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
    return variants.map(variant => {
      const sceneId = `${heroId}_body_${variant.stage.replace('-', '_')}`;
      const bodyRouteId = `${sceneId}_route`;
      return {
        id: sceneId,
        kind: 'body_variants',
        bodyVariantStage: variant.stage,
        bodyRouteId,
        title: variant.title,
        subtitle: variant.subtitle,
        ageLabel: `27 ans et plus · identité actuelle ${age} ans`,
        participants: [heroId],
        src: `assets/vn/cg/body-variants/heroines/${heroId}-${variant.stage}-v1.webp`,
        alt: variant.alt,
        quote: variant.quote,
        story: variant.story,
        routeUnlockRule: { type: 'heroes_unlocked', heroIds: [heroId] },
        unlockRule: { type: 'body_route_completed', routeId: bodyRouteId }
      };
    });
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
    return variants.map(variant => {
      const sceneId = `${villainId}_body_${variant.stage.replace('-', '_')}`;
      const bodyRouteId = `${sceneId}_route`;
      return {
        id: sceneId,
        kind: 'body_variants',
        bodyVariantStage: variant.stage,
        bodyRouteId,
        title: variant.title,
        subtitle: variant.subtitle,
        ageLabel: '27 ans et plus',
        participants: [villainId],
        src: `assets/vn/cg/body-variants/villains/${villainId}-${variant.stage}-v1.webp`,
        alt: variant.alt,
        quote: variant.quote,
        story: variant.story,
        routeUnlockRule: { type: 'boss_defeated', bossId: villainId },
        unlockRule: { type: 'body_route_completed', routeId: bodyRouteId }
      };
    });
  });

  const bodyVariantScenes = [...heroineBodyVariantScenes, ...villainBodyVariantScenes];
  const bodyRouteFlavorSpecs = [
    ['nyx', 'heroines', 'Nyx Circuit', 'Ronin des Néons', 30, 'nyx-circuit', 'relais radio privé', 'un éclat de son premier implant', 'la nuit où elle refusa de vendre une mémoire'],
    ['aurelia', 'heroines', 'Aurelia Brassheart', 'Maréchale des Engrenages', 36, 'aurelia-brassheart', 'serre de cuivre', 'une montre sans aiguille militaire', 'son premier atelier libéré d’un contrat de guerre'],
    ['maris', 'heroines', 'Capitaine Maris Blacktide', 'Corsaire de la Marée Noire', 33, 'maris-blacktide', 'cabine des cartes', 'une boussole à deux clés', 'la mutinerie où elle choisit son propre équipage'],
    ['zahra', 'heroines', 'Zahra des Mille-Ciels', 'Princesse des Dunes Stellaires', 28, 'zahra-mille-ciels', 'jardin suspendu', 'une lanterne de sa première caravane', 'le jour où elle ouvrit les portes du palais sans ordre royal'],
    ['mircalla', 'heroines', 'Mircalla Dollheart', 'Gothic Lolita adulte', 29, 'mircalla-dollheart', 'atelier de poupées mécaniques', 'un ruban noir cousu de sa main', 'sa première création signée de son vrai nom'],
    ['isolde', 'heroines', 'Isolde Mourne', 'Cantatrice du Dernier Chœur', 35, 'isolde-mourne', 'chapelle acoustique', 'une partition restée inachevée', 'le concert où elle transforma un deuil en voix'],
    ['hana', 'heroines', 'Hana Kurogane', 'Samouraï des Sept Coupes', 32, 'hana-kurogane', 'dojo sous la pluie', 'une garde de sabre fendue', 'le duel adulte où elle refusa un maître injuste'],
    ['freyja', 'heroines', 'Freyja Rimeborne', 'Reine des Glaces Industrielles', 38, 'freyja-rimeborne', 'forge cryogénique', 'un cristal de sa première tempête', 'l’hiver où elle protégea les ouvrières plutôt que la couronne'],
    ['vega', 'heroines', 'Vega Solari', 'Paladine Héliotech', 31, 'vega-solari', 'observatoire solaire', 'un prisme terni de l’académie', 'la mission où elle désobéit pour sauver une colonie'],
    ['amara', 'heroines', 'Amara Verdigris', 'Alchimiste Biopunk', 34, 'amara-verdigris', 'jardin bioluminescent', 'une capsule de sa première culture', 'l’expérience qu’elle arrêta pour préserver une vie'],
    ['xyra', 'villains', 'Xyra Bioforge', 'Démone Biomécanique', 214, 'xyra-bioforge', 'sanctuaire bioforgé', 'un fragment de châssis originel', 'le premier ordre auquel elle opposa sa propre volonté'],
    ['ossuary', 'villains', 'Lady Ossuary', 'Maîtresse Squelette', 487, 'lady-ossuary', 'galerie des ossements paisibles', 'une clé d’ivoire de son premier caveau', 'le jugement où elle accorda le repos contre l’avis de sa cour'],
    ['nhalzara', 'villains', 'Nhal’Zara', 'Impératrice du Vide', 1200, 'nhal-zara', 'observatoire du vide', 'un éclat d’une étoile éteinte', 'la première frontière qu’elle choisit de ne pas engloutir'],
    ['astarra', 'villains', 'Astarra Infernale', 'Reine des Enfers', 666, 'astarra-infernal', 'palais des braises calmes', 'un sceau de sa première couronne', 'le règne où elle imposa une loi de refuge aux Enfers'],
    ['umbrael', 'villains', 'Umbrael Shadow', 'Maîtresse des Ombres', 308, 'umbrael-shadow', 'bibliothèque sans soleil', 'un miroir noir de son apprentissage', 'la nuit où elle cessa d’être l’ombre d’une autre'],
    ['pestifera', 'villains', 'Pestifera', 'Duchesse des Pestes', 531, 'pestifera', 'orangerie de quarantaine', 'une fiole scellée de son premier remède', 'l’épidémie où elle choisit de soigner avant de régner'],
    ['vexara', 'villains', 'Vexara Dreadtide', 'Amirale de l’Abîme', 402, 'vexara-dreadtide', 'pont de l’amiral', 'un compas abyssal cabossé', 'la traversée où elle ramena tout son équipage'],
    ['kalix', 'villains', 'Kali-X', 'Dominatrice Quantique', 289, 'kali-x', 'chambre de calcul silencieuse', 'un cube logique devenu imprévisible', 'l’équation où elle conserva une variable libre'],
    ['malika', 'villains', 'Malika Ash-Djinn', 'Sultane des Cendres', 904, 'malika-ash-djinn', 'cour des vents de cendre', 'un bracelet de verre volcanique', 'le pacte où elle libéra les voix enfermées dans une lampe'],
    ['noctis', 'villains', 'Madame Noctis', 'Tisseuse de Cauchemars', 777, 'madame-noctis', 'salon des rêves lucides', 'une bobine de son premier songe', 'le cauchemar qu’elle transforma en porte de sortie']
  ];
  const bodyRouteVoiceById = {
    nyx: 'Une mémoire choisie vaut davantage que toutes les versions que les mégacorps ont voulu écrire pour moi.',
    aurelia: 'Je règle mes propres horloges ; aucune campagne ne décidera du rythme de ma vie.',
    maris: 'Un cap libre n’a pas besoin de l’approbation d’un empire pour être juste.',
    zahra: 'Je peux ouvrir un palais, une caravane ou un avenir sans devenir la propriété d’une cour.',
    mircalla: 'Je signe chaque création de mon vrai nom, y compris la personne que je choisis de devenir.',
    isolde: 'Ma voix peut porter le deuil sans lui céder toute la scène.',
    hana: 'La discipline que je conserve est celle que j’ai examinée et choisie.',
    freyja: 'Une couronne ne vaut rien si elle exige que je sacrifie celles qu’elle prétend protéger.',
    vega: 'La lumière guide seulement tant qu’elle n’aveugle pas la volonté de celles qu’elle éclaire.',
    amara: 'Toute transformation digne commence par le droit de l’arrêter.',
    xyra: 'Je ne suis ni un châssis à corriger ni une commande à exécuter.',
    ossuary: 'Le repos que j’accorde aux autres doit aussi pouvoir m’appartenir.',
    nhalzara: 'Même le Vide connaît la frontière que je choisis de ne pas franchir.',
    astarra: 'Une souveraine des Enfers peut promulguer le refuge sans rendre sa couronne plus faible.',
    umbrael: 'Je décide quand l’ombre protège, quand elle révèle et quand elle s’efface.',
    pestifera: 'Le soin demeure un choix de puissance, jamais une dette imposée.',
    vexara: 'Je ne nomme victoire aucun voyage qui abandonne son équipage.',
    kalix: 'Toute équation qui prétend me définir gardera au moins une variable libre.',
    malika: 'Un pacte juste rend les voix au lieu de les enfermer.',
    noctis: 'Un cauchemar peut devenir une sortie dès que la rêveuse reprend le fil.'
  };
  const bodyRouteProfiles = Object.fromEntries(bodyRouteFlavorSpecs.map(spec => {
    const [id, group, name, title, age, slug, sanctuary, keepsake, origin] = spec;
    return [id, {
      id,
      group,
      name,
      title,
      age,
      sanctuary,
      keepsake,
      origin,
      voice: bodyRouteVoiceById[id],
      portraitSrc: `assets/characters/${group}/${slug}-portrait-v1.webp`
    }];
  }));

  function bodyRouteLine(speaker, text, mood = 'neutral') {
    return { speaker, text, mood };
  }

  function getBodyRouteCopy(scene, profile) {
    if (scene.bodyVariantStage === 'chubby') {
      return {
        type: 'chubby',
        title: 'Se choisir entière',
        subtitle: 'Route VN · chronologie plus-size adulte',
        summary: `${profile.name}, adulte de ${profile.age} ans, explore une chronologie où sa silhouette chubby n’est ni un obstacle ni une statistique.`,
        subject: 'sa silhouette plus-size',
        firstDecision: 'le moment où elle cessa de corriger son corps pour satisfaire une archive',
        transition: 'plusieurs saisons de repos, de travail et de vie choisie',
        reveal: 'une silhouette chubby adulte, stable, digne et entièrement vêtue'
      };
    }
    if (scene.bodyVariantStage === 'maternity') {
      return {
        type: 'maternity',
        title: 'L’avenir protégé',
        subtitle: 'Route VN · maternité adulte hors-combat',
        summary: `${profile.name}, adulte de ${profile.age} ans, ouvre une chronologie future où une grossesse choisie évolue dans un sanctuaire sûr.`,
        subject: 'son avenir de maternité',
        firstDecision: 'la décision de construire un futur qui n’appartient ni à une armée ni à un Trône',
        transition: 'plusieurs mois de soins, d’autonomie et de protection hors-combat',
        reveal: 'une grossesse adulte sereine, autonome et entièrement vêtue'
      };
    }
    return {
      type: 'young-adult-memory',
      title: scene.bodyVariantStage === 'first-reign' ? 'La première couronne' : 'Les premières missions',
      subtitle: 'Flash-back VN · jeunes années clairement adultes 27+',
      summary: `${profile.name} reconstruit un souvenir de ses jeunes années adultes, daté après ses 27 ans révolus.`,
      subject: scene.bodyVariantStage === 'first-reign' ? 'son premier règne adulte' : 'ses débuts de carrière adultes',
      firstDecision: profile.origin,
      transition: 'un retour d’archive vers ses 27 ans révolus, sans rajeunissement mineur',
      reveal: scene.bodyVariantStage === 'first-reign'
        ? 'sa première couronne, portée avec un visage et des proportions clairement adultes'
        : 'sa première tenue de mission, portée avec un visage et des proportions clairement adultes'
    };
  }

  function buildBodyRouteNodes(scene, profile, copy) {
    const openingLines = [
      bodyRouteLine('narrator', `Les Archives de Haven isolent une nouvelle route. Son décor reproduit « ${profile.sanctuary} ».`, 'atmosphere'),
      bodyRouteLine('narrator', copy.summary, 'reflective'),
      bodyRouteLine('hero', `« Cette route parle de ${copy.subject}. Je veux choisir moi-même comment elle sera racontée. »`, 'firm'),
      bodyRouteLine('player', '« Tu peux interrompre la lecture à tout instant. Rien ici ne modifiera le combat, notre alliance ou notre relation. »', 'supportive'),
      bodyRouteLine('hero', '« Alors nous avançons comme témoins, jamais comme propriétaires de cette version de moi. »', 'resolved'),
      bodyRouteLine('narrator', `Elle pose devant elle ${profile.keepsake}, seul repère matériel autorisé dans la reconstruction.`, 'memory'),
      bodyRouteLine('hero', `« Le point de départ est ${copy.firstDecision}. Ce choix était déjà le mien. »`, 'reflective'),
      bodyRouteLine('narrator', 'Trois perspectives apparaissent. Aucune n’est présentée comme meilleure ou plus désirable que les autres.', 'safe')
    ];
    const autonomyLines = [
      bodyRouteLine('player', '« Commençons par ta voix, sans commentaire extérieur sur ton corps ou ton rang. »', 'respectful'),
      bodyRouteLine('hero', `« ${profile.voice} Je ne demande pas à être validée ; je demande que ma décision soit conservée exactement. »`, 'firm'),
      bodyRouteLine('narrator', `${profile.name} décrit les habitudes quotidiennes qui ont rendu cette chronologie habitable.`, 'reflective'),
      bodyRouteLine('hero', `« Dans cet espace — ${profile.sanctuary} — je pouvais enfin distinguer ce que je voulais de ce qu’on attendait de moi. »`, 'soft'),
      bodyRouteLine('player', '« L’archive notera ton autonomie avant de noter ton apparence. »', 'supportive'),
      bodyRouteLine('hero', '« Et elle ne transformera jamais cette apparence en récompense, faiblesse ou permission. »', 'resolved'),
      bodyRouteLine('narrator', 'La route retient cette formulation et rejoint le nœud de réflexion.', 'memory')
    ];
    const loreLines = [
      bodyRouteLine('player', `« Que raconte ${profile.keepsake} que le portrait final ne pourrait pas dire ? »`, 'curious'),
      bodyRouteLine('hero', '« Il prouve que cette histoire a commencé par une décision, pas par le regard d’une autre personne. »', 'reflective'),
      bodyRouteLine('narrator', `Le souvenir revient à ${profile.origin}.`, 'memory'),
      bodyRouteLine('hero', '« Ce jour-là, j’étais adulte, informée, et libre de prendre une autre direction. »', 'firm'),
      bodyRouteLine('player', '« Nous garderons aussi les hésitations, sans les transformer en faute. »', 'supportive'),
      bodyRouteLine('hero', '« Garde surtout la sortie. Une route sans sortie devient un ordre. »', 'resolved'),
      bodyRouteLine('narrator', 'La relique se change en balise et rejoint le nœud de réflexion.', 'memory')
    ];
    const witnessLines = [
      bodyRouteLine('player', '« Qui souhaites-tu comme témoin de cette chronologie ? »', 'respectful'),
      bodyRouteLine('hero', '« Des personnes capables de voir cette chronologie sans décider à ma place de ce qu’elle signifie. »', 'firm'),
      bodyRouteLine('narrator', `Les lumières associées à « ${profile.sanctuary} » dessinent un cercle ouvert plutôt qu’une scène de jugement.`, 'atmosphere'),
      bodyRouteLine('hero', '« Je peux partager cette image et conserver pourtant le droit de la refermer. »', 'resolved'),
      bodyRouteLine('player', '« Le consentement à l’archive vaut pour l’archive, pas pour ton corps ni pour une relation. »', 'supportive'),
      bodyRouteLine('hero', '« Exactement. Cette limite doit rester visible jusque dans la conclusion. »', 'relieved'),
      bodyRouteLine('narrator', 'Le cercle reste ouvert et rejoint le nœud de réflexion.', 'memory')
    ];
    const reflectionLines = [
      bodyRouteLine('narrator', `La route traverse ${copy.transition}.`, 'transition'),
      bodyRouteLine('narrator', 'Les batailles restent hors cadre : cette chronologie concerne une vie, pas une mécanique de puissance.', 'safe'),
      bodyRouteLine('hero', `« Je reconnais ${copy.subject}, mais je veux encore décider du cadrage final. »`, 'checking'),
      bodyRouteLine('player', '« Portrait privé, archive complète ou symbole transmis : les trois options restent réversibles jusqu’à la validation. »', 'respectful'),
      bodyRouteLine('hero', '« Et aucune ne changera mes statistiques, ma valeur ou mon accès aux missions. »', 'firm'),
      bodyRouteLine('narrator', `Le système confirme : ${copy.reveal}.`, 'reveal'),
      bodyRouteLine('narrator', 'La dernière décision concerne uniquement la manière de conserver ce souvenir.', 'safe')
    ];
    const makeClosingLines = ending => [
      bodyRouteLine('hero', ending === 'private'
        ? '« Je choisis un portrait privé, accessible seulement depuis mes archives. »'
        : ending === 'complete'
          ? '« Je choisis l’image entière, sans recadrage destiné à rendre mon corps plus acceptable. »'
          : '« Je choisis de transmettre ce souvenir comme une preuve d’autonomie. »', 'resolved'),
      bodyRouteLine('player', '« La décision est enregistrée. Tu peux toujours fermer la route avant sa révélation. »', 'respectful'),
      bodyRouteLine('narrator', `${profile.name} relit chaque annotation, puis retire toutes celles qui prétendaient interpréter son choix.`, 'reflective'),
      bodyRouteLine('hero', `« Je valide cette route vers ${copy.reveal}. »`, 'firm'),
      bodyRouteLine('narrator', 'Le verrou narratif se lève sans accorder monnaie, expérience, confiance ou avantage militaire.', 'safe'),
      bodyRouteLine('hero', '« Cette image est une fin possible, pas une forme supérieure aux autres. »', 'resolved'),
      bodyRouteLine('narrator', `La CG « ${scene.title} » rejoint maintenant les Archives Sensuelles.`, 'reveal')
    ];

    return [
      { id: 'opening', kind: 'dialogue', lines: openingLines, nextNode: 'perspective-choice' },
      {
        id: 'perspective-choice',
        kind: 'choice',
        prompt: 'Quelle perspective doit guider cette route individuelle ?',
        options: [
          { id: 'autonomy', label: 'Écouter sa propre définition, sans jugement extérieur', nextNode: 'path-autonomy' },
          { id: 'lore', label: `Explorer le souvenir lié à ${profile.keepsake}`, nextNode: 'path-lore' },
          { id: 'witness', label: 'Définir qui peut témoigner sans interpréter à sa place', nextNode: 'path-witness' }
        ]
      },
      { id: 'path-autonomy', kind: 'dialogue', lines: autonomyLines, nextNode: 'reflection' },
      { id: 'path-lore', kind: 'dialogue', lines: loreLines, nextNode: 'reflection' },
      { id: 'path-witness', kind: 'dialogue', lines: witnessLines, nextNode: 'reflection' },
      { id: 'reflection', kind: 'dialogue', lines: reflectionLines, nextNode: 'archive-choice' },
      {
        id: 'archive-choice',
        kind: 'choice',
        prompt: 'Comment cette chronologie adulte doit-elle être conservée ?',
        options: [
          { id: 'private', label: 'Comme un portrait privé sous son seul contrôle', nextNode: 'ending-private' },
          { id: 'complete', label: 'Comme une archive complète, sans recadrage normatif', nextNode: 'ending-complete' },
          { id: 'legacy', label: 'Comme un symbole d’autonomie transmis à Haven', nextNode: 'ending-legacy' }
        ]
      },
      { id: 'ending-private', kind: 'dialogue', lines: makeClosingLines('private'), end: true },
      { id: 'ending-complete', kind: 'dialogue', lines: makeClosingLines('complete'), end: true },
      { id: 'ending-legacy', kind: 'dialogue', lines: makeClosingLines('legacy'), end: true }
    ];
  }

  const bodyRoutes = bodyVariantScenes.map(scene => {
    const [participantId] = scene.participants;
    const profile = bodyRouteProfiles[participantId];
    const copy = getBodyRouteCopy(scene, profile);
    return {
      id: scene.bodyRouteId,
      sceneId: scene.id,
      participantId,
      participantName: profile.name,
      participantTitle: profile.title,
      participantGroup: profile.group,
      participantAge: profile.age,
      minimumSceneAge: 27,
      isAdultAtScene: true,
      sexualContent: false,
      romanceRequired: false,
      variantStage: scene.bodyVariantStage,
      title: copy.title,
      subtitle: copy.subtitle,
      summary: copy.summary,
      portraitSrc: profile.portraitSrc,
      unlockRule: scene.routeUnlockRule,
      initialNode: 'opening',
      choicesRequired: 2,
      nodes: buildBodyRouteNodes(scene, profile, copy)
    };
  });

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
  const privateRitualStageSpecs = [
    {
      stage: 'before',
      numeral: 'I',
      stageLabel: 'Avant · anticipation',
      subtitle: ageLabel => `Anticipation boudoir · adulte de ${ageLabel}`,
      alt: (name, ageLabel) => `${name}, adulte de ${ageLabel}, prépare seule une parenthèse de détente dans une tenue opaque et couvrante, avec un objet personnel non sexuel.`,
      quote: '« Je ferme la porte, je choisis la lumière et je garde la maîtrise du moment. »',
      story: name => `${name} prépare elle-même une pause privée : lumière tamisée, objet personnel et tenue de détente entièrement couvrante. Aucun acte ni accessoire sexuel n’est représenté ou suggéré.`
    },
    {
      stage: 'ellipsis',
      numeral: 'II',
      stageLabel: 'Ellipse · pause hors champ',
      subtitle: () => 'Fondu abstrait · pièce vide et temps suspendu',
      alt: name => `Le boudoir de ${name} demeure vide dans un fondu presque noir, traversé uniquement par des impulsions de lumière abstraites.`,
      quote: '« Le temps privé reste privé. »',
      story: () => 'La personne quitte entièrement le cadre. Le fondu presque noir et les pulsations de néon indiquent seulement une ellipse temporelle, sans corps, son sexuel ou activité intime.'
    },
    {
      stage: 'after',
      numeral: 'III',
      stageLabel: 'Après · retour au calme',
      subtitle: ageLabel => `Retour au calme · adulte de ${ageLabel}`,
      alt: (name, ageLabel) => `${name}, adulte de ${ageLabel}, revient seule, sereine et entièrement vêtue après une pause personnelle hors champ.`,
      quote: '« Cette pause m’appartenait ; je reviens quand je le décide. »',
      story: name => `${name} apparaît reposée et satisfaite de ce temps de détente. Sa tenue reste opaque et fermée, son objet personnel est rangé et aucun détail sexuel ou fluide n’est montré.`
    }
  ];

  function buildPrivateRitualScenes(specs, group) {
    return specs.flatMap(spec => {
      const [participantId, name, third, fourth] = spec;
      const age = group === 'heroines' ? third : fourth;
      const ageLabel = `${age} ans`;
      const sequenceId = `${participantId}_private_ritual`;
      const unlockRule = group === 'heroines'
        ? { type: 'heroes_unlocked', heroIds: [participantId] }
        : { type: 'boss_defeated', bossId: participantId };

      return privateRitualStageSpecs.map((stageSpec, sequenceIndex) => ({
        id: `${participantId}_private_ritual_${stageSpec.stage}`,
        kind: 'private_ritual',
        title: `${name} · Parenthèse privée ${stageSpec.numeral}`,
        subtitle: stageSpec.subtitle(ageLabel),
        ageLabel,
        participants: [participantId],
        src: `assets/vn/cg/private-ritual/${group}/${participantId}-ritual-${stageSpec.stage}-v1.webp`,
        alt: stageSpec.alt(name, ageLabel),
        quote: stageSpec.quote,
        story: stageSpec.story(name),
        sequenceId,
        sequenceIndex,
        sequenceLength: privateRitualStageSpecs.length,
        sequenceStage: stageSpec.stage,
        sequenceStageLabel: stageSpec.stageLabel,
        unlockRule
      }));
    });
  }

  const privateRitualScenes = [
    ...buildPrivateRitualScenes(heroineSpecs, 'heroines'),
    ...buildPrivateRitualScenes(villainSpecs, 'villains')
  ];

  function createErosPartnerGroup(members) {
    return {
      count: members.length,
      minimumAge: 28,
      members: members.map(member => ({
        id: member[0],
        title: member[1],
        age: member[2],
        gender: 'man',
        isAdult: true,
        autonomous: true
      })),
      relationship: 'independent_peers',
      consent: 'affirmed_revocable',
      canLeaveFreely: true
    };
  }

  const erosTimeProfiles = [
    {
      id: 'nyx', group: 'heroines', name: 'Nyx Circuit', age: 30,
      setting: 'relais privé sous la pluie néon',
      palette: 'noir, cyan, magenta et chrome',
      partnerGroup: createErosPartnerGroup([
        ['data-courier', 'coursier de données indépendant', 31],
        ['ethical-neurotech', 'neurotechnicien éthique', 38],
        ['corp-whistleblower', 'lanceur d’alerte ex-corporatiste', 34]
      ])
    },
    {
      id: 'aurelia', group: 'heroines', name: 'Aurelia Brassheart', age: 36,
      setting: 'serre mécanique de cuivre',
      palette: 'cuivre, laiton, vert-de-gris et crème',
      partnerGroup: createErosPartnerGroup([
        ['airship-captain', 'capitaine d’aérostat indépendant', 42],
        ['clockmaker', 'maître horloger indépendant', 39],
        ['cooperative-boilermaker', 'chaudronnier coopératif', 45],
        ['botanical-automata-designer', 'créateur d’automates botaniques', 36]
      ])
    },
    {
      id: 'maris', group: 'heroines', name: 'Capitaine Maris Blacktide', age: 33,
      setting: 'salon neutre d’un port franc stellaire',
      palette: 'bleu nuit, bordeaux, or terni et violet',
      partnerGroup: createErosPartnerGroup([
        ['rival-corsair-captain', 'capitaine corsaire rival', 44],
        ['abyssal-archaeologist', 'archéologue abyssal', 37],
        ['void-diver', 'plongeur du vide indépendant', 35],
        ['stellar-tide-navigator', 'navigateur des marées stellaires', 41],
        ['free-port-mediator', 'médiateur du port franc', 39]
      ])
    },
    {
      id: 'zahra', group: 'heroines', name: 'Zahra des Mille-Ciels', age: 28,
      setting: 'jardin suspendu sous trois lunes',
      palette: 'ambre, indigo, turquoise et or',
      partnerGroup: createErosPartnerGroup([
        ['caravan-astronomer', 'astronome caravanier', 34],
        ['windship-pilot', 'pilote de nef des vents', 32],
        ['free-cartographer', 'conteur-cartographe libre', 36]
      ])
    },
    {
      id: 'mircalla', group: 'heroines', name: 'Mircalla Dollheart', age: 29,
      setting: 'salon de porcelaine noire',
      palette: 'noir, ivoire, lie-de-vin et mauve',
      partnerGroup: createErosPartnerGroup([
        ['egl-photographer', 'photographe EGL adulte indépendant', 33],
        ['porcelain-artisan', 'artisan de porcelaine mécanique', 40]
      ])
    },
    {
      id: 'isolde', group: 'heroines', name: 'Isolde Mourne', age: 35,
      setting: 'loge d’opéra restaurée avant l’aube',
      palette: 'noir, prune, argent et or de bougie',
      partnerGroup: createErosPartnerGroup([
        ['guest-conductor', 'chef d’orchestre invité', 48],
        ['independent-baritone', 'baryton indépendant', 39],
        ['opera-restorer', 'architecte-restaurateur', 43],
        ['music-archivist', 'archiviste musical', 36]
      ])
    },
    {
      id: 'hana', group: 'heroines', name: 'Hana Kurogane', age: 32,
      setting: 'pavillon lunaire au cœur d’un jardin de chrome',
      palette: 'pourpre chromé, noir d’encre, blanc lunaire et rouge',
      partnerGroup: createErosPartnerGroup([
        ['peer-ronin', 'ronin de rang égal', 37],
        ['free-tea-master', 'maître de thé indépendant', 44],
        ['pacifist-envoy', 'pacifiste d’ambassade', 33]
      ])
    },
    {
      id: 'freyja', group: 'heroines', name: 'Freyja Rimeborne', age: 38,
      setting: 'refuge chaleureux au cœur du blizzard',
      palette: 'cyan glacé, acier, ambre et charbon',
      partnerGroup: createErosPartnerGroup([
        ['rival-jarl', 'jarl rival', 46],
        ['cryoforge-engineer', 'ingénieur cryoforge', 40],
        ['polar-pilot', 'pilote polaire indépendant', 35],
        ['steelworkers-delegate', 'délégué sidérurgiste', 42],
        ['free-skald', 'skald libre', 38],
        ['glacial-doctor', 'médecin glaciaire', 50]
      ])
    },
    {
      id: 'vega', group: 'heroines', name: 'Vega Solari', age: 31,
      setting: 'observatoire privé pendant une éclipse',
      palette: 'blanc-or, orange solaire, cobalt et noir spatial',
      partnerGroup: createErosPartnerGroup([
        ['peer-solar-knight', 'chevalier solaire de rang égal', 34],
        ['civil-heliophysicist', 'héliophysicien civil', 37]
      ])
    },
    {
      id: 'amara', group: 'heroines', name: 'Amara Verdigris', age: 34,
      setting: 'jardin bioluminescent sécurisé',
      palette: 'vert-de-gris, émeraude, chartreuse et bronze',
      partnerGroup: createErosPartnerGroup([
        ['botany-ethicist', 'éthicien botanique', 41],
        ['biodesign-engineer', 'ingénieur biodesign indépendant', 36],
        ['clinic-herbalist', 'herboriste de clinique', 45],
        ['ecotectural-sculptor', 'sculpteur écotectural', 32]
      ])
    },
    {
      id: 'xyra', group: 'villains', name: 'Xyra Bioforge', age: 214,
      setting: 'sanctuaire bioforgé autonome',
      palette: 'rose incandescent, métal noir, cyan et rouge',
      partnerGroup: createErosPartnerGroup([
        ['emancipated-cyborg', 'vétéran cyborg émancipé', 42],
        ['neural-architect', 'architecte neural indépendant', 49],
        ['chassis-artist', 'artiste de châssis autonome', 57],
        ['synth-rights-envoy', 'envoyé des droits synthétiques', 61]
      ])
    },
    {
      id: 'ossuary', group: 'villains', name: 'Lady Ossuary', age: 487,
      setting: 'galerie paisible d’ossements sculptés',
      palette: 'ivoire, blanc os, sang-de-bœuf et noir',
      partnerGroup: createErosPartnerGroup([
        ['autonomous-revenant', 'chevalier revenant autonome', 310],
        ['funerary-anatomist', 'anatomiste funéraire', 52],
        ['ethical-ivory-conservator', 'conservateur d’ivoire éthique', 47]
      ])
    },
    {
      id: 'nhalzara', group: 'villains', name: 'Nhal’Zara', age: 1200,
      setting: 'observatoire au bord du Vide',
      palette: 'violet, noir absolu, cyan stellaire et argent',
      partnerGroup: createErosPartnerGroup([
        ['space-observer', 'observateur spatial', 55],
        ['void-pilot', 'pilote du Vide indépendant', 38],
        ['boundary-physicist', 'physicien des frontières', 47],
        ['cosmic-monk', 'moine cosmique libre', 60],
        ['singularity-historian', 'historien des singularités', 41],
        ['time-traveler', 'voyageur temporel autonome', 44]
      ])
    },
    {
      id: 'astarra', group: 'villains', name: 'Astarra Infernale', age: 666,
      setting: 'palais de braises calmes',
      palette: 'orange braise, cramoisi, obsidienne et or',
      partnerGroup: createErosPartnerGroup([
        ['rival-archduke', 'archiduc infernal rival', 700],
        ['free-hellsmith', 'forgeron infernal libre', 180],
        ['pact-jurist', 'juriste indépendant des pactes', 94],
        ['obsidian-harpist', 'harpiste d’obsidienne', 79],
        ['volcanic-explorer', 'explorateur volcanique', 126]
      ])
    },
    {
      id: 'umbrael', group: 'villains', name: 'Umbrael Shadow', age: 308,
      setting: 'bibliothèque sans soleil',
      palette: 'indigo, noir, violet fumé et argent',
      partnerGroup: createErosPartnerGroup([
        ['night-watcher', 'veilleur nocturne indépendant', 35],
        ['occult-archivist', 'archiviste occultiste', 46]
      ])
    },
    {
      id: 'pestifera', group: 'villains', name: 'Pestifera', age: 531,
      setting: 'orangerie de quarantaine purifiée',
      palette: 'vert acide, ambre, bronze sombre et crème',
      partnerGroup: createErosPartnerGroup([
        ['quarantine-doctor', 'médecin de quarantaine', 52],
        ['epidemic-ecologist', 'écologue épidémique', 45],
        ['antidote-alchemist', 'alchimiste d’antidotes', 39],
        ['mask-maker', 'créateur de masques indépendant', 48]
      ])
    },
    {
      id: 'vexara', group: 'villains', name: 'Vexara Dreadtide', age: 402,
      setting: 'salon d’un port franc abyssal',
      palette: 'cyan abyssal, bleu marine, or rouillé et violet',
      partnerGroup: createErosPartnerGroup([
        ['rival-abyssal-captain', 'capitaine abyssal rival', 423],
        ['wreck-salvager', 'récupérateur d’épaves indépendant', 38],
        ['trench-hydrographer', 'hydrographe des fosses', 44],
        ['free-corsair', 'corsaire indépendant', 36],
        ['ocean-magic-theorist', 'théoricien des magies océanes', 52],
        ['free-port-negotiator', 'négociateur de port libre', 47]
      ])
    },
    {
      id: 'kalix', group: 'villains', name: 'Kali-X', age: 289,
      setting: 'chambre de calcul silencieuse',
      palette: 'rose électrique, bleu photon, noir et blanc',
      partnerGroup: createErosPartnerGroup([
        ['quantum-logician', 'logicien quantique', 41],
        ['chrono-racer', 'pilote chrono-racer indépendant', 35],
        ['synth-personhood-jurist', 'juriste de la personne synthétique', 48]
      ])
    },
    {
      id: 'malika', group: 'villains', name: 'Malika Ash-Djinn', age: 904,
      setting: 'cour des vents de cendre',
      palette: 'ambre, gris fumée, turquoise et rubis',
      partnerGroup: createErosPartnerGroup([
        ['free-djinn', 'djinn libre', 330],
        ['volcanic-glassblower', 'souffleur de verre volcanique', 42],
        ['storm-guide', 'guide des tempêtes indépendant', 58],
        ['airship-envoy', 'émissaire de nef aérienne', 47],
        ['ember-poet', 'poète des braises', 36]
      ])
    },
    {
      id: 'noctis', group: 'villains', name: 'Madame Noctis', age: 777,
      setting: 'salon des rêves lucides aux sorties visibles',
      palette: 'violet profond, bleu minuit, argent et rose sombre',
      partnerGroup: createErosPartnerGroup([
        ['lucid-dreamer', 'rêveur lucide autonome', 38],
        ['sleep-neurologist', 'neurologue du sommeil', 45],
        ['oneiric-artist', 'artiste onirique indépendant', 34],
        ['dream-cartographer', 'cartographe des songes', 51]
      ])
    }
  ];

  const erosTimeStageSpecs = [
    {
      stage: 'prelude',
      numeral: 'I',
      stageLabel: 'Prélude · tension consentie',
      subtitle: count => `Éros Time · prélude avec ${count} hommes adultes`,
      alt: (profile, count) => `${profile.name}, adulte de ${profile.age} ans, échange des regards complices avec exactement ${count} hommes adultes et indépendants dans le décor « ${profile.setting} »; tous restent entièrement vêtus.`,
      quote: '« Les limites sont dites, le oui reste révocable et chaque porte demeure ouverte. »',
      story: (profile, count) => `${profile.name} accueille ${count} pairs autonomes dans le décor « ${profile.setting} ». Tous confirment leurs limites et leur liberté de partir avant que la conversation ne devienne plus intime hors champ.`,
      visiblePeople: profile => profile.partnerGroup.count + 1,
      peopleVisible: true
    },
    {
      stage: 'ellipsis',
      numeral: 'II',
      stageLabel: 'Ellipse · intimité hors champ',
      subtitle: () => 'Éros Time · pièce vide et intimité non montrée',
      alt: profile => `Le décor « ${profile.setting} » de ${profile.name} est entièrement vide; aucune personne, silhouette ou réflexion n’apparaît pendant l’ellipse.`,
      quote: '« Ce qui devient intime reste entièrement hors cadre. »',
      story: profile => `Le décor « ${profile.setting} » demeure vide derrière une porte opaque tandis que les lumières baissent. Cette ellipse temporelle suggère seulement une intimité privée, sans montrer de personne, de corps, de son sexuel ou d’activité.`,
      visiblePeople: () => 0,
      peopleVisible: false
    },
    {
      stage: 'return',
      numeral: 'III',
      stageLabel: 'Retour · complicité apaisée',
      subtitle: count => `Éros Time · retour couvert avec ${count} hommes adultes`,
      alt: (profile, count) => `${profile.name}, adulte de ${profile.age} ans, retrouve exactement ${count} hommes adultes autour d’eau ou de thé; tous portent des tenues opaques et fermées.`,
      quote: '« On se retrouve, on vérifie que chacun va bien, puis chacun choisit la suite. »',
      story: (profile, count) => `${profile.name} et ses ${count} partenaires réapparaissent entièrement couverts dans le décor « ${profile.setting} ». Ils partagent de l’eau, du thé et une conversation calme; aucun détail intime n’est montré.`,
      visiblePeople: profile => profile.partnerGroup.count + 1,
      peopleVisible: true
    }
  ];

  const erosTimeScenes = erosTimeProfiles.flatMap(profile => {
    const sequenceId = `${profile.id}_eros_time`;
    const unlockRule = profile.group === 'heroines'
      ? { type: 'heroes_unlocked', heroIds: [profile.id] }
      : { type: 'boss_defeated', bossId: profile.id };

    return erosTimeStageSpecs.map((stageSpec, sequenceIndex) => ({
      id: `${profile.id}_eros_time_${stageSpec.stage}`,
      kind: 'eros_time',
      archiveScope: 'adult_only',
      listedInArchive: sequenceIndex === 0,
      title: `${profile.name} · Éros Time ${stageSpec.numeral}`,
      subtitle: stageSpec.subtitle(profile.partnerGroup.count),
      ageLabel: `${profile.age} ans · partenaires 28 ans et plus`,
      participants: [profile.id],
      src: `assets/vn/cg/eros-time/${profile.group}/${profile.id}-eros-${stageSpec.stage}-v1.webp`,
      alt: stageSpec.alt(profile, profile.partnerGroup.count),
      quote: stageSpec.quote,
      story: stageSpec.story(profile, profile.partnerGroup.count),
      setting: profile.setting,
      palette: profile.palette,
      partnerGroup: profile.partnerGroup,
      visiblePeople: stageSpec.visiblePeople(profile),
      peopleVisible: stageSpec.peopleVisible,
      eroticTone: true,
      intimacy: 'implied_offscreen',
      sexualActsShown: false,
      nudity: false,
      playerInvolved: false,
      rewardEffects: false,
      gameplayEffects: false,
      romanceEffects: false,
      sequenceId,
      sequenceIndex,
      sequenceLength: erosTimeStageSpecs.length,
      sequenceStage: stageSpec.stage,
      sequenceStageLabel: stageSpec.stageLabel,
      unlockRule
    }));
  });

  const bonusScenes = [
    ...bikiniScenes,
    ...pairedScenes,
    ...gameOverTeases,
    ...bodyVariantScenes,
    ...boudoirScenes,
    ...privateRitualScenes,
    ...erosTimeScenes
  ];
  const contract = {
    schemaVersion: '1.0.0',
    contentVersion: '2.10.0',
    bodyRouteDataVersion: '1.0.0',
    maturity: {
      minimumAge: 27,
      adultsOnly: true,
      explicitSexualActs: false,
      nudity: false,
      sexualDevices: false,
      consentRequired: true,
      intimacyPresentation: 'before_after_fade_to_black',
      multiPartnerPresentation: 'consensual_offscreen_only',
      minimumPartnerAge: 28,
      gameplayConsequencesForRefusal: false
    },
    villainCinematics,
    bodyRoutes,
    bonusScenes,
    categories: Object.freeze({
      all: 'Toutes les archives',
      bikini: 'Maillots',
      romance_ff: 'Romances F/F',
      afterglow: 'Après les néons',
      game_over: 'Game Over',
      body_variants: 'Routes corporelles VN',
      boudoir: 'Boudoirs individuels',
      private_ritual: 'Parenthèses privées',
      eros_time: 'Éros Time · intimité hors champ'
    })
  };

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  globalScope.INFERNAL_CITY_ADULT_SCENES = deepFreeze(contract);
})(window);
