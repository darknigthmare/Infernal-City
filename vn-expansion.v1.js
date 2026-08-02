/**
 * Infernal City — extension narrative persistante, version 1.
 *
 * Ce module complète les chapitres de `INFERNAL_VN_SCENES` sans modifier leur
 * graphe. Il peut être chargé seul et fusionne aussi le registre Characters
 * lorsqu'il a été chargé avant lui.
 *
 * Les choix de lore sont non sexuels. Ils ne changent ni les ressources,
 * ni les vagues, ni les statistiques de combat. La maturité ne règle que le
 * ton et la mise en scène d'adultes consentants ; toute intimité reste hors
 * champ et se termine par un fondu au noir.
 */
(function exposeInfernalVnExpansion() {
  'use strict';

  const STORAGE_KEY = 'infernalCity.vnExpansion.v1';
  const DATA_VERSION = 1;
  const MAX_MEMORY_LENGTH = 240;
  const LEGACY_HERO_IDS = Object.freeze(['aria', 'kira', 'rin', 'selene', 'vespera', 'carmilla']);

  const LEGACY_HEROINE_BLUEPRINTS = Object.freeze({
    aria: {
      displayName: 'Commandante Aria',
      age: 34,
      expressionSheetSrc: 'assets/vn/expressions/aria-expressions-v1.webp',
      branchThemes: ['devoir', 'repos', 'égalité'],
      branchLabels: [
        'Lui demander ce qu’elle protégerait si Haven n’avait plus besoin de commandants.',
        'Proposer un rituel de fin de service où chacun peut déposer son rôle.',
        'Écrire avec elle une règle garantissant la même voix aux deux partenaires.'
      ],
      callbacks: ['aria.futureBeyondDuty', 'aria.offDutyRitual', 'aria.equalVoice'],
      poses: [
        ['command-rest', 'Repos de commandement'],
        ['aegis-open', 'Garde Aegis ouverte'],
        ['equal-toast', 'Toast entre égaux']
      ],
      ambiences: [
        ['blue-watch', 'Veille bleue du pont'],
        ['aegis-dawn', 'Aube sous le dôme'],
        ['quiet-quarters', 'Quartiers au calme']
      ]
    },
    kira: {
      displayName: 'Kira l’Ombre',
      age: 29,
      expressionSheetSrc: 'assets/vn/expressions/kira-expressions-v1.webp',
      branchThemes: ['vérité', 'liberté', 'confiance'],
      branchLabels: [
        'Lui offrir une vérité personnelle sans exiger qu’elle réponde.',
        'Imaginer un refuge dont elle seule déciderait les portes et les règles.',
        'Choisir un signe discret qui signifie toujours « je te crois ».'
      ],
      callbacks: ['kira.offeredTruth', 'kira.chosenRefuge', 'kira.trustSignal'],
      poses: [
        ['rooftop-listener', 'Écoute sur les toits'],
        ['mask-lowered', 'Masque abaissé'],
        ['two-key-pact', 'Pacte à deux clés']
      ],
      ambiences: [
        ['noir-rooftop', 'Toits sous la pluie'],
        ['hologram-maze', 'Labyrinthe holographique'],
        ['safehouse-lamps', 'Lampes du refuge']
      ]
    },
    rin: {
      displayName: 'Rin',
      age: 28,
      expressionSheetSrc: 'assets/vn/expressions/rin-expressions-v1.webp',
      branchThemes: ['mémoire', 'limites', 'transmission'],
      branchLabels: [
        'L’inviter à raconter un souvenir que le feu ne doit jamais effacer.',
        'Définir ensemble un mot simple qui suspend toute cérémonie.',
        'Lui demander quel enseignement elle voudrait transmettre à Haven.'
      ],
      callbacks: ['rin.emberMemory', 'rin.boundaryWord', 'rin.livingTradition'],
      poses: [
        ['ember-cup', 'Coupe de braise'],
        ['ritual-listener', 'Écoute du rituel'],
        ['sanctuary-keeper', 'Gardienne du sanctuaire']
      ],
      ambiences: [
        ['ember-gold', 'Braises dorées'],
        ['ritual-crimson', 'Cercle rituel carmin'],
        ['sanctuary-night', 'Sanctuaire nocturne']
      ]
    },
    selene: {
      displayName: 'Sélène',
      age: 31,
      expressionSheetSrc: 'assets/vn/expressions/selene-expressions-v1.webp',
      branchThemes: ['mémoire', 'avenir', 'identité'],
      branchLabels: [
        'L’aider à nommer un souvenir heureux qui lui appartient entièrement.',
        'Dessiner avec elle une constellation représentant un avenir choisi.',
        'Lui demander comment elle souhaite être reconnue au-delà de ses pouvoirs.'
      ],
      callbacks: ['selene.keptMemory', 'selene.chosenConstellation', 'selene.selfDefinition'],
      poses: [
        ['lunar-observer', 'Observatrice lunaire'],
        ['memory-gardener', 'Jardinière des souvenirs'],
        ['tide-listener', 'Écoute de la marée']
      ],
      ambiences: [
        ['silver-observatory', 'Observatoire argenté'],
        ['memory-bloom', 'Jardin en floraison'],
        ['moonlit-tide', 'Marée au clair de lune']
      ]
    },
    vespera: {
      displayName: 'Impératrice Vespera',
      age: 146,
      expressionSheetSrc: 'assets/vn/expressions/vespera-expressions-v1.webp',
      branchThemes: ['souveraineté', 'héritage', 'diplomatie'],
      branchLabels: [
        'Lui demander quel choix fut le sien avant que le trône choisisse pour elle.',
        'Concevoir un symbole d’alliance qui n’appartient à aucune couronne.',
        'L’écouter définir l’héritage qu’elle laisserait sans conquête.'
      ],
      callbacks: ['vespera.firstChoice', 'vespera.crownlessSymbol', 'vespera.peacefulLegacy'],
      poses: [
        ['throne-aside', 'Loin du trône'],
        ['crownless-dance', 'Danse sans couronne'],
        ['pact-reader', 'Lecture du pacte']
      ],
      ambiences: [
        ['neutral-embassy', 'Ambassade neutre'],
        ['abyssal-ball', 'Bal abyssal'],
        ['quiet-violet', 'Salon violet au calme']
      ]
    },
    carmilla: {
      displayName: 'Reine Carmilla',
      age: 312,
      expressionSheetSrc: 'assets/vn/expressions/carmilla-expressions-v1.webp',
      branchThemes: ['histoire', 'création', 'aube'],
      branchLabels: [
        'Lui demander quelle page de son histoire elle réécrirait pour elle-même.',
        'Choisir une œuvre à créer ensemble plutôt qu’un trophée à conserver.',
        'Imaginer avec elle une tradition destinée à accueillir chaque nouvelle aube.'
      ],
      callbacks: ['carmilla.rewrittenPage', 'carmilla.sharedCreation', 'carmilla.dawnTradition'],
      poses: [
        ['sealed-cup', 'Coupe scellée'],
        ['velvet-curtsy', 'Révérence de velours'],
        ['dawn-reader', 'Lectrice de l’aube']
      ],
      ambiences: [
        ['gothic-library', 'Bibliothèque gothique'],
        ['crimson-ball', 'Bal cramoisi'],
        ['first-dawn', 'Première lumière']
      ]
    }
  });

  const LEGACY_CHAPTER_BLUEPRINTS = Object.freeze({
    aria: [
      ['midnight-relief', 'haven-command-deck-night', 'quiet-industrial'],
      ['shield-dance', 'aegis-training-dome', 'slow-synth'],
      ['under-aegis', 'aria-private-quarters', 'intimate-aegis']
    ],
    kira: [
      ['dead-channel', 'shadow-lounge', 'noir-electronic'],
      ['shadow-game', 'holographic-maze', 'playful-stealth'],
      ['two-key-safehouse', 'kira-safehouse', 'intimate-noir']
    ],
    rin: [
      ['two-ember-cups', 'ember-sanctuary', 'ritual-warmth'],
      ['spoken-limits', 'flame-ritual-circle', 'sensual-ritual'],
      ['closed-sanctuary', 'rin-private-sanctuary', 'intimate-flame']
    ],
    selene: [
      ['artificial-moon', 'lunar-observatory', 'ambient-lunar'],
      ['memory-garden', 'lunar-memory-garden', 'dreamlike-lunar'],
      ['tide-chamber', 'selene-tide-chamber', 'intimate-lunar']
    ],
    vespera: [
      ['table-without-throne', 'neutral-embassy-chamber', 'abyssal-diplomacy'],
      ['abyssal-ball', 'abyssal-embassy-ballroom', 'regal-sensual'],
      ['amendable-pact', 'vespera-private-embassy', 'intimate-abyssal']
    ],
    carmilla: [
      ['sealed-cup', 'carmilla-gothic-library', 'gothic-chamber'],
      ['velvet-ball', 'crimson-masked-ball', 'gothic-waltz'],
      ['when-dawn-rings', 'carmilla-private-chamber', 'intimate-gothic']
    ]
  });

  const CHARACTER_PACK = (
    typeof window !== 'undefined'
    && window.INFERNAL_CITY_CHARACTERS?.schema === 'infernal-city.characters/1'
  )
    ? window.INFERNAL_CITY_CHARACTERS
    : null;
  const CHARACTER_VN = CHARACTER_PACK?.vn?.schema === 'infernal-city.characters.vn/1'
    ? CHARACTER_PACK.vn
    : null;
  const CHARACTER_VN_HEROINES = CHARACTER_VN?.heroines || {};
  const CHARACTER_PERSISTENT_BLUEPRINT = (
    CHARACTER_VN?.persistentBlueprint?.schema === 'infernal-city.characters.vn-state/1'
  )
    ? CHARACTER_VN.persistentBlueprint
    : null;

  function normalizeExternalHeroineBlueprint(heroId, source) {
    const persistentPath = CHARACTER_PERSISTENT_BLUEPRINT?.heroinePaths?.[heroId];
    const branchThemes = (
      source?.persistentBranchThemes
      || persistentPath?.traitIds
      || source?.loreChoices?.map(choice => choice.persistentTrait)
      || []
    ).slice(0, 3);
    const loreChoices = Array.isArray(source?.loreChoices) ? source.loreChoices.slice(0, 3) : [];
    const chapterList = Array.isArray(source?.chapters) ? source.chapters.slice(0, 3) : [];

    return {
      displayName: source?.displayName || source?.name || heroId,
      age: Math.max(18, Math.floor(Number(source?.age) || 18)),
      expressionSheetSrc: source?.expressionSheetSrc
        || `assets/vn/expressions/${heroId}-expressions-v1.webp`,
      branchThemes,
      branchLabels: branchThemes.map((theme, index) => (
        loreChoices[index]?.label || `Parler de ${theme} sans conséquence militaire ni économique.`
      )),
      callbacks: branchThemes.map((theme, index) => (
        loreChoices[index]?.callbackId || `${heroId}.remember.${theme}`
      )),
      poses: chapterList.map(chapter => [chapter.id, chapter.title]),
      ambiences: chapterList.map(chapter => [
        `${chapter.id}-ambience`,
        chapter.subtitle || chapter.title
      ])
    };
  }

  const externalHeroineBlueprints = Object.fromEntries(
    Object.entries(CHARACTER_VN_HEROINES)
      .filter(([, source]) => source?.isAdult === true && Number(source.age) >= 18)
      .map(([heroId, source]) => [heroId, normalizeExternalHeroineBlueprint(heroId, source)])
  );
  const externalChapterBlueprints = Object.fromEntries(
    Object.entries(CHARACTER_VN_HEROINES).map(([heroId, source]) => [
      heroId,
      (source?.chapters || []).slice(0, 3).map(chapter => [
        chapter.id,
        chapter.presentation?.backdrop || chapter.cgSrc,
        chapter.presentation?.musicMood || 'haven-night'
      ])
    ])
  );
  const HERO_IDS = Object.freeze([
    ...new Set([...LEGACY_HERO_IDS, ...Object.keys(externalHeroineBlueprints)])
  ]);
  const HEROINE_BLUEPRINTS = Object.freeze({
    ...LEGACY_HEROINE_BLUEPRINTS,
    ...externalHeroineBlueprints
  });
  const CHAPTER_BLUEPRINTS = Object.freeze({
    ...LEGACY_CHAPTER_BLUEPRINTS,
    ...externalChapterBlueprints
  });
  const HEROINE_TOTAL = HERO_IDS.length;
  const CHAPTER_TOTAL = Object.values(CHAPTER_BLUEPRINTS)
    .reduce((total, chapterList) => total + chapterList.length, 0);

  function getExternalChapter(heroId, chapterId) {
    return CHARACTER_VN_HEROINES[heroId]?.chapters
      ?.find(chapter => chapter.id === chapterId) || null;
  }

  function assetSlug(heroId, chapterId) {
    return `${heroId}-${chapterId}`;
  }

  function chapterAssetSrc(heroId, index) {
    const chapterId = CHAPTER_BLUEPRINTS[heroId]?.[index]?.[0];
    const externalChapter = chapterId ? getExternalChapter(heroId, chapterId) : null;
    return chapterId
      ? externalChapter?.cgSrc
        || `assets/vn/cg/chapters/${assetSlug(heroId, chapterId)}.webp`
      : '';
  }

  function buildLoreChoices(heroId, chapterId) {
    const heroine = HEROINE_BLUEPRINTS[heroId];
    const externalChapter = getExternalChapter(heroId, chapterId);
    if (Array.isArray(externalChapter?.loreChoices) && externalChapter.loreChoices.length > 0) {
      return externalChapter.loreChoices.slice(0, 3).map(choice => ({
        id: choice.id,
        label: choice.label,
        category: 'personality-lore',
        sexualContent: false,
        callbackId: choice.callbackId,
        persistentTrait: choice.persistentTrait,
        effects: {
          relationshipMemoryOnly: true,
          military: false,
          economy: false,
          combat: false
        }
      }));
    }
    return heroine.branchLabels.map((label, index) => ({
      id: `${chapterId}.${heroine.branchThemes[index]}`,
      label,
      category: 'personality-lore',
      sexualContent: false,
      callbackId: `${heroine.callbacks[index]}.${chapterId}`,
      persistentTrait: heroine.branchThemes[index],
      effects: {
        relationshipMemoryOnly: true,
        military: false,
        economy: false,
        combat: false
      }
    }));
  }

  function buildCallbacks(heroId, chapterId) {
    return buildLoreChoices(heroId, chapterId).map(choice => ({
      id: choice.callbackId,
      trigger: 'lore-choice',
      choiceId: choice.id,
      persistentPath: `heroines.${heroId}.traits.${choice.persistentTrait}`,
      writes: ['traits', 'memories', 'callbackHistory'],
      forbiddenWrites: ['credits', 'resources', 'towerStats', 'enemyStats', 'waveState'],
      militaryEffect: false,
      economicEffect: false
    }));
  }

  const chapters = HERO_IDS.flatMap(heroId => (
    CHAPTER_BLUEPRINTS[heroId].map(([chapterId, backdropId, musicMood]) => {
      const slug = assetSlug(heroId, chapterId);
      const externalChapter = getExternalChapter(heroId, chapterId);
      const cgSrc = externalChapter?.cgSrc || `assets/vn/cg/chapters/${slug}.webp`;
      const loreChoices = buildLoreChoices(heroId, chapterId);
      return {
        heroId,
        chapterId,
        cgSrc,
        // The authored CG also serves as the coherent scene backdrop. This
        // keeps every branch fully illustrated without loading a second
        // duplicate bitmap on mobile.
        backdropSrc: externalChapter?.presentation?.backdrop || cgSrc,
        expressionSheetSrc: externalChapter?.expressionSheetSrc
          || HEROINE_BLUEPRINTS[heroId].expressionSheetSrc,
        musicMood,
        callbacks: buildCallbacks(heroId, chapterId),
        loreChoices
      };
    })
  ));

  const studioHeroines = Object.fromEntries(HERO_IDS.map(heroId => {
    const heroine = HEROINE_BLUEPRINTS[heroId];
    const poses = heroine.poses.map(([id, label], index) => ({
      id,
      label,
      previewSrc: chapterAssetSrc(heroId, index),
      adultOnly: true,
      nudity: false
    }));
    const ambiences = heroine.ambiences.map(([id, label], index) => ({
      id,
      label,
      backdropSrc: chapterAssetSrc(heroId, index),
      musicMood: id
    }));
    return [heroId, {
      heroId,
      displayName: heroine.displayName,
      age: heroine.age,
      isAdult: true,
      poses,
      ambiences
    }];
  }));

  function createHeroineState() {
    const source = CHARACTER_PERSISTENT_BLUEPRINT?.defaultHeroineState || {};
    const sourceConsent = source.consent || {};
    return {
      traits: { ...(source.traits || {}) },
      memories: [...(source.memories || [])],
      callbackHistory: [...(source.callbackHistory || [])],
      consent: {
        granted: sourceConsent.granted === true && sourceConsent.revoked !== true,
        revoked: sourceConsent.revoked === true,
        updatedAt: typeof sourceConsent.updatedAt === 'string' ? sourceConsent.updatedAt : null
      }
    };
  }

  function createDefaultState() {
    return {
      dataVersion: 1,
      maturity: 'suggestive',
      updatedAt: null,
      heroines: Object.fromEntries(HERO_IDS.map(heroId => [heroId, createHeroineState()]))
    };
  }

  function sanitizeMaturity(mode) {
    return mode === 'intense' ? 'intense' : 'suggestive';
  }

  function sanitizeHeroineState(candidate) {
    const clean = createHeroineState();
    if (!candidate || typeof candidate !== 'object') return clean;
    if (candidate.traits && typeof candidate.traits === 'object') {
      Object.entries(candidate.traits).forEach(([trait, count]) => {
        if (/^[a-zÀ-ÿ-]{2,32}$/iu.test(trait)) {
          clean.traits[trait] = Math.max(0, Math.min(99, Math.floor(Number(count) || 0)));
        }
      });
    }
    if (Array.isArray(candidate.memories)) {
      clean.memories = candidate.memories
        .filter(memory => typeof memory === 'string')
        .map(memory => memory.slice(0, MAX_MEMORY_LENGTH))
        .slice(-90);
    }
    if (Array.isArray(candidate.callbackHistory)) {
      clean.callbackHistory = candidate.callbackHistory
        .filter(callback => typeof callback === 'string')
        .map(callback => callback.slice(0, MAX_MEMORY_LENGTH))
        .slice(-90);
    }
    const consent = candidate.consent;
    if (consent && typeof consent === 'object') {
      clean.consent.granted = consent.granted === true && consent.revoked !== true;
      clean.consent.revoked = consent.revoked === true;
      clean.consent.updatedAt = typeof consent.updatedAt === 'string' ? consent.updatedAt : null;
    }
    return clean;
  }

  function sanitizeState(candidate, options = {}) {
    const clean = createDefaultState();
    if (!candidate || typeof candidate !== 'object') return clean;
    if (Number(candidate.dataVersion) > DATA_VERSION) {
      const error = new Error(
        `Progression narrative plus récente détectée (v${candidate.dataVersion}).`
      );
      error.code = 'NARRATIVE_VERSION_INCOMPATIBLE';
      if (options.throwOnIncompatible === true) throw error;
      return clean;
    }
    clean.maturity = sanitizeMaturity(candidate.maturity);
    clean.updatedAt = typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null;
    HERO_IDS.forEach(heroId => {
      clean.heroines[heroId] = sanitizeHeroineState(candidate.heroines?.[heroId]);
    });
    return clean;
  }

  function resolveStorage(storage) {
    if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') {
      return storage;
    }
    try {
      if (window.localStorage) return window.localStorage;
    } catch (_error) {
      // Le mode privé peut interdire localStorage : l'appelant garde alors
      // simplement l'état retourné par les fonctions pures.
    }
    return null;
  }

  function loadState(storage) {
    const target = resolveStorage(storage);
    if (!target) return createDefaultState();
    try {
      const serialized = target.getItem(STORAGE_KEY);
      return serialized
        ? sanitizeState(JSON.parse(serialized), { throwOnIncompatible: true })
        : createDefaultState();
    } catch (error) {
      throw error;
    }
  }

  function saveState(state, storage, options = {}) {
    const clean = sanitizeState(state, { throwOnIncompatible: true });
    clean.updatedAt = new Date().toISOString();
    const target = resolveStorage(storage);
    const serialized = JSON.stringify(clean);
    try {
      if (!target) throw new Error('Stockage narratif indisponible.');
      target.setItem(STORAGE_KEY, serialized);
      if (typeof target.getItem === 'function' && target.getItem(STORAGE_KEY) !== serialized) {
        throw new Error('Le stockage narratif n’a pas confirmé l’écriture.');
      }
    } catch (cause) {
      // The sanitized mutation remains usable for the current session, but an
      // explicit error prevents the UI from claiming that it was persisted.
      const error = new Error('Progression narrative non persistée : stockage indisponible.');
      error.code = 'NARRATIVE_STORAGE_WRITE_FAILED';
      error.state = clean;
      error.cause = cause;
      if (options.throwOnError !== false) throw error;
    }
    return clean;
  }

  function findChapter(heroId, chapterId) {
    return chapters.find(chapter => chapter.heroId === heroId && chapter.chapterId === chapterId) || null;
  }

  function grantConsent(state, heroId, storage) {
    const clean = sanitizeState(state, { throwOnIncompatible: true });
    if (!HERO_IDS.includes(heroId)) return clean;
    clean.heroines[heroId].consent = {
      granted: true,
      revoked: false,
      updatedAt: new Date().toISOString()
    };
    return saveState(clean, storage);
  }

  function revokeConsent(state, heroId, storage) {
    const clean = sanitizeState(state, { throwOnIncompatible: true });
    if (!HERO_IDS.includes(heroId)) return clean;
    clean.heroines[heroId].consent = {
      granted: false,
      revoked: true,
      updatedAt: new Date().toISOString()
    };
    return saveState(clean, storage);
  }

  function setMaturity(state, mode, storage) {
    const clean = sanitizeState(state, { throwOnIncompatible: true });
    clean.maturity = sanitizeMaturity(mode);
    return saveState(clean, storage);
  }

  function recordLoreChoice(state, heroId, chapterId, choiceId, storage) {
    const clean = sanitizeState(state, { throwOnIncompatible: true });
    const chapter = findChapter(heroId, chapterId);
    if (!chapter) return { state: clean, applied: false, reason: 'unknown-chapter' };
    const heroineState = clean.heroines[heroId];
    if (!heroineState.consent.granted || heroineState.consent.revoked) {
      return { state: clean, applied: false, reason: 'consent-required' };
    }
    const choice = chapter.loreChoices.find(item => item.id === choiceId);
    const callback = chapter.callbacks.find(item => item.id === choice?.callbackId);
    if (!choice || !callback) return { state: clean, applied: false, reason: 'unknown-choice' };

    heroineState.traits[choice.persistentTrait] = (
      Number(heroineState.traits[choice.persistentTrait]) || 0
    ) + 1;
    const memoryId = `${heroId}.${chapterId}.${choice.id}`;
    if (!heroineState.memories.includes(memoryId)) heroineState.memories.push(memoryId);
    heroineState.callbackHistory.push(`${chapterId}:${callback.id}`);
    return {
      state: saveState(clean, storage),
      applied: true,
      callbackId: callback.id,
      narrativeOnly: true
    };
  }

  const PERSISTENCE_SAVED_FIELDS = Object.freeze([
    ...new Set([
      'maturity',
      'traits',
      'memories',
      'callbackHistory',
      'consent',
      ...(CHARACTER_PERSISTENT_BLUEPRINT?.savedFields || [])
    ])
  ]);
  const PERSISTENCE_EXCLUDED_FIELDS = Object.freeze([
    ...new Set([
      'credits',
      'resources',
      'towerStats',
      'enemyStats',
      'waveState',
      ...(CHARACTER_PERSISTENT_BLUEPRINT?.excludedFields || [])
    ])
  ]);

  const data = {
    schema: 'infernal-city.vn-expansion/1',
    version: 1,
    storageKey: STORAGE_KEY,
    content: {
      allCharactersAdults: true,
      majorCharacterIds: HERO_IDS,
      graphicSex: false,
      fadeToBlack: true,
      loreChoicesAreNonSexual: true,
      militaryConsequences: false,
      economicConsequences: false
    },
    maturity: {
      modes: ['suggestive', 'intense'],
      defaultMode: 'suggestive',
      optional: true,
      intenseRequiresOptIn: true,
      consentRequired: true,
      consentRevocable: true,
      consequenceFreeRefusal: true,
      scope: ['dialogue-tone', 'romantic-tension', 'camera-framing'],
      excludes: ['graphic-sex', 'combat-bonus', 'combat-penalty', 'credits', 'resources']
    },
    heroines: Object.fromEntries(HERO_IDS.map(heroId => {
      const source = HEROINE_BLUEPRINTS[heroId];
      return [heroId, {
        id: heroId,
        displayName: source.displayName,
        age: source.age,
        isAdult: true,
        persistentBranchThemes: [...source.branchThemes],
        chapterIds: CHAPTER_BLUEPRINTS[heroId].map(([chapterId]) => chapterId)
      }];
    })),
    chapters,
    studio: {
      schema: 'infernal-city.studio/2',
      version: '2.0',
      heroines: studioHeroines,
      conclusionCgs: [
        {
          id: 'haven-lanterns',
          title: 'Les lanternes de Haven',
          cgSrc: 'assets/vn/cg/conclusions/haven-lanterns.webp',
          requirement: 'Terminer six chapitres en respectant chaque limite',
          maturityMode: 'suggestive'
        },
        {
          id: 'six-free-voices',
          title: `${HEROINE_TOTAL} voix libres`,
          cgSrc: 'assets/vn/cg/conclusions/six-free-voices.webp',
          requirement: 'Découvrir un souvenir de lore pour chaque héroïne',
          maturityMode: 'suggestive'
        },
        {
          id: 'chosen-night',
          title: 'La nuit choisie',
          cgSrc: 'assets/vn/cg/conclusions/chosen-night.webp',
          requirement: `Achever les ${CHAPTER_TOTAL} chapitres avec consentement actif`,
          maturityMode: 'intense',
          consentRequired: true,
          fadeToBlack: true
        }
      ]
    },
    persistence: {
      scope: 'narrative-only',
      characterBlueprint: CHARACTER_PERSISTENT_BLUEPRINT,
      savedFields: PERSISTENCE_SAVED_FIELDS,
      excludedFields: PERSISTENCE_EXCLUDED_FIELDS,
      createDefaultState,
      sanitizeState,
      loadState,
      saveState,
      grantConsent,
      revokeConsent,
      setMaturity,
      recordLoreChoice
    },
    getChapter: findChapter
  };

  window.INFERNAL_VN_EXPANSION = Object.freeze(data);
}());
