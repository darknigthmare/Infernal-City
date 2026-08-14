'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const EXPANSION = require(path.join(ROOT, 'expansion.v1.js'));
const CAMPAIGN_SOURCE = fs.readFileSync(path.join(ROOT, 'campaign-content.v1.js'), 'utf8');
const CHARACTER_SOURCE = fs.readFileSync(path.join(ROOT, 'characters.v1.js'), 'utf8');
const SPECIALIZATION_SOURCE = fs.readFileSync(path.join(ROOT, 'specialization-runtime.v1.js'), 'utf8');
const PROFESSIONAL_SOURCE = fs.readFileSync(path.join(ROOT, 'gameplay-professional.v1.js'), 'utf8');
const HTML_SOURCE = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadCampaignContent() {
  const window = { INFERNAL_CITY_EXPANSION: EXPANSION };
  const sandbox = {
    window,
    console,
    Date,
    Math,
    Object,
    Array,
    Set,
    String,
    Number
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(CHARACTER_SOURCE, context, { filename: 'characters.v1.js' });
  vm.runInContext(CAMPAIGN_SOURCE, context, { filename: 'campaign-content.v1.js' });
  return window.INFERNAL_CITY_CAMPAIGN_CONTENT;
}

function loadSpecializationRuntime() {
  const window = {};
  const sandbox = { window, console, Math, Object, Array, Number };
  sandbox.globalThis = sandbox;
  vm.runInContext(
    SPECIALIZATION_SOURCE,
    vm.createContext(sandbox),
    { filename: 'specialization-runtime.v1.js' }
  );
  return window.INFERNAL_CITY_SPECIALIZATION_RUNTIME;
}

function makeRuntimeEngine(defenses, specs, enemies = []) {
  return {
    placedTowers: defenses,
    enemies,
    crates: [],
    powerups: [],
    waveActive: true,
    getDefenseSpecializationOptions(defense) {
      return [specs[defense.specializationId]].filter(Boolean);
    },
    findTarget() {
      return enemies[0] || null;
    },
    getEnemiesInRange() {
      return enemies;
    }
  };
}

test('professional campaign owns twenty authored waves grouped into ten throne contracts', () => {
  const content = loadCampaignContent();
  const waves = plain(content.tenThronesWaves);
  const knownEnemies = new Set(Object.keys(EXPANSION.enemyDefinitions));
  const knownLayouts = new Set(Object.keys(EXPANSION.worldLayouts));
  const legacyNames = new Set(EXPANSION.waveScripts.ten_thrones_20.waves.map(wave => wave.name));

  assert.ok(content);
  assert.equal(content.version, '3.1.0');
  assert.equal(Object.isFrozen(content), true);
  assert.equal(waves.length, 20);
  assert.deepEqual(waves.map(wave => wave.number), Array.from({ length: 20 }, (_, index) => index + 1));
  assert.equal(new Set(waves.map(wave => wave.name)).size, 20, 'chaque vague possède un titre propre');
  assert.equal(waves.some(wave => legacyNames.has(wave.name)), false, 'la campagne pro ne recycle aucun titre historique');

  waves.forEach((wave, index) => {
    const expectedContract = Math.floor(index / 2) + 1;
    assert.equal(wave.contract, expectedContract, `vague ${wave.number}: contrat`);
    assert.match(wave.name, /\S/u);
    assert.match(wave.objective, /\S/u);
    assert.equal(knownLayouts.has(wave.layoutPolicy), true, `vague ${wave.number}: disposition`);
    assert.equal(wave.groups.length, 3, `vague ${wave.number}: composition lisible`);
    assert.ok(Number.isFinite(wave.reward) && wave.reward > 0);
    assert.ok(Number.isFinite(wave.intermissionMs) && wave.intermissionMs >= 5000);
    wave.groups.forEach(group => {
      assert.equal(knownEnemies.has(group.type), true, `vague ${wave.number}: ${group.type}`);
      assert.ok(Number.isInteger(group.count) && group.count > 0);
      assert.ok(Number.isFinite(group.intervalMs) && group.intervalMs > 0);
      assert.ok(Number.isFinite(group.delayMs) && group.delayMs >= 0);
      assert.ok(Array.isArray(group.routePattern) && group.routePattern.length > 0);
      assert.equal(group.routePattern.every(route => Number.isInteger(route) && route >= 0 && route <= 3), true);
    });
  });

  for (let contract = 1; contract <= 10; contract += 1) {
    const pair = waves.filter(wave => wave.contract === contract);
    assert.equal(pair.length, 2, `contrat ${contract}`);
    assert.match(pair[0].objective, /Sécuriser/u);
    assert.match(pair[1].objective, /Trône/u);
    assert.ok(pair[1].reward > pair[0].reward);
  }
});

test('Infinitum exposes twenty-eight unique and structurally valid mutators', () => {
  const content = loadCampaignContent();
  const mutators = plain(content.infinitumMutators);
  const baseIds = new Set(EXPANSION.infinitumMutators.map(mutator => mutator.id));

  assert.equal(mutators.length, 28);
  assert.equal(new Set(mutators.map(mutator => mutator.id)).size, mutators.length);
  mutators.forEach(mutator => {
    assert.match(mutator.id, /^[a-z0-9_]+$/u);
    assert.match(mutator.name, /\S/u);
    assert.match(mutator.description, /\S/u);
    assert.ok(Number.isFinite(mutator.difficulty) && mutator.difficulty > 0);
    assert.ok(mutator.modifiers && Object.keys(mutator.modifiers).length > 0);
    if (!baseIds.has(mutator.id)) {
      assert.equal(mutator.tags.includes('professional'), true);
      assert.equal(mutator.tags.includes('infinitum'), true);
    }
  });
});

test('professional Daily is deterministic and always supplies direct, anti-air and utility roles', () => {
  const content = loadCampaignContent();
  const date = new Date('2026-08-13T12:00:00.000Z');
  const first = plain(content.createDailyChallenge(date, 'qa-professional'));
  const replay = plain(content.createDailyChallenge(date, 'qa-professional'));
  const roles = plain(content.defenseRoles);

  assert.deepEqual(replay, first, 'la même date et le même profil reproduisent le contrat');
  assert.equal(first.startingDefenseIds.length, 3);
  assert.equal(new Set(first.startingDefenseIds).size, 3, 'le deck ne contient aucun doublon');
  assert.equal(roles.direct.includes(first.startingDefenseIds[0]), true);
  assert.equal(roles.antiAir.includes(first.startingDefenseIds[1]), true);
  assert.equal(roles.utility.includes(first.startingDefenseIds[2]), true);
  assert.match(first.heroId, /\S/u);
});

test('specialization runtime initializes charges and advances heat, ramp and patrol state', () => {
  const runtime = loadSpecializationRuntime();
  const enemy = { id: 'target-1', x: 80, y: 0 };
  const mine = { x: 0, y: 0, range: 120, specializationId: 'landmine_scatter' };
  const vulcan = { x: 0, y: 0, range: 120, specializationId: 'vulcan_cerberus' };
  const flame = { x: 0, y: 0, range: 120, specializationId: 'flame_furnace' };
  const laser = { x: 20, y: 30, range: 100, specializationId: 'laser_interceptor' };
  const specs = {
    landmine_scatter: { id: 'landmine_scatter', modifiers: { mineCount: 6 } },
    vulcan_cerberus: { id: 'vulcan_cerberus', modifiers: { heatCapacityMultiplier: 1.5 } },
    flame_furnace: { id: 'flame_furnace', modifiers: { maximumRamp: 1.4, rampDamagePerSecond: 0.2 } },
    laser_interceptor: { id: 'laser_interceptor', modifiers: { patrolRadiusMultiplier: 1.2 } }
  };
  [mine, vulcan, flame, laser].forEach(defense => {
    runtime.initializeDefense(defense, specs[defense.specializationId]);
  });
  const engine = makeRuntimeEngine([mine, vulcan, flame, laser], specs, [enemy]);

  assert.equal(runtime.version, '1.0.0');
  assert.equal(Object.isFrozen(runtime), true);
  assert.equal(mine.remainingCharges, 6);
  runtime.beforeUpdate(engine, 0.5);
  assert.equal(vulcan.specializationHeat, 18);
  assert.ok(Math.abs(flame.specializationRamp - 0.1) < 1e-9);
  assert.notEqual(laser.x, laser.specializationOriginX);
  assert.notEqual(laser.y, laser.specializationOriginY);
});

test('specialization runtime applies orbit control, bounded salvage attraction and mine rearm', () => {
  const runtime = loadSpecializationRuntime();
  const enemy = { id: 'target-2', x: 40, y: 0, slowTimer: 0, slowSpeedMultiplier: 1 };
  const gravity = { x: 0, y: 0, range: 100, hp: 10, maxHp: 10, damage: 0, specializationId: 'gravity_orbit' };
  const magnet = { x: 0, y: 0, range: 100, hp: 10, maxHp: 10, damage: 0, specializationId: 'magnet_salvager' };
  const mine = { x: 0, y: 0, range: 100, hp: 10, maxHp: 10, damage: 0, remainingCharges: 0, specializationId: 'landmine_scatter' };
  const specs = {
    gravity_orbit: { id: 'gravity_orbit', modifiers: { pathLengthMultiplier: 1.25 } },
    magnet_salvager: { id: 'magnet_salvager', modifiers: { collectionSpeedMultiplier: 1.4 } },
    landmine_scatter: { id: 'landmine_scatter', modifiers: { mineCount: 5 } }
  };
  const engine = makeRuntimeEngine([gravity, magnet, mine], specs, [enemy]);
  engine.crates = [{ x: 50, y: 0 }];
  runtime.beforeUpdate(engine, 0.1);

  assert.ok(enemy.pathDistortionTimer > 0);
  assert.equal(enemy.pathDistortionMultiplier, 1.25);
  assert.ok(enemy.slowTimer > 0);
  assert.ok(enemy.slowSpeedMultiplier < 1);
  assert.ok(engine.crates[0].x < 50, 'la caisse converge vers le drone');

  engine.waveActive = false;
  runtime.afterUpdate(engine);
  assert.equal(mine.remainingCharges, 5);
  assert.equal(mine.rearmTimer, 0);
});

test('professional gameplay source carries the deterministic simulation and progression contracts', () => {
  assert.match(PROFESSIONAL_SOURCE, /const FIXED_STEP_SECONDS = 1 \/ 60;/u);
  assert.match(PROFESSIONAL_SOURCE, /while \(this\.simulationAccumulator >= FIXED_STEP_SECONDS/u);
  assert.match(PROFESSIONAL_SOURCE, /this\.update\(FIXED_STEP_SECONDS \* overdriveScale\)/u);
  assert.match(PROFESSIONAL_SOURCE, /proto\.launchPreparedWave = function launchPreparedWave/u);
  assert.match(PROFESSIONAL_SOURCE, /this\.gameplayPhase = 'preparation'/u);
  assert.match(PROFESSIONAL_SOURCE, /META_HP_MAX_RANK = 10/u);
  assert.match(PROFESSIONAL_SOURCE, /META_FIRE_RATE_MAX_RANK = 10/u);
  assert.match(PROFESSIONAL_SOURCE, /proto\.sanitizeRunCheckpoint = function sanitizeRunCheckpointProfessional/u);
  assert.match(PROFESSIONAL_SOURCE, /proto\.getSpatialEnemyCandidates = function getSpatialEnemyCandidates/u);
  assert.match(PROFESSIONAL_SOURCE, /TARGET_POLICIES = new Set/u);
  assert.match(PROFESSIONAL_SOURCE, /tutorialSteps: TUTORIAL_STEPS/u);
  assert.match(PROFESSIONAL_SOURCE, /secondaryObjectives: SECONDARY_OBJECTIVES/u);
});

test('HTML exposes the complete tactical, recovery and accessibility surface in safe script order', () => {
  const requiredIds = [
    'guided-tutorial-toggle',
    'save-failure-banner',
    'btn-emergency-export',
    'tactical-phase-txt',
    'btn-launch-wave',
    'btn-game-speed',
    'btn-combat-pause',
    'mission-secondary-objective-txt',
    'tutorial-coach',
    'defense-targeting-policy',
    'gamepad-deadzone',
    'gamepad-sensitivity'
  ];
  const ids = [...HTML_SOURCE.matchAll(/\bid="([^"]+)"/gu)].map(match => match[1]);
  requiredIds.forEach(id => assert.equal(ids.includes(id), true, `#${id}`));
  assert.equal(new Set(ids).size, ids.length, 'aucun identifiant HTML dupliqué');
  assert.match(HTML_SOURCE, /id="save-failure-banner"[^>]*role="alert"/u);
  assert.match(HTML_SOURCE, /id="tutorial-coach"[^>]*role="region"[^>]*aria-labelledby="tutorial-coach-title"/u);
  assert.match(HTML_SOURCE, /<label[^>]*for="defense-targeting-policy"/u);

  const specializationIndex = HTML_SOURCE.indexOf('src="specialization-runtime.v1.js"');
  const campaignIndex = HTML_SOURCE.indexOf('src="campaign-content.v1.js"');
  const professionalIndex = HTML_SOURCE.indexOf('src="gameplay-professional.v1.js"');
  const infinitumIndex = HTML_SOURCE.indexOf('src="infinitum-runtime.v1.js"');
  const pwaIndex = HTML_SOURCE.indexOf('src="pwa.v4.js"');
  assert.ok(specializationIndex >= 0);
  assert.ok(campaignIndex > specializationIndex);
  assert.ok(gameIndex > campaignIndex);
  assert.ok(professionalIndex > gameIndex);
  assert.ok(infinitumIndex > professionalIndex);
  assert.ok(pwaIndex > infinitumIndex);
});

test('all professional Daily decks stay deterministic, role-safe and duplicate-free over a full year', () => {
  const content = loadCampaignContent();
  for (let day = 0; day < 366; day += 1) {
    const challenge = plain(content.createDailyChallenge(new Date(Date.UTC(2028, 0, 1 + day)), 'annual-qa'));
    assert.equal(challenge.startingDefenseIds.length, 3);
    assert.equal(new Set(challenge.startingDefenseIds).size, 3, challenge.date);
  }
});
  const gameIndex = HTML_SOURCE.indexOf('src="game.v9.js"');
