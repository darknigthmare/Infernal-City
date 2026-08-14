'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function loadBalanceContracts() {
  const window = {};
  const sandbox = {
    window,
    globalThis: null,
    console,
    Date,
    Math,
    Object,
    Array,
    Set,
    String,
    Number,
    RegExp,
    RangeError,
    TypeError
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  ['expansion.v1.js', 'enemy-legions.v1.js', 'campaign-content.v1.js'].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  });
  return {
    legions: window.INFERNAL_CITY_ENEMY_LEGIONS,
    campaign: window.INFERNAL_CITY_CAMPAIGN_CONTENT
  };
}

test('all fifty enemies expose measurable threat derived from combat stats', () => {
  const { legions } = loadBalanceContracts();
  const enemies = Object.values(legions.enemies);
  assert.equal(enemies.length, 50);
  enemies.forEach(enemy => {
    assert.ok(Number.isInteger(enemy.balance.threatRating), enemy.id);
    assert.ok(enemy.balance.threatRating >= 5 && enemy.balance.threatRating <= 80, enemy.id);
    assert.ok(enemy.balance.effectiveHp >= enemy.stats.hp, enemy.id);
    assert.ok(enemy.balance.sustainedDps > 0, enemy.id);
    assert.ok(enemy.balance.rangeMultiplier >= 1, enemy.id);
    assert.ok(enemy.balance.mechanicMultiplier >= 1, enemy.id);
  });

  const tierMedians = [1, 2, 3, 4, 5].map(tier => {
    const values = enemies
      .filter(enemy => enemy.tier === tier)
      .map(enemy => enemy.balance.threatRating)
      .sort((left, right) => left - right);
    return values[Math.floor(values.length / 2)];
  });
  tierMedians.slice(1).forEach((median, index) => {
    assert.ok(median > tierMedians[index], `médianes de menace: ${tierMedians.join(', ')}`);
  });
});

test('the twenty-wave escort curve uses monotonic budgets with bounded rounding error', () => {
  const { campaign, legions } = loadBalanceContracts();
  const waves = campaign.tenThronesWaves;
  assert.equal(waves.length, 20);

  waves.forEach((wave, index) => {
    if (index >= 2) assert.ok(wave.threatBudget > waves[index - 2].threatBudget, `budget de phase vague ${wave.number}`);
    if (index % 2 === 1) assert.ok(wave.threatBudget > waves[index - 1].threatBudget, `budget du Trône vague ${wave.number}`);
    assert.ok(wave.threatUtilization >= 0.85 && wave.threatUtilization <= 1.15, `utilisation vague ${wave.number}`);
    assert.equal(wave.scheduledThreat, wave.groups.reduce((sum, group) => sum + group.scheduledThreat, 0));
    wave.groups.forEach(group => {
      const enemy = legions.enemies[group.type];
      assert.equal(group.threatRating, enemy.balance.threatRating, group.type);
      assert.equal(group.scheduledThreat, group.count * group.threatRating, group.type);
      assert.equal(group.countScale, campaign.getEnemyCountScale(group.type), group.type);
      assert.ok(group.intervalMs >= Math.min(1800, 340 + group.threatRating * 14), group.type);
      assert.ok(group.intervalMs <= 1800, group.type);
    });
  });
});

test('every throne assault is stronger than its reconnaissance without elite floods', () => {
  const { campaign, legions } = loadBalanceContracts();
  for (let contract = 0; contract < 10; contract += 1) {
    const reconnaissance = campaign.tenThronesWaves[contract * 2];
    const assault = campaign.tenThronesWaves[contract * 2 + 1];
    assert.ok(assault.scheduledThreat > reconnaissance.scheduledThreat, `contrat ${contract + 1}`);
    assert.ok(assault.scheduledThreat <= reconnaissance.scheduledThreat * 1.5, `pic contrat ${contract + 1}`);
    assert.ok(assault.groups[0].count <= 5, `rang IV contrat ${contract + 1}`);
    assert.ok(assault.groups[1].count <= 4, `rang V contrat ${contract + 1}`);
    assert.ok(assault.groups[2].count <= 22, `escorte contrat ${contract + 1}`);
    assert.equal(legions.enemies[assault.groups[0].type].tier, 4);
    assert.equal(legions.enemies[assault.groups[1].type].tier, 5);
    assert.equal(legions.enemies[assault.groups[2].type].tier, 1);
  }
});
