'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const BASE_SOURCE = fs.readFileSync(path.join(ROOT, 'vn-scenes.v1.js'), 'utf8');
const CHARACTER_SOURCE = fs.readFileSync(path.join(ROOT, 'characters.v1.js'), 'utf8');
const EXPANSION_SOURCE = fs.readFileSync(path.join(ROOT, 'vn-expansion.v1.js'), 'utf8');

const LEGACY_IDS = ['aria', 'carmilla', 'kira', 'rin', 'selene', 'vespera'];
const CHARACTER_IDS = ['amara', 'aurelia', 'freyja', 'hana', 'isolde', 'maris', 'mircalla', 'nyx', 'vega', 'zahra'];
const ALL_IDS = [...LEGACY_IDS, ...CHARACTER_IDS].sort();

function loadRuntime() {
  const context = vm.createContext({
    window: {},
    console,
    Date,
    Object,
    Array,
    Set,
    String,
    Number
  });
  vm.runInContext(BASE_SOURCE, context, { filename: 'vn-scenes.v1.js' });
  vm.runInContext(CHARACTER_SOURCE, context, { filename: 'characters.v1.js' });
  vm.runInContext(EXPANSION_SOURCE, context, { filename: 'vn-expansion.v1.js' });
  return {
    characters: context.window.INFERNAL_CITY_CHARACTERS,
    scenes: context.window.INFERNAL_VN_SCENES,
    expansion: context.window.INFERNAL_VN_EXPANSION
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

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

function reachableBeatIds(chapter) {
  const beats = new Map(chapter.beats.map(beat => [beat.id, beat]));
  const visited = new Set();
  const queue = [chapter.entryBeat];

  while (queue.length > 0) {
    const beatId = queue.shift();
    if (visited.has(beatId)) continue;
    const beat = beats.get(beatId);
    assert.ok(beat, `${chapter.heroId}/${chapter.id}: beat ${beatId} absent`);
    visited.add(beatId);
    const destinations = beat.kind === 'choice'
      ? beat.options.map(option => option.nextBeat)
      : beat.nextBeat
        ? [beat.nextBeat]
        : [];
    destinations.forEach(destination => {
      assert.ok(beats.has(destination), `${chapter.heroId}/${chapter.id}: destination ${destination} absente`);
      queue.push(destination);
    });
  }
  return visited;
}

test('la fusion data-driven conserve les six heroines et ajoute les dix nouvelles', () => {
  const { characters, scenes, expansion } = loadRuntime();

  assert.deepEqual(Object.keys(expansion.heroines).sort(), ALL_IDS);
  assert.deepEqual(Array.from(expansion.content.majorCharacterIds).sort(), ALL_IDS);
  assert.deepEqual(Object.keys(expansion.studio.heroines).sort(), ALL_IDS);
  assert.deepEqual(Object.keys(scenes.heroines).sort(), ALL_IDS);
  assert.equal(expansion.chapters.length, 48);
  assert.equal(Object.values(scenes.heroines).flatMap(heroine => heroine.chapters).length, 48);
  assert.equal(characters.vn.chapters.length, 30);
  LEGACY_IDS.forEach(id => assert.equal(expansion.heroines[id].chapterIds.length, 3));
  CHARACTER_IDS.forEach(id => assert.equal(expansion.heroines[id].chapterIds.length, 3));
});

test('les trente chapitres du registre personnages gardent CG expressions et callbacks persistants', () => {
  const { characters, expansion } = loadRuntime();
  const expectedKeys = new Set(characters.vn.chapters.map(chapter => (
    `${chapter.heroId}.${chapter.chapterId}`
  )));
  const integratedChapters = expansion.chapters.filter(chapter => CHARACTER_IDS.includes(chapter.heroId));

  assert.equal(integratedChapters.length, 30);
  integratedChapters.forEach(chapter => {
    const key = `${chapter.heroId}.${chapter.chapterId}`;
    assert.equal(expectedKeys.has(key), true, `${key}: chapitre non issu du registre`);
    assert.equal(chapter.cgSrc, `assets/vn/cg/chapters/${chapter.heroId}-${chapter.chapterId}.webp`);
    assert.equal(chapter.backdropSrc, chapter.cgSrc);
    assert.equal(chapter.expressionSheetSrc, `assets/vn/expressions/${chapter.heroId}-expressions-v1.webp`);
    assert.equal(chapter.loreChoices.length, 3);
    assert.equal(chapter.callbacks.length, 3);
    chapter.loreChoices.forEach(choice => {
      assert.equal(choice.sexualContent, false);
      assert.equal(choice.effects.relationshipMemoryOnly, true);
      assert.equal(choice.effects.military, false);
      assert.equal(choice.effects.combat, false);
      assert.equal(choice.effects.economy, false);
      const callback = chapter.callbacks.find(item => item.id === choice.callbackId);
      assert.ok(callback, `${key}/${choice.id}: callback absent`);
      assert.equal(callback.militaryEffect, false);
      assert.equal(callback.economicEffect, false);
      assert.ok(callback.forbiddenWrites.includes('resources'));
      assert.ok(callback.forbiddenWrites.includes('towerStats'));
      assert.ok(callback.forbiddenWrites.includes('enemyStats'));
    });
  });
});

test('les seize heroines possedent un etat persistant assaini sans perdre les anciennes donnees', () => {
  const { characters, expansion } = loadRuntime();
  const persistence = expansion.persistence;
  const defaults = persistence.createDefaultState();

  assert.deepEqual(Object.keys(defaults.heroines).sort(), ALL_IDS);
  assert.equal(
    persistence.characterBlueprint.schema,
    characters.vn.persistentBlueprint.schema
  );
  assert.deepEqual(
    Object.keys(persistence.characterBlueprint.heroinePaths).sort(),
    CHARACTER_IDS
  );

  const candidate = plain(defaults);
  candidate.heroines.aria.traits.devoir = 3;
  candidate.heroines.aria.memories.push('aria.midnight-relief.memory');
  candidate.heroines.nyx.traits.identité = 2;
  candidate.heroines.nyx.memories.push('nyx.ghost-in-the-rain.identity');
  candidate.heroines.inconnue = {
    traits: { danger: 99 },
    memories: ['unknown'],
    callbackHistory: [],
    consent: { granted: true, revoked: false }
  };
  const clean = persistence.sanitizeState(candidate);

  assert.equal(clean.heroines.aria.traits.devoir, 3);
  assert.deepEqual(clean.heroines.aria.memories, ['aria.midnight-relief.memory']);
  assert.equal(clean.heroines.nyx.traits.identité, 2);
  assert.deepEqual(clean.heroines.nyx.memories, ['nyx.ghost-in-the-rain.identity']);
  assert.equal(Object.hasOwn(clean.heroines, 'inconnue'), false);
  assert.deepEqual(Object.keys(clean.heroines).sort(), ALL_IDS);
});

test('consentement refus et revocation restent immediats sans penalite ni effet gameplay', () => {
  const { expansion } = loadRuntime();
  const persistence = expansion.persistence;
  const store = memoryStorage();
  const chapterId = expansion.heroines.nyx.chapterIds[0];
  const chapter = expansion.getChapter('nyx', chapterId);
  const choice = chapter.loreChoices[0];
  let state = persistence.createDefaultState();

  const refused = persistence.recordLoreChoice(state, 'nyx', chapterId, choice.id, store);
  assert.equal(refused.applied, false);
  assert.equal(refused.reason, 'consent-required');
  assert.deepEqual(plain(refused.state.heroines.nyx.traits), {});
  assert.deepEqual(plain(refused.state.heroines.nyx.memories), []);

  state = persistence.grantConsent(state, 'nyx', store);
  const accepted = persistence.recordLoreChoice(state, 'nyx', chapterId, choice.id, store);
  assert.equal(accepted.applied, true);
  assert.equal(accepted.narrativeOnly, true);
  assert.equal(accepted.state.heroines.nyx.traits[choice.persistentTrait], 1);
  assert.equal(accepted.state.heroines.nyx.memories.length, 1);
  assert.equal(accepted.state.heroines.nyx.callbackHistory.length, 1);

  const beforeRevocation = plain(accepted.state.heroines.nyx);
  const revoked = persistence.revokeConsent(accepted.state, 'nyx', store);
  assert.equal(revoked.heroines.nyx.consent.granted, false);
  assert.equal(revoked.heroines.nyx.consent.revoked, true);
  assert.deepEqual(plain(revoked.heroines.nyx.traits), beforeRevocation.traits);
  assert.deepEqual(plain(revoked.heroines.nyx.memories), beforeRevocation.memories);
  assert.deepEqual(plain(revoked.heroines.nyx.callbackHistory), beforeRevocation.callbackHistory);
  ['credits', 'resources', 'towerStats', 'enemyStats', 'waveState'].forEach(field => {
    assert.ok(persistence.excludedFields.includes(field), `${field}: exclusion absente`);
    assert.equal(Object.hasOwn(revoked, field), false);
  });
});

test('la sauvegarde narrative fait un aller-retour pour les seize heroines', () => {
  const { expansion } = loadRuntime();
  const persistence = expansion.persistence;
  const store = memoryStorage();
  let state = persistence.createDefaultState();

  state = persistence.grantConsent(state, 'nyx', store);
  state.heroines.aria.traits.devoir = 4;
  state.heroines.amara.traits.soin = 2;
  const saved = persistence.saveState(state, store);
  const loaded = persistence.loadState(store);

  assert.deepEqual(Object.keys(loaded.heroines).sort(), ALL_IDS);
  assert.equal(loaded.heroines.nyx.consent.granted, true);
  assert.equal(loaded.heroines.aria.traits.devoir, 4);
  assert.equal(loaded.heroines.amara.traits.soin, 2);
  assert.match(saved.updatedAt, /^\d{4}-\d{2}-\d{2}T/u);
});

test('les trente graphes restent longs atteignables et proposent pause ou revocation sans perte', () => {
  const { scenes } = loadRuntime();
  const chapters = CHARACTER_IDS.flatMap(id => scenes.heroines[id].chapters);

  assert.equal(chapters.length, 30);
  chapters.forEach(chapter => {
    const reachable = reachableBeatIds(chapter);
    assert.equal(reachable.size, chapter.beats.length, `${chapter.heroId}/${chapter.id}: branche morte`);
    assert.ok(chapter.beats.flatMap(beat => beat.lines || []).length >= 50);
    assert.equal(chapter.presentation.fadeToBlack, true);
    assert.equal(chapter.presentation.graphicContent, false);

    const choices = chapter.beats
      .filter(beat => beat.kind === 'choice')
      .flatMap(beat => beat.options);
    ['pause', 'revoke'].forEach(action => {
      const option = choices.find(item => item.consentAction === action);
      assert.ok(option, `${chapter.heroId}/${chapter.id}: action ${action} absente`);
      assert.equal(option.effects.preserveAffinity, true);
      assert.equal(option.effects.preserveCombat, true);
      assert.equal(option.effects.combat, false);
      assert.equal(option.effects.economy, false);
    });
    choices.forEach(option => {
      assert.notEqual(Number(option.effects.relationshipXp) < 0, true);
      assert.equal(option.effects.combat, false);
      assert.equal(option.effects.economy, false);
    });
  });
});

test('le contrat fusionne reste adulte consensuel non graphique et narratif seulement', () => {
  const { scenes, expansion } = loadRuntime();

  assert.equal(expansion.content.allCharactersAdults, true);
  assert.equal(expansion.content.graphicSex, false);
  assert.equal(expansion.content.fadeToBlack, true);
  assert.equal(expansion.content.militaryConsequences, false);
  assert.equal(expansion.content.economicConsequences, false);
  assert.equal(expansion.maturity.consentRequired, true);
  assert.equal(expansion.maturity.consentRevocable, true);
  assert.equal(expansion.maturity.consequenceFreeRefusal, true);
  assert.equal(scenes.content.allCharactersAdults, true);
  assert.equal(scenes.content.consentRequired, true);
  assert.equal(scenes.content.consentRevocable, true);
  assert.equal(scenes.content.explicitSexualDetail, false);
  assert.equal(scenes.content.endingStyle, 'fade-to-black');
  assert.ok(expansion.persistence.savedFields.includes('consent'));
  assert.ok(expansion.persistence.savedFields.includes('memories'));
});
