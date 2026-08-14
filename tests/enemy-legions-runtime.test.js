'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = fs.readFileSync(path.join(ROOT, 'enemy-legions.v1.js'), 'utf8');
const RUNTIME = fs.readFileSync(path.join(ROOT, 'enemy-legions-runtime.v1.js'), 'utf8');

function load() {
  class GameEngine {}
  const proto = GameEngine.prototype;
  Object.assign(proto, {
    spawnEnemy(type) { const definition = this.expansion.enemyDefinitions[type]; const enemy = { type, hp: 100, maxHp: 100, speed: 60, damage: 10, attackCooldown: 1, traits: definition.traits || [], dead: false, routeIndex: 0, waypointIndex: 1, x: 0, y: 0 }; this.enemies.push(enemy); return enemy; },
    update() {}, killEnemy(enemy) { enemy.dead = true; this.enemies.splice(this.enemies.indexOf(enemy), 1); },
    damageEnemy(enemy, amount) { enemy.hp -= amount; }, getEnemyControlResistance() { return 1; },
    preloadWaveCharacterBosses() { return []; }, chooseFallbackEnemyType() { return 'swarmer'; }, render() {},
    getRunRandom() { return 0.5; }, preloadSpriteAsset(src) { return { src, complete: true, width: 1024, height: 256 }; },
    ensureEnemySprite() {}, getEnemyRouteTarget() { return { x: 100, y: 0 }; },
    getBattlefieldView() { return {}; }, applyBattlefieldView() {}, isSpriteReady() { return true; },
    drawAtlasFrame() { return true; }, getReadableWorldSize(value) { return value; }, openAntagonistCodex() {}
  });
  const window = { INFERNAL_CITY_EXPANSION: { enemyDefinitions: {} } };
  const sandbox = { window, globalThis: null, GameEngine, ENEMY_SPRITE_DATA: {}, console, Math, Set, Object, Array, Number, String, document: { getElementById() { return null; } } };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(REGISTRY, context, { filename: 'enemy-legions.v1.js' });
  window.INFERNAL_CITY_EXPANSION = window.INFERNAL_CITY_EXPANSION || sandbox.INFERNAL_CITY_EXPANSION;
  vm.runInContext(RUNTIME, context, { filename: 'enemy-legions-runtime.v1.js' });
  const engine = new GameEngine();
  engine.expansion = window.INFERNAL_CITY_EXPANSION;
  engine.enemies = []; engine.placedTowers = []; engine.enemyBullets = []; engine.animationClock = 0;
  engine.spriteAtlasImages = {}; engine.ctx = null; engine.canvas = null; engine.wave = 8; engine.isPaused = false; engine.isGameOver = false;
  return { engine, window, spriteData: sandbox.ENEMY_SPRITE_DATA };
}

test('runtime registers all fifty individual four-frame WebP sheets', () => {
  const { window, spriteData } = load();
  assert.equal(Object.keys(window.INFERNAL_CITY_ENEMY_LEGIONS.enemies).length, 50);
  assert.equal(Object.keys(spriteData).length, 50);
  Object.values(spriteData).forEach(sprite => {
    assert.match(sprite.src, /^assets\/animations\/enemy-legions\/enemies\/.+\.webp$/);
    assert.equal(sprite.columns, 4);
    assert.equal(sprite.rows, 1);
  });
});

test('ranged legion attacks create authored hostile projectiles and armor is active', () => {
  const { engine } = load();
  engine.placedTowers.push({ x: 150, y: 0, hp: 100, radius: 10 });
  const scarab = engine.spawnEnemy('bioforge_scarab', 0);
  scarab.legionAttackTimer = 2;
  engine.updateLegionRuntime(0.1);
  assert.equal(engine.enemyBullets.length, 1);
  assert.equal(engine.enemyBullets[0].legionEffectId, 'bio_acid_spore');
  const before = scarab.hp;
  engine.damageEnemy(scarab, 20);
  assert.ok(scarab.hp > before - 20);
});

test('support, movement and revive mechanics are executed by the shared runtime', () => {
  const { engine } = load();
  const healer = engine.spawnEnemy('bioforge_stitcher', 0);
  const ally = engine.spawnEnemy('bioforge_carapace', 0);
  ally.hp = 40; healer.legionMechanicTimer = 0;
  engine.updateLegionRuntime(0.1);
  assert.ok(ally.hp > 40);
  const thrall = engine.spawnEnemy('ossuary_bone_thrall', 0);
  thrall.legionRevived = false;
  const count = engine.enemies.length;
  engine.getRunRandom = () => 0;
  engine.killEnemy(thrall);
  assert.equal(engine.enemies.length, count);
  assert.equal(thrall.dead, false);
});

test('registry, runtime, campaign and PWA load in deterministic order', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const registry = html.indexOf('src="enemy-legions.v1.js"');
  const campaign = html.indexOf('src="campaign-content.v1.js"');
  const game = html.indexOf('src="game.v9.js"');
  const infinitum = html.indexOf('src="infinitum-runtime.v1.js"');
  const runtime = html.indexOf('src="enemy-legions-runtime.v1.js"');
  const pwa = html.indexOf('src="pwa.v4.js"');
  assert.ok(registry > 0 && campaign > registry && game > campaign && runtime > infinitum && pwa > runtime);
});
