'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_SOURCE = fs.readFileSync(path.join(ROOT, 'audio.v8.js'), 'utf8');

class FakeSource {
  constructor() {
    this.listeners = new Map();
    this.buffer = null;
  }

  connect() {}
  start() {}
  stop() {}

  addEventListener(name, callback) {
    this.listeners.set(name, callback);
  }

  emit(name) {
    this.listeners.get(name)?.();
  }
}

class FakeAudioParam {
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
  linearRampToValueAtTime() {}
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 1000;
    this.state = 'running';
    this.destination = {};
    this.bufferCreateCount = 0;
    this.oscillators = [];
    this.bufferSources = [];
    this.suspendCalls = 0;
    this.resumeCalls = 0;
  }

  createGain() {
    return { gain: new FakeAudioParam(), connect() {} };
  }

  createOscillator() {
    const source = new FakeSource();
    source.frequency = new FakeAudioParam();
    source.type = 'sine';
    this.oscillators.push(source);
    return source;
  }

  createBuffer(_channels, size) {
    this.bufferCreateCount++;
    const samples = new Float32Array(size);
    return { getChannelData() { return samples; } };
  }

  createBufferSource() {
    const source = new FakeSource();
    this.bufferSources.push(source);
    return source;
  }

  createBiquadFilter() {
    return { type: '', frequency: new FakeAudioParam(), connect() {} };
  }

  resume() {
    this.resumeCalls++;
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.suspendCalls++;
    this.state = 'suspended';
    return Promise.resolve();
  }
}

function createSoundEngine() {
  const sandbox = {
    console,
    window: { AudioContext: FakeAudioContext },
    setTimeout,
    clearTimeout
  };
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);
  const exportHook = ';globalThis.__AUDIO_TEST__ = { SoundEngine };';
  vm.runInContext(`${AUDIO_SOURCE}\n${exportHook}`, context, { filename: 'audio.v8.js' });

  const engine = new context.__AUDIO_TEST__.SoundEngine();
  assert.equal(engine.init(), true);
  return engine;
}

test('les buffers procéduraux sont réutilisés pour les flammes et explosions', () => {
  const engine = createSoundEngine();

  engine.playFlame();
  const firstFlameBuffer = engine.ctx.bufferSources[0].buffer;
  engine.ctx.currentTime = 0.06;
  engine.playFlame();

  assert.equal(engine.ctx.bufferCreateCount, 1);
  assert.equal(engine.ctx.bufferSources[1].buffer, firstFlameBuffer);

  engine.ctx.currentTime = 0.12;
  engine.playExplosion();
  engine.ctx.currentTime = 0.18;
  engine.playExplosion();

  assert.equal(engine.ctx.bufferCreateCount, 2);
  assert.equal(engine.ctx.bufferSources[2].buffer, engine.ctx.bufferSources[3].buffer);
});

test('les tirs redondants sont limités sans modifier la méthode publique', () => {
  const engine = createSoundEngine();

  engine.playShoot();
  engine.ctx.currentTime = 0.01;
  engine.playShoot();
  engine.ctx.currentTime = 0.03;
  engine.playShoot();

  assert.equal(engine.ctx.oscillators.length, 2);
});

test('le budget de voix se libère lorsque les sources se terminent', () => {
  const engine = createSoundEngine();
  engine.maxHotSfxVoices = 2;

  engine.playShoot();
  engine.ctx.currentTime = 0.05;
  engine.playPlasma();
  engine.ctx.currentTime = 0.12;
  engine.playFlame();

  assert.equal(engine.activeHotSfxVoices, 2);
  assert.equal(engine.ctx.bufferSources.length, 0);

  engine.ctx.oscillators[0].emit('ended');
  engine.ctx.currentTime = 0.2;
  engine.playFlame();

  assert.equal(engine.activeHotSfxVoices, 2);
  assert.equal(engine.ctx.bufferSources.length, 1);
});

test('les volumes musique et effets sont independants, bornes et appliques au mix existant', () => {
  const engine = createSoundEngine();

  assert.equal(engine.setMusicVolume(0.35), 0.35);
  assert.equal(engine.setSfxVolume(1.5), 1);
  assert.equal(engine.musicGain.gain.value, 0.125);
  assert.ok(Math.abs(engine.sfxGain.gain.value - 0.4375) < Number.EPSILON);
  assert.equal(engine.setMusicVolume(-1), 0);
  assert.equal(engine.musicGain.gain.value, 0);
});

test('la radio ne se declare active qu apres initialisation audio et evite un second timer', () => {
  const engine = createSoundEngine();

  assert.equal(engine.startMusic(), true);
  const firstTimer = engine.musicTimer;
  assert.ok(firstTimer);
  assert.equal(engine.startMusic(), true);
  assert.equal(engine.musicTimer, firstTimer);

  engine.stopMusic();
  engine.ctx = null;
  engine.init = () => false;
  assert.equal(engine.startMusic(), false);
  assert.equal(engine.isPlayingMusic, false);
  assert.equal(engine.musicTimer, null);
});

test('masquer puis restaurer la page suspend et reprend exactement la radio active', () => {
  const engine = createSoundEngine();
  engine.startMusic();

  engine.suspendForVisibility();
  assert.equal(engine.isPlayingMusic, false);
  assert.equal(engine.resumeMusicAfterVisibility, true);
  assert.equal(engine.musicTimer, null);
  assert.equal(engine.ctx.suspendCalls, 1);

  assert.equal(engine.resumeFromVisibility(), true);
  assert.equal(engine.isPlayingMusic, true);
  assert.equal(engine.resumeMusicAfterVisibility, false);
  assert.ok(engine.musicTimer);
  engine.stopMusic();

  engine.suspendForVisibility();
  assert.equal(engine.resumeFromVisibility(), false, 'une radio deja arretee ne doit pas demarrer seule');
});
