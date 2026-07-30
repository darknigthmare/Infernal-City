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

  const heroineBodyVariantScenes = heroineSpecs.flatMap(spec => {
    const [heroId, name, age] = spec;
    const variants = [
      {
        stage: 'chubby',
        title: `${name} · Silhouette chubby`,
        subtitle: 'Chronologie plus-size · adulte 27+',
        alt: `${name} apparaît dans une variante chubby adulte, digne, autonome et entièrement vêtue.`,
        quote: '« Mon corps n’est jamais une statistique de combat. »',
        story: `Cette chronologie alternative respecte l’identité de ${name} et représente sa silhouette plus-size sans fétichisation.`
      },
      {
        stage: 'maternity',
        title: `${name} · Maternité protégée`,
        subtitle: 'Grossesse calme hors-combat · adulte 27+',
        alt: `${name}, adulte et entièrement vêtue, vit une grossesse sereine dans un espace protégé hors-combat.`,
        quote: '« Ici, le futur grandit loin des lignes de siège. »',
        story: `La maternité alternative de ${name} est montrée dans un moment calme, choisi et protégé, sans faiblesse imposée ni mise en danger.`
      },
      {
        stage: 'early-career',
        title: `${name} · Débuts de carrière`,
        subtitle: 'Premières missions · adulte de 27 ans ou plus',
        alt: `${name} au début de sa carrière, clairement adulte de 27 ans ou plus, vêtue et non sexualisée.`,
        quote: '« Mes premiers choix étaient déjà les miens. »',
        story: `Cette archive remonte aux premières missions de ${name} tout en conservant un visage et des proportions matures, clairement adultes.`
      }
    ];
    return variants.map(variant => ({
      id: `${heroId}_body_${variant.stage.replace('-', '_')}`,
      kind: 'body_variants',
      bodyVariantStage: variant.stage,
      title: variant.title,
      subtitle: variant.subtitle,
      ageLabel: `27 ans et plus · identité actuelle ${age} ans`,
      participants: [heroId],
      src: `assets/vn/cg/body-variants/heroines/${heroId}-${variant.stage}-v1.webp`,
      alt: variant.alt,
      quote: variant.quote,
      story: variant.story,
      unlockRule: { type: 'heroes_unlocked', heroIds: [heroId] }
    }));
  });

  const villainBodyVariantScenes = villainSpecs.flatMap(spec => {
    const [villainId, name] = spec;
    const variants = [
      {
        stage: 'chubby',
        title: `${name} · Silhouette chubby`,
        subtitle: 'Chronologie plus-size · adulte 27+',
        alt: `${name} apparaît dans une variante chubby adulte, digne, souveraine et entièrement vêtue.`,
        quote: '« Un Trône ne se mesure pas à une silhouette. »',
        story: `Cette chronologie préserve les traits et l’autorité de ${name} sans fétichiser sa silhouette plus-size.`
      },
      {
        stage: 'maternity',
        title: `${name} · Maternité protégée`,
        subtitle: 'Grossesse calme hors-combat · adulte 27+',
        alt: `${name}, adulte et entièrement vêtue, vit une grossesse sereine dans un sanctuaire protégé hors-combat.`,
        quote: '« Même les Enfers savent garder un sanctuaire. »',
        story: `La maternité alternative de ${name} demeure paisible et autonome, sans transformer la grossesse en vulnérabilité ou en mécanique de guerre.`
      },
      {
        stage: 'first-reign',
        title: `${name} · Premier règne`,
        subtitle: 'Première couronne · adulte de 27 ans ou plus',
        alt: `${name} lors de son premier règne, clairement adulte de 27 ans ou plus, vêtue et non sexualisée.`,
        quote: '« Ma première couronne était déjà un choix. »',
        story: `Cette archive montre le premier règne de ${name} avec un visage et des proportions matures, clairement adultes et non sexuels.`
      }
    ];
    return variants.map(variant => ({
      id: `${villainId}_body_${variant.stage.replace('-', '_')}`,
      kind: 'body_variants',
      bodyVariantStage: variant.stage,
      title: variant.title,
      subtitle: variant.subtitle,
      ageLabel: '27 ans et plus',
      participants: [villainId],
      src: `assets/vn/cg/body-variants/villains/${villainId}-${variant.stage}-v1.webp`,
      alt: variant.alt,
      quote: variant.quote,
      story: variant.story,
      unlockRule: { type: 'boss_defeated', bossId: villainId }
    }));
  });

  const bodyVariantScenes = [...heroineBodyVariantScenes, ...villainBodyVariantScenes];
  const heroineBoudoirScenes = heroineSpecs.map(spec => {
    const [heroId, name, age] = spec;
    return {
      id: `${heroId}_boudoir`,
      kind: 'boudoir',
      title: `${name} · Boudoir néon`,
      subtitle: `Portrait boudoir individuel · adulte de ${age} ans`,
      ageLabel: `${age} ans`,
      participants: [heroId],
      src: `assets/vn/cg/boudoir/heroines/${heroId}-boudoir-v1.webp`,
      alt: `${name}, adulte de ${age} ans, pose seule dans un boudoir élégant, vêtue et sans nudité.`,
      quote: '« La séance continue seulement tant que je la choisis. »',
      story: `${name} dirige elle-même cette séance boudoir individuelle. Le portrait reste sensuel, non nu et sans acte ou accessoire sexuel explicite.`,
      unlockRule: { type: 'heroes_unlocked', heroIds: [heroId] }
    };
  });

  const villainBoudoirScenes = villainSpecs.map(spec => {
    const [villainId, name, title, age] = spec;
    return {
      id: `${villainId}_boudoir`,
      kind: 'boudoir',
      title: `${name} · Boudoir du Trône`,
      subtitle: `${title} · portrait individuel adulte`,
      ageLabel: `${age} ans`,
      participants: [villainId],
      src: `assets/vn/cg/boudoir/villains/${villainId}-boudoir-v1.webp`,
      alt: `${name}, souveraine adulte, pose seule et vêtue dans un boudoir inspiré de son Trône, sans nudité.`,
      quote: '« Mon image demeure sous mon autorité. »',
      story: `${name} transforme son sanctuaire en studio boudoir souverain. Cette archive individuelle reste sensuelle, non nue et sans acte ou accessoire sexuel explicite.`,
      unlockRule: { type: 'boss_defeated', bossId: villainId }
    };
  });

  const boudoirScenes = [...heroineBoudoirScenes, ...villainBoudoirScenes];
  const bonusScenes = [
    ...bikiniScenes,
    ...pairedScenes,
    ...gameOverTeases,
    ...bodyVariantScenes,
    ...boudoirScenes
  ];
  const contract = {
    schemaVersion: '1.0.0',
    contentVersion: '2.7.0',
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
      game_over: 'Game Over',
      body_variants: 'Variantes corporelles',
      boudoir: 'Boudoirs individuels'
    })
  };

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  globalScope.INFERNAL_CITY_ADULT_SCENES = deepFreeze(contract);
})(window);
