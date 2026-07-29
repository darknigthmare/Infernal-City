'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'characters.v1.js'), 'utf8');
const BASE_VN_SOURCE = fs.readFileSync(path.join(ROOT, 'vn-scenes.v1.js'), 'utf8');

const HEROINE_IDS = ['amara', 'aurelia', 'freyja', 'hana', 'isolde', 'maris', 'mircalla', 'nyx', 'vega', 'zahra'];
const BOSS_IDS = ['astarra', 'kalix', 'malika', 'nhalzara', 'noctis', 'ossuary', 'pestifera', 'umbrael', 'vexara', 'xyra'];
const HEROINE_SLUGS = {
  nyx: 'nyx-circuit',
  aurelia: 'aurelia-brassheart',
  maris: 'maris-blacktide',
  zahra: 'zahra-mille-ciels',
  mircalla: 'mircalla-dollheart',
  isolde: 'isolde-mourne',
  hana: 'hana-kurogane',
  freyja: 'freyja-rimeborne',
  vega: 'vega-solari',
  amara: 'amara-verdigris'
};
const BOSS_SLUGS = {
  xyra: 'xyra-bioforge',
  ossuary: 'lady-ossuary',
  nhalzara: 'nhal-zara',
  astarra: 'astarra-infernal',
  umbrael: 'umbrael-shadow',
  pestifera: 'pestifera',
  vexara: 'vexara-dreadtide',
  kalix: 'kali-x',
  malika: 'malika-ash-djinn',
  noctis: 'madame-noctis'
};

function loadCharacters(withBaseVn = true) {
  const context = vm.createContext({
    window: {},
    globalThis: {},
    Object,
    Array,
    Set,
    String,
    Number
  });
  if (withBaseVn) {
    vm.runInContext(BASE_VN_SOURCE, context, { filename: 'vn-scenes.v1.js' });
  }
  vm.runInContext(SOURCE, context, { filename: 'characters.v1.js' });
  return {
    registry: context.window.INFERNAL_CITY_CHARACTERS,
    scenes: context.window.INFERNAL_VN_SCENES
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function numericValues(value) {
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(item => (
    typeof item === 'number' ? [item] : numericValues(item)
  ));
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

test('le module expose un contrat autonome versionne et gele', () => {
  const { registry, scenes } = loadCharacters(false);

  assert.equal(registry.schema, 'infernal-city.characters/1');
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.version, 1);
  assert.equal(Object.isFrozen(registry), true);
  assert.equal(scenes.schema, 'infernal-city.vn-scenes/1');
  assert.equal(Object.keys(scenes.heroines).length, 10);
});

test('les dix heroines ont leurs identites adultes et leurs chemins d assets exacts', () => {
  const { registry } = loadCharacters();

  assert.deepEqual(Object.keys(registry.heroines).sort(), HEROINE_IDS);
  assert.deepEqual(Array.from(registry.heroineIds).sort(), HEROINE_IDS);

  Object.entries(registry.heroines).forEach(([id, heroine]) => {
    const slug = HEROINE_SLUGS[id];
    assert.equal(heroine.id, id);
    assert.equal(heroine.slug, slug);
    assert.equal(heroine.isAdult, true);
    assert.ok(heroine.age >= 18);
    assert.match(heroine.name, /\S/u);
    assert.match(heroine.title, /\S/u);
    assert.equal(heroine.avatar, `assets/characters/heroines/${slug}-portrait-v1.webp`);
    assert.equal(heroine.altAvatar, `assets/characters/heroines/${slug}-night-portrait-v1.webp`);
    assert.notEqual(heroine.altAvatar, heroine.avatar);
    assert.equal(heroine.spriteAtlas.src, `assets/characters/heroines/${slug}-atlas-v1.png`);
    assert.deepEqual(Array.from(heroine.spriteAtlas.stateRows), ['idle', 'move', 'attack', 'ultimate']);
    assert.equal(heroine.spriteAtlas.framesPerState, 4);
    assert.match(heroine.abilityName, /\S/u);
    assert.match(heroine.abilityDesc, /\S/u);
    assert.ok(heroine.cooldown >= 1);
    assert.ok(['vulcan', 'plasma', 'railgun', 'flamethrower'].includes(heroine.startingWeapon));
    assert.equal(heroine.loungeLines.length, 5);
    assert.ok(heroine.loungeLines.every(line => line.length >= 60));
    assert.match(heroine.boundary, /\S/u);
    assert.match(heroine.unlockRule.label, /\S/u);
    assert.equal(heroine.relationship.consentRequired, true);
    assert.equal(heroine.relationship.consentRevocable, true);
    assert.equal(heroine.relationship.refusalPenalty, 'none');
  });
});

test('les dix kits fournissent trente mecaniques uniques et des effets chiffres', () => {
  const { registry } = loadCharacters();
  const mechanics = new Set();
  const abilityIds = new Set();

  assert.deepEqual(Object.keys(registry.heroKits).sort(), HEROINE_IDS);
  Object.values(registry.heroKits).forEach(kit => {
    assert.match(kit.role, /\S/u);
    ['passive', 'active', 'ultimate'].forEach(kind => {
      const ability = kit[kind];
      assert.match(ability.id, /\S/u);
      assert.match(ability.name, /\S/u);
      assert.match(ability.description, /\S/u);
      assert.match(ability.mechanic, /\S/u);
      assert.equal(abilityIds.has(ability.id), false, `ID de pouvoir duplique : ${ability.id}`);
      assert.equal(mechanics.has(ability.mechanic), false, `mecanique dupliquee : ${ability.mechanic}`);
      abilityIds.add(ability.id);
      mechanics.add(ability.mechanic);
      const effectData = kind === 'passive' ? ability.modifiers : ability.effect;
      const minimumNumericValues = kind === 'passive' ? 2 : 3;
      assert.ok(
        numericValues(effectData).length >= minimumNumericValues,
        `${kit.id}/${kind}: effets chiffres incomplets`
      );
    });
    assert.ok(kit.active.cooldownMs >= 1000);
    assert.match(kit.active.targeting, /\S/u);
    assert.equal(kit.ultimate.chargeRequired, 100);
  });
  assert.equal(mechanics.size, 30);
  assert.equal(abilityIds.size, 30);
});

test('les dix antagonistes ont trois phases distinctes et des atlas exacts', () => {
  const { registry } = loadCharacters();
  const phaseMechanics = new Set();

  assert.deepEqual(Object.keys(registry.bosses).sort(), BOSS_IDS);
  assert.deepEqual(Array.from(registry.bossIds).sort(), BOSS_IDS);

  Object.entries(registry.bosses).forEach(([id, boss]) => {
    const slug = BOSS_SLUGS[id];
    assert.equal(boss.id, id);
    assert.equal(boss.slug, slug);
    assert.equal(boss.isAdult, true);
    assert.ok(boss.age >= 18);
    assert.match(boss.name, /\S/u);
    assert.match(boss.title, /\S/u);
    assert.ok(boss.traits.length >= 4);
    assert.match(boss.signature.mechanic, /\S/u);
    assert.match(boss.signature.name, /\S/u);
    assert.match(boss.signature.description, /\S/u);
    assert.match(boss.signature.counterplay, /\S/u);
    ['hp', 'speed', 'damage', 'reward', 'radius'].forEach(field => assert.ok(boss.stats[field] > 0));
    assert.equal(boss.phases.length, 3);
    assert.deepEqual(Array.from(boss.phases, phase => phase.threshold), [1, 0.66, 0.33]);
    boss.phases.forEach((phase, index) => {
      assert.equal(phase.number, index + 1);
      assert.match(phase.name, /\S/u);
      assert.match(phase.pattern.type, /\S/u);
      assert.match(phase.pattern.mechanic, /\S/u);
      assert.equal(phaseMechanics.has(phase.pattern.mechanic), false);
      phaseMechanics.add(phase.pattern.mechanic);
      assert.ok(phase.pattern.count > 0);
      assert.ok(phase.pattern.speed > 0);
      assert.ok(phase.pattern.damage > 0);
      assert.ok(phase.pattern.cooldownMs > 0);
    });
    ['score', 'coins', 'xp', 'metaCoins'].forEach(field => assert.ok(boss.rewards[field] > 0));
    assert.equal(boss.spriteAtlas.src, `assets/characters/villains/${slug}-atlas-v1.png`);
    assert.deepEqual(Array.from(boss.spriteAtlas.stateRows), ['idle', 'move', 'attack', 'ultimate']);
    assert.equal(boss.spriteAtlas.framesPerState, 4);
  });
  assert.equal(phaseMechanics.size, 30);
});

test('la campagne des Dix Trones est deterministe et programme un boss tous les deux niveaux', () => {
  const { registry } = loadCharacters();
  const campaign = registry.campaigns.ten_thrones;

  assert.equal(campaign.id, 'ten_thrones');
  assert.equal(campaign.finalWave, 20);
  assert.equal(campaign.deterministic, true);
  assert.equal(campaign.bossSchedule.length, 10);
  assert.deepEqual(campaign.bossSchedule.map(entry => entry.wave), [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
  assert.deepEqual(
    campaign.bossSchedule.map(entry => entry.bossId).sort(),
    BOSS_IDS
  );
  assert.ok(campaign.bossSchedule.every(entry => entry.deterministic === true));
  assert.equal(new Set(campaign.bossSchedule.map(entry => entry.wave)).size, 10);
});

test('le registre VN contient trente longs chapitres atteignables et leurs vrais emplacements', () => {
  const { registry } = loadCharacters();
  const chapters = Object.values(registry.vn.heroines).flatMap(heroine => heroine.chapters);

  assert.equal(registry.vn.schema, 'infernal-city.characters.vn/1');
  assert.equal(registry.vn.chaptersPerHeroine, 3);
  assert.equal(chapters.length, 30);
  assert.equal(registry.vn.chapters.length, 30);
  assert.equal(new Set(chapters.map(chapter => `${chapter.heroId}.${chapter.id}`)).size, 30);
  const openingFingerprints = new Set();
  const authoredLoreAnswers = new Set();

  chapters.forEach(chapter => {
    assert.ok(chapter.estimatedMinutes >= 10);
    assert.equal(chapter.presentation.fadeToBlack, true);
    assert.equal(chapter.presentation.graphicContent, false);
    assert.equal(chapter.cgSrc, `assets/vn/cg/chapters/${chapter.heroId}-${chapter.id}.webp`);
    assert.equal(chapter.expressionSheetSrc, `assets/vn/expressions/${chapter.heroId}-expressions-v1.webp`);
    assert.equal(chapter.loreChoices.length, 3);
    chapter.loreChoices.forEach(choice => {
      assert.equal(choice.sexualContent, false);
      assert.equal(choice.effects.relationshipMemoryOnly, true);
      assert.equal(choice.effects.military, false);
      assert.equal(choice.effects.combat, false);
      assert.equal(choice.effects.economy, false);
    });
    const reachable = reachableBeatIds(chapter);
    assert.equal(reachable.size, chapter.beats.length, `${chapter.heroId}/${chapter.id}: branche morte`);
    const lines = chapter.beats.flatMap(beat => beat.lines || []);
    assert.ok(lines.length >= 50, `${chapter.heroId}/${chapter.id}: chapitre trop court (${lines.length})`);
    const opening = chapter.beats.find(beat => beat.id === 'opening');
    openingFingerprints.add(opening.lines.map(line => line.text).join('\n'));
    chapter.beats
      .filter(beat => /^lore-/u.test(beat.id) && beat.id !== 'lore-choice')
      .forEach(beat => authoredLoreAnswers.add(beat.lines[4]?.text || ''));
    const loreBeat = chapter.beats.find(beat => beat.id === 'lore-choice');
    assert.equal(loreBeat.options.length, 3);
    assert.ok(loreBeat.options.every(option => (
      option.effects.combat === false
      && option.effects.economy === false
      && option.effects.narrativeOnly === true
    )));
  });
  assert.equal(openingFingerprints.size, 30);
  assert.ok(authoredLoreAnswers.size >= 30);
});

test('l injection VN preserve les six heroines existantes et ajoute les dix nouvelles', () => {
  const { registry, scenes } = loadCharacters();
  const originalIds = ['aria', 'carmilla', 'kira', 'rin', 'selene', 'vespera'];

  assert.equal(Object.keys(scenes.heroines).length, 16);
  originalIds.forEach(id => assert.ok(scenes.heroines[id], `${id}: heroine historique perdue`));
  HEROINE_IDS.forEach(id => {
    assert.ok(scenes.heroines[id], `${id}: heroine non injectee`);
    assert.equal(scenes.heroines[id].chapters.length, 3);
    assert.equal(scenes.heroines[id].isAdult, true);
  });
  assert.deepEqual(
    Object.keys(registry.vn.persistentBlueprint.heroinePaths).sort(),
    HEROINE_IDS
  );
  assert.ok(registry.vn.persistentBlueprint.excludedFields.includes('towerStats'));
  assert.ok(registry.vn.persistentBlueprint.excludedFields.includes('enemyStats'));
  assert.ok(registry.vn.persistentBlueprint.excludedFields.includes('resources'));
});

test('le contrat de contenu reste adulte consensuel non graphique et sans consequence militaire', () => {
  const { registry, scenes } = loadCharacters();

  assert.equal(registry.content.allCharactersAdults, true);
  assert.equal(registry.content.minimumAge, 18);
  assert.equal(registry.content.consentRequired, true);
  assert.equal(registry.content.consentRevocable, true);
  assert.equal(registry.content.refusalPenalty, 'none');
  assert.equal(registry.content.graphicSex, false);
  assert.equal(registry.content.fadeToBlack, true);
  assert.equal(registry.content.loreChoicesAreNarrativeOnly, true);
  assert.equal(registry.content.combatConsequences, false);
  assert.equal(registry.content.economicConsequences, false);
  assert.equal(scenes.content.allCharactersAdults, true);
  assert.equal(scenes.content.consentRequired, true);
  assert.equal(scenes.content.consentRevocable, true);
  assert.equal(scenes.content.explicitSexualDetail, false);
  assert.equal(scenes.content.endingStyle, 'fade-to-black');

  const serialized = JSON.stringify(plain(registry.vn.heroines));
  assert.doesNotMatch(serialized, /combatBonus|coinReward|creditReward|enemyDamageMultiplier/u);
});

test('les atlas OpenAI et tous leurs medias derives sont de vrais fichiers livrables', () => {
  const { registry } = loadCharacters();
  const assertBitmap = (relativePath, minimumBytes = 10_000) => {
    const absolutePath = path.join(ROOT, relativePath);
    assert.ok(fs.existsSync(absolutePath), `${relativePath}: fichier absent`);
    assert.ok(fs.statSync(absolutePath).size > minimumBytes, `${relativePath}: bitmap trop petit`);
  };

  Object.values(registry.heroines).forEach(heroine => {
    assertBitmap(heroine.spriteAtlas.src, 100_000);
    const atlas = fs.readFileSync(path.join(ROOT, heroine.spriteAtlas.src));
    assert.equal(atlas.readUInt32BE(16), 1024);
    assert.equal(atlas.readUInt32BE(20), 1024);
    assert.equal(atlas[25], 6, `${heroine.id}: atlas sans RGBA`);
    assertBitmap(heroine.avatar);
    assertBitmap(heroine.altAvatar);
  });
  Object.values(registry.bosses).forEach(boss => {
    assertBitmap(boss.spriteAtlas.src, 100_000);
    assertBitmap(boss.portrait);
  });
  registry.vn.chapters.forEach(chapter => {
    assertBitmap(chapter.cgSrc);
    assertBitmap(chapter.expressionSheetSrc);
  });
  assertBitmap('assets/vn/cg/ten-thrones-conclusion-v1.webp');
});
