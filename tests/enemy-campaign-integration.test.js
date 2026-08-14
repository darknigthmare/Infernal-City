'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const EXPANSION_SOURCE = fs.readFileSync(path.join(ROOT, 'expansion.v1.js'), 'utf8');
const LEGIONS_SOURCE = fs.readFileSync(path.join(ROOT, 'enemy-legions.v1.js'), 'utf8');
const CAMPAIGN_SOURCE = fs.readFileSync(path.join(ROOT, 'campaign-content.v1.js'), 'utf8');

function loadIntegratedCampaign() {
  const window = {};
  const sandbox = { window, globalThis: null, console, Date, Math, Object, Array, Set, String, Number, RangeError, TypeError };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(EXPANSION_SOURCE, context, { filename: 'expansion.v1.js' });
  vm.runInContext(LEGIONS_SOURCE, context, { filename: 'enemy-legions.v1.js' });
  vm.runInContext(CAMPAIGN_SOURCE, context, { filename: 'campaign-content.v1.js' });
  return {
    campaign: window.INFERNAL_CITY_CAMPAIGN_CONTENT,
    legions: window.INFERNAL_CITY_ENEMY_LEGIONS,
    expansion: window.INFERNAL_CITY_EXPANSION
  };
}

test('Dix Trônes deploys all fifty legion enemies across its twenty waves', () => {
  const { campaign, legions, expansion } = loadIntegratedCampaign();
  assert.equal(campaign.legionCampaignEnabled, true);
  assert.equal(campaign.tenThronesWaves.length, 20);
  assert.equal(campaign.enemyCycles.length, 10);
  const usedTypes = new Set();
  campaign.tenThronesWaves.forEach((wave, index) => {
    assert.equal(wave.number, index + 1);
    assert.equal(wave.groups.length, 3);
    wave.groups.forEach(group => {
      assert.ok(legions.enemies[group.type], `vague ${wave.number}: ${group.type}`);
      assert.equal(expansion.enemyDefinitions[group.type], legions.enemies[group.type]);
      usedTypes.add(group.type);
    });
  });
  assert.deepEqual([...usedTypes].sort(), Object.keys(legions.enemies).sort());
});

test('each throne introduces ranks one to three then counters with ranks four, five and one', () => {
  const { campaign, legions } = loadIntegratedCampaign();
  Object.values(legions.factions).forEach((faction, contractIndex) => {
    const factionIds = Array.from(faction.enemyIds);
    const reconnaissance = campaign.tenThronesWaves[contractIndex * 2];
    const throneAssault = campaign.tenThronesWaves[contractIndex * 2 + 1];
    assert.deepEqual(Array.from(reconnaissance.groups, group => group.type), factionIds.slice(0, 3), `${faction.id} reconnaissance`);
    assert.deepEqual(Array.from(throneAssault.groups, group => group.type), [factionIds[3], factionIds[4], factionIds[0]], `${faction.id} siège`);
  });
});

test('group sizes apply the exported role-and-tier threat scale', () => {
  const { campaign, legions } = loadIntegratedCampaign();
  const scales = new Set();
  campaign.tenThronesWaves.forEach(wave => {
    wave.groups.forEach(group => {
      const expectedScale = campaign.getEnemyCountScale(group.type);
      assert.equal(group.countScale, expectedScale, group.type);
      assert.ok(group.count >= 1);
      assert.ok(group.intervalMs >= 220);
      assert.ok(group.delayMs >= 0);
      assert.ok(group.routePattern.length >= 2);
      scales.add(expectedScale);
    });
  });
  assert.ok(scales.size >= 4, 'la composition doit distinguer horde, standard, support et élite');
  assert.ok(campaign.getEnemyCountScale('bioforge_scarab') > campaign.getEnemyCountScale('bioforge_broodmother'));
  assert.ok(campaign.getEnemyCountScale('plague_miasma_rat') > campaign.getEnemyCountScale('plague_fungal_colossus'));
  assert.ok(Object.keys(legions.enemies).every(id => campaign.getEnemyCountScale(id) > 0));
});
