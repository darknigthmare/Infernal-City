'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const expansion = require(path.join(ROOT, 'expansion.v1.js'));
const plain = value => JSON.parse(JSON.stringify(value));
const HAVEN_NAMES = {
  haven_outer_port: 'Port Extérieur d’Haven',
  haven_sunken_cathedral: 'Cathédrale Engloutie',
  haven_abyssal_reactor: 'Réacteur Abyssal',
  haven_inner_citadel: 'Citadelle Intérieure (Dernier Carré)'
};
const HAVEN_IDS = Object.keys(HAVEN_NAMES);

function loadGame(saved = null) {
  const storage = new Map(saved ? [['valkyrie_sweeper_save', JSON.stringify(saved)]] : []);
  const window = { innerWidth: 1200, innerHeight: 800, addEventListener() {}, removeEventListener() {} };
  const document = {
    readyState: 'loading', body: null, addEventListener() {}, getElementById() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    window, document, console, navigator: { getGamepads() { return []; } },
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, String(value)); }, removeItem(key) { storage.delete(key); }
    },
    audio: new Proxy({}, { get(target, key) { return target[key] || (() => {}); } }),
    requestAnimationFrame() {}, cancelAnimationFrame() {}, setTimeout() {}, clearTimeout() {}
  });
  ['expansion.v1.js', 'characters.v1.js', 'dlc-packs.v1.js'].forEach(name => vm.runInContext(read(name), context, { filename: name }));
  vm.runInContext(read('game.v9.js') + '\n;globalThis.testExports = { GameEngine, TOWER_TYPES };', context);
  const { GameEngine, TOWER_TYPES } = context.testExports;
  const images = new Map(), requests = [], draws = [], scales = [];
  const proto = GameEngine.prototype;
  proto.preloadSpriteAsset = function preloadImage(src) {
    requests.push(src);
    if (!images.has(src)) images.set(src, {
      src, complete: true,
      naturalWidth: /\/maps\/haven_/.test(src) ? 1536 : 1024,
      naturalHeight: /\/maps\/haven_/.test(src) ? 1024 : 1024,
      addEventListener() {}
    });
    return images.get(src);
  };
  const engine = new GameEngine();
  Object.assign(engine, {
    canvas: {
      width: 1200, height: 800,
      setAttribute() {}, addEventListener() {},
      getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
    },
    ctx: new Proxy({
      drawImage(...args) { draws.push(args); },
      scale(...args) { scales.push(args); }
    }, { get(target, key) { return key in target ? target[key] : () => {}; } }),
    updateHUD() {}, updateWeaponsHUD() {}, updateHeroPresentation() {}, renderBuildBar() {},
    showFeedback() {}, announce() {}, addFloatingText() {}, saveProgress() {}
  });
  return { engine, window, document, storage, context, GameEngine, TOWER_TYPES, images, requests, draws, scales };
}

test('the four named Haven plates preserve native dimensions and cardinal open approaches', () => {
  for (const [id, name] of Object.entries(HAVEN_NAMES)) {
    const layout = expansion.worldLayouts[id];
    assert.equal(layout.name, name);
    assert.deepEqual(layout.world, { width: 1200, height: 800 });
    assert.equal(layout.citadel.x, 600); assert.equal(layout.citadel.y, 400);
    assert.equal(layout.dailyEligible, false);
    assert.deepEqual([layout.approachBounds.minX, layout.approachBounds.minY, layout.approachBounds.maxX, layout.approachBounds.maxY], [-300, -200, 1500, 1000]);
    assert.equal(layout.previewSrc, layout.terrainSrc);
    const png = fs.readFileSync(path.join(ROOT, layout.terrainSrc));
    assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
    const nativeWidth = png.readUInt32BE(16), nativeHeight = png.readUInt32BE(20);
    assert.deepEqual([nativeWidth, nativeHeight], [1536, 1024]);
    assert.equal(layout.approachBounds.width / nativeWidth, layout.approachBounds.height / nativeHeight);
    assert.deepEqual(layout.spawnRoutes.map(route => route.side), ['north', 'east', 'south', 'west']);
    for (const route of layout.spawnRoutes) {
      const vertical = route.side === 'north' || route.side === 'south';
      assert.ok(route.polyline.every(point => vertical ? point.x === 600 : point.y === 400));
      assert.deepEqual(route.polyline.at(-1), { x: 600, y: 400 });
      let distance = Infinity;
      for (const point of route.polyline) {
        const next = Math.hypot(point.x - 600, point.y - 400);
        assert.ok(next < distance, route.id + ' must progress toward the citadel');
        distance = next;
      }
    }
    assert.ok(layout.buildBounds.minX > 0 && layout.buildBounds.maxX < 1200);
    assert.ok(layout.buildBounds.minY > 0 && layout.buildBounds.maxY < 800);
    assert.equal(layout.obstacles, undefined);
  }
});

test('daily generation preserves the four historical layouts and its previous seeded contract', () => {
  const historical = ['convergence', 'western_wall', 'southern_watch', 'twin_rift'];
  assert.deepEqual(Object.values(expansion.worldLayouts).filter(layout => layout.dailyEligible !== false).map(layout => layout.id), historical);
  for (let index = 0; index < 120; index++) {
    const daily = expansion.utils.createDailyChallenge(new Date(Date.UTC(2026, 0, 1 + index)), 'haven-regression');
    assert.ok(historical.includes(daily.layoutId));
  }
  assert.deepEqual(expansion.utils.createDailyChallenge('2026-11-24', 'haven-regression'), {
    id: 'daily-2026-11-24-5ac06b45', date: '2026-11-24', seed: 1522559813,
    layoutId: 'convergence', heroId: 'kira', waveScriptId: 'siege_15',
    mutatorIds: ['long_march', 'siege_priority', 'lunar_grace'],
    startingDefenseIds: ['napalm_mine', 'laser_drone', 'tesla_spire'],
    rules: {
      retriesAllowed: true, deterministicSpawns: true, saveDuringRun: false,
      startingCoins: 145, scoreMultiplier: 1.56,
      scoreBonuses: { citadelUntouched: 5000, noDefenseSold: 1800, allWavesCleared: 8000 }
    }
  });
});

test('boot and first battle preloading retain each saved Haven layout instead of the default terrain', () => {
  for (const id of HAVEN_IDS) {
    const { engine, requests } = loadGame({ version: 8, selectedLayoutId: id, mapRotation: HAVEN_IDS });
    assert.equal(engine.saveLoadError, null);
    assert.equal(engine.selectedLayoutId, id);
    assert.equal(engine.worldLayout.id, id);
    assert.equal(engine.spawnRoutes.length, 4);
    assert.equal(requests.length, 0, 'boot waits for adult entry');
    engine.hasEnteredAdultExperience = true;
    engine.preloadBattleSprites();
    assert.equal(engine.approachTerrainImage.src, expansion.worldLayouts[id].terrainSrc);
    assert.equal(requests.includes(expansion.worldLayouts.convergence.terrainSrc), false);
  }
});

test('new games and run checkpoints preserve Haven terrain, routes and buildable defenses', () => {
  const { engine, TOWER_TYPES } = loadGame();
  engine.hasEnteredAdultExperience = true;
  for (const id of HAVEN_IDS) {
    engine.startNewGame({ layoutId: id, silent: true });
    assert.equal(engine.worldLayout.id, id);
    assert.equal(engine.approachTerrainImage.src, expansion.worldLayouts[id].terrainSrc);
    assert.ok(engine.enemies.every(enemy => enemy.routeId.startsWith(id + '_')));
    const position = engine.findValidDefensePlacement(360, 250, { radius: TOWER_TYPES.vulcan_turret.radius || 18 });
    assert.ok(position);
    engine.placedTowers = [engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, position.x, position.y)];
    engine.wave = 4;
    const checkpoint = engine.createRunCheckpoint();
    engine.applyWorldLayout('western_wall', { force: true, repositionUnits: false });
    assert.equal(engine.restoreRunCheckpoint(checkpoint), true);
    assert.equal(engine.selectedLayoutId, id);
    assert.equal(engine.worldLayout.id, id);
    assert.equal(engine.approachTerrainImage.src, expansion.worldLayouts[id].terrainSrc);
    assert.equal(engine.wave, 5);
    for (const defense of engine.placedTowers) {
      assert.equal(engine.validateDefensePlacement(defense.x, defense.y, { radius: defense.radius, ignoreDefense: defense }).ok, true);
    }
  }
});

test('manual rotation updates Haven terrain and is blocked during an active assault', () => {
  const { engine } = loadGame();
  engine.hasEnteredAdultExperience = true;
  engine.applyWorldLayout(HAVEN_IDS[0], { force: true, repositionUnits: false });
  engine.setMapRotation(HAVEN_IDS);
  engine.activeDlcBiomeId = 'dlc_astral_cathedral';
  engine.waveActive = true;
  assert.equal(engine.rotateWorldLayoutBetweenWaves(), false);
  assert.equal(engine.activeDlcBiomeId, 'dlc_astral_cathedral', 'a blocked rotation keeps the current visual preference');
  engine.waveActive = false;
  for (let index = 1; index <= HAVEN_IDS.length; index++) {
    assert.equal(engine.rotateWorldLayoutBetweenWaves(), true);
    const id = HAVEN_IDS[index % HAVEN_IDS.length];
    assert.equal(engine.selectedLayoutId, id);
    assert.equal(engine.approachTerrainImage.src, expansion.worldLayouts[id].terrainSrc);
    assert.ok(engine.spawnRoutes.every(route => route.id.startsWith(id + '_')));
    assert.equal(engine.activeDlcBiomeId, null);
    assert.equal(engine.createCampaignSaveData().activeDlcBiomeId, null);
    engine.activeDlcBiomeId = 'dlc_astral_cathedral';
  }
});

test('native Haven scenes draw at uniform scale on wide and portrait viewports', () => {
  const { engine, draws, scales } = loadGame();
  engine.hasEnteredAdultExperience = true;
  engine.prefersReducedMotion = true;
  for (const id of HAVEN_IDS) {
    engine.applyWorldLayout(id, { force: true, repositionUnits: false });
    for (const [width, height] of [[1536, 1024], [390, 844], [1920, 720]]) {
      engine.canvas.width = width; engine.canvas.height = height;
      const view = engine.getBattlefieldView(width, height);
      engine.applyBattlefieldView(view);
      engine.drawBattlefieldFloor(1200, 800, view);
      const call = draws.findLast(args => args[0] === engine.approachTerrainImage);
      assert.deepEqual(call.slice(1), [0, 0, 1536, 1024, -300, -200, 1800, 1200]);
      assert.equal(call[7] / call[3], call[8] / call[4]);
      const [scaleX, scaleY] = scales.at(-1);
      assert.equal(scaleX, scaleY);
      assert.ok(scaleX > 0);
    }
  }
});

test('returning from a side mode restores the Haven plate without changing saved camera or routes', () => {
  const { engine } = loadGame();
  engine.hasEnteredAdultExperience = true;
  engine.applyWorldLayout('haven_sunken_cathedral', { force: true, repositionUnits: false });
  engine.camera.zoom = 2;
  const state = engine.captureGameplayState();
  const camera = plain(state.camera);
  const routes = plain(state.spawnRoutes);
  engine.applyWorldLayout('western_wall', { force: true, repositionUnits: false });
  assert.equal(engine.restoreGameplayState(state), true);
  assert.equal(engine.worldLayout.id, 'haven_sunken_cathedral');
  assert.equal(engine.approachTerrainImage.src, expansion.worldLayouts.haven_sunken_cathedral.terrainSrc);
  assert.deepEqual(plain(engine.camera), camera);
  assert.deepEqual(plain(engine.spawnRoutes), routes);
});

test('the mission briefing exposes all four Haven names for manual selection', () => {
  const html = read('index.html');
  for (const [id, name] of Object.entries(HAVEN_NAMES)) {
    assert.ok(html.includes('<option value="' + id + '">' + name + '</option>'));
  }
});

test('manual Haven selection clears a previous biome, while a later explicit DLC choice survives reload', () => {
  const loaded = loadGame();
  const { engine, context, document, storage, GameEngine, draws } = loaded;
  ['dlc-art.v1.js', 'dlc-art-runtime.v1.js'].forEach(name => vm.runInContext(read(name), context, { filename: name }));
  const handlers = new Map();
  document.getElementById = id => id === 'layout-select'
    ? { addEventListener(name, handler) { handlers.set(name, handler); } }
    : null;
  engine.bindEvents();
  engine.saveProgress = GameEngine.prototype.saveProgress;
  engine.hasEnteredAdultExperience = true;
  for (const id of HAVEN_IDS) {
    engine.activeDlcBiomeId = 'dlc_astral_cathedral';
    handlers.get('change')({ target: { value: id } });
    assert.equal(engine.activeDlcBiomeId, null);
    const saved = JSON.parse(storage.get('valkyrie_sweeper_save'));
    assert.equal(saved.activeDlcBiomeId, null);
    assert.equal(saved.selectedLayoutId, id);
    engine.startNewGame({ layoutId: id, silent: true });
    const view = engine.getBattlefieldView();
    draws.length = 0;
    engine.drawBattlefieldFloor(1200, 800, view);
    engine.renderDlcBiomeOverlay(1200, 800, view);
    assert.ok(draws.some(call => call[0].src === expansion.worldLayouts[id].terrainSrc));
    assert.equal(draws.some(call => /\/maps\/astral_/.test(call[0].src)), false);
  }

  assert.equal(engine.selectDlcIllustratedMap('dlc_astral_cathedral', 'astral_parvis_solaire'), true);
  assert.equal(engine.activeDlcBiomeId, 'dlc_astral_cathedral');
  const saved = JSON.parse(storage.get('valkyrie_sweeper_save'));
  assert.equal(saved.activeDlcBiomeId, 'dlc_astral_cathedral');
  assert.equal(saved.dlcMapSelections.dlc_astral_cathedral, 'astral_parvis_solaire');
  const resumed = loadGame(saved);
  ['dlc-art.v1.js', 'dlc-art-runtime.v1.js'].forEach(name => vm.runInContext(read(name), resumed.context, { filename: name }));
  resumed.engine.hasEnteredAdultExperience = true;
  resumed.engine.preloadBattleSprites();
  assert.equal(resumed.engine.selectedLayoutId, 'haven_inner_citadel');
  assert.equal(resumed.engine.activeDlcBiomeId, 'dlc_astral_cathedral');
  resumed.engine.renderDlcBiomeOverlay(1200, 800, resumed.engine.getBattlefieldView());
  assert.ok(resumed.draws.some(call => call[0].src.endsWith('/astral_parvis_solaire.png')));
});
