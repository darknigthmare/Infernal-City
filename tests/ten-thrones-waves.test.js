'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const expansion = require(path.join(ROOT, 'expansion.v1.js'));

function loadCharacters() {
  const source = fs.readFileSync(path.join(ROOT, 'characters.v1.js'), 'utf8');
  const window = {};
  const sandbox = { window, console };
  sandbox.globalThis = sandbox;
  vm.runInContext(source, vm.createContext(sandbox), { filename: 'characters.v1.js' });
  return window.INFERNAL_CITY_CHARACTERS;
}

function compositionSignature(wave) {
  return wave.groups
    .map(group => `${group.type}:${group.count}`)
    .sort()
    .join('|');
}

function threatBudget(wave) {
  return wave.groups.reduce((total, group) => {
    const enemy = expansion.enemyDefinitions[group.type];
    const shield = enemy.shield?.capacity || 0;
    const split = enemy.split
      ? (expansion.enemyDefinitions[enemy.split.childType].stats.hp
        * enemy.split.childCount
        * enemy.split.childHpMultiplier)
      : 0;
    const unitThreat = enemy.stats.hp
      + shield
      + split
      + (enemy.stats.damage * 12)
      + (enemy.stats.speed * 2);
    return total + (unitThreat * group.count);
  }, 0);
}

test('Ten Thrones owns twenty deterministic waves with unique authored finales', () => {
  const script = expansion.waveScripts.ten_thrones_20;
  const siege = expansion.waveScripts.siege_15;

  assert.ok(script);
  assert.equal(script.id, 'ten_thrones_20');
  assert.equal(script.deterministic, true);
  assert.equal(script.finalWave, 20);
  assert.equal(script.waves.length, 20);
  assert.deepEqual(script.waves.map(wave => wave.number), Array.from({ length: 20 }, (_, index) => index + 1));
  assert.deepEqual(
    script.waves.slice(0, 15).map(wave => wave.name),
    siege.waves.map(wave => wave.name)
  );
  assert.equal(siege.waves[14].intermissionMs, 0, 'la campagne quinze vagues se conclut immediatement');
  assert.ok(
    script.waves[14].intermissionMs >= 6000,
    'Ten Thrones doit laisser une vraie phase de preparation avant Kali-X'
  );

  const allSignatures = script.waves.map(compositionSignature);
  assert.equal(new Set(allSignatures).size, allSignatures.length, 'every wave composition is unique');

  const openingSignatures = new Set(siege.waves.slice(0, 5).map(compositionSignature));
  script.waves.slice(15).forEach(wave => {
    assert.equal(openingSignatures.has(compositionSignature(wave)), false, `wave ${wave.number} does not recycle waves 1-5`);
  });
});

test('waves 16-20 increase unit count, authored reward and combat threat', () => {
  const finales = expansion.waveScripts.ten_thrones_20.waves.slice(15);
  const knownTypes = new Set(Object.keys(expansion.enemyDefinitions));
  const unitCounts = finales.map(wave => wave.groups.reduce((sum, group) => sum + group.count, 0));
  const rewards = finales.map(wave => wave.reward);
  const budgets = finales.map(threatBudget);

  finales.forEach(wave => {
    assert.ok(wave.groups.length >= 6, `wave ${wave.number} has a full escort formation`);
    wave.groups.forEach(group => {
      assert.equal(knownTypes.has(group.type), true, `wave ${wave.number}: ${group.type}`);
      assert.ok(Number.isInteger(group.count) && group.count > 0);
      assert.ok(Number.isFinite(group.intervalMs) && group.intervalMs > 0);
      assert.ok(Number.isFinite(group.delayMs) && group.delayMs >= 0);
      assert.ok(group.routePattern.length > 0);
    });
  });

  for (let index = 1; index < finales.length; index += 1) {
    assert.ok(unitCounts[index] > unitCounts[index - 1], `wave ${finales[index].number} unit count`);
    assert.ok(rewards[index] > rewards[index - 1], `wave ${finales[index].number} reward`);
    assert.ok(budgets[index] > budgets[index - 1], `wave ${finales[index].number} threat budget`);
  }

  assert.deepEqual(unitCounts, [104, 120, 130, 150, 168]);
  assert.equal(finales.at(-1).intermissionMs, 0);
});

test('final boss escorts match the eighth, ninth and tenth Thrones schedule', () => {
  const characters = loadCharacters();
  const campaignFinaleSchedule = Array.from(characters.campaigns.ten_thrones.bossSchedule)
    .filter(entry => entry.wave >= 16)
    .map(entry => [entry.wave, entry.bossId]);
  const authoredEscorts = expansion.waveScripts.ten_thrones_20.waves
    .slice(15)
    .filter(wave => wave.bossEscortFor)
    .map(wave => [wave.number, wave.bossEscortFor]);

  assert.deepEqual(authoredEscorts, campaignFinaleSchedule);
  assert.deepEqual(authoredEscorts, [
    [16, 'kalix'],
    [18, 'malika'],
    [20, 'noctis']
  ]);

  const byNumber = Object.fromEntries(
    expansion.waveScripts.ten_thrones_20.waves.slice(15).map(wave => [wave.number, wave])
  );
  assert.ok(byNumber[16].groups.some(group => group.type === 'flying'));
  assert.ok(byNumber[16].groups.some(group => group.type === 'runner'));
  assert.ok(byNumber[18].groups.some(group => group.type === 'splitter'));
  assert.ok(byNumber[18].groups.some(group => group.type === 'flying'));
  assert.deepEqual(
    new Set(byNumber[20].groups.map(group => group.type)),
    new Set(['bulwark', 'artillery', 'brute', 'splitter', 'flying', 'runner'])
  );
});
