'use strict';

(function registerInfernalCityAdultScenes(globalScope) {
  const villainSpecs = [
    ['xyra', 'Xyra Bioforge', 'Démone Biomécanique', 214],
    ['ossuary', 'Lady Ossuary', 'Maîtresse Squelette', 487],
    ['nhalzara', 'Nhal’Zara', 'Impératrice du Vide', 1200],
    ['astarra', 'Astarra Infernale', 'Reine des Enfers', 666],
    ['umbrael', 'Umbrael Shadow', 'Maîtresse des Ombres', 308],
    ['pestifera', 'Pestifera', 'Duchesse des Pestes', 531],
    ['vexara', 'Vexara Dreadtide', 'Amirale de l’Abîme', 402],
    ['kalix', 'Kali-X', 'Dominatrice Quantique', 289],
    ['malika', 'Malika Ash-Djinn', 'Sultane des Cendres', 904],
    ['noctis', 'Madame Noctis', 'Tisseuse de Cauchemars', 777]
  ];

  const villainCinematics = Object.fromEntries(villainSpecs.map(spec => {
    const [id, name, title, age] = spec;
    return [id, {
      id,
      name,
      title,
      age,
      isAdult: true,
      introSrc: `assets/vn/cg/villains/${id}-intro-v1.webp`,
      defeatSrc: `assets/vn/cg/villains/${id}-defeat-v1.webp`,
      introAlt: `${name}, antagoniste adulte, révèle son Trône devant Haven.`,
      defeatAlt: `${name}, antagoniste adulte neutralisée, prépare son retrait.`,
      introCopy: `${name} entre en scène et annonce clairement sa mécanique de siège.`,
      defeatCopy: `${name} reconnaît la neutralisation de son Trône et se retire sans violence graphique.`
    }];
  }));

  const heroineSpecs = [
    ['nyx', 'Nyx Circuit', 30],
    ['aurelia', 'Aurelia Brassheart', 36],
    ['maris', 'Capitaine Maris Blacktide', 33],
    ['zahra', 'Zahra des Mille-Ciels', 28],
    ['mircalla', 'Mircalla Dollheart', 29],
    ['isolde', 'Isolde Mourne', 35],
    ['hana', 'Hana Kurogane', 32],
    ['freyja', 'Freyja Rimeborne', 38],
    ['vega', 'Vega Solari', 31],
    ['amara', 'Amara Verdigris', 34]
  ];

  const bikiniScenes = heroineSpecs.map(spec => {
    const [heroId, name, age] = spec;
    return {
      id: `${heroId}_bikini`,
      kind: 'bikini',
      title: `${name} · Escale néon`,
      subtitle: `Archive maillot · adulte de ${age} ans`,
      ageLabel: `${age} ans`,
      participants: [heroId],
      src: `assets/vn/cg/adult-bonus/${heroId}-bikini-v1.webp`,
      alt: `${name}, adulte de ${age} ans, en maillot élégant sur la côte néon.`,
      quote: '« Une pause choisie vaut mieux qu’un ordre de plus. »',
      story: `${name} choisit sa tenue et son moment de détente. Cette archive sensuelle reste non nue et sans effet sur ses capacités militaires.`,
      unlockRule: { type: 'heroes_unlocked', heroIds: [heroId] }
    };
  });

  const pairSpecs = [
    ['nyx-aurelia', 'Nyx & Aurelia', ['nyx', 'aurelia'], 'franchise et patience'],
    ['maris-zahra', 'Maris & Zahra', ['maris', 'zahra'], 'liberté et confiance'],
    ['mircalla-isolde', 'Mircalla & Isolde', ['mircalla', 'isolde'], 'silence et délicatesse'],
    ['hana-freyja', 'Hana & Freyja', ['hana', 'freyja'], 'respect et chaleur'],
    ['vega-amara', 'Vega & Amara', ['vega', 'amara'], 'lumière et douceur']
  ];

  const pairedScenes = pairSpecs.flatMap(spec => {
    const [slug, title, participants, theme] = spec;
    const unlockRule = { type: 'heroes_unlocked', heroIds: participants };
    return [
      {
        id: `${slug}_romance`,
        kind: 'romance_ff',
        title: `${title} · Tension partagée`,
        subtitle: 'Romance femme-femme · adultes consentantes',
        ageLabel: '28 ans et plus',
        participants,
        src: `assets/vn/cg/adult-bonus/${slug}-romance-v1.webp`,
        alt: `${title}, deux femmes adultes, partagent une proximité romantique consentie.`,
        quote: '« Oui maintenant, et chacune peut encore dire pause. »',
        story: `Le rapprochement repose sur ${theme}. Les deux femmes formulent leur accord avant tout baiser ou contact affectueux.`,
        unlockRule
      },
      {
        id: `${slug}_afterglow`,
        kind: 'afterglow',
        title: `${title} · Après les néons`,
        subtitle: 'Après-intimité implicite · adultes consentantes',
        ageLabel: '28 ans et plus',
        participants,
        src: `assets/vn/cg/adult-bonus/${slug}-afterglow-v1.webp`,
        alt: `${title}, deux femmes adultes en peignoirs ou sous des draps couvrants après un fondu au noir.`,
        quote: '« On reste, on parle, ou on s’arrête : le choix demeure. »',
        story: 'La scène intime elle-même reste hors champ. L’archive reprend après le fondu au noir, dans un moment calme, couvert et non graphique.',
        unlockRule
      }
    ];
  });

  const gameOverTeases = [
    ['01', 'xyra', 'nyx', 'Xyra a brisé le réseau de Nyx, mais lui laisse déjà préparer sa revanche.'],
    ['02', 'vexara', 'maris', 'Vexara salue théâtralement Maris et lui promet une nouvelle bordée.'],
    ['03', 'kalix', 'vega', 'Kali-X suspend son calcul juste assez longtemps pour lancer un sourire provocateur à Vega.'],
    ['04', 'noctis', 'mircalla', 'Madame Noctis referme le songe tandis que Mircalla mémorise chaque faiblesse du cauchemar.']
  ].map(spec => {
    const [number, villainId, heroId, caption] = spec;
    return {
      id: `game_over_tease_${number}`,
      kind: 'game_over',
      title: `Revanche promise · ${number}`,
      subtitle: 'Game Over coquin · taquinerie non sexuelle',
      ageLabel: '29 ans et plus',
      participants: [villainId, heroId],
      villainId,
      heroId,
      src: `assets/vn/cg/adult-bonus/game-over-tease-${number}-v1.webp`,
      alt: 'Une antagoniste adulte triomphe avec une pose provocatrice face à une héroïne adulte indemne et entièrement vêtue.',
      quote: '« Ce siège est perdu. Pas la prochaine sortie. »',
      story: caption,
      unlockRule: { type: 'first_game_over' }
    };
  });

  const bonusScenes = [...bikiniScenes, ...pairedScenes, ...gameOverTeases];
  const contract = {
    schemaVersion: '1.0.0',
    contentVersion: '2.5.0',
    maturity: {
      minimumAge: 27,
      adultsOnly: true,
      explicitSexualActs: false,
      nudity: false,
      consentRequired: true,
      intimacyPresentation: 'before_after_fade_to_black',
      gameplayConsequencesForRefusal: false
    },
    villainCinematics,
    bonusScenes,
    categories: Object.freeze({
      all: 'Toutes les archives',
      bikini: 'Maillots',
      romance_ff: 'Romances F/F',
      afterglow: 'Après les néons',
      game_over: 'Game Over'
    })
  };

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  globalScope.INFERNAL_CITY_ADULT_SCENES = deepFreeze(contract);
})(window);
