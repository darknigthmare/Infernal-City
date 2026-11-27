'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { specs } = require('../scripts/dlc-art-spec.cjs');
const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const projectileIds = ['flame_stream', 'siege_missile', 'cryo_shard', 'acid_glob', 'drone_laser', 'siphon_seed'];
const synergyIds = ['choc_thermique', 'tempete_magnetique', 'embrasement_toxique'];

function load({ entered = true, imageReady = true, tamper, previousDraw = () => false } = {}) {
  const assets = Object.fromEntries([...projectileIds, ...synergyIds].map(id => [`fx/${id}`, {
    ...specs[`fx/${id}`], sha256: 'c'.repeat(64), approved: true, nativeBytesPreserved: true
  }]));
  tamper?.(assets);
  const window = { INFERNAL_CITY_DLC_ART: { assets }, addEventListener() {}, removeEventListener() {} };
  const context = vm.createContext({ window, console, navigator: {},
    document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; } },
    requestAnimationFrame() {}, audio: new Proxy({}, { get() { return () => {}; } }) });
  vm.runInContext(read('game.v9.js') + '\n;globalThis.testGame = GameEngine;', context);
  const proto = context.testGame.prototype;
  const requests = [], calls = [], rotations = [], damage = [];
  Object.assign(proto, {
    drawCompletedEvolution: previousDraw,
    preloadSpriteAsset(src) { requests.push(src); return { src, complete: imageReady, naturalWidth: 1774, naturalHeight: src.includes('thermique') ? 887 : 665 }; },
    isSpriteReady(image) { return Boolean(image?.complete && image.naturalWidth); },
    getReadableWorldSize(size) { return size; },
    getDefenseSpecializationOptions() { return []; },
    isEnemyFlying() { return false; },
    damageEnemy(enemy, amount) { damage.push(amount); enemy.hp -= amount; },
    getApproachCullBounds() { return { left: -500, right: 1700, top: -500, bottom: 1300 }; },
    getRunModifierProduct() { return 1; },
    addFloatingText() {}
  });
  vm.runInContext(read('tactical-fx-runtime.v1.js'), context);
  const engine = Object.create(proto);
  Object.assign(engine, {
    hasEnteredAdultExperience: entered, animationClock: 1, prefersReducedMotion: false,
    isOverdriveActive: false, selectedHero: { id: 'aria' }, freezeTimer: 0,
    particles: [], projectiles: [], enemies: [], placedTowers: [],
    ctx: { save() {}, restore() {}, translate() {}, rotate(r) { rotations.push(r); },
      drawImage(...args) { calls.push(args); } }
  });
  return { engine, requests, calls, rotations, damage, assets };
}

function projectile(id, extra = {}) {
  const types = { siege_missile: 'missile', cryo_shard: 'cryo', acid_glob: 'acid', drone_laser: 'drone', siphon_seed: 'siphon' };
  return { type: id === 'flame_stream' ? 'flame' : id === 'acid_glob' ? 'acid' : id === 'siege_missile' ? 'plasma_mortar' : 'bullet',
    sourceDefense: types[id] ? { type: types[id] } : undefined,
    x: 80, y: 90, vx: 0, vy: 200, radius: 6, life: 0.5, damage: 10, ...extra };
}

test('six live projectile identities draw their own native cells without changing combat data', () => {
  const { engine, calls, requests, rotations } = load();
  for (const id of projectileIds) {
    const p = projectile(id); const before = JSON.stringify(p);
    assert.equal(engine.drawCompletedEvolution(p), true, id);
    assert.equal(JSON.stringify(p), before);
    assert.match(requests.at(-1), new RegExp(`/${id}\\.png$`));
    const call = calls.at(-1);
    assert.equal(call[2], 0);
    assert.equal(call[3], 1774 / 8);
    assert.equal(call[4], 665 / 3);
    assert.equal(rotations.at(-1), Math.PI / 2);
  }
});

test('unreviewed metadata and the entry gate cannot request tactical images', () => {
  const gated = load({ entered: false });
  assert.equal(gated.engine.drawCompletedEvolution(projectile('cryo_shard')), false);
  assert.equal(gated.engine.emitTacticalProjectileImpact(projectile('cryo_shard'), { x: 80, y: 90 }), false);
  assert.equal(gated.requests.length, 0);
  for (const change of [
    { approved: false }, { nativeBytesPreserved: false }, { sha256: 'invalid' },
    { src: 'https://example.invalid/fx.png' }, { rows: 4 }, { states: ['flight', 'wrong', 'overload'] }
  ]) {
    const { engine, requests } = load({ tamper(assets) { Object.assign(assets['fx/cryo_shard'], change); } });
    assert.equal(engine.drawCompletedEvolution(projectile('cryo_shard')), false);
    assert.equal(requests.length, 0);
  }
});

test('slow or failed decoding preserves the legacy rendering path and issues one request', () => {
  const { engine, requests, calls } = load({ imageReady: false });
  for (let i = 0; i < 5; i++) assert.equal(engine.drawCompletedEvolution(projectile('acid_glob')), false);
  assert.equal(requests.length, 1); assert.equal(calls.length, 0);
});

test('existing evolutions and duo effects take precedence; ordinary bullets and rings remain untouched', () => {
  const { engine, requests } = load({ previousDraw(p) { return Boolean(p.completionEvolution || p.dlcDuoId); } });
  assert.equal(engine.drawCompletedEvolution(projectile('flame_stream', { completionEvolution: 'inferno' })), true);
  assert.equal(engine.drawCompletedEvolution({ type: 'gravity_ring', dlcDuoId: 'duo_aria_astarra' }), true);
  assert.equal(engine.drawCompletedEvolution(projectile('drone_laser', { sourceDefense: { type: 'bullet' } })), false);
  assert.equal(engine.drawCompletedEvolution({ type: 'gravity_ring' }), false);
  assert.equal(requests.length, 0);
});

test('overdrive selects its row and reduced motion freezes projectiles without adding impacts', () => {
  const { engine, calls } = load();
  engine.isOverdriveActive = true;
  engine.prefersReducedMotion = true;
  engine.drawCompletedEvolution(projectile('siege_missile'));
  const first = calls.at(-1).slice(1);
  assert.equal(first[0], 0); assert.equal(first[1], 2 * 665 / 3);
  engine.animationClock = 100;
  engine.drawCompletedEvolution(projectile('siege_missile'));
  assert.deepEqual(calls.at(-1).slice(1), first);
  assert.equal(engine.emitTacticalProjectileImpact(projectile('siege_missile'), { x: 0, y: 0 }), false);
  assert.equal(engine.particles.length, 0);
});

test('actual elemental reactions retain their damage and cooldown while identifying each animation', () => {
  const cases = [
    ['choc_thermique', 'flame', { slowTimer: 2 }, 135],
    ['tempete_magnetique', 'tesla', { gravityPulledUntil: 4 }, 130],
    ['embrasement_toxique', 'plasma', { bioCorrodedUntil: 4 }, 125]
  ];
  for (const [id, type, status, expectedDamage] of cases) {
    const { engine, damage, calls } = load();
    const enemy = { x: 80, y: 90, hp: 1000, ...status };
    engine.damageEnemyFromDefense({ type }, enemy, 100);
    assert.equal(damage[0], expectedDamage, id);
    assert.equal(engine.particles[0].synergyId, id);
    assert.equal(engine.particles[0].maxLife, 0.34);
    assert.equal(engine.drawCompletedEvolution(engine.particles[0]), true);
    engine.particles[0].life = 0.04;
    engine.drawCompletedEvolution(engine.particles[0]);
    assert.equal(calls.at(-1)[2] / calls.at(-1)[4], 3, 'fade row');
    engine.damageEnemyFromDefense({ type }, enemy, 100);
    assert.equal(damage[1], 100, 'reaction cooldown unchanged');
    assert.equal(engine.particles.length, 1);
  }
});

test('a real projectile collision creates one bounded visual impact without changing damage or removal', () => {
  const { engine, damage, calls } = load();
  const p = projectile('cryo_shard', { vx: 0, vy: 0 });
  const enemy = { x: 80, y: 90, radius: 15, hp: 1000 };
  engine.enemies.push(enemy); engine.projectiles.push(p);
  engine.updateProjectiles(0);
  assert.deepEqual(damage, [10]); assert.equal(enemy.hp, 990);
  assert.equal(engine.projectiles.length, 0);
  assert.equal(engine.particles.length, 1);
  assert.equal(engine.particles[0].type, 'tactical_projectile_impact');
  assert.equal(engine.drawCompletedEvolution(engine.particles[0]), true);
  assert.equal(calls.at(-1)[2], 665 / 3, 'impact row');
  assert.equal(engine.emitTacticalProjectileImpact(p, enemy), false, 'same-frame piercing cap');
  engine.updateParticles(0.33);
  assert.equal(engine.particles.length, 0);
  engine.particles = Array.from({ length: 220 }, () => ({}));
  engine.animationClock = 2;
  assert.equal(engine.emitTacticalProjectileImpact(p, enemy), false);
  assert.equal(engine.particles.length, 220);
});

test('new atlases advance with the simulation clock and remain fixed during pause', () => {
  const { engine, calls } = load();
  const p = projectile('drone_laser');
  engine.drawCompletedEvolution(p);
  const initial = calls.at(-1)[1];
  engine.drawCompletedEvolution(p);
  assert.equal(calls.at(-1)[1], initial);
  engine.animationClock += 0.1;
  engine.drawCompletedEvolution(p);
  assert.notEqual(calls.at(-1)[1], initial);
});
