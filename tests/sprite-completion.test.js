'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const registrySource = fs.readFileSync(path.join(ROOT, 'sprite-completion.v1.js'), 'utf8');
const runtimeSource = fs.readFileSync(path.join(ROOT, 'sprite-completion-runtime.v1.js'), 'utf8');
const legionSource = fs.readFileSync(path.join(ROOT, 'enemy-legions.v1.js'), 'utf8');

function load(keys = [], { imageReady = true, dimensions = [1579, 1021] } = {}) {
  const calls = [], requests = [], legacyCalls = [], transforms = [];
  const heroData = { aria: { src: 'old-aria.png' }, nyx: { src: 'old-nyx.png' } };
  const enemyData = {
    bulwark: { src: 'old-bulwark.png', size: 76 },
    xyra: { src: 'old-xyra.png', size: 118 },
    leviathan: { src: 'old-leviathan.png', size: 188, rotate: true, rotationOffset: 0.25 }
  };
  const towerData = { vulcan_turret: { src: 'old-vulcan.png', size: 56, rotate: true } };
  class GameEngine {}
  Object.assign(GameEngine.prototype, {
    drawAtlasFrame(...args) { legacyCalls.push(args); return true; },
    drawHero(x, y, options = {}) {
      this.drawAtlasFrame({}, { src: 'old-aura.png' }, 0, x, y, 150);
      return this.drawAtlasFrame({}, heroData[options.heroId || this.selectedHero.id], 0, x, y, 100);
    },
    drawEnemy(enemy) {
      const sprite = enemyData[enemy.type];
      return this.drawAtlasFrame(this.enemySpriteImages[enemy.type], sprite, 0, enemy.x, enemy.y, sprite.size, {
        rotation: sprite.rotate ? (enemy.facingAngle || 0) + (sprite.rotationOffset || 0) : undefined,
        flipX: !sprite.rotate && Math.cos(enemy.facingAngle || 0) < 0
      });
    },
    drawTower(tower) { return this.drawAtlasFrame({}, towerData[tower.id], 0, tower.x, tower.y, 56); },
    ensureHeroSprite() {}, ensureEnemySprite() {}, ensureTowerSprite() {},
    preloadSpriteAsset(src) {
      requests.push(src);
      return { src, complete: imageReady, naturalWidth: dimensions[0], naturalHeight: dimensions[1] };
    },
    isSpriteReady(image) { return Boolean(image?.complete && image.naturalWidth); },
    getDefenseSpecializationOptions() { return [{ id: 'option_a' }, { id: 'option_b' }]; },
    damageEnemy(enemy, amount, options = {}) {
      if (enemy.dead || !(amount > 0)) return;
      if (enemy.shield > 0 && !options.ignoreShield) {
        const absorbed = Math.min(enemy.shield, amount);
        enemy.shield -= absorbed; amount -= absorbed;
      }
      enemy.hp -= amount;
      if (enemy.hp <= 0) this.killEnemy(enemy);
    },
    killEnemy(enemy) {
      if (!enemy || enemy.dead) return;
      if (enemy.revive) { enemy.hp = 50; enemy.revive = false; return; }
      enemy.dead = true;
      this.enemies = this.enemies.filter(item => item !== enemy);
      this.rewardCount++;
    },
    buildSelectedTowerAt(x, y) { this.placedTowers.push({ id: 'vulcan_turret', level: 1, x, y }); },
    placeStarterDefenses() { this.buildSelectedTowerAt(10, 20); },
    sellDefense(tower) {
      if (!this.placedTowers.includes(tower)) return { ok: false };
      this.placedTowers = this.placedTowers.filter(item => item !== tower);
      this.coins += 60; return { ok: true, refund: 60 };
    },
    fireWeapon(weapon) {
      this.heroAnimationState = 'attack'; this.heroAnimationTimer = 0.3;
      if (weapon.id === 'railgun') {
        this.particles.push({ type: 'rail_beam', x1: 0, y1: 0, x2: 100, y2: 0, life: 0.25 });
      } else this.projectiles.push({ x: 10, y: 20, vx: 300, vy: 0, radius: 6, type: weapon.id === 'flamethrower' ? 'flame' : 'bullet' });
    },
    update(dt) { this.gameplaySeconds += dt; }, render() {},
    applyBattlefieldView() {}, getBattlefieldView() { return {}; },
    getReadableWorldSize(size) { return size; },
    startNewGame() { this.enemies = []; }, restoreGameplayState() { this.enemies = []; }
  });
  const window = {};
  const sandbox = {
    window, console, GameEngine, HERO_SPRITE_DATA: heroData, ENEMY_SPRITE_DATA: enemyData,
    TOWER_SPRITE_DATA: towerData, COMPANION_FX_SPRITE_DATA: { state_poses: { src: 'old-aura.png' } }
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(legionSource, context);
  vm.runInContext(registrySource, context);
  window.INFERNAL_CITY_SPRITE_COMPLETION_APPROVED = { assets: Object.fromEntries(keys.map(key => [key, {
    src: window.INFERNAL_CITY_SPRITE_COMPLETION.assets[key].src, approved: true, sha256: 'a'.repeat(64)
  }])) };
  vm.runInContext(runtimeSource, context);
  const engine = new GameEngine();
  Object.assign(engine, {
    hasEnteredAdultExperience: true, selectedHero: { id: 'aria' }, heroAnimationState: 'idle',
    enemies: [], enemySpriteImages: {}, placedTowers: [], projectiles: [], particles: [],
    gameplaySeconds: 0, rewardCount: 0, coins: 0, canvas: { width: 1200, height: 800 },
    ctx: { save() {}, restore() {}, translate() {},
      rotate(angle) { transforms.push({ rotation: angle }); },
      scale(x, y) { transforms.push({ scale: [x, y] }); },
      drawImage(...args) { calls.push(args); } }
  });
  return { engine, calls, requests, legacyCalls, transforms, window, context };
}

function lastRow(call, rows) { return call[2] / (call[0].naturalHeight / rows); }
function lastColumn(call, columns) { return call[1] / (call[0].naturalWidth / columns); }
function enemy(options = {}) { return { type: 'bulwark', hp: 100, shield: 0, x: 20, y: 30, radius: 22, speed: 40, ...options }; }

test('registry covers 111 combat atlases and 13 presentation assets, with no gallery-only Nova fighter', () => {
  const { window } = load();
  const assets = Object.values(window.INFERNAL_CITY_SPRITE_COMPLETION.assets);
  assert.equal(assets.length, 124);
  const counts = Object.fromEntries(['heroes', 'bosses', 'enemies', 'towers', 'evolutions', 'portraits', 'environment']
    .map(group => [group, assets.filter(asset => asset.group === group).length]));
  assert.deepEqual(counts, { heroes: 16, bosses: 14, enemies: 57, towers: 20, evolutions: 4, portraits: 10, environment: 3 });
  assert.equal(assets.filter(asset => asset.preparedOnly === true).length, 0);
  assert.equal(assets.filter(asset => asset.usage).length, 13);
  for (const id of ['swarmer', 'runner', 'brute']) assert.ok(window.INFERNAL_CITY_SPRITE_COMPLETION.assets[`enemies/${id}`]);
  for (const id of ['hellwarden', 'vespera', 'carmilla']) assert.ok(window.INFERNAL_CITY_SPRITE_COMPLETION.assets[`bosses/${id}`]);
  assert.equal(window.INFERNAL_CITY_SPRITE_COMPLETION.assets['heroes/nova'], undefined);
});

test('planned or unreviewed paths never load; approved assets wait for actual use and adult entry', () => {
  const { engine, requests, legacyCalls } = load(['heroes/aria']);
  assert.equal(requests.length, 0);
  engine.hasEnteredAdultExperience = false;
  engine.drawHero(0, 0);
  assert.equal(requests.length, 0);
  engine.hasEnteredAdultExperience = true;
  engine.drawEnemy(enemy());
  assert.equal(requests.length, 0);
  engine.drawHero(0, 0);
  engine.drawHero(0, 0);
  assert.equal(requests.length, 1);
  assert.ok(legacyCalls.length > 0);
});

test('native fractional cell bounds and pose rows are drawn directly without resampling frames', () => {
  const { engine, calls } = load(['heroes/aria']);
  engine.heroAnimationState = 'attack'; engine.heroAnimationTimer = 0.3;
  engine.drawHero(10, 20);
  engine.update(0.15); engine.heroAnimationTimer = 0.15;
  engine.drawHero(10, 20);
  const call = calls.at(-1);
  assert.equal(lastRow(call, 8), 2);
  assert.equal(lastColumn(call, 8), 4);
  assert.equal(call[3], 1579 / 8);
  assert.equal(call[4], 1021 / 8);
  assert.ok(!Number.isInteger(call[3]));
  engine.heroAnimationState = 'victory';
  engine.drawHero(10, 20);
  assert.equal(lastRow(calls.at(-1), 8), 5);
});

test('hash-bound silhouette scaling stays fixed across poses and transients without changing source cells', () => {
  const { engine, calls, window } = load(['heroes/aria', 'enemies/bulwark', 'portraits/nyx']);
  const approved = window.INFERNAL_CITY_SPRITE_COMPLETION_APPROVED.assets;
  Object.assign(approved['heroes/aria'], { drawScale: 1.5, drawScaleSha256: 'a'.repeat(64) });
  engine.drawHero(0, 0);
  assert.equal(calls.at(-1)[7], 150);
  assert.equal(calls.at(-1)[3], 1579 / 8, 'source cell remains native and fractional');
  engine.heroAnimationState = 'victory'; engine.drawHero(0, 0);
  assert.equal(calls.at(-1)[7], 150);
  approved['heroes/aria'].drawScaleSha256 = 'b'.repeat(64);
  engine.drawHero(0, 0);
  assert.equal(calls.at(-1)[7], 100, 'unbound scale falls back to 1');
  Object.assign(approved['enemies/bulwark'], { drawScale: 1.4, drawScaleSha256: 'a'.repeat(64) });
  const unit = enemy(); engine.enemies.push(unit); engine.drawEnemy(unit);
  const aliveHeight = calls.at(-1)[8];
  assert.equal(aliveHeight, 76 * 1.4);
  engine.killEnemy(unit); engine.render();
  assert.equal(calls.at(-1)[8], aliveHeight, 'death retains the same fixed body scale');
  Object.assign(approved['portraits/nyx'], { drawScale: 1.8, drawScaleSha256: 'a'.repeat(64) });
  assert.equal(window.INFERNAL_CITY_SPRITE_COMPLETION.approved('portraits/nyx').drawScale, 1);
});

test('new heroine finish poses coexist with her existing attack atlas', () => {
  const { engine, calls, legacyCalls } = load(['heroes/nyx']);
  engine.selectedHero = { id: 'nyx' }; engine.heroAnimationState = 'victory';
  engine.drawHero(0, 0);
  assert.equal(lastRow(calls.at(-1), 4), 1);
  const count = calls.length;
  engine.heroAnimationState = 'attack'; engine.drawHero(0, 0);
  assert.equal(calls.length, count);
  assert.equal(legacyCalls.at(-1)[1].src, 'old-nyx.png');
});

test('repeated attacks restart their authored pose and reduced motion holds a single frame', () => {
  const { engine, calls } = load(['heroes/aria']);
  engine.heroAnimationState = 'attack'; engine.heroAnimationTimer = 0.3;
  engine.drawHero(0, 0);
  engine.update(0.2); engine.heroAnimationTimer = 0.1; engine.drawHero(0, 0);
  assert.ok(lastColumn(calls.at(-1), 8) > 0);
  engine.heroAnimationTimer = 0.3; engine.drawHero(0, 0);
  assert.equal(lastColumn(calls.at(-1), 8), 0);
  engine.prefersReducedMotion = true; engine.update(0.2); engine.drawHero(0, 0);
  assert.equal(lastColumn(calls.at(-1), 8), 0);
});

test('drawing an idle decoy does not restart the selected heroine attack', () => {
  const { engine, calls } = load(['heroes/aria']);
  engine.heroAnimationState = 'attack'; engine.heroAnimationTimer = 0.3;
  engine.drawHero(0, 0);
  engine.update(0.15); engine.heroAnimationTimer = 0.15;
  engine.drawHero(30, 40, { heroId: 'aria' });
  assert.equal(lastRow(calls.at(-1), 8), 1);
  engine.drawHero(0, 0);
  assert.equal(lastRow(calls.at(-1), 8), 2);
  assert.equal(lastColumn(calls.at(-1), 8), 4);
});

test('automatic shots preserve active ability and ultimate poses while still firing', () => {
  const { engine, calls } = load(['heroes/aria']);
  for (const [pose, row] of [['ability', 3], ['ultimate', 4]]) {
    engine.heroAnimationState = pose; engine.heroAnimationTimer = 0.72;
    engine.drawHero(0, 0);
    engine.update(0.2); engine.heroAnimationTimer = 0.52;
    const before = engine.projectiles.length;
    engine.fireWeapon({ id: 'vulcan', isEvolved: false });
    assert.equal(engine.projectiles.length, before + 1);
    assert.equal(engine.heroAnimationState, pose);
    assert.equal(engine.heroAnimationTimer, 0.52);
    engine.drawHero(0, 0);
    assert.equal(lastRow(calls.at(-1), 8), row);
    assert.equal(lastColumn(calls.at(-1), 8), 2);
  }
  engine.heroAnimationTimer = 0;
  engine.fireWeapon({ id: 'vulcan', isEvolved: false });
  assert.equal(engine.heroAnimationState, 'attack');
  assert.equal(engine.heroAnimationTimer, 0.3);
});

test('shield-break animation requires a true positive-to-zero shield transition', () => {
  const { engine, calls } = load(['enemies/bulwark']);
  const unit = enemy({ shield: 10 }); engine.enemies.push(unit);
  engine.damageEnemy(unit, 2); engine.drawEnemy(unit);
  assert.equal(lastRow(calls.at(-1), 4), 0);
  engine.damageEnemy(unit, 8); engine.drawEnemy(unit);
  assert.equal(lastRow(calls.at(-1), 4), 3);
  engine.update(0.6); engine.damageEnemy(unit, 1); engine.drawEnemy(unit);
  assert.equal(lastRow(calls.at(-1), 4), 0);
  unit.attackAnimationTimer = 0.3; engine.drawEnemy(unit);
  assert.equal(lastRow(calls.at(-1), 4), 1);
});

test('dead enemies keep a bounded visual only after removal, without changing rewards or revivals', () => {
  const { engine, calls } = load(['enemies/bulwark']);
  const revived = enemy({ revive: true }); engine.enemies.push(revived);
  engine.killEnemy(revived); engine.render();
  assert.equal(calls.length, 0);
  assert.equal(engine.enemies.length, 1);
  assert.equal(engine.rewardCount, 0);
  engine.killEnemy(revived); engine.killEnemy(revived);
  assert.equal(engine.enemies.length, 0);
  assert.equal(engine.rewardCount, 1);
  engine.render();
  assert.equal(lastRow(calls.at(-1), 4), 2);
  const count = calls.length;
  engine.update(0.81); engine.render();
  assert.equal(calls.length, count);
  assert.equal(engine.rewardCount, 1);
});

test('death visuals are capped and reset with a new run', () => {
  const { engine, calls } = load(['enemies/bulwark']);
  for (let i = 0; i < 80; i++) { const unit = enemy(); engine.enemies.push(unit); engine.killEnemy(unit); }
  engine.render();
  assert.equal(calls.length, 64);
  engine.startNewGame(); engine.render();
  assert.equal(calls.length, 64);
  assert.equal(engine.rewardCount, 80);
});

test('boss intro, phase shifts and telegraph select distinct rows; regular attacks keep their original artwork', () => {
  const { engine, calls, legacyCalls } = load(['bosses/xyra']);
  const boss = enemy({ type: 'xyra', isBoss: true, poseState: 'intro', poseTimer: 1.6 });
  engine.drawEnemy(boss); assert.equal(lastRow(calls.at(-1), 6), 0);
  boss.poseState = 'phase_shift'; boss.bossPhase = 2;
  engine.drawEnemy(boss); assert.equal(lastRow(calls.at(-1), 6), 1);
  boss.bossPhase = 3; engine.drawEnemy(boss); assert.equal(lastRow(calls.at(-1), 6), 2);
  boss.poseState = null; boss.telegraphTimer = 0.9;
  engine.drawEnemy(boss); assert.equal(lastRow(calls.at(-1), 6), 3);
  boss.telegraphTimer = 0; boss.attackAnimationTimer = 0.4;
  engine.drawEnemy(boss); assert.equal(legacyCalls.at(-1)[1].src, 'old-xyra.png');
});

test('a repeated boss telegraph restarts from its own countdown after legacy movement', () => {
  const { engine, calls, legacyCalls } = load(['bosses/xyra']);
  const boss = enemy({ type: 'xyra', isBoss: true, poseState: null, poseTimer: 0, telegraphTimer: 0.9 });
  engine.drawEnemy(boss);
  engine.update(0.75); boss.telegraphTimer = 0.15;
  engine.drawEnemy(boss);
  assert.equal(lastColumn(calls.at(-1), 8), 7);
  boss.telegraphTimer = 0; engine.drawEnemy(boss);
  assert.equal(legacyCalls.at(-1)[1].src, 'old-xyra.png');
  engine.update(0.25); boss.telegraphTimer = 0.9;
  engine.drawEnemy(boss);
  assert.equal(lastRow(calls.at(-1), 6), 3);
  assert.equal(lastColumn(calls.at(-1), 8), 0);
});

test('tower build, levels, both specializations and successful recycling use their real gameplay state', () => {
  const { engine, calls } = load(['towers/vulcan_turret']);
  engine.buildSelectedTowerAt(10, 20);
  const tower = engine.placedTowers[0]; engine.drawTower(tower);
  assert.equal(lastRow(calls.at(-1), 8), 5);
  engine.update(0.81);
  for (let level = 1; level <= 3; level++) {
    tower.level = level; tower.animationTimer = 0.34; engine.drawTower(tower);
    assert.equal(lastRow(calls.at(-1), 8), level - 1);
  }
  tower.specializationId = 'option_a'; engine.drawTower(tower);
  assert.equal(lastRow(calls.at(-1), 8), 3);
  tower.specializationId = 'option_b'; engine.drawTower(tower);
  assert.equal(lastRow(calls.at(-1), 8), 4);
  assert.equal(engine.sellDefense(tower).ok, true);
  assert.equal(engine.sellDefense(tower).ok, false);
  assert.equal(engine.coins, 60);
  engine.render(); assert.equal(lastRow(calls.at(-1), 8), 6);
});

test('base tower idle loops use their authored row while resting upgrades retain their own silhouette', () => {
  const { engine, calls } = load(['towers/vulcan_turret']);
  const tower = { id: 'vulcan_turret', level: 1, x: 10, y: 20, animationTimer: 0 };
  engine.drawTower(tower);
  assert.equal(lastRow(calls.at(-1), 8), 7);
  engine.update(0.25); engine.drawTower(tower);
  assert.equal(lastColumn(calls.at(-1), 8), 2);
  for (const level of [2, 3]) {
    tower.level = level; engine.drawTower(tower);
    assert.equal(lastRow(calls.at(-1), 8), level - 1);
    assert.equal(lastColumn(calls.at(-1), 8), 0, 'idle never plays a firing sequence');
  }
  tower.specializationId = 'option_b'; engine.drawTower(tower);
  assert.equal(lastRow(calls.at(-1), 8), 4);
  assert.equal(lastColumn(calls.at(-1), 8), 0);
  tower.specializationId = null; tower.level = 1; engine.prefersReducedMotion = true;
  engine.drawTower(tower);
  assert.equal(lastRow(calls.at(-1), 8), 7);
  assert.equal(lastColumn(calls.at(-1), 8), 0);
});

test('rotating enemies keep their facing and source offset in their death animation', () => {
  const { engine, calls, transforms } = load(['bosses/leviathan', 'bosses/xyra']);
  const leviathan = enemy({ type: 'leviathan', isBoss: true, poseState: 'intro', facingAngle: 2.1 });
  engine.enemies.push(leviathan); engine.drawEnemy(leviathan);
  const aliveRotation = transforms.at(-1).rotation;
  assert.equal(aliveRotation, 2.35);
  const aliveSize = calls.at(-1)[8];
  transforms.length = 0; engine.killEnemy(leviathan); engine.render();
  assert.equal(transforms.at(-1).rotation, aliveRotation);
  assert.equal(calls.at(-1)[8], aliveSize);
  assert.equal(transforms.some(item => item.scale), false, 'rotating bodies are not mirrored a second time');
  engine.update(1.5);
  const upright = enemy({ type: 'xyra', isBoss: true, facingAngle: Math.PI });
  engine.enemies.push(upright); transforms.length = 0;
  engine.killEnemy(upright); engine.render();
  assert.deepEqual(transforms.at(-1).scale, [-1, 1]);
  assert.equal(transforms.some(item => 'rotation' in item), false, 'upright bosses stay billboarded');
});

test('placement preview uses the approved base silhouette and preserves the legacy fallback contract', () => {
  const { engine, calls, requests } = load(['towers/vulcan_turret']);
  assert.equal(engine.drawCompletedTowerPreview('vulcan_turret', 100, 200, 56, { alpha: 0.68 }), true);
  assert.match(calls.at(-1)[0].src, /towers\/vulcan_turret\.png$/);
  assert.equal(lastRow(calls.at(-1), 8), 0);
  assert.equal(lastColumn(calls.at(-1), 8), 0);
  assert.equal(requests.length, 1);
  assert.equal(engine.drawCompletedTowerPreview('unapproved', 0, 0, 56), false);
  const failed = load(['towers/vulcan_turret'], { imageReady: false });
  assert.equal(failed.engine.drawCompletedTowerPreview('vulcan_turret', 0, 0, 56), false);
  assert.equal(failed.calls.length, 0);
});

test('each evolved weapon receives its own artwork and basic shots remain unchanged', () => {
  const ids = { vulcan: 'vulcan-cerberus', plasma: 'nova-cataclysm', railgun: 'odin-lance', flamethrower: 'niflhel-breath' };
  const { engine, calls } = load(Object.values(ids).map(id => `evolutions/${id}`));
  for (const [weaponId, id] of Object.entries(ids)) {
    engine.fireWeapon({ id: weaponId, isEvolved: false });
    const basic = weaponId === 'railgun' ? engine.particles.at(-1) : engine.projectiles.at(-1);
    assert.equal(engine.drawCompletedEvolution(basic), false);
    engine.fireWeapon({ id: weaponId, isEvolved: true });
    const evolved = weaponId === 'railgun' ? engine.particles.at(-1) : engine.projectiles.at(-1);
    assert.equal(evolved.completionEvolution, id);
    assert.equal(engine.drawCompletedEvolution(evolved), true);
    assert.match(calls.at(-1)[0].src, new RegExp(`${id}\\.png$`));
    if (weaponId === 'railgun') {
      const thickness = calls.at(-1)[8];
      evolved.x2 = 800;
      engine.drawCompletedEvolution(evolved);
      assert.equal(calls.at(-1)[7], 800);
      assert.equal(calls.at(-1)[8], thickness, 'rail beam thickness stays constant as range increases');
      assert.ok(thickness < 100);
    }
  }
});

test('failed decoding retains the legacy renderer and does not retry once per frame', () => {
  const { engine, calls, requests, legacyCalls } = load(['heroes/aria'], { imageReady: false });
  for (let i = 0; i < 5; i++) engine.drawHero(0, 0);
  assert.equal(calls.length, 0);
  assert.equal(requests.length, 1);
  assert.equal(legacyCalls.length, 10);
});

test('every enabled native PNG is present and matches its approved hash', () => {
  const window = {};
  const context = vm.createContext({ window, console });
  vm.runInContext(legionSource, context);
  vm.runInContext(registrySource, context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'sprite-completion-approved.v1.js'), 'utf8'), context);
  const approved = window.INFERNAL_CITY_SPRITE_COMPLETION_APPROVED.assets;
  for (const [key, entry] of Object.entries(approved)) {
    assert.ok(window.INFERNAL_CITY_SPRITE_COMPLETION.approved(key), key);
    const bytes = fs.readFileSync(path.join(ROOT, entry.src));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256, key);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), entry.width);
    assert.equal(bytes.readUInt32BE(20), entry.height);
    assert.ok([4, 6].includes(bytes[25]), key);
  }
});

test('manifest builder requires hash-bound visual review and a rejection always disables an asset', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'infernal-sprite-review-'));
  try {
    fs.mkdirSync(path.join(directory, 'scripts'));
    fs.mkdirSync(path.join(directory, 'assets/animations/completion-v1/heroes'), { recursive: true });
    for (const relative of ['sprite-completion.v1.js', 'enemy-legions.v1.js', 'scripts/build-sprite-completion-manifest.cjs']) {
      fs.copyFileSync(path.join(ROOT, relative), path.join(directory, relative));
    }
    fs.writeFileSync(path.join(directory, 'sprite-completion-approved.v1.js'),
      'window.INFERNAL_CITY_SPRITE_COMPLETION_APPROVED = { assets: {} };');
    // Existing RGBA atlas serves only as a PNG fixture; no artwork is generated
    // and the disposable fixture is never used by the game.
    const bytes = fs.readFileSync(path.join(ROOT, 'assets/animations/companions/pet-drone-atlas.png'));
    fs.writeFileSync(path.join(directory, 'assets/animations/completion-v1/heroes/aria.png'), bytes);
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const execute = (...args) => spawnSync(process.execPath,
      ['scripts/build-sprite-completion-manifest.cjs', ...args], { cwd: directory, encoding: 'utf8' });
    const manifest = () => JSON.parse(fs.readFileSync(path.join(directory, 'assets/animations/completion-v1/manifest.json'), 'utf8'));
    assert.equal(execute().status, 0);
    assert.equal(manifest().present, 1);
    assert.equal(manifest().approved, 0);
    assert.notEqual(execute('--approve-existing').status, 0);
    const scalesPath = path.join(directory, 'scales.json');
    fs.writeFileSync(scalesPath, JSON.stringify({ assets: [{ key: 'heroes/aria', sha256, drawScale: 1.5 }] }));
    assert.equal(execute('--scales', scalesPath).status, 0);
    assert.equal(manifest().approved, 0, 'measurements never approve artwork');
    assert.equal(manifest().files[0].drawScale, 1.5);
    const reviewPath = path.join(directory, 'review.json');
    fs.writeFileSync(reviewPath, JSON.stringify({ approved: [{ key: 'heroes/aria', sha256 }] }));
    assert.equal(execute('--qa', reviewPath, '--scales', scalesPath).status, 0);
    assert.equal(manifest().approved, 1);
    assert.equal(manifest().files[0].drawScaleSha256, sha256);
    assert.equal(execute().status, 0);
    assert.equal(manifest().files[0].drawScale, 1.5, 'unchanged approved bytes retain their measured scale');
    fs.writeFileSync(scalesPath, JSON.stringify({ assets: [{ key: 'heroes/aria', sha256: '0'.repeat(64), drawScale: 1.7 }] }));
    assert.notEqual(execute('--scales', scalesPath).status, 0);
    assert.equal(manifest().files[0].drawScale, 1.5, 'stale measurement fails transactionally');
    fs.writeFileSync(reviewPath, JSON.stringify({ approved: [{ key: 'heroes/aria', sha256: '0'.repeat(64) }] }));
    assert.notEqual(execute('--qa', reviewPath).status, 0);
    assert.equal(manifest().approved, 1, 'a failed review is transactional');
    fs.writeFileSync(reviewPath, JSON.stringify({ approved: [{ key: 'heroes/aria', sha256 }], rejected: ['heroes/aria'] }));
    assert.equal(execute('--qa', reviewPath).status, 0);
    assert.equal(manifest().approved, 0);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('PWA and HTML load the optional completion module after the existing gameplay extensions', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const worker = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const names = ['enemy-legions-professional.v1.js', 'sprite-completion-approved.v1.js', 'sprite-completion.v1.js', 'sprite-completion-runtime.v1.js', 'pwa.v4.js'];
  const positions = names.map(name => html.indexOf(`src="${name}"`));
  positions.forEach((position, index) => {
    assert.ok(position > 0 && (index === 0 || position > positions[index - 1]));
    assert.ok(worker.includes(`'./${names[index]}'`));
  });
});
