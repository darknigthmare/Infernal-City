/* Valkyrie Sweeper: Dark Siege - Procedural Web Audio Synthesizer Engine */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.8;
    this.isMuted = false;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.resumeMusicAfterVisibility = false;
    this.currentStation = 'synthwave'; // 'synthwave', 'gothic', 'industrial', 'chillwave', 'heavy'

    // Cached procedural buffers avoid rebuilding thousands of random samples for
    // every flame or explosion fired by the automatic defenses.
    this.noiseBuffers = new Map();

    // Hot combat sounds share a small voice budget. Gameplay effects are never
    // throttled: only redundant audio cues are skipped during dense barrages.
    this.hotSfxLastPlayedAt = new Map();
    this.activeHotSfxVoices = 0;
    this.maxHotSfxVoices = 24;
  }

  init() {
    if (this.ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.getMusicGainValue();
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.getSfxGainValue();
      this.sfxGain.connect(this.ctx.destination);
      return true;
    } catch (error) {
      console.warn('Audio indisponible dans ce navigateur.', error);
      this.ctx = null;
      this.musicGain = null;
      this.sfxGain = null;
      return false;
    }
  }

  ensureAudio() {
    if (!this.ctx && !this.init()) return false;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return Boolean(this.ctx);
  }

  getNoiseBuffer(durationSeconds) {
    if (!this.ctx || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return null;

    const durationMs = Math.max(1, Math.round(durationSeconds * 1000));
    const cacheKey = `${this.ctx.sampleRate}:${durationMs}`;
    if (this.noiseBuffers.has(cacheKey)) return this.noiseBuffers.get(cacheKey);

    const bufferSize = Math.max(1, Math.round(this.ctx.sampleRate * (durationMs / 1000)));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseBuffers.set(cacheKey, buffer);
    return buffer;
  }

  canPlayHotSfx(key, minimumIntervalSeconds) {
    if (!this.ctx || this.activeHotSfxVoices >= this.maxHotSfxVoices) return false;

    const now = this.ctx.currentTime;
    const previousTime = this.hotSfxLastPlayedAt.get(key);
    if (Number.isFinite(previousTime) && now - previousTime < minimumIntervalSeconds) return false;

    this.hotSfxLastPlayedAt.set(key, now);
    return true;
  }

  trackHotSfxSource(source) {
    if (!source) return source;

    this.activeHotSfxVoices++;
    let released = false;
    const releaseVoice = () => {
      if (released) return;
      released = true;
      this.activeHotSfxVoices = Math.max(0, this.activeHotSfxVoices - 1);
    };

    if (typeof source.addEventListener === 'function') {
      source.addEventListener('ended', releaseVoice, { once: true });
    } else {
      source.onended = releaseVoice;
    }
    return source;
  }

  setStation(station) {
    this.currentStation = station;
  }

  clampVolume(value, fallback = 1) {
    const numeric = Number(value);
    return Number.isFinite(numeric)
      ? Math.max(0, Math.min(1, numeric))
      : fallback;
  }

  getMusicGainValue() {
    // Keep the original mix at the UI default while still exposing a useful
    // 0-100 range. This avoids suddenly overpowering dialogue after migration.
    return 0.25 * (this.musicVolume / 0.7);
  }

  getSfxGainValue() {
    return 0.35 * (this.sfxVolume / 0.8);
  }

  setMusicVolume(value) {
    this.musicVolume = this.clampVolume(value, this.musicVolume);
    if (this.musicGain) this.musicGain.gain.value = this.getMusicGainValue();
    return this.musicVolume;
  }

  setSfxVolume(value) {
    this.sfxVolume = this.clampVolume(value, this.sfxVolume);
    if (this.sfxGain) this.sfxGain.gain.value = this.getSfxGainValue();
    return this.sfxVolume;
  }

  toggleSfx() {
    this.isMuted = !this.isMuted;
    return !this.isMuted;
  }

  // --- Sound Effects Synthesizer --- //

  playShoot() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;
    if (!this.canPlayHotSfx('shoot', 0.025)) return;
    
    const now = this.ctx.currentTime;
    const osc = this.trackHotSfxSource(this.ctx.createOscillator());
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playPlasma() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;
    if (!this.canPlayHotSfx('plasma', 0.04)) return;

    const now = this.ctx.currentTime;
    const osc = this.trackHotSfxSource(this.ctx.createOscillator());
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playRailgun() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;
    if (!this.canPlayHotSfx('railgun', 0.06)) return;

    const now = this.ctx.currentTime;
    const osc = this.trackHotSfxSource(this.ctx.createOscillator());
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playFlame() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;
    if (!this.canPlayHotSfx('flame', 0.055)) return;

    const now = this.ctx.currentTime;
    const buffer = this.getNoiseBuffer(0.1);
    if (!buffer) return;

    const whiteNoise = this.trackHotSfxSource(this.ctx.createBufferSource());
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
  }

  playExplosion() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;
    if (!this.canPlayHotSfx('explosion', 0.05)) return;

    const now = this.ctx.currentTime;
    const buffer = this.getNoiseBuffer(0.4);
    if (!buffer) return;

    const noise = this.trackHotSfxSource(this.ctx.createBufferSource());
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  playPickup() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.12);
    });
  }

  playAbility() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playOverdrive() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.6);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  playNuke() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 1.2);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  playFreeze() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playSlotSpin() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + i * 100, now + i * 0.08);

      gain.gain.setValueAtTime(0.3, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.06);
    }
  }

  playDragonRoar() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.5);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  playHurtVoice() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playRelationshipCue() {
    if (this.isMuted) return;
    if (!this.ensureAudio()) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(659, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(523, now + 0.55);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  // --- 5-Station Procedural Synthesizer Radio --- //

  toggleMusic() {
    if (!this.ensureAudio()) return;
    if (this.isPlayingMusic) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  startMusic() {
    if (this.isPlayingMusic) return true;
    if (!this.ensureAudio()) {
      this.isPlayingMusic = false;
      return false;
    }
    this.isPlayingMusic = true;

    let step = 0;

    const playBeat = () => {
      if (!this.isPlayingMusic || !this.ctx) return;
      const now = this.ctx.currentTime;

      let bassNotes = [65.41, 65.41, 73.42, 87.31];
      let arpeggio = [261.63, 329.63, 392.00, 523.25];
      let oscType = 'sawtooth';
      let speed = 250;

      if (this.currentStation === 'gothic') {
        bassNotes = [55.00, 55.00, 61.74, 65.41]; // A1, A1, B1, C2
        arpeggio = [220.00, 261.63, 329.63, 440.00];
        oscType = 'square';
        speed = 280;
      } else if (this.currentStation === 'industrial') {
        bassNotes = [49.00, 49.00, 58.27, 65.41];
        arpeggio = [196.00, 233.08, 293.66, 392.00];
        oscType = 'sawtooth';
        speed = 200;
      } else if (this.currentStation === 'chillwave') {
        bassNotes = [97.99, 97.99, 110.00, 130.81];
        arpeggio = [392.00, 440.00, 523.25, 659.25];
        oscType = 'sine';
        speed = 340;
      } else if (this.currentStation === 'heavy') {
        bassNotes = [41.20, 41.20, 49.00, 55.00]; // E1
        arpeggio = [164.81, 196.00, 220.00, 329.63];
        oscType = 'sawtooth';
        speed = 180;
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = oscType;
      const freq = bassNotes[Math.floor(step / 4) % bassNotes.length];
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.22);

      if (step % 2 === 0) {
        const synthOsc = this.ctx.createOscillator();
        const synthGain = this.ctx.createGain();

        synthOsc.type = 'sine';
        synthOsc.frequency.setValueAtTime(arpeggio[(step / 2) % arpeggio.length], now);

        synthGain.gain.setValueAtTime(0.12, now);
        synthGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        synthOsc.connect(synthGain);
        synthGain.connect(this.musicGain);

        synthOsc.start(now);
        synthOsc.stop(now + 0.18);
      }

      step++;
      this.musicTimer = setTimeout(playBeat, speed);
    };

    playBeat();
    return true;
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  suspendForVisibility() {
    this.resumeMusicAfterVisibility = this.isPlayingMusic;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.isPlayingMusic = false;
    this.ctx?.suspend?.().catch?.(() => {});
  }

  resumeFromVisibility() {
    if (!this.resumeMusicAfterVisibility) return false;
    this.resumeMusicAfterVisibility = false;
    return this.startMusic();
  }
}

const audio = new SoundEngine();
