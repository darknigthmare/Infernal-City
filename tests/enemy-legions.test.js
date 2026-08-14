'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'enemy-legions.v1.js'), 'utf8');

function loadLegions() {
  const originalEnemy = Object.freeze({
    id: 'swarmer',
    name: 'Larve de Cendre',
    role: 'horde',
    stats: Object.freeze({ hp: 55, speed: 72, damage: 5, reward: 3, radius: 13, attackRange: 22, attackCooldownMs: 900 }),
    traits: Object.freeze(['ground'])
  });
  const originalExpansion = Object.freeze({
    version: 'test',
    enemyDefinitions: Object.freeze({ swarmer: originalEnemy }),
    utils: Object.freeze({ marker: true })
  });
  const window = { INFERNAL_CITY_EXPANSION: originalExpansion };
  const sandbox = { window, globalThis: null, console, Object, Array, Set, String, Number, Math };
  sandbox.globalThis = sandbox;
  vm.runInContext(SOURCE, vm.createContext(sandbox), { filename: 'enemy-legions.v1.js' });
  return { legions: window.INFERNAL_CITY_ENEMY_LEGIONS, expansion: window.INFERNAL_CITY_EXPANSION, originalExpansion };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('the immutable browser contract exposes fifty enemies in ten complete factions', () => {
  const { legions } = loadLegions();
  assert.ok(legions);
  assert.equal(legions.version, '1.0.0');
  assert.equal(legions.schemaVersion, 1);
  assert.equal(Object.keys(legions.enemies).length, 50);
  assert.equal(Object.keys(legions.factions).length, 10);
  assert.equal(Object.isFrozen(legions), true);
  assert.equal(Object.isFrozen(legions.enemies), true);
  assert.equal(Object.isFrozen(legions.effects), true);

  const allFactionMembers = [];
  Object.values(legions.factions).forEach(faction => {
    assert.match(faction.name, /\S/);
    assert.match(faction.doctrine, /\S/);
    assert.match(faction.counterplay, /\S/);
    assert.equal(faction.enemyIds.length, 5, faction.id);
    assert.equal(new Set(faction.enemyIds).size, 5, faction.id);
    faction.enemyIds.forEach(id => {
      assert.ok(legions.enemies[id], `${faction.id}: ${id}`);
      assert.equal(legions.enemies[id].factionId, faction.id);
      allFactionMembers.push(id);
    });
  });
  assert.equal(new Set(allFactionMembers).size, 50);
});

test('every enemy has bounded gameplay stats, one unique four-frame sheet and a useful codex entry', () => {
  const { legions } = loadLegions();
  const spritePaths = new Set();
  const expectedBounds = {
    hp: [50, 3000], speed: [20, 150], damage: [1, 120], reward: [1, 100], radius: [8, 45],
    attackRange: [20, 450], attackCooldownMs: [500, 4000], armor: [0, 0.65], controlResistance: [0, 0.85]
  };

  Object.entries(legions.enemies).forEach(([id, enemy]) => {
    assert.equal(enemy.id, id);
    assert.match(id, /^(bioforge|ossuary|void|infernal|shadow|plague|dreadtide|quantum|ash|nightmare)_[a-z0-9_]+$/);
    assert.ok(Number.isInteger(enemy.tier) && enemy.tier >= 1 && enemy.tier <= 5);
    assert.equal(enemy.spriteSrc, `assets/animations/enemy-legions/enemies/${id}.webp`);
    assert.equal(enemy.sprite.src, enemy.spriteSrc);
    assert.equal(enemy.sprite.columns, 4);
    assert.equal(enemy.sprite.rows, 1);
    assert.equal(enemy.sprite.frameCount, 4);
    assert.deepEqual(plain(enemy.sprite.frameOrder), { idle: 0, move: 1, attack: 2, impact: 3 });
    assert.equal(spritePaths.has(enemy.sprite.src), false, `sprite dupliqué: ${enemy.sprite.src}`);
    spritePaths.add(enemy.sprite.src);

    Object.entries(expectedBounds).forEach(([stat, [min, max]]) => {
      assert.ok(Number.isFinite(enemy.stats[stat]), `${id}.${stat}`);
      assert.ok(enemy.stats[stat] >= min && enemy.stats[stat] <= max, `${id}.${stat}=${enemy.stats[stat]}`);
    });
    assert.ok(enemy.traits.length >= 3, id);
    assert.match(enemy.counterplay, /\S.{20,}/, `${id} counterplay`);
    assert.match(enemy.codex.summary, /\S.{20,}/, `${id} summary`);
    assert.match(enemy.codex.tactics, /\S.{20,}/, `${id} tactics`);
    assert.match(enemy.codex.lore, /\S.{20,}/, `${id} lore`);
    assert.equal(Object.isFrozen(enemy), true);
  });
  assert.equal(spritePaths.size, 50);
});

test('attacks, mechanics and synergies are structured gameplay contracts rather than decorative copy', () => {
  const { legions } = loadLegions();
  const enemyIds = new Set(Object.keys(legions.enemies));
  const effectIds = new Set(Object.keys(legions.effects));
  const mechanicIds = new Set();
  const referencedEffects = new Set();

  Object.values(legions.enemies).forEach(enemy => {
    assert.match(enemy.attack.mode, /\S/);
    assert.match(enemy.attack.target, /\S/);
    assert.match(enemy.attack.damageType, /\S/);
    assert.match(enemy.attack.description, /\S.{15,}/);
    assert.ok(Number.isInteger(enemy.attack.burstCount) && enemy.attack.burstCount >= 1);
    if (enemy.attack.effectId) {
      assert.equal(effectIds.has(enemy.attack.effectId), true, `${enemy.id} attack effect`);
      referencedEffects.add(enemy.attack.effectId);
    }

    assert.ok(enemy.mechanics.length >= 1, enemy.id);
    enemy.mechanics.forEach(mechanic => {
      assert.equal(mechanicIds.has(mechanic.id), false, `mechanic duplicate: ${mechanic.id}`);
      mechanicIds.add(mechanic.id);
      assert.match(mechanic.type, /\S/);
      assert.match(mechanic.trigger, /\S/);
      assert.match(mechanic.target, /\S/);
      const values = Object.values(mechanic.values);
      assert.ok(values.length >= 2, `${enemy.id}.${mechanic.id} values`);
      assert.ok(values.every(value => Number.isFinite(value)), `${enemy.id}.${mechanic.id} numeric values`);
      assert.ok(values.some(value => value > 0), `${enemy.id}.${mechanic.id} active values`);
      if (mechanic.effectId) {
        assert.equal(effectIds.has(mechanic.effectId), true, `${enemy.id}.${mechanic.id} effect`);
        referencedEffects.add(mechanic.effectId);
      }
      (mechanic.summonIds || []).forEach(summonId => {
        assert.equal(enemyIds.has(summonId), true, `${enemy.id} summons ${summonId}`);
        assert.notEqual(summonId, enemy.id, `${enemy.id} cannot summon itself`);
      });
    });

    assert.ok(enemy.synergies.length >= 1, `${enemy.id} synergy`);
    enemy.synergies.forEach(entry => {
      assert.match(entry.condition, /\S/);
      assert.ok(Number.isFinite(entry.radius) && entry.radius > 0);
      assert.match(entry.description, /\S.{15,}/);
      assert.ok(entry.with.length >= 1);
      entry.with.forEach(targetId => {
        assert.equal(enemyIds.has(targetId), true, `${enemy.id} synergy target ${targetId}`);
        assert.notEqual(targetId, enemy.id, `${enemy.id} self-synergy`);
      });
      const bonuses = Object.values(entry.bonus);
      assert.ok(bonuses.length >= 1);
      assert.ok(bonuses.every(value => Number.isFinite(value) && value > 0));
    });
  });

  assert.equal(mechanicIds.size, 50);
  assert.deepEqual([...referencedEffects].sort(), [...effectIds].sort(), 'chaque effet possède au moins un consommateur gameplay');
});

test('all twenty-six projectile, field and deployable effects own a unique four-frame sheet', () => {
  const { legions } = loadLegions();
  assert.equal(Object.keys(legions.effects).length, 26);
  const paths = new Set();
  const validKinds = new Set(['projectile', 'deployable', 'field', 'beam']);

  Object.entries(legions.effects).forEach(([id, effect]) => {
    assert.equal(effect.id, id);
    assert.equal(validKinds.has(effect.kind), true, id);
    assert.equal(effect.visualOnly, false);
    assert.equal(effect.sprite.src, `assets/animations/enemy-legions/effects/${id}.webp`);
    assert.equal(effect.sprite.columns, 4);
    assert.equal(effect.sprite.rows, 1);
    assert.equal(effect.sprite.frameCount, 4);
    assert.equal(paths.has(effect.sprite.src), false, `effect sprite duplicate: ${effect.sprite.src}`);
    paths.add(effect.sprite.src);
    assert.ok(effect.lifecycle.durationMs > 0);
    assert.ok(effect.lifecycle.hitboxRadius > 0);
    assert.ok(Object.keys(effect.gameplay).length >= 2);
    assert.ok(Object.values(effect.gameplay).every(value => Number.isFinite(value)));
    assert.equal(Object.isFrozen(effect), true);
  });
  assert.equal(paths.size, 26);
});

test('wave packages exercise every unit in faction order with playable cadence', () => {
  const { legions } = loadLegions();
  assert.equal(Object.keys(legions.wavePackages).length, 10);
  const scheduled = new Set();

  Object.entries(legions.wavePackages).forEach(([factionId, wave]) => {
    assert.equal(wave.factionId, factionId);
    assert.equal(wave.groups.length, 5);
    assert.match(wave.synergyPlan, /\S.{20,}/);
    wave.groups.forEach((group, index) => {
      assert.equal(group.type, legions.factions[factionId].enemyIds[index]);
      assert.ok(Number.isInteger(group.count) && group.count > 0);
      assert.ok(group.intervalMs >= 500);
      assert.ok(group.delayMs >= 0);
      assert.match(group.formationRole, /\S/);
      scheduled.add(group.type);
    });
  });
  assert.equal(scheduled.size, 50);
});

test('loading after the frozen expansion preserves old enemies and merges all fifty legions', () => {
  const { legions, expansion, originalExpansion } = loadLegions();
  assert.notEqual(expansion, originalExpansion);
  assert.equal(expansion.version, 'test');
  assert.equal(expansion.utils.marker, true);
  assert.equal(expansion.enemyDefinitions.swarmer.name, 'Larve de Cendre');
  assert.equal(Object.keys(expansion.enemyDefinitions).length, 51);
  Object.keys(legions.enemies).forEach(id => {
    assert.equal(expansion.enemyDefinitions[id], legions.enemies[id], id);
  });
  assert.equal(Object.isFrozen(expansion), true);
  assert.equal(Object.isFrozen(expansion.enemyDefinitions), true);
});
