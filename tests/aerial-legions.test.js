'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function load({ imageReady = true } = {}) {
  const window = { addEventListener() {}, removeEventListener() {} };
  const context = vm.createContext({
    window, console,
    document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; } },
    navigator: {}, audio: {}, requestAnimationFrame() {}, cancelAnimationFrame() {}
  });
  const run = name => vm.runInContext(read(name), context, { filename: name });
  ['expansion.v1.js', 'characters.v1.js', 'enemy-legions.v1.js', 'campaign-content.v1.js', 'dlc-packs.v1.js'].forEach(run);
  const originalExpansion = window.INFERNAL_CITY_EXPANSION;
  const originalCampaign = plain(window.INFERNAL_CITY_CAMPAIGN_CONTENT);
  run('aerial-legions.v1.js');
  vm.runInContext(read('game.v9.js') + '\n;globalThis.testExports = { GameEngine, ENEMY_SPRITE_DATA, SPECIALIST_ENEMY_TYPES, DIFFICULTY_DATA };', context);
  const { GameEngine, ENEMY_SPRITE_DATA, SPECIALIST_ENEMY_TYPES, DIFFICULTY_DATA } = context.testExports;
  const proto = GameEngine.prototype;
  const baseQueue = proto.buildWaveSpawnQueue;
  const calls = [], requests = [], rects = [], transforms = [];

  // Keep the real spawn, queue, classifier, sprite loader and body renderer.
  // Replace simulation/UI boundaries so the tests can drive each pose exactly.
  Object.assign(proto, {
    update(dt) { this.animationClock += dt; }, render() {}, updateHUD() {},
    getReadableWorldSize(size) { return size; },
    getBattlefieldView() { return {}; }, applyBattlefieldView() {},
    startNewGame() { this.enemies = []; }, restoreGameplayState() { this.enemies = []; },
    preloadSpriteAsset(src) {
      requests.push(src);
      const spec = Object.values(window.INFERNAL_CITY_DLC_ART?.assets || {}).find(entry => entry.src === src);
      return { src, complete: spec ? imageReady : true, naturalWidth: spec?.width || 1024, naturalHeight: spec?.height || 1024 };
    },
    damageEnemy(enemy, amount) {
      const absorbed = Math.min(enemy.shield || 0, amount);
      enemy.shield = Math.max(0, (enemy.shield || 0) - absorbed);
      enemy.hp -= amount - absorbed;
      if (enemy.hp <= 0) this.killEnemy(enemy);
    },
    killEnemy(enemy) {
      if (!enemy || enemy.dead) return;
      if (enemy.revive) { enemy.hp = 50; enemy.revive = false; return; }
      enemy.dead = true;
      this.enemies = this.enemies.filter(item => item !== enemy);
      this.rewardCount++;
    }
  });
  ['infinitum-runtime.v1.js', 'enemy-legions-runtime.v1.js', 'sprite-completion-approved.v1.js',
    'sprite-completion.v1.js', 'aerial-legions-runtime.v1.js', 'sprite-completion-runtime.v1.js', 'dlc-art.v1.js'].forEach(run);
  const engine = Object.create(proto);
  const drawing = {
    globalAlpha: 1,
    drawImage(...args) { calls.push(args); },
    fillRect(...args) { rects.push(args); },
    scale(...args) { transforms.push(args); }
  };
  const ctx = new Proxy(drawing, { get(target, key) { return key in target ? target[key] : () => {}; } });
  Object.assign(engine, {
    ctx, canvas: { width: 1200, height: 800 }, hasEnteredAdultExperience: true,
    enemySpriteImages: {}, smoothAtlasImages: {}, spriteAtlasImages: {},
    enemies: [], placedTowers: [], enemyBullets: [], projectiles: [], particles: [],
    crates: [], powerups: [], bossHazards: [], hazards: [],
    activeRunMutators: [], towerMutators: [], isTowerMode: false,
    wave: 6, difficulty: 'standard', isPaused: false, isGameOver: false,
    animationClock: 0, freezeTimer: 0, rewardCount: 0, randomCalls: 0, randomValues: [],
    spawnRoutes: plain(window.INFERNAL_CITY_EXPANSION.worldLayouts.convergence.spawnRoutes),
    spawnGatePulses: {}, nextSpawnGateIndex: 0,
    enemiesSpawnedThisWave: 0, waveSpawnTarget: 60, waveSpawnQueue: [], bossSpawnedThisWave: false,
    citadel: { x: 600, y: 400, radius: 45 }, selectedHero: { id: 'aria' },
    getRunRandom() { this.randomCalls++; return this.randomValues.shift() ?? 0.99; },
    getCampaignFinalWave() { return 15; }, getCampaignDefinition() { return null; },
    getAdjustedWaveGroupCount(group) { return group.count; }
  });
  return { window, context, run, engine, calls, requests, rects, transforms, originalExpansion, originalCampaign,
    baseQueue, spriteData: ENEMY_SPRITE_DATA, specialistTypes: SPECIALIST_ENEMY_TYPES, difficulties: DIFFICULTY_DATA };
}

const row = call => call[2] / (call[0].naturalHeight / 4);
const column = call => call[1] / (call[0].naturalWidth / 8);

test('the ten aerial identities use authored HP/speed and inherit only existing flying combat values', () => {
  const { window, originalExpansion, originalCampaign } = load();
  const aerial = window.INFERNAL_CITY_AERIAL_LEGIONS;
  const pack = window.INFERNAL_CITY_DLCS.freeExpansions.find(entry => entry.id === aerial.packId);
  assert.equal(aerial.enemyIds.length, 10);
  assert.equal(Object.isFrozen(aerial), true);
  assert.equal(Object.isFrozen(aerial.enemies), true);
  for (const unit of pack.aerialLegionUnits) {
    const enemy = aerial.enemies[unit.id];
    assert.equal(enemy.name, unit.name);
    assert.equal(enemy.factionId, unit.faction);
    assert.equal(enemy.baseType, 'flying');
    assert.deepEqual(plain(enemy.stats), { ...plain(originalExpansion.enemyDefinitions.flying.stats), hp: unit.hp, speed: unit.speed });
    assert.ok(enemy.traits.includes('flying') && enemy.traits.includes('specialist'));
    assert.equal(Object.isFrozen(enemy.stats), true);
    assert.equal(window.INFERNAL_CITY_EXPANSION.enemyDefinitions[unit.id], enemy);
  }
  assert.equal(Object.keys(window.INFERNAL_CITY_ENEMY_LEGIONS.enemies).length, 50);
  assert.deepEqual(plain(window.INFERNAL_CITY_CAMPAIGN_CONTENT), originalCampaign);
  assert.equal(window.INFERNAL_CITY_EXPANSION.waveScripts, originalExpansion.waveScripts);
  assert.equal(window.INFERNAL_CITY_EXPANSION.enemyDefinitions.flying, originalExpansion.enemyDefinitions.flying);
});

test('wave selection follows the existing faction unlock rule and eventually selects all ten units', () => {
  const { window } = load();
  const aerial = window.INFERNAL_CITY_AERIAL_LEGIONS;
  assert.equal(aerial.selectForWave(3), null);
  assert.equal(aerial.selectForWave(6, 'void'), 'air_void_manta');
  const seen = new Set();
  for (let wave = 4; wave <= 40; wave++) {
    const selected = aerial.selectForWave(wave);
    const unlocked = aerial.factionIds.slice(0, Math.min(10, Math.ceil(wave / 3)));
    assert.ok(unlocked.includes(aerial.enemies[selected].factionId));
    assert.equal(aerial.selectForWave(wave), selected);
    seen.add(selected);
  }
  assert.equal(seen.size, 10);
});

test('real scripted waves replace only non-boss flying slots and preserve every route and time', () => {
  const { engine, window, baseQueue } = load();
  let replaced = 0;
  for (let wave = 1; wave <= 15; wave++) {
    engine.wave = wave;
    const authored = baseQueue.call(engine, wave);
    const originalDefinition = engine.activeWaveDefinition;
    const originalGroups = plain(originalDefinition.groups);
    const queue = engine.buildWaveSpawnQueue(wave);
    assert.equal(queue.length, authored.length);
    queue.forEach((entry, index) => {
      const previous = authored[index];
      assert.deepEqual(plain({ ...entry, type: previous.type }), plain(previous));
      if (previous.type === 'flying' && !previous.boss && wave >= 4) {
        assert.ok(window.INFERNAL_CITY_AERIAL_LEGIONS.enemies[entry.type]);
        replaced++;
      } else assert.equal(entry.type, previous.type);
    });
    assert.deepEqual(plain(originalDefinition.groups), originalGroups, 'authored groups remain immutable');
    if (authored.some(entry => entry.type === 'flying') && wave >= 4) {
      assert.notEqual(engine.activeWaveDefinition, originalDefinition);
      assert.ok(engine.activeWaveDefinition.groups.some(group => window.INFERNAL_CITY_AERIAL_LEGIONS.enemies[group.type]));
    }
  }
  assert.ok(replaced > 0);
  engine.isTowerMode = true;
  assert.deepEqual(plain(engine.buildWaveSpawnQueue(30)), []);
});

test('Infinitum fallback keeps the same random draws and preserves the other legion selections', () => {
  const { engine, window } = load();
  engine.wave = 30;
  engine.randomValues = [0.99, 0.45];
  assert.equal(engine.chooseFallbackEnemyType(), window.INFERNAL_CITY_AERIAL_LEGIONS.selectForWave(30));
  assert.equal(engine.randomCalls, 2);
  engine.randomValues = [0.99, 0.98];
  assert.equal(engine.chooseFallbackEnemyType(), 'swarmer');
  assert.equal(engine.randomCalls, 4);
  engine.randomValues = [0.1, 0, 0];
  assert.equal(engine.chooseFallbackEnemyType(), window.INFERNAL_CITY_ENEMY_LEGIONS.factions.bioforge.enemyIds[0]);
  assert.equal(engine.randomCalls, 7);
  engine.wave = 3; engine.randomValues = [0.45];
  assert.equal(engine.chooseFallbackEnemyType(), 'runner');
  assert.equal(engine.randomCalls, 8);
});

test('real spawning applies aerial, specialist and global modifiers exactly once without ground modifiers', () => {
  const { engine, window, difficulties, specialistTypes } = load();
  engine.isTowerMode = true;
  engine.difficulty = 'standard';
  engine.wave = 11;
  engine.towerMutators = [{ id: 'aerial-test', modifiers: {
    enemyHpMultiplier: 1.3, flyingHpMultiplier: 1.4, specialistHpMultiplier: 1.2,
    flyingSpeedMultiplier: 1.15, enemySpeedMultiplier: 0.9, groundSpeedMultiplier: 2,
    enemyDamageMultiplier: 1.25, routeLengthMultiplier: 1.5, flyingStealthSeconds: 3
  } }];
  const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, actual + ' !== ' + expected);
  for (const definition of Object.values(window.INFERNAL_CITY_AERIAL_LEGIONS.enemies)) {
    const enemy = engine.spawnEnemy(definition.id, 2, { hpMultiplier: 0.5 });
    close(enemy.hp, definition.stats.hp * 2 * difficulties.standard.enemyHp * 1.3 * 1.4 * 1.2 * 0.5);
    close(enemy.maxHp, enemy.hp);
    close(enemy.speed, definition.stats.speed * difficulties.standard.enemySpeed * 1.15 * 0.9 / 1.5);
    close(enemy.baseSpeed, enemy.speed);
    close(enemy.legionBaseSpeed, enemy.speed);
    close(enemy.damage, definition.stats.damage * 1.25);
    assert.equal(enemy.authoredReward, definition.stats.reward);
    assert.equal(enemy.legionFactionId, definition.factionId);
    assert.equal(enemy.stealthTimer, 3);
    assert.equal(enemy.routeIndex, 2);
    assert.equal(enemy.color, '#38bdf8');
    assert.equal(engine.isEnemyFlying(enemy), true);
    assert.equal(engine.isEnemyFlying({ type: definition.id }), true, 'classification survives saved enemy reconstruction');
    assert.ok(specialistTypes.includes(enemy.type));
    assert.equal(window.INFERNAL_CITY_INFINITUM_RUNTIME.isSpecialist(enemy), true);
  }
  assert.equal(engine.enemiesSpawnedThisWave, 10);
  assert.equal(engine.isEnemyFlying({ type: 'swarmer' }), false);
  assert.equal(engine.isEnemyFlying(null), false);
});

test('actual spawning through a scripted queue retains wave counts and aerial names', () => {
  const { engine, window } = load();
  engine.wave = 8;
  engine.waveSpawnQueue = engine.buildWaveSpawnQueue(8).filter(entry => !entry.boss);
  const expectedTypes = engine.waveSpawnQueue.map(entry => entry.type);
  const expectedCount = expectedTypes.length;
  for (let index = 0; index < expectedCount; index++) engine.spawnMutant();
  assert.equal(engine.enemiesSpawnedThisWave, expectedCount);
  assert.equal(engine.waveSpawnQueue.length, 0);
  assert.deepEqual(plain(engine.enemies.map(enemy => enemy.type)), plain(expectedTypes));
  engine.enemies.filter(enemy => window.INFERNAL_CITY_AERIAL_LEGIONS.enemies[enemy.type]).forEach(enemy => {
    assert.equal(enemy.name, window.INFERNAL_CITY_AERIAL_LEGIONS.enemies[enemy.type].name);
  });
});

test('completion uses approved native fractional cells while retaining health and facing cues', () => {
  const { engine, window, calls, rects, transforms } = load();
  const enemy = engine.spawnEnemy('air_bioforge_wasp');
  enemy.hp /= 2; enemy.facingAngle = Math.PI;
  engine.drawEnemy(enemy);
  const call = calls.at(-1);
  const spec = window.INFERNAL_CITY_DLC_ART.assets['enemies/air_bioforge_wasp'];
  assert.equal(call[0].src, spec.src);
  assert.equal(call[3], spec.width / 8);
  assert.equal(call[4], spec.height / 4);
  assert.equal(spec.drawScaleSha256, spec.sha256);
  assert.ok(spec.drawScale > 1 && spec.drawScale < 1.6, 'hash-bound scale compensates only native gutters');
  assert.ok(Math.abs(call[7] - 54 * spec.drawScale) < 1e-8);
  assert.ok(!Number.isInteger(call[3]), 'native atlas cell is intentionally fractional');
  assert.equal(row(call), 0);
  assert.equal(rects.length, 2, 'the real body renderer retains both HP bar rectangles');
  assert.deepEqual(transforms.at(-1), [-1, 1]);
  enemy.attackAnimationTimer = 0.4; engine.drawEnemy(enemy);
  assert.equal(row(calls.at(-1)), 1);
  engine.update(0.2); enemy.attackAnimationTimer = 0.2; engine.drawEnemy(enemy);
  assert.equal(column(calls.at(-1)), 4);
  engine.prefersReducedMotion = true; engine.drawEnemy(enemy);
  assert.equal(column(calls.at(-1)), 0);
});

test('the shared completion lifecycle handles aerial shields, actual deaths, revivals and reset', () => {
  const { engine, calls } = load();
  const enemy = engine.spawnEnemy('air_void_manta');
  enemy.shield = 10;
  engine.damageEnemy(enemy, 4); engine.drawEnemy(enemy);
  assert.equal(row(calls.at(-1)), 0);
  engine.damageEnemy(enemy, 6); engine.drawEnemy(enemy);
  assert.equal(row(calls.at(-1)), 3);
  engine.update(0.6); engine.drawEnemy(enemy);
  assert.equal(row(calls.at(-1)), 0);
  enemy.revive = true;
  engine.killEnemy(enemy);
  const count = calls.length;
  engine.render();
  assert.equal(calls.length, count);
  assert.equal(engine.rewardCount, 0);
  engine.killEnemy(enemy); engine.killEnemy(enemy); engine.render();
  assert.equal(engine.rewardCount, 1);
  assert.equal(engine.enemies.length, 0);
  assert.equal(row(calls.at(-1)), 2);
  engine.startNewGame();
  const afterReset = calls.length; engine.render();
  assert.equal(calls.length, afterReset);
});

test('unapproved or unavailable aerial art leaves the existing sprite fallback and caches failures', () => {
  const { engine, window, calls, requests, spriteData } = load({ imageReady: false });
  const key = 'enemies/air_shadow_owl';
  const spec = window.INFERNAL_CITY_DLC_ART.assets[key];
  spec.approved = false;
  const enemy = engine.spawnEnemy('air_shadow_owl');
  engine.drawEnemy(enemy);
  const fallbackSrc = engine.smoothAtlasImages[spriteData.flying.src]?.src || spriteData.flying.src;
  assert.equal(requests.includes(spec.src), false);
  assert.equal(calls.at(-1)[0].src, fallbackSrc);
  spec.approved = true;
  engine.drawEnemy(enemy); engine.drawEnemy(enemy);
  assert.equal(requests.filter(src => src === spec.src).length, 1);
  assert.equal(calls.at(-1)[0].src, fallbackSrc);
  spec.sha256 = 'unapproved';
  assert.equal(window.INFERNAL_CITY_SPRITE_COMPLETION.approved(key), null);
});

test('aerial modules are idempotent and placed around the existing runtime in the HTML bootstrap', () => {
  const { run, window, specialistTypes } = load();
  const contract = window.INFERNAL_CITY_AERIAL_LEGIONS;
  const completion = window.INFERNAL_CITY_SPRITE_COMPLETION;
  const count = specialistTypes.length;
  run('aerial-legions.v1.js'); run('aerial-legions-runtime.v1.js');
  assert.equal(window.INFERNAL_CITY_AERIAL_LEGIONS, contract);
  assert.equal(window.INFERNAL_CITY_SPRITE_COMPLETION, completion);
  assert.equal(specialistTypes.length, count);
  const html = read('index.html');
  const at = name => html.indexOf('src="' + name + '"');
  assert.ok(at('aerial-legions.v1.js') > at('dlc-packs.v1.js'));
  assert.ok(at('game.v9.js') > at('aerial-legions.v1.js'));
  assert.ok(at('aerial-legions-runtime.v1.js') > at('sprite-completion.v1.js'));
  assert.ok(at('sprite-completion-runtime.v1.js') > at('aerial-legions-runtime.v1.js'));
});
