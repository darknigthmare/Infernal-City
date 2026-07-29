'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'expansion.v1.js'), 'utf8');

const DEFENSE_IDS = [
  'vulcan_turret',
  'plasma_mortar',
  'railgun_pylon',
  'flame_trap',
  'tesla_spire',
  'cryo_cannon',
  'acid_trap',
  'laser_drone',
  'landmine',
  'aegis_barrier',
  'gravity_well',
  'missile_pod',
  'bio_siphon',
  'magnet_drone',
  'sawblade_turret',
  'emp_tower',
  'orbital_beam',
  'napalm_mine',
  'blood_shrine',
  'sonic_cannon'
];

function loadExpansion() {
  const window = {};
  const sandbox = {
    window,
    console,
    Date,
    Math,
    Object,
    Array,
    Set,
    String,
    Number,
    RangeError,
    TypeError
  };
  sandbox.globalThis = sandbox;
  vm.runInContext(SOURCE, vm.createContext(sandbox), { filename: 'expansion.v1.js' });
  return window.INFERNAL_CITY_EXPANSION;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('expansion exposes the stable 2.3 browser contract', () => {
  const expansion = loadExpansion();

  assert.ok(expansion);
  assert.equal(expansion.version, '2.3.0');
  assert.equal(expansion.schemaVersion, 1);
  assert.equal(expansion.title, 'La Guerre des Quatre Portes');
  assert.deepEqual(plain(expansion.world), { width: 1200, height: 800 });
  assert.equal(Object.isFrozen(expansion), true);
});

test('four fixed-size layouts provide valid bounds, citadels and polylines', () => {
  const { worldLayouts } = loadExpansion();
  assert.deepEqual(Object.keys(worldLayouts).sort(), [
    'convergence',
    'southern_watch',
    'twin_rift',
    'western_wall'
  ]);

  Object.values(worldLayouts).forEach(layout => {
    assert.equal(layout.world.width, 1200, `${layout.id} width`);
    assert.equal(layout.world.height, 800, `${layout.id} height`);
    assert.match(layout.name, /\S/);
    assert.match(layout.description, /\S/);
    assert.match(layout.terrainSrc, /^assets\/environment\/.+\.png$/);
    assert.equal(fs.existsSync(path.join(ROOT, layout.terrainSrc)), true, `${layout.id} terrain`);
    assert.equal(fs.existsSync(path.join(ROOT, layout.previewSrc)), true, `${layout.id} preview`);
    assert.ok(layout.citadel.x >= 0 && layout.citadel.x <= 1200);
    assert.ok(layout.citadel.y >= 0 && layout.citadel.y <= 800);
    assert.ok(layout.spawnRoutes.length >= 2);

    ['approachBounds', 'buildBounds'].forEach(key => {
      const value = layout[key];
      assert.ok(value.minX < value.maxX, `${layout.id} ${key} horizontal`);
      assert.ok(value.minY < value.maxY, `${layout.id} ${key} vertical`);
      assert.equal(value.width, value.maxX - value.minX);
      assert.equal(value.height, value.maxY - value.minY);
    });

    layout.spawnRoutes.forEach(spawnRoute => {
      assert.ok(['north', 'east', 'south', 'west'].includes(spawnRoute.side));
      assert.ok(spawnRoute.polyline.length >= 2, `${spawnRoute.id} is a polyline`);
      assert.deepEqual(plain(spawnRoute.polyline[0]), plain(spawnRoute.spawn));
      const destination = spawnRoute.polyline.at(-1);
      assert.equal(destination.x, layout.citadel.x, `${spawnRoute.id} reaches citadel x`);
      assert.equal(destination.y, layout.citadel.y, `${spawnRoute.id} reaches citadel y`);
    });
  });
});

test('asymmetric layouts enforce their requested attack directions', () => {
  const { worldLayouts } = loadExpansion();
  assert.ok(worldLayouts.western_wall.citadel.x >= 120 && worldLayouts.western_wall.citadel.x <= 160);
  assert.ok(worldLayouts.twin_rift.citadel.x < 200);
  assert.ok(worldLayouts.southern_watch.citadel.y < 150);

  assert.deepEqual(
    [...new Set(worldLayouts.convergence.spawnRoutes.map(spawnRoute => spawnRoute.side))].sort(),
    ['east', 'north', 'south', 'west']
  );
  assert.ok(worldLayouts.western_wall.spawnRoutes.every(spawnRoute => spawnRoute.side === 'east'));
  assert.ok(worldLayouts.twin_rift.spawnRoutes.every(spawnRoute => spawnRoute.side === 'east'));
  assert.ok(worldLayouts.southern_watch.spawnRoutes.every(spawnRoute => spawnRoute.side === 'south'));
  assert.equal(worldLayouts.twin_rift.spawnRoutes.length, 2);
});

test('the campaign contains fifteen deterministic waves using known enemies', () => {
  const expansion = loadExpansion();
  const script = expansion.waveScripts.siege_15;
  const knownTypes = new Set(Object.keys(expansion.enemyDefinitions));
  const usedTypes = new Set();

  assert.equal(script.deterministic, true);
  assert.equal(script.finalWave, 15);
  assert.equal(script.waves.length, 15);

  script.waves.forEach((wave, index) => {
    assert.equal(wave.number, index + 1);
    assert.ok(wave.groups.length > 0);
    wave.groups.forEach(group => {
      assert.equal(knownTypes.has(group.type), true, `wave ${wave.number}: ${group.type}`);
      assert.ok(Number.isInteger(group.count) && group.count > 0);
      assert.ok(Number.isFinite(group.intervalMs) && group.intervalMs > 0);
      assert.ok(Number.isFinite(group.delayMs) && group.delayMs >= 0);
      assert.ok(Array.isArray(group.routePattern) && group.routePattern.length > 0);
      assert.ok(group.routePattern.every(routeIndex => Number.isInteger(routeIndex) && routeIndex >= 0));
      usedTypes.add(group.type);
    });
  });

  ['flying', 'bulwark', 'artillery', 'splitter'].forEach(type => {
    assert.equal(usedTypes.has(type), true, `${type} appears in the campaign`);
  });
});

test('all four specialist enemies define combat stats, traits and counterplay', () => {
  const { enemyDefinitions } = loadExpansion();

  ['flying', 'bulwark', 'artillery', 'splitter'].forEach(type => {
    const enemy = enemyDefinitions[type];
    assert.equal(enemy.id, type);
    assert.match(enemy.name, /\S/);
    assert.match(enemy.role, /\S/);
    assert.match(enemy.counterplay, /\S/);
    assert.ok(enemy.stats.hp > 0);
    assert.ok(enemy.stats.speed > 0);
    assert.ok(enemy.stats.damage > 0);
    assert.ok(enemy.stats.reward > 0);
    assert.ok(enemy.traits.length >= 3);
  });

  assert.ok(enemyDefinitions.flying.traits.includes('flying'));
  assert.ok(enemyDefinitions.bulwark.shield.capacity > 0);
  assert.ok(enemyDefinitions.artillery.siege.splashRadius > 0);
  assert.equal(enemyDefinitions.splitter.split.childType, 'swarmer');
});

test('six heroes own unique, fully targeted combat kits', () => {
  const { heroKits } = loadExpansion();
  const expectedHeroes = ['aria', 'carmilla', 'kira', 'rin', 'selene', 'vespera'];
  assert.deepEqual(Object.keys(heroKits).sort(), expectedHeroes);

  const abilityIds = new Set();
  Object.values(heroKits).forEach(hero => {
    assert.match(hero.role, /\S/);
    assert.match(hero.passive.description, /\S/);
    assert.match(hero.active.description, /\S/);
    assert.match(hero.ultimate.description, /\S/);
    assert.ok(hero.active.cooldownMs >= 1000);
    assert.match(hero.active.targeting, /\S/);
    assert.equal(hero.ultimate.chargeRequired, 100);
    assert.equal(hero.preferredDefenses.length, 3);
    [hero.passive.id, hero.active.id, hero.ultimate.id].forEach(id => {
      assert.equal(abilityIds.has(id), false, `duplicate ability ${id}`);
      abilityIds.add(id);
    });
  });
  assert.equal(abilityIds.size, 18);
});

test('all twenty defenses have exactly two explicit specialization branches', () => {
  const { defenseSpecializations } = loadExpansion();
  assert.deepEqual(Object.keys(defenseSpecializations), DEFENSE_IDS);

  const branchIds = new Set();
  Object.entries(defenseSpecializations).forEach(([defenseId, branches]) => {
    assert.equal(branches.length, 2, defenseId);
    branches.forEach(branch => {
      assert.match(branch.name, /\S/);
      assert.match(branch.description, /\S/);
      assert.ok(Object.keys(branch.modifiers).length >= 3);
      assert.ok(branch.traits.length >= 3);
      assert.equal(branchIds.has(branch.id), false, `duplicate branch ${branch.id}`);
      branchIds.add(branch.id);
    });
  });
  assert.equal(branchIds.size, 40);
});

test('Infinitum includes a deep set of structured mutators', () => {
  const { infinitumMutators } = loadExpansion();
  const ids = new Set(infinitumMutators.map(mutator => mutator.id));

  assert.ok(infinitumMutators.length >= 8);
  assert.equal(ids.size, infinitumMutators.length);
  infinitumMutators.forEach(mutator => {
    assert.match(mutator.name, /\S/);
    assert.match(mutator.description, /\S/);
    assert.ok(mutator.difficulty >= 1 && mutator.difficulty <= 5);
    assert.ok(Object.keys(mutator.modifiers).length >= 2);
    assert.ok(mutator.tags.length >= 2);
  });
});

test('seeded RNG, hashing and daily challenges are deterministic', () => {
  const { utils } = loadExpansion();
  const first = utils.createSeededRng('same-seed');
  const second = utils.createSeededRng('same-seed');
  const other = utils.createSeededRng('other-seed');
  const firstSequence = Array.from({ length: 8 }, () => first());
  const secondSequence = Array.from({ length: 8 }, () => second());
  const otherSequence = Array.from({ length: 8 }, () => other());

  assert.deepEqual(firstSequence, secondSequence);
  assert.notDeepEqual(firstSequence, otherSequence);
  assert.equal(utils.hashString('Infernal City'), utils.hashString('Infernal City'));
  assert.notEqual(utils.hashString('Infernal City'), utils.hashString('Infernal city'));
  assert.equal(utils.dateKey('2026-07-29T23:00:00Z'), '2026-07-29');

  const dailyA = plain(utils.createDailyChallenge('2026-07-29T12:00:00Z', 'profile-a'));
  const dailyB = plain(utils.createDailyChallenge('2026-07-29T12:00:00Z', 'profile-a'));
  const dailyTomorrow = plain(utils.createDailyChallenge('2026-07-30T12:00:00Z', 'profile-a'));
  assert.deepEqual(dailyA, dailyB);
  assert.notDeepEqual(dailyA, dailyTomorrow);
  assert.match(dailyA.id, /^daily-2026-07-29-[0-9a-f]{8}$/);
  assert.ok(dailyA.mutatorIds.length >= 2 && dailyA.mutatorIds.length <= 3);
  assert.equal(dailyA.startingDefenseIds.length, 3);
});
