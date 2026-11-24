'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const dlcs = require(path.join(ROOT, 'dlc-packs.v1.js'));

test('dlc-packs exposes 4 free expansions and 6 paid visual-domain DLCs', () => {
  assert.equal(dlcs.version, '1.1.0');
  assert.equal(dlcs.freeExpansions.length, 4);
  assert.equal(dlcs.paidDlcs.length, 6);
  assert.equal(dlcs.allPacks.length, 10);
});

test('all paid DLC Valkyries and Bosses are 18+ adults (2 Valkyries + 2 Bosses each) and biome atlases exist', () => {
  assert.equal(dlcs.adultMinimumAge, 18);
  assert.equal(dlcs.loreChoicesAreNarrativeOnly, true);

  for (const dlc of dlcs.paidDlcs) {
    assert.equal(fs.existsSync(path.join(ROOT, dlc.biomeAtlas)), true, `${dlc.id} atlas exists`);
    assert.equal(dlc.heroines.length, 2, `${dlc.id} has 2 Valkyries`);
    for (const h of dlc.heroines) {
      assert.equal(h.isAdult, true);
      assert.ok(h.age >= 18, `${h.name} age >= 18`);
    }
    assert.equal(dlc.bosses.length, 2, `${dlc.id} has 2 Bosses`);
    for (const b of dlc.bosses) {
      assert.equal(b.isAdult, true);
      assert.ok(b.age >= 18, `${b.name} age >= 18`);
      assert.equal(b.phases.length, 3, `${b.name} has 3 phases`);
    }
    assert.equal(dlc.maps.length, 2);
    assert.equal(dlc.towers.length, 2);
  }
});

test('reverse-TD POV boss expansion covers all 10 Thrones plus Leviathan', () => {
  const reign = dlcs.freeExpansions.find(e => e.id === 'free_reign_of_thrones');
  assert.ok(reign);
  assert.equal(reign.modeType, 'reverse_tower_defense');
  assert.equal(reign.playableBosses.length, 11);
  assert.equal(reign.totalSiegeMissions, 30);
});
