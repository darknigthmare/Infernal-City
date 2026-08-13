'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'infinitum-runtime.v1.js'), 'utf8');

const MODIFIERS = Object.freeze({
  defenseCostMultiplier: 1.15,
  secondaryRewardMultiplier: 1.5,
  enemyDamageMultiplier: 1.35,
  enemySpeedMultiplier: 0.88,
  groundSpeedMultiplier: 1.08,
  flyingStealthSeconds: 3.5,
  flyingRewardMultiplier: 1.25,
  barrierHpDrainPerSecond: 0.5,
  heavyCountMultiplier: 1.4,
  specialistHpMultiplier: 1.2,
  enemyFireRateMultiplier: 0.78,
  sellRatioMultiplier: 0.65,
  specialistControlResistanceMultiplier: 0.7,
  specialistRewardMultiplier: 1.25,
  heavyDirectDamageMultiplier: 0.78,
  heavySplashDamageMultiplier: 1.3,
  crateChanceMultiplier: 1.65,
  defenseRangeMultiplier: 0.86,
  revealedDamageTakenMultiplier: 1.25,
  splashDamageMultiplier: 1.22,
  artilleryFireRateMultiplier: 0.72,
  hostileProjectileSpeedMultiplier: 0.82,
  barrierHpMultiplier: 1.6,
  defenseHpMultiplier: 0.88,
  controlDurationMultiplier: 1.28,
  bossControlResistanceMultiplier: 0.55,
  milestoneMetaMultiplier: 1.5
});

function loadRuntime() {
  class GameEngine {
    constructor() {
      this.isTowerMode = true;
      this.towerMutators = [{ id: 'all-contracts', modifiers: { ...MODIFIERS } }];
      this.activeRunMutators = [];
      this.enemies = [];
      this.enemyBullets = [];
      this.bossHazards = [];
      this.placedTowers = [];
      this.crates = [];
      this.powerups = [];
      this.coins = 1000;
      this.selectedTowerToBuild = TOWER_TYPES.vulcan_turret;
      this.lastDamage = 0;
      this.randomValues = [0.99, 0.99, 0.99];
      this.freezeTimer = 0;
      this.worldWidth = 1200;
      this.worldHeight = 800;
      this.waveRewardClaimed = false;
      this.waveActive = true;
      this.wave = 10;
      this.towerFloor = 10;
      this.claimedInfinitumMilestones = new Set();
      this.metaCoins = 0;
      this.runMetaCoinsEarned = 0;
      this.secondaryObjectiveResult = true;
    }

    getActiveRunMutators() { return this.isTowerMode ? this.towerMutators : this.activeRunMutators; }
    getRunModifierProduct(key, fallback = 1) {
      return this.getActiveRunMutators().reduce((value, mutator) => value * (Number(mutator.modifiers?.[key]) || 1), fallback);
    }
    getRunRandom() { return this.randomValues.shift() ?? 0.99; }
    isEnemyFlying(enemy) { return enemy?.type === 'flying'; }
    spawnEnemy(type, routeIndex = 0) {
      const enemy = { type, routeIndex, hp: 100, maxHp: 100, speed: 10, baseSpeed: 10, damage: 20, traits: [], radius: 10 };
      this.enemies.push(enemy);
      return enemy;
    }
    spawnMutant() { return this.spawnEnemy('swarmer'); }
    getAdjustedWaveGroupCount(group) { return Number(group.count) || 1; }
    getDefenseStatsAtLevel() { return { range: 100, maxHp: 200, damage: 10, fireRate: 500, radius: 18 }; }
    buildSelectedTowerAt() {
      const cost = this.selectedTowerToBuild.cost;
      if (this.coins < cost) return false;
      this.coins -= cost;
      this.lastPaidCost = cost;
      return true;
    }
    renderBuildBar() {}
    updateBuildBarAffordability() {}
    getDefenseSellValue() { return 50; }
    updatePlacedTowers() {}
    getEnemyControlResistance() { return 0.5; }
    applyEnemyStun(enemy, duration) { return duration * this.getEnemyControlResistance(enemy, 'stun'); }
    damageEnemy(enemy, amount) { this.lastDamage = amount; enemy.hp -= amount; return amount; }
    createExplosion(x, y, radius, damage) { this.damageEnemy(this.enemies[0], damage); }
    updateHazards() {}
    fireTower() {}
    updateArtillerySiege() { return false; }
    updateEnemies() {}
    fireBossPattern() {
      this.enemyBullets.push({ vx: 100, vy: 0, damage: 10 });
    }
    applyBossSignature() {
      this.bossHazards.push({ damage: 10 });
    }
    killEnemy(enemy) { enemy.dead = true; return this.getRunModifierProduct('coinRewardMultiplier'); }
    completeWave() {
      this.waveRewardClaimed = true;
      this.waveActive = false;
      this.claimedInfinitumMilestones.add(this.towerFloor);
      this.metaCoins += 30;
      this.runMetaCoinsEarned += 30;
    }
    addBoundedLoot(kind, loot) { if (kind === 'crate') this.crates.push(loot); }
    updateHUD() {}
    saveProgress() { return true; }
    showFeedback() {}
    announce() {}
  }

  const TOWER_TYPES = {
    vulcan_turret: { id: 'vulcan_turret', name: 'Vulcain', desc: 'Direct', cost: 100 }
  };
  const window = {};
  const sandbox = {
    window,
    globalThis: window,
    GameEngine,
    TOWER_TYPES,
    console,
    Math,
    Number,
    Object,
    Array,
    Set,
    WeakSet,
    WeakMap
  };
  vm.runInContext(SOURCE, vm.createContext(sandbox), { filename: 'infinitum-runtime.v1.js' });
  return { GameEngine, runtime: window.INFERNAL_CITY_INFINITUM_RUNTIME };
}

test('the Infinitum runtime publishes every authored professional modifier contract', () => {
  const { runtime } = loadRuntime();
  assert.equal(runtime.installed, true);
  assert.deepEqual([...runtime.modifierKeys].sort(), Object.keys(MODIFIERS).sort());
  assert.deepEqual(Object.keys(runtime.contracts).sort(), Object.keys(MODIFIERS).sort());
});

test('enemy, defense, economy and control modifiers change actual simulation values', () => {
  const { GameEngine } = loadRuntime();
  const engine = new GameEngine();

  const flying = engine.spawnEnemy('flying');
  assert.equal(flying.hp, 120);
  assert.equal(flying.maxHp, 120);
  assert.ok(Math.abs(flying.speed - 8.8) < 1e-9);
  assert.equal(flying.damage, 27);
  assert.equal(flying.stealthTimer, 3.5);

  const ground = engine.spawnEnemy('brute');
  assert.ok(Math.abs(ground.speed - 9.504) < 1e-9);

  const barrierStats = engine.getDefenseStatsAtLevel({ type: 'barrier' }, 1);
  assert.equal(barrierStats.range, 86);
  assert.equal(barrierStats.maxHp, 320);
  assert.equal(barrierStats.damage, 10);
  assert.equal(barrierStats.fireRate, 500);
  assert.equal(barrierStats.radius, 18);
  assert.equal(engine.getDefenseStatsAtLevel({ type: 'bullet' }, 1).maxHp, 176);

  const originalTower = engine.selectedTowerToBuild;
  engine.buildSelectedTowerAt(10, 10);
  assert.equal(engine.lastPaidCost, 115);
  assert.equal(engine.coins, 885);
  assert.equal(engine.selectedTowerToBuild, originalTower, 'the catalog object is restored after the transaction');
  assert.equal(engine.getDefenseSellValue({}), 32);

  const bossSpecialist = { type: 'artillery', traits: [], isBoss: true };
  assert.ok(Math.abs(engine.applyEnemyStun(bossSpecialist, 2) - 0.4928) < 1e-9);
});

test('direct, splash, hostile projectile and milestone modifiers remain distinct', () => {
  const { GameEngine } = loadRuntime();
  const engine = new GameEngine();
  const heavy = { type: 'brute', hp: 1000, traits: [] };

  engine.damageEnemy(heavy, 100);
  assert.ok(Math.abs(engine.lastDamage - 78) < 1e-9);

  engine.enemies = [heavy];
  engine.createExplosion(0, 0, 100, 100);
  assert.ok(Math.abs(engine.lastDamage - 158.6) < 1e-9);

  engine.fireBossPattern({});
  assert.ok(Math.abs(engine.enemyBullets[0].vx - 82) < 1e-9);
  assert.ok(Math.abs(engine.enemyBullets[0].damage - 13.5) < 1e-9);

  engine.applyBossSignature({}, {}, 1, 'pattern');
  assert.ok(Math.abs(engine.bossHazards[0].damage - 13.5) < 1e-9);

  engine.completeWave();
  assert.equal(engine.metaCoins, 45);
  assert.equal(engine.runMetaCoinsEarned, 45);
});
