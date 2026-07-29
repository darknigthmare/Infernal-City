'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'adult-scenes.v1.js'), 'utf8');

function loadContract() {
  const window = {};
  const context = vm.createContext({ window });
  vm.runInContext(SOURCE, context, { filename: 'adult-scenes.v1.js' });
  return window.INFERNAL_CITY_ADULT_SCENES;
}

function assertRealWebp(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  assert.ok(fs.existsSync(filePath), `${relativePath}: fichier absent`);
  const data = fs.readFileSync(filePath);
  assert.ok(data.length > 15_000, `${relativePath}: fichier anormalement petit`);
  assert.equal(data.toString('ascii', 0, 4), 'RIFF', `${relativePath}: conteneur RIFF absent`);
  assert.equal(data.toString('ascii', 8, 12), 'WEBP', `${relativePath}: signature WebP absente`);
  const chunk = data.toString('ascii', 12, 16);
  let width = 0;
  let height = 0;
  if (chunk === 'VP8X') {
    width = 1 + data.readUIntLE(24, 3);
    height = 1 + data.readUIntLE(27, 3);
  } else if (chunk === 'VP8 ') {
    width = data.readUInt16LE(26) & 0x3fff;
    height = data.readUInt16LE(28) & 0x3fff;
  } else if (chunk === 'VP8L') {
    width = 1 + data[21] + ((data[22] & 0x3f) << 8);
    height = 1 + ((data[22] >> 6) | (data[23] << 2) | ((data[24] & 0x0f) << 10));
  }
  assert.deepEqual({ width, height }, { width: 960, height: 540 }, `${relativePath}: dimensions`);
}

test('le contrat 2.6 est gele et limite toutes les scenes aux adultes non explicites', () => {
  const contract = loadContract();
  assert.equal(contract.contentVersion, '2.6.0');
  assert.equal(contract.maturity.adultsOnly, true);
  assert.equal(contract.maturity.minimumAge >= 27, true);
  assert.equal(contract.maturity.explicitSexualActs, false);
  assert.equal(contract.maturity.nudity, false);
  assert.equal(contract.maturity.consentRequired, true);
  assert.equal(contract.maturity.intimacyPresentation, 'before_after_fade_to_black');
  assert.equal(contract.maturity.gameplayConsequencesForRefusal, false);
  assert.equal(Object.isFrozen(contract), true);
  assert.equal(Object.isFrozen(contract.bonusScenes), true);
});

test('les dix Trones ont une vraie introduction et une vraie defaite cinematographiques', () => {
  const contract = loadContract();
  const cinematics = Object.values(contract.villainCinematics);
  assert.equal(cinematics.length, 10);
  const paths = [];
  cinematics.forEach(cinematic => {
    assert.equal(cinematic.isAdult, true);
    assert.equal(cinematic.age >= 27, true);
    assert.match(cinematic.introSrc, new RegExp(`${cinematic.id}-intro-v1\\.webp$`));
    assert.match(cinematic.defeatSrc, new RegExp(`${cinematic.id}-defeat-v1\\.webp$`));
    paths.push(cinematic.introSrc, cinematic.defeatSrc);
  });
  assert.equal(new Set(paths).size, 20);
  paths.forEach(assertRealWebp);
});

test('les bonus couvrent les archives sensuelles et soixante CG corporelles independantes', () => {
  const contract = loadContract();
  const counts = contract.bonusScenes.reduce((result, scene) => {
    result[scene.kind] = (result[scene.kind] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(
    { ...counts },
    {
      bikini: 10,
      romance_ff: 5,
      afterglow: 5,
      game_over: 4,
      body_variants: 60
    }
  );
  assert.equal(contract.bonusScenes.length, 84);
  assert.equal(new Set(contract.bonusScenes.map(scene => scene.src)).size, 84);
  contract.bonusScenes.forEach(scene => {
    assert.ok(scene.ageLabel);
    assert.ok(scene.alt.length > 30);
    assert.ok(scene.story.length > 40);
    assertRealWebp(scene.src);
  });
});

test('les variantes corporelles separent trois CG par femme sans sexualiser la jeunesse', () => {
  const contract = loadContract();
  const variants = contract.bonusScenes.filter(scene => scene.kind === 'body_variants');
  const heroineVariants = variants.filter(scene => scene.unlockRule.type === 'heroes_unlocked');
  const villainVariants = variants.filter(scene => scene.unlockRule.type === 'boss_defeated');
  const stageCounts = variants.reduce((counts, scene) => {
    counts[scene.bodyVariantStage] = (counts[scene.bodyVariantStage] || 0) + 1;
    return counts;
  }, {});
  const participantCounts = variants.reduce((counts, scene) => {
    const [participantId] = scene.participants;
    counts[participantId] = (counts[participantId] || 0) + 1;
    return counts;
  }, {});

  assert.equal(heroineVariants.length, 30);
  assert.equal(villainVariants.length, 30);
  assert.deepEqual(
    { ...stageCounts },
    { chubby: 20, maternity: 20, 'early-career': 10, 'first-reign': 10 }
  );
  assert.equal(Object.keys(participantCounts).length, 20);
  Object.values(participantCounts).forEach(count => assert.equal(count, 3));
  variants.forEach(scene => {
    assert.equal(scene.participants.length, 1);
    assert.match(scene.subtitle, /27/u);
    assert.match(scene.ageLabel, /27 ans et plus/u);
    assert.match(scene.alt, /adulte/u);
    assert.match(scene.src, new RegExp(`-${scene.bodyVariantStage}-v1\\.webp$`, 'u'));
    assert.doesNotMatch(scene.src, /body-variants-v1/u);
    assert.equal(Object.hasOwn(scene, 'reward'), false);
    assert.equal(Object.hasOwn(scene, 'gameplayEffect'), false);
  });
});

test('les romances et afterglows sont F/F, atteignables et sans recompense gameplay', () => {
  const contract = loadContract();
  contract.bonusScenes
    .filter(scene => ['romance_ff', 'afterglow'].includes(scene.kind))
    .forEach(scene => {
      assert.equal(scene.participants.length, 2);
      assert.equal(scene.unlockRule.type, 'heroes_unlocked');
      assert.deepEqual(
        [...scene.unlockRule.heroIds].sort(),
        [...scene.participants].sort()
      );
      assert.equal(Object.hasOwn(scene, 'reward'), false);
      assert.equal(Object.hasOwn(scene, 'gameplayEffect'), false);
    });
});
