'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const baseSource = fs.readFileSync(path.join(ROOT, 'vn-scenes.v1.js'), 'utf8');
const expansionSource = fs.readFileSync(path.join(ROOT, 'vn-expansion.v1.js'), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(baseSource, context, { filename: 'vn-scenes.v1.js' });
vm.runInContext(expansionSource, context, { filename: 'vn-expansion.v1.js' });

const base = context.window.INFERNAL_VN_SCENES;
const expansion = context.window.INFERNAL_VN_EXPANSION;
const expectedHeroIds = ['aria', 'carmilla', 'kira', 'rin', 'selene', 'vespera'];

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}

test('l extension couvre les six personnages majeurs adultes', () => {
  assert.equal(expansion.schema, 'infernal-city.vn-expansion/1');
  assert.deepEqual(Array.from(expansion.content.majorCharacterIds).sort(), expectedHeroIds);
  assert.deepEqual(Object.keys(expansion.heroines).sort(), expectedHeroIds);
  Object.values(expansion.heroines).forEach(heroine => {
    assert.equal(heroine.isAdult, true);
    assert.ok(heroine.age >= 18);
    assert.equal(heroine.persistentBranchThemes.length, 3);
  });
});

test('les dix-huit chapitres existants ont une CG unique et leurs metadonnees', () => {
  const baseKeys = Object.values(base.heroines).flatMap(heroine => (
    heroine.chapters.map(chapter => `${heroine.id}/${chapter.id}`)
  )).sort();
  const expansionKeys = expansion.chapters
    .map(chapter => `${chapter.heroId}/${chapter.chapterId}`)
    .sort();
  const cgs = expansion.chapters.map(chapter => chapter.cgSrc);

  assert.equal(expansion.chapters.length, 18);
  assert.deepEqual(Array.from(expansionKeys), Array.from(baseKeys));
  assert.equal(new Set(cgs).size, 18);
  expansion.chapters.forEach(chapter => {
    assert.match(chapter.cgSrc, /^assets\/vn\/cg\/chapters\/.+\.webp$/);
    assert.match(chapter.backdropSrc, /^assets\/vn\/cg\/chapters\/.+\.webp$/);
    assert.match(chapter.expressionSheetSrc, /^assets\/vn\/expressions\/.+\.webp$/);
    assert.ok(chapter.musicMood.length >= 3);
  });
});

test('chaque chapitre propose trois choix de lore et trois callbacks persistants', () => {
  expansion.chapters.forEach(chapter => {
    assert.equal(chapter.loreChoices.length, 3, `${chapter.chapterId}: choix`);
    assert.equal(chapter.callbacks.length, 3, `${chapter.chapterId}: callbacks`);
    chapter.loreChoices.forEach(choice => {
      assert.equal(choice.category, 'personality-lore');
      assert.equal(choice.sexualContent, false);
      assert.equal(choice.effects.relationshipMemoryOnly, true);
      assert.equal(choice.effects.military, false);
      assert.equal(choice.effects.economy, false);
      assert.ok(chapter.callbacks.some(callback => callback.id === choice.callbackId));
    });
    chapter.callbacks.forEach(callback => {
      assert.equal(callback.militaryEffect, false);
      assert.equal(callback.economicEffect, false);
      assert.ok(callback.forbiddenWrites.includes('credits'));
      assert.ok(callback.forbiddenWrites.includes('towerStats'));
    });
  });
});

test('la branche de personnalite est sauvegardee par heroine et exige le consentement', () => {
  const store = memoryStorage();
  const persistence = expansion.persistence;
  let state = persistence.createDefaultState();
  const chapter = expansion.getChapter('aria', 'midnight-relief');
  const choice = chapter.loreChoices[0];

  const refused = persistence.recordLoreChoice(
    state,
    'aria',
    chapter.chapterId,
    choice.id,
    store
  );
  assert.equal(refused.applied, false);
  assert.equal(refused.reason, 'consent-required');

  state = persistence.grantConsent(state, 'aria', store);
  const accepted = persistence.recordLoreChoice(
    state,
    'aria',
    chapter.chapterId,
    choice.id,
    store
  );
  assert.equal(accepted.applied, true);
  assert.equal(accepted.narrativeOnly, true);
  const loaded = persistence.loadState(store);
  assert.equal(loaded.heroines.aria.traits[choice.persistentTrait], 1);
  assert.equal(loaded.heroines.aria.memories.length, 1);
  assert.equal(loaded.heroines.aria.callbackHistory.length, 1);
  assert.equal(loaded.heroines.kira.memories.length, 0);
});

test('une progression narrative future est refusee sans etre remplacee', () => {
  const store = memoryStorage();
  const raw = JSON.stringify({ dataVersion: 999, futureMemory: ['keep'] });
  store.setItem(expansion.storageKey, raw);

  assert.throws(
    () => expansion.persistence.loadState(store),
    /plus r.cente d.tect.e/u
  );
  assert.equal(store.getItem(expansion.storageKey), raw);
  assert.throws(
    () => expansion.persistence.saveState({ dataVersion: 999 }, store),
    /plus r.cente d.tect.e/u
  );
  assert.equal(store.getItem(expansion.storageKey), raw);
});

test('un echec de stockage remonte sans perdre la mutation en memoire', () => {
  const persistence = expansion.persistence;
  const failingStore = {
    getItem() { return null; },
    setItem() { throw new Error('quota exceeded'); }
  };
  const state = persistence.createDefaultState();
  assert.throws(
    () => persistence.grantConsent(state, 'aria', failingStore),
    error => {
      assert.equal(error.code, 'NARRATIVE_STORAGE_WRITE_FAILED');
      assert.equal(error.state.heroines.aria.consent.granted, true);
      assert.match(error.message, /non persist.e/u);
      return true;
    }
  );
  assert.equal(failingStore.getItem(expansion.storageKey), null);
});

test('le contrat de maturite est facultatif, revocable et sans impact gameplay', () => {
  const maturity = expansion.maturity;
  assert.deepEqual(Array.from(maturity.modes), ['suggestive', 'intense']);
  assert.equal(maturity.defaultMode, 'suggestive');
  assert.equal(maturity.optional, true);
  assert.equal(maturity.intenseRequiresOptIn, true);
  assert.equal(maturity.consentRequired, true);
  assert.equal(maturity.consentRevocable, true);
  assert.equal(maturity.consequenceFreeRefusal, true);
  assert.equal(expansion.content.graphicSex, false);
  assert.equal(expansion.content.fadeToBlack, true);
  assert.equal(expansion.content.militaryConsequences, false);
  assert.equal(expansion.content.economicConsequences, false);

  const store = memoryStorage();
  let state = expansion.persistence.createDefaultState();
  state = expansion.persistence.setMaturity(state, 'intense', store);
  state = expansion.persistence.grantConsent(state, 'kira', store);
  state = expansion.persistence.revokeConsent(state, 'kira', store);
  assert.equal(state.maturity, 'intense');
  assert.equal(state.heroines.kira.consent.granted, false);
  assert.equal(state.heroines.kira.consent.revoked, true);
  assert.ok(expansion.persistence.excludedFields.includes('resources'));
  assert.ok(expansion.persistence.excludedFields.includes('enemyStats'));
});

test('Studio 2.0 offre trois poses, trois ambiances et trois conclusions', () => {
  assert.equal(expansion.studio.schema, 'infernal-city.studio/2');
  assert.deepEqual(Object.keys(expansion.studio.heroines).sort(), expectedHeroIds);
  Object.values(expansion.studio.heroines).forEach(heroine => {
    assert.equal(heroine.isAdult, true);
    assert.equal(heroine.poses.length, 3);
    assert.equal(new Set(heroine.poses.map(pose => pose.id)).size, 3);
    assert.ok(heroine.poses.every(pose => pose.adultOnly && pose.nudity === false));
    assert.equal(heroine.ambiences.length, 3);
    assert.equal(new Set(heroine.ambiences.map(ambience => ambience.id)).size, 3);
  });
  assert.equal(expansion.studio.conclusionCgs.length, 3);
  assert.equal(new Set(expansion.studio.conclusionCgs.map(cg => cg.cgSrc)).size, 3);
});

test('toutes les CG, expressions, poses, ambiances et conclusions pointent vers des fichiers reels', () => {
  const referencedAssets = new Set();
  expansion.chapters.forEach(chapter => {
    referencedAssets.add(chapter.cgSrc);
    referencedAssets.add(chapter.backdropSrc);
    referencedAssets.add(chapter.expressionSheetSrc);
  });
  Object.values(expansion.studio.heroines).forEach(heroine => {
    heroine.poses.forEach(pose => referencedAssets.add(pose.previewSrc));
    heroine.ambiences.forEach(ambience => referencedAssets.add(ambience.backdropSrc));
  });
  expansion.studio.conclusionCgs.forEach(conclusion => referencedAssets.add(conclusion.cgSrc));

  referencedAssets.forEach(relativePath => {
    assert.equal(
      fs.existsSync(path.join(ROOT, relativePath)),
      true,
      `${relativePath}: asset narratif manquant`
    );
  });
});
