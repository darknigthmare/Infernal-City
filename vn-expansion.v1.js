/**
 * Infernal City — extension narrative persistante, version 1.
 *
 * Ce module complète les 18 chapitres de `INFERNAL_VN_SCENES` sans modifier
 * leur graphe. Il peut être chargé seul : toutes les références de chapitres
 * et tous les emplacements d'assets prévus sont déclarés ici.
 *
 * Les choix de lore sont non sexuels. Ils ne changent ni les ressources,
 * ni les vagues, ni les statistiques de combat. La maturité ne règle que le
 * ton et la mise en scène d'adultes consentants ; toute intimité reste hors
 * champ et se termine par un fondu au noir.
 */
(function exposeInfernalVnExpansion() {
  'use strict';

  const STORAGE_KEY = 'infernalCity.vnExpansion.v1';
  const HERO_IDS = Object.freeze(['aria', 'kira', 'rin', 'selene', 'vespera', 'carmilla']);

  const HEROINE_BLUEPRINTS = Object.freeze({
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

  const CHAPTER_BLUEPRINTS = Object.freeze({
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

  function assetSlug(heroId, chapterId) {
    return `${heroId}-${chapterId}`;
  }

  function chapterAssetSrc(heroId, index) {
    const chapterId = CHAPTER_BLUEPRINTS[heroId]?.[index]?.[0];
    return chapterId
      ? `assets/vn/cg/chapters/${assetSlug(heroId, chapterId)}.webp`
      : '';
  }

  function buildLoreChoices(heroId, chapterId) {
    const heroine = HEROINE_BLUEPRINTS[heroId];
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
    const heroine = HEROINE_BLUEPRINTS[heroId];
    return heroine.callbacks.map((id, index) => ({
      id: `${id}.${chapterId}`,
      trigger: 'lore-choice',
      choiceId: `${chapterId}.${heroine.branchThemes[index]}`,
      persistentPath: `heroines.${heroId}.traits.${heroine.branchThemes[index]}`,
      writes: ['traits', 'memories', 'callbackHistory'],
      forbiddenWrites: ['credits', 'resources', 'towerStats', 'enemyStats', 'waveState'],
      militaryEffect: false,
      economicEffect: false
    }));
  }

  const chapters = HERO_IDS.flatMap(heroId => (
    CHAPTER_BLUEPRINTS[heroId].map(([chapterId, backdropId, musicMood]) => {
      const slug = assetSlug(heroId, chapterId);
      return {
        heroId,
        chapterId,
        cgSrc: `assets/vn/cg/chapters/${slug}.webp`,
        // The authored CG also serves as the coherent scene backdrop. This
        // keeps all 18 branches fully illustrated without loading a second
        // duplicate bitmap on mobile.
        backdropSrc: `assets/vn/cg/chapters/${slug}.webp`,
        expressionSheetSrc: HEROINE_BLUEPRINTS[heroId].expressionSheetSrc,
        musicMood,
        callbacks: buildCallbacks(heroId, chapterId),
        loreChoices: buildLoreChoices(heroId, chapterId)
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
    return {
      traits: {},
      memories: [],
      callbackHistory: [],
      consent: {
        granted: false,
        revoked: false,
        updatedAt: null
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
        .slice(-90);
    }
    if (Array.isArray(candidate.callbackHistory)) {
      clean.callbackHistory = candidate.callbackHistory
        .filter(callback => typeof callback === 'string')
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

  function sanitizeState(candidate) {
    const clean = createDefaultState();
    if (!candidate || typeof candidate !== 'object') return clean;
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
      return serialized ? sanitizeState(JSON.parse(serialized)) : createDefaultState();
    } catch (_error) {
      return createDefaultState();
    }
  }

  function saveState(state, storage) {
    const clean = sanitizeState(state);
    clean.updatedAt = new Date().toISOString();
    const target = resolveStorage(storage);
    if (target) {
      try {
        target.setItem(STORAGE_KEY, JSON.stringify(clean));
      } catch (_error) {
        // La progression reste utilisable en mémoire même si le quota est plein.
      }
    }
    return clean;
  }

  function findChapter(heroId, chapterId) {
    return chapters.find(chapter => chapter.heroId === heroId && chapter.chapterId === chapterId) || null;
  }

  function grantConsent(state, heroId, storage) {
    const clean = sanitizeState(state);
    if (!HERO_IDS.includes(heroId)) return clean;
    clean.heroines[heroId].consent = {
      granted: true,
      revoked: false,
      updatedAt: new Date().toISOString()
    };
    return saveState(clean, storage);
  }

  function revokeConsent(state, heroId, storage) {
    const clean = sanitizeState(state);
    if (!HERO_IDS.includes(heroId)) return clean;
    clean.heroines[heroId].consent = {
      granted: false,
      revoked: true,
      updatedAt: new Date().toISOString()
    };
    return saveState(clean, storage);
  }

  function setMaturity(state, mode, storage) {
    const clean = sanitizeState(state);
    clean.maturity = sanitizeMaturity(mode);
    return saveState(clean, storage);
  }

  function recordLoreChoice(state, heroId, chapterId, choiceId, storage) {
    const clean = sanitizeState(state);
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
          title: 'Six voix libres',
          cgSrc: 'assets/vn/cg/conclusions/six-free-voices.webp',
          requirement: 'Découvrir un souvenir de lore pour chaque héroïne',
          maturityMode: 'suggestive'
        },
        {
          id: 'chosen-night',
          title: 'La nuit choisie',
          cgSrc: 'assets/vn/cg/conclusions/chosen-night.webp',
          requirement: 'Achever les dix-huit chapitres avec consentement actif',
          maturityMode: 'intense',
          consentRequired: true,
          fadeToBlack: true
        }
      ]
    },
    persistence: {
      scope: 'narrative-only',
      savedFields: ['maturity', 'traits', 'memories', 'callbackHistory', 'consent'],
      excludedFields: ['credits', 'resources', 'towerStats', 'enemyStats', 'waveState'],
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
