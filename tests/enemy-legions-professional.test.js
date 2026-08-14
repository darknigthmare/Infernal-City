'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = fs.readFileSync(path.join(ROOT, 'enemy-legions.v1.js'), 'utf8');
const LEGACY_RUNTIME = fs.readFileSync(path.join(ROOT, 'enemy-legions-runtime.v1.js'), 'utf8');
const PROFESSIONAL_RUNTIME = fs.readFileSync(path.join(ROOT, 'enemy-legions-professional.v1.js'), 'utf8');

function load() {
  class GameEngine {}
  const proto = GameEngine.prototype;
  Object.assign(proto, {
    spawnEnemy(type, routeIndex = 0, options = {}) {
      const definition = this.expansion.enemyDefinitions[type];
      const stats = definition.stats;
      const enemy = {
        type, name: definition.name, x: options.x || 0, y: options.y || 0,
        hp: stats.hp, maxHp: stats.hp, speed: stats.speed, baseSpeed: stats.speed,
        damage: stats.damage, radius: stats.radius, attackCooldown: stats.attackCooldownMs / 1000,
        routeIndex, waypointIndex: options.waypointIndex || 1, traits: [...definition.traits],
        dead: false, color: '#ff2aaf', slowTimer: 0, stunTimer: 0, shield: 0, maxShield: 0
      };
      this.enemies.push(enemy);
      return enemy;
    },
    update() {}, updateEnemyBullets() {}, updatePlacedTowers() {},
    damageEnemyFromDefense(defense, enemy, amount) { this.damageEnemy(enemy, amount, { sourceDefense: defense }); },
    damageEnemy(enemy, amount) { enemy.hp -= amount; if (enemy.hp <= 0) this.killEnemy(enemy); },
    killEnemy(enemy) { enemy.dead = true; const index = this.enemies.indexOf(enemy); if (index >= 0) this.enemies.splice(index, 1); },
    getEnemyControlResistance() { return 1; }, preloadWaveCharacterBosses() { return []; },
    chooseFallbackEnemyType() { return 'swarmer'; }, render() {}, openAntagonistCodex() {},
    captureGameplayState() { return { marker: true }; }, restoreGameplayState() { return true; }, startNewGame() {},
    getRunRandom() { return 0; }, preloadSpriteAsset(src) { return { src, complete: true, width: 1024, height: 256 }; },
    ensureEnemySprite() {}, getEnemyRouteTarget() { return { x: 500, y: 0 }; },
    getBattlefieldView() { return {}; }, applyBattlefieldView() {}, isSpriteReady() { return true; },
    drawAtlasFrame() { return true; }, getReadableWorldSize(value) { return value; },
    getApproachCullBounds() { return { left: -1000, right: 2000, top: -1000, bottom: 2000 }; },
    damageCitadel(amount) { this.citadel.hp -= amount; }, updateHUD() {}, addFloatingText() {}, showFeedback() {}
  });
  const window = { INFERNAL_CITY_EXPANSION: { enemyDefinitions: {} } };
  const sandbox = {
    window, globalThis: null, GameEngine, ENEMY_SPRITE_DATA: {}, console, Math, Set, Map,
    Object, Array, Number, String, JSON,
    document: { getElementById() { return null; }, querySelector() { return null; }, createElement() { return {}; } }
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(REGISTRY, context, { filename: 'enemy-legions.v1.js' });
  vm.runInContext(LEGACY_RUNTIME, context, { filename: 'enemy-legions-runtime.v1.js' });
  vm.runInContext(PROFESSIONAL_RUNTIME, context, { filename: 'enemy-legions-professional.v1.js' });
  const engine = new GameEngine();
  engine.expansion = window.INFERNAL_CITY_EXPANSION;
  engine.enemies = []; engine.placedTowers = []; engine.enemyBullets = [];
  engine.animationClock = 1; engine.wave = 10; engine.worldWidth = 1000; engine.worldHeight = 600;
  engine.citadel = { x: 500, y: 0, radius: 40, hp: 1000, maxHp: 1000 };
  engine.isPaused = false; engine.isGameOver = false; engine.invincibleTimer = 0; engine.isOverdriveActive = false;
  return { engine, window, contract: window.INFERNAL_CITY_ENEMY_LEGIONS_PROFESSIONAL };
}

test('professional runtime handles every authored mechanic, attack mode and target policy', () => {
  const { window, contract } = load();
  const enemies = Object.values(window.INFERNAL_CITY_ENEMY_LEGIONS.enemies);
  const mechanicTypes = [...new Set(enemies.flatMap(enemy => enemy.mechanics.map(mechanic => mechanic.type)))].sort();
  const attackModes = [...new Set(enemies.map(enemy => enemy.attack.mode))].sort();
  const targetPolicies = [...new Set(enemies.map(enemy => enemy.attack.target))].sort();
  assert.equal(mechanicTypes.length, 50);
  assert.deepEqual([...contract.mechanicHandlers], mechanicTypes);
  assert.deepEqual([...contract.attackModes], attackModes);
  assert.deepEqual([...contract.targetPolicies], targetPolicies);
});

test('authored projectiles apply damage and their on-hit mechanic', () => {
  const { engine } = load();
  const tower = { x: 70, y: 0, radius: 14, hp: 300, maxHp: 300, fireRate: 1000, disabledTimer: 0, name: 'Tesla' };
  engine.placedTowers.push(tower);
  const scarab = engine.spawnEnemy('bioforge_scarab', 0);
  scarab.legionAttackTimer = 10;
  engine.updateLegionRuntime(0.1);
  assert.equal(engine.enemyBullets.some(bullet => bullet.legionManaged), true);
  engine.updateEnemyBullets(0.3);
  assert.ok(tower.hp < 300);
  assert.equal(tower.legionCorrosion.stacks, 1);
});

test('deployables, auras and per-mechanic timers produce measurable field effects', () => {
  const { engine } = load();
  const tower = { x: 40, y: 0, radius: 14, hp: 300, maxHp: 300, fireRate: 1000, disabledTimer: 0, name: 'Railgun' };
  engine.placedTowers.push(tower);
  const jammer = engine.spawnEnemy('quantum_chronal_jammer', 0);
  jammer.legionAttackTimer = 0;
  engine.updateLegionRuntime(0.1);
  engine.animationClock += 0.3;
  engine.updateLegionRuntime(0.3);
  assert.ok(engine.legionRuntime.fields.some(field => field.kind === 'deploy_slow'));
  assert.ok(tower.legionCooldownSlowUntil > engine.animationClock);
  assert.ok(jammer.legionMechanicTimers.jammer_anchor > 0);
});

test('damage redirect, authored armor and rewind are active without permanent synergy leakage', () => {
  const { engine } = load();
  const protector = engine.spawnEnemy('bioforge_carapace', 0);
  const ally = engine.spawnEnemy('bioforge_scarab', 0, { x: 20 });
  const protectorBefore = protector.hp;
  const allyBefore = ally.hp;
  engine.prepareProfessionalLegions(0.1);
  engine.damageEnemy(ally, 40);
  assert.ok(protector.hp < protectorBefore);
  assert.ok(ally.hp > allyBefore - 40);

  const marksman = engine.spawnEnemy('quantum_paradox_markswoman', 0, { x: 200 });
  const originalX = marksman.x;
  engine.damageEnemy(marksman, marksman.maxHp * 0.8, { ignoreArmor: true });
  assert.equal(marksman.legionRewound, true);
  assert.ok(marksman.x < originalX);

  ally.legionDamageMultiplier = 9;
  engine.prepareProfessionalLegions(0.1);
  assert.ok(ally.legionDamageMultiplier < 9);
});

test('side-mode snapshots serialize gameplay fields but never image objects', () => {
  const { engine, contract } = load();
  contract.addField(engine, { kind: 'deploy_hazard', x: 10, y: 20, radius: 40, life: 4, effectId: 'plague_canker_pod' });
  engine.legionRuntime.effectImages.plague_canker_pod = { complete: true, width: 1024 };
  const saved = engine.captureGameplayState();
  assert.equal(saved.legionRuntimeState.fields.length, 1);
  assert.doesNotMatch(JSON.stringify(saved.legionRuntimeState), /effectImages|complete|width/);
  engine.startNewGame({});
  assert.equal(engine.legionRuntime.fields.length, 0);
  engine.restoreGameplayState(saved);
  assert.equal(engine.legionRuntime.fields.length, 1);
});

test('HTML, service worker and package load/check the professional runtime in release order', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const legacy = html.indexOf('enemy-legions-runtime.v1.js');
  const professional = html.indexOf('enemy-legions-professional.v1.js');
  const pwa = html.indexOf('pwa.v4.js');
  assert.ok(legacy > 0 && professional > legacy && pwa > professional);
  assert.match(sw, /enemy-legions-professional\.v1\.js/);
  assert.match(pkg.scripts.check, /node --check enemy-legions-professional\.v1\.js/);
});
test('all fifty authored units survive a full runtime smoke cycle', () => {
  const catalogue = load().window.INFERNAL_CITY_ENEMY_LEGIONS.enemies;
  Object.values(catalogue).forEach(definition => {
    const { engine } = load();
    const towers = [
      { x: 18, y: 0, type: 'barrier', name: 'Égide', radius: 16, hp: 900, maxHp: 900, fireRate: 800, baseFireRate: 800, damage: 4, level: 2, cost: 70 },
      { x: 110, y: 12, type: 'railgun', name: 'Railgun', radius: 14, hp: 650, maxHp: 650, fireRate: 950, baseFireRate: 950, damage: 55, level: 4, cost: 180 },
      { x: 240, y: -16, type: 'tesla', name: 'Tesla', radius: 14, hp: 520, maxHp: 520, fireRate: 620, baseFireRate: 620, damage: 36, level: 3, cost: 130 }
    ];
    engine.placedTowers.push(...towers);
    const enemy = engine.spawnEnemy(definition.id, 0, { x: 0, y: 0 });
    definition.synergies.flatMap(entry => Array.from(entry.with || [])).forEach((allyId, index) => {
      if (catalogue[allyId]) engine.spawnEnemy(allyId, 0, { x: 12 + index * 8, y: 8 });
    });
    enemy.legionAttackTimer = 99;

    assert.doesNotThrow(() => {
      for (let step = 0; step < 16; step += 1) {
        engine.animationClock += 0.5;
        engine.update(0.5);
        engine.updateEnemyBullets(0.5);
        engine.updatePlacedTowers(0.5);
      }
      if (!enemy.dead && engine.enemies.includes(enemy)) {
        engine.damageEnemyFromDefense(towers[1], enemy, Math.max(1, enemy.maxHp * 0.55));
        enemy.legionRevived = true;
        engine.damageEnemy(enemy, enemy.maxHp * 4, { ignoreArmor: true, trueDamage: true });
      }
    }, definition.id);

    [...engine.enemies, ...engine.placedTowers, ...engine.enemyBullets].forEach(entity => {
      ['x', 'y'].forEach(key => {
        if (entity[key] !== undefined) assert.ok(Number.isFinite(entity[key]), `${definition.id}: ${key}`);
      });
      if (entity.hp !== undefined) assert.ok(Number.isFinite(entity.hp), `${definition.id}: hp`);
    });
    assert.ok(engine.legionRuntime.fields.length <= 72, `${definition.id}: fields`);
    assert.ok(engine.legionRuntime.delayed.length <= 128, `${definition.id}: delayed`);
  });
});