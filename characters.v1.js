/**
 * Infernal City — Characters Pack v1
 *
 * Autonomous, data-first registry for ten playable adult heroines, ten adult
 * antagonists and the deterministic "Ten Thrones" campaign. When the visual
 * novel corpus is already present, this module adds its thirty chapters
 * without replacing any existing heroine.
 */
(function exposeInfernalCityCharacters(root) {
  'use strict';

  const SCHEMA = 'infernal-city.characters/1';
  const VERSION = 1;
  const CHAPTERS_PER_HEROINE = 3;
  const SAFE_RELATION_EFFECTS = Object.freeze({
    relationshipXp: 0,
    preserveAffinity: true,
    preserveCombat: true,
    narrativeOnly: true,
    combat: false,
    economy: false
  });

  const heroineSpecs = [
    {
      id: 'nyx',
      slug: 'nyx-circuit',
      name: 'Nyx Circuit',
      title: 'Ronin des Néons',
      age: 30,
      style: 'cyberpunk',
      abilityName: 'Faille Chromatique',
      abilityDesc: 'Ouvre une brèche de données qui ralentit et expose les assaillantes.',
      cooldown: 11,
      startingWeapon: 'railgun',
      unlockRule: { type: 'default', threshold: 0, label: 'Disponible dès le premier briefing.' },
      boundary: 'Nyx demande des mots directs : le silence n’est jamais interprété comme un accord.',
      loungeLines: [
        'Nyx coupe ses implants de combat avant de s’asseoir, puis vous laisse choisir la distance.',
        'Elle partage une fréquence privée, révocable dès que l’un de vous souhaite retrouver le calme.',
        'La pluie de néons glisse sur sa veste tandis qu’elle vérifie que la conversation vous convient.',
        'Elle expose ses limites sans détour et écoute les vôtres avec la même attention.',
        'Une porte chiffrée s’ouvre sur une invitation mutuelle, puis l’archive choisit un fondu au noir.'
      ],
      voice: 'franche, électrique et attentive',
      motifs: ['identité', 'liberté', 'confiance'],
      loreQuestions: [
        'Lui demander quel souvenir elle conserverait si ses implants perdaient toute mémoire.',
        'Imaginer avec elle une nuit sans surveillance, choisie plutôt que volée.',
        'Créer un signal qui signifie toujours « arrêtons-nous et parlons ».'
      ],
      loreAnswers: [
        '« Je garderais le goût du café brûlé partagé avec ma sœur avant mon premier implant. Aucun réseau n’a jamais su l’indexer, alors ce souvenir est vraiment à moi. »',
        '« Je n’irais pas pirater une tour. Je marcherais sous la pluie sans brouilleur, simplement parce que personne ne chercherait à transformer ma présence en donnée. »',
        '« Trois impulsions cyan, lentes et nettes. Elles ne voudraient pas dire danger : elles nous rendraient le droit de reprendre la conversation depuis le début. »'
      ],
      chapters: [
        ['ghost-in-the-rain', 'Le fantôme dans la pluie', 'Un canal pirate révèle la voix que Nyx cache au réseau.', 'toit de Haven sous une pluie cyan', 'noir-synth'],
        ['unchained-frequency', 'Fréquence sans chaîne', 'Vous définissez ensemble un espace que personne ne peut surveiller.', 'relais radio abandonné', 'slow-cyber'],
        ['after-the-blackout', 'Après le blackout', 'Quand les néons s’éteignent, Nyx choisit ce qu’elle souhaite montrer.', 'quartiers privés privés de courant', 'intimate-cyber']
      ]
    },
    {
      id: 'aurelia',
      slug: 'aurelia-brassheart',
      name: 'Aurelia Brassheart',
      title: 'Maréchale des Engrenages',
      age: 36,
      style: 'steampunk',
      abilityName: 'Chrono-Soupape',
      abilityDesc: 'Libère une surpression temporelle qui accélère les défenses proches.',
      cooldown: 13,
      startingWeapon: 'vulcan',
      unlockRule: { type: 'wave_cleared', threshold: 2, label: 'Sécuriser la vague 2 des Dix Trônes.' },
      boundary: 'Aurelia exige que chaque protocole intime puisse être suspendu sans justification.',
      loungeLines: [
        'Aurelia dépose ses gants d’ingénieure et vous offre le fauteuil face au sien.',
        'Elle remonte une montre ancienne en vous demandant si vous souhaitez prolonger la soirée.',
        'La vapeur parfume le salon de cuivre chaud ; elle attend votre réponse avant de se rapprocher.',
        'Vous rédigez ensemble un protocole où pause, refus et changement d’avis ont la même valeur.',
        'Les aiguilles s’arrêtent sur un accord renouvelé avant que le récit se fonde au noir.'
      ],
      voice: 'élégante, méthodique et chaleureuse',
      motifs: ['héritage', 'temps', 'égalité'],
      loreQuestions: [
        'Lui demander quelle invention elle créerait sans ordre militaire.',
        'Choisir un instant qu’elle voudrait laisser durer sans jamais l’emprisonner.',
        'Réécrire avec elle un protocole donnant une voix égale à chaque partenaire.'
      ],
      loreAnswers: [
        '« Une minuscule serre mécanique qui suivrait les saisons plutôt que les ordres. Elle ne gagnerait aucune bataille, mais rendrait leurs matins aux quartiers privés de ciel. »',
        '« Le premier silence après la relève. Je le prolongerais sans l’arrêter : un temps vivant doit conserver une sortie, autrement il devient une cage dorée. »',
        '« Article premier : personne ne dispose d’une voix prépondérante. Article second : une pause n’exige ni faute ni justification. Voilà une machine que je serais fière de signer. »'
      ],
      chapters: [
        ['brass-after-hours', 'Le cuivre après la relève', 'Aurelia ouvre son atelier lorsque les machines retrouvent le silence.', 'atelier aux verrières fumées', 'quiet-brass'],
        ['borrowed-minute', 'La minute empruntée', 'Une montre interdite offre un temps qui n’appartient qu’à vous deux.', 'observatoire mécanique', 'clockwork-waltz'],
        ['heart-under-glass', 'Le cœur sous verre', 'Aurelia retire son armure sociale sans renoncer à ses règles.', 'serre de cuivre nocturne', 'intimate-steam']
      ]
    },
    {
      id: 'maris',
      slug: 'maris-blacktide',
      name: 'Capitaine Maris Blacktide',
      title: 'Corsaire de la Marée Noire',
      age: 33,
      style: 'pirate techno-gothique',
      abilityName: 'Bordée Blacktide',
      abilityDesc: 'Déchaîne une bordée spectrale le long d’une route ennemie.',
      cooldown: 14,
      startingWeapon: 'plasma',
      unlockRule: { type: 'boss_defeated', bossId: 'xyra', threshold: 1, label: 'Vaincre Xyra Bioforge.' },
      boundary: 'Maris ne confond jamais audace et permission ; toute invitation reçoit une réponse explicite.',
      loungeLines: [
        'Maris accroche son sabre loin de la table avant de servir deux verres scellés.',
        'Elle raconte une mutinerie gagnée sans demander que vous livriez vos propres secrets.',
        'Son rire se rapproche, mais sa main reste immobile jusqu’à votre invitation.',
        'Vous choisissez un mot de vigie qui interrompt immédiatement tout jeu ou rapprochement.',
        'La cabine se ferme sur deux décisions libres et la mer holographique accompagne le fondu au noir.'
      ],
      voice: 'aventureuse, rauque et loyale',
      motifs: ['horizon', 'loyauté', 'refuge'],
      loreQuestions: [
        'Lui demander quel horizon elle poursuivrait si aucune guerre ne barrait la mer.',
        'Définir ce que signifie une loyauté qui ne possède jamais personne.',
        'Imaginer une cabine-refuge dont chacun conserve sa propre clé.'
      ],
      loreAnswers: [
        '« Je chercherais la mer qui apparaît sur les cartes les plus anciennes puis s’interrompt sans explication. Pas pour la conquérir : pour revenir raconter qu’un horizon peut rester libre. »',
        '« Être loyale, c’est revenir parce qu’on l’a décidé, pas parce qu’une chaîne nous ramène. Je veux des équipières capables de partir et heureuses de retrouver le pont. »',
        '« Deux serrures, deux clés, et aucune passe de capitaine. On y entre sur invitation, on en ressort sans rendre de compte, même au milieu d’une tempête. »'
      ],
      chapters: [
        ['captains-table', 'La table de la capitaine', 'Maris partage une carte vers un horizon absent des archives.', 'pont d’un croiseur corsaire', 'dark-shanty'],
        ['two-compasses', 'Deux boussoles', 'Vos directions divergent sans empêcher une traversée commune.', 'cabine des cartes stellaires', 'slow-tide'],
        ['blacktide-cabin', 'La cabine Blacktide', 'Une tempête immobilise le navire et laisse toute décision entre vos mains.', 'cabine sous l’orage violet', 'intimate-tide']
      ]
    },
    {
      id: 'zahra',
      slug: 'zahra-mille-ciels',
      name: 'Zahra des Mille-Ciels',
      title: 'Princesse des Dunes Stellaires',
      age: 28,
      style: 'royauté désertique techno-fantasy originale',
      abilityName: 'Mirage des Mille-Ciels',
      abilityDesc: 'Projette un palais-mirage qui détourne les hordes et brûle leurs traces.',
      cooldown: 12,
      startingWeapon: 'plasma',
      unlockRule: { type: 'boss_defeated', bossId: 'ossuary', threshold: 1, label: 'Vaincre Lady Ossuary.' },
      boundary: 'Zahra rappelle que rang, charme et hospitalité ne remplacent jamais une demande claire.',
      loungeLines: [
        'Zahra ouvre le jardin suspendu mais vous laisse décider si vous franchissez le seuil.',
        'Elle partage un thé d’épices et demande quelle forme de proximité vous semble juste.',
        'Ses voiles constellés suivent le vent artificiel tandis qu’elle attend votre signe.',
        'Vous nommez chacun vos limites ; aucune tradition de cour ne peut les contredire.',
        'Les lanternes baissent sur une invitation réciproque, avant un fondu au noir non graphique.'
      ],
      voice: 'lumineuse, souveraine et joueuse',
      motifs: ['choix', 'hospitalité', 'avenir'],
      loreQuestions: [
        'Lui demander quel choix elle ferait loin de toute obligation dynastique.',
        'Inventer une hospitalité où l’invité peut partir sans offenser personne.',
        'Dessiner avec elle la constellation d’un avenir qui n’est écrit par aucune cour.'
      ],
      loreAnswers: [
        '« Je deviendrais cartographe des vents stellaires. Une route change à chaque voyage ; elle me laisserait être souveraine de ma direction plutôt que prisonnière d’un trône. »',
        '« Chaque réception commencerait par montrer la sortie et préparer le voyage du retour. Un départ paisible serait la preuve de notre accueil, jamais une offense. »',
        '« Cette étoile serait le doute, celle-ci le désir, et la troisième le droit de changer. Aucune ne commanderait aux autres ; ensemble seulement, elles indiqueraient demain. »'
      ],
      chapters: [
        ['garden-above-sand', 'Le jardin au-dessus du sable', 'Zahra vous reçoit dans un refuge suspendu entre deux tempêtes.', 'jardin-palais sous trois lunes', 'desert-ambient'],
        ['unwritten-constellation', 'La constellation non écrite', 'Une carte céleste attend des choix qui n’appartiennent qu’à vous.', 'observatoire de verre ambré', 'star-waltz'],
        ['lanterns-of-choice', 'Les lanternes du choix', 'La fête s’éloigne et Zahra renouvelle chaque invitation.', 'terrasse privée aux lanternes', 'intimate-desert']
      ]
    },
    {
      id: 'mircalla',
      slug: 'mircalla-dollheart',
      name: 'Mircalla Dollheart',
      title: 'Duchesse de Porcelaine Noire',
      age: 29,
      style: 'Elegant Gothic Lolita adulte',
      abilityName: 'Cour de Porcelaine',
      abilityDesc: 'Anime des sentinelles de porcelaine qui interceptent les projectiles.',
      cooldown: 15,
      startingWeapon: 'railgun',
      unlockRule: { type: 'boss_defeated', bossId: 'nhalzara', threshold: 1, label: 'Vaincre Nhal’Zara.' },
      boundary: 'Mircalla, adulte, distingue strictement esthétique de poupée et infantilisation ; elle décide seule de son image et de ses invitations.',
      loungeLines: [
        'Mircalla ajuste sa tenue EGL de cour avant de vous demander où vous souhaitez vous asseoir.',
        'Elle retire sa couronne de porcelaine, pas son droit de diriger le rythme de l’échange.',
        'Derrière son éventail, elle formule une invitation précise et attend une réponse tout aussi claire.',
        'Vous convenez que toute mise en scène s’arrête dès que l’un de vous n’y trouve plus de plaisir.',
        'Les rideaux de dentelle noire se ferment sur un accord adulte renouvelé, puis le récit se fond au noir.'
      ],
      voice: 'précieuse, mordante et parfaitement adulte',
      motifs: ['image', 'authenticité', 'autonomie'],
      loreQuestions: [
        'Lui demander quelle part de son image publique lui appartient vraiment.',
        'L’écouter décrire ce qu’elle refuse de sacrifier à la perfection.',
        'Créer un portrait où elle choisit chaque détail et peut tout recommencer.'
      ],
      loreAnswers: [
        '« La dentelle, les silhouettes et le noir m’appartiennent. Le sourire immobile qu’on exige de la “duchesse parfaite”, lui, appartient à ceux qui préfèrent une poupée à une femme adulte. »',
        '« Je ne sacrifierai plus ma colère. Une fissure assumée raconte davantage de vérité que cent porcelaines intactes rangées pour plaire à une cour. »',
        '« Je choisirais l’angle, la lumière et surtout le bouton d’effacement. Être regardée ne vaut que si je peux encore dire : cette version n’est pas moi. »'
      ],
      chapters: [
        ['porcelain-audience', 'Audience de porcelaine', 'Mircalla démonte les attentes cachées derrière son apparence de cour.', 'salon EGL de porcelaine noire', 'gothic-chamber'],
        ['crack-in-perfection', 'La fissure dans la perfection', 'Une pièce imparfaite devient la première œuvre qu’elle souhaite conserver.', 'atelier de poupées mécaniques', 'quiet-gothic'],
        ['lace-curtain', 'Le rideau de dentelle', 'Mircalla met en scène une soirée dont elle garde chaque commande.', 'boudoir de dentelle non nu', 'intimate-gothic']
      ]
    },
    {
      id: 'isolde',
      slug: 'isolde-mourne',
      name: 'Isolde Mourne',
      title: 'Cantatrice du Dernier Deuil',
      age: 35,
      style: 'gothique victorien',
      abilityName: 'Requiem Mourne',
      abilityDesc: 'Chante une onde funèbre qui affaiblit les élites et renforce les barrières.',
      cooldown: 13,
      startingWeapon: 'flamethrower',
      unlockRule: { type: 'boss_defeated', bossId: 'astarra', threshold: 1, label: 'Vaincre Astarra Infernale.' },
      boundary: 'Isolde accueille le silence, mais exige un oui parlé avant tout changement de proximité.',
      loungeLines: [
        'Isolde éteint les cierges de cérémonie et conserve une lampe pour que chaque geste reste lisible.',
        'Elle vous offre une chanson sans exiger que vous expliquiez les deuils qu’elle réveille.',
        'Le velours noir frôle le fauteuil lorsqu’elle se rapproche après votre oui explicite.',
        'Vous choisissez une phrase simple qui rend à chacun l’espace dont il a besoin.',
        'La dernière note accompagne une invitation partagée et un fondu au noir respectueux.'
      ],
      voice: 'grave, poétique et apaisante',
      motifs: ['deuil', 'présence', 'renouveau'],
      loreQuestions: [
        'Lui demander quel souvenir mérite une chanson plutôt qu’un tombeau.',
        'Choisir comment rester présent sans forcer l’autre à parler.',
        'Imaginer un rituel de renouveau qui ne nie aucune perte.'
      ],
      loreAnswers: [
        '« Le rire de ma première régisseuse quand le décor s’est écroulé sans blesser personne. Un tombeau figerait cet instant ; une chanson lui rend son mouvement. »',
        '« On peut partager le même banc et regarder dans deux directions. La présence devient alors une offre silencieuse, non une question répétée jusqu’à obtenir réponse. »',
        '« Nous planterions une graine pour chaque nom perdu, puis une autre sans nom pour ce qui reste possible. L’aube n’effacerait rien ; elle ajouterait seulement de la lumière. »'
      ],
      chapters: [
        ['last-requiem', 'Le dernier requiem', 'Isolde chante pour les absentes et vous laisse choisir ce que vous partagez.', 'nef cyber-gothique déserte', 'requiem-ambient'],
        ['voice-between-silences', 'La voix entre les silences', 'Une répétition devient une conversation sans dette ni exigence.', 'opéra en ruines restauré', 'velvet-nocturne'],
        ['mourning-into-dawn', 'Du deuil à l’aube', 'Isolde ouvre les tentures sur une lumière qu’elle croyait perdue.', 'loge privée avant l’aube', 'intimate-requiem']
      ]
    },
    {
      id: 'hana',
      slug: 'hana-kurogane',
      name: 'Hana Kurogane',
      title: 'Shogun du Chrome Pourpre',
      age: 32,
      style: 'samouraï techno-fantasy',
      abilityName: 'Lune Kurogane',
      abilityDesc: 'Trace une coupe lunaire qui traverse une ligne complète d’ennemis.',
      cooldown: 10,
      startingWeapon: 'railgun',
      unlockRule: { type: 'boss_defeated', bossId: 'umbrael', threshold: 1, label: 'Vaincre Umbrael Shadow.' },
      boundary: 'Hana considère le consentement comme une décision présente, jamais comme une promesse ancienne.',
      loungeLines: [
        'Hana range son katana dans un coffre scellé avant de commencer le thé.',
        'Elle propose un échange honnête où chacun peut garder les secrets qu’il ne souhaite pas livrer.',
        'Son regard demande une réponse avant que sa chaise ne se rapproche de la vôtre.',
        'Vous définissez un geste d’arrêt qu’aucun serment ne peut annuler.',
        'Le jardin de chrome s’efface sur une décision commune et un fondu au noir.'
      ],
      voice: 'disciplinée, sèche et secrètement tendre',
      motifs: ['honneur', 'vérité', 'paix'],
      loreQuestions: [
        'Lui demander ce que devient l’honneur lorsqu’il ne sert plus un maître.',
        'Partager une vérité sans la transformer en obligation réciproque.',
        'Concevoir un lieu de paix où elle peut déposer son arme sans perdre son identité.'
      ],
      loreAnswers: [
        '« L’honneur devient une discipline tournée vers l’intérieur : tenir la parole que j’ai librement donnée et la retirer lorsqu’elle blesse. Aucun maître n’est nécessaire pour cela. »',
        '« Je peux te dire que j’ai fui une bataille sans exiger ton propre aveu en échange. Ma vérité ne sera pas un crochet planté dans la tienne. »',
        '« Un pavillon ouvert, avec le katana visible mais verrouillé. Je n’y serais ni soldate ni ancienne soldate : simplement Hana, capable de choisir la prochaine heure. »'
      ],
      chapters: [
        ['tea-without-rank', 'Le thé sans rang', 'Hana abandonne les titres le temps d’une cérémonie entre égaux.', 'jardin de chrome pourpre', 'quiet-koto'],
        ['truth-under-steel', 'La vérité sous l’acier', 'Un ancien serment révèle la différence entre devoir et choix.', 'dojo holographique silencieux', 'steel-ambient'],
        ['moon-on-empty-blade', 'La lune sur la lame vide', 'Hana dépose son arme et renouvelle elle-même chaque étape.', 'pavillon privé sous la lune', 'intimate-kurogane']
      ]
    },
    {
      id: 'freyja',
      slug: 'freyja-rimeborne',
      name: 'Freyja Rimeborne',
      title: 'Jarl des Tempêtes Cryoniques',
      age: 38,
      style: 'dieselpunk nordique',
      abilityName: 'Serment du Blizzard',
      abilityDesc: 'Invoque un front cryonique qui gèle les projectiles et ralentit les lourdes.',
      cooldown: 14,
      startingWeapon: 'vulcan',
      unlockRule: { type: 'boss_defeated', bossId: 'pestifera', threshold: 1, label: 'Vaincre Pestifera.' },
      boundary: 'Freyja aime les défis, mais aucun défi relationnel ne continue après une hésitation.',
      loungeLines: [
        'Freyja abandonne sa cape givrée à l’entrée et vous salue comme son égale.',
        'Elle transforme un concours de récits en invitation, sans faire du refus une défaite.',
        'Sa paume reste ouverte entre vous jusqu’à ce que vous choisissiez de la rejoindre.',
        'Vous gravez vos limites sur une tablette effaçable plutôt que dans un serment éternel.',
        'La tempête couvre une proximité consentie tandis que le récit se fond au noir.'
      ],
      voice: 'puissante, rieuse et protectrice',
      motifs: ['serment', 'foyer', 'vulnérabilité'],
      loreQuestions: [
        'Lui demander quel serment elle choisirait si elle pouvait aussi le défaire.',
        'Imaginer un foyer qui accueille sans jamais retenir.',
        'L’écouter nommer une peur sans lui demander de la vaincre immédiatement.'
      ],
      loreAnswers: [
        '« Je promettrais de revenir parler avant de disparaître, tant que revenir reste possible et sûr. Si ce serment cesse de nous protéger, nous le briserons ensemble sans honte. »',
        '« Mon foyer aurait un feu toujours allumé et des portes qui ne grincent jamais lorsqu’on les ouvre vers l’extérieur. L’accueil se mesure à la liberté du départ. »',
        '« J’ai peur du calme après la victoire, parce qu’il ne me donne plus d’ennemi à combattre. Ne me demande pas d’être brave ce soir ; reste seulement si tu en as envie. »'
      ],
      chapters: [
        ['feast-after-storm', 'Le festin après la tempête', 'Freyja réserve la dernière table à une conversation sans public.', 'hall cryonique après victoire', 'nordic-ambient'],
        ['erasable-oath', 'Le serment effaçable', 'Vous inventez une promesse qui conserve le droit de changer.', 'forge de glace et d’acier', 'slow-rime'],
        ['warmth-under-rime', 'La chaleur sous le givre', 'Au cœur du blizzard, Freyja demande plutôt que de présumer.', 'refuge privé dans la tempête', 'intimate-rime']
      ]
    },
    {
      id: 'vega',
      slug: 'vega-solari',
      name: 'Vega Solari',
      title: 'Paladine de l’Héliosphère',
      age: 31,
      style: 'space-opera solaire',
      abilityName: 'Lance Héliosphérique',
      abilityDesc: 'Condense une lance solaire qui perce les blindages et dissipe les ombres.',
      cooldown: 12,
      startingWeapon: 'plasma',
      unlockRule: { type: 'boss_defeated', bossId: 'vexara', threshold: 1, label: 'Vaincre Vexara Dreadtide.' },
      boundary: 'Vega renouvelle les accords après chaque changement d’intensité, même lorsque la confiance est ancienne.',
      loungeLines: [
        'Vega atténue son halo d’armure afin que sa présence ne décide rien à votre place.',
        'Elle vous invite à regarder le soleil artificiel et accepte aussi bien une réponse négative.',
        'Sa lumière devient plus douce lorsqu’elle confirme la distance que vous avez choisie.',
        'Vous échangez des questions précises, puis chacun reformule les limites de l’autre.',
        'L’héliosphère baisse sur une invitation mutuelle et un fondu au noir non graphique.'
      ],
      voice: 'rayonnante, chevaleresque et précise',
      motifs: ['foi', 'doute', 'réciprocité'],
      loreQuestions: [
        'Lui demander ce qui subsiste de sa foi lorsqu’elle s’autorise à douter.',
        'L’écouter parler d’une victoire qu’elle ne souhaite plus célébrer.',
        'Écrire avec elle une règle de réciprocité pour toute nouvelle invitation.'
      ],
      loreAnswers: [
        '« Ma foi n’est plus une réponse, mais une direction : protéger ce qui peut choisir. Le doute l’empêche de devenir un ordre imposé au reste de l’univers. »',
        '« J’ai détruit un croiseur vide et reçu une médaille avant d’apprendre que son équipage s’était rendu. La victoire était réelle ; la célébration, elle, aurait été un mensonge. »',
        '« Celui qui invite formule ce qu’il souhaite et offre immédiatement une sortie. Celui qui répond peut poser une autre condition, et aucun halo ne transforme l’hésitation en oui. »'
      ],
      chapters: [
        ['halo-at-rest', 'Le halo au repos', 'Vega désactive son armure pour parler sans symbole entre vous.', 'chapelle solaire orbitale', 'solar-ambient'],
        ['permission-to-doubt', 'La permission de douter', 'Une paladine confie les questions que sa légende interdit.', 'promenade de l’héliosphère', 'quiet-solar'],
        ['eclipse-for-two', 'Une éclipse pour deux', 'Vega choisit l’ombre afin que chaque lumière soit consentie.', 'observatoire privé en éclipse', 'intimate-solar']
      ]
    },
    {
      id: 'amara',
      slug: 'amara-verdigris',
      name: 'Amara Verdigris',
      title: 'Alchimiste des Jardins Toxiques',
      age: 34,
      style: 'biopunk Art nouveau',
      abilityName: 'Floraison Verdigris',
      abilityDesc: 'Fait croître un jardin corrosif qui soigne les alliées et dissout les armures.',
      cooldown: 15,
      startingWeapon: 'flamethrower',
      unlockRule: { type: 'boss_defeated', bossId: 'kalix', threshold: 1, label: 'Vaincre Kali-X.' },
      boundary: 'Amara demande avant chaque expérience et retire immédiatement toute substance ou mise en scène refusée.',
      loungeLines: [
        'Amara neutralise les spores de son laboratoire avant de vous ouvrir la serre.',
        'Elle propose une infusion vérifiée et accueille sans commentaire votre choix de ne pas la boire.',
        'Une liane lumineuse dessine la distance convenue entre vos fauteuils.',
        'Vous établissez un protocole d’expérience où chacun peut arrêter sans expliquer son malaise.',
        'La serre se referme sur une proximité choisie et le récit se fond au noir.'
      ],
      voice: 'curieuse, sensuelle et consciencieuse',
      motifs: ['création', 'soin', 'transformation'],
      loreQuestions: [
        'Lui demander quelle création elle laisserait vivre sans chercher à la contrôler.',
        'Définir un soin qui respecte aussi le droit de rester seul.',
        'Imaginer une transformation dont chaque étape peut être refusée.'
      ],
      loreAnswers: [
        '« La fleur consciente de la serre nord. Elle refuse mes tailles, choisit sa lumière et m’apprend qu’une créatrice n’est pas forcément propriétaire de ce qu’elle éveille. »',
        '« Je déposerais le remède avec sa composition complète, puis je partirais. Soigner n’accorde pas un siège au chevet ni un droit sur la gratitude. »',
        '« Chaque mue aurait son antidote et un miroir. On pourrait s’arrêter, revenir ou conserver une forme imparfaite sans que le laboratoire prononce le mot échec. »'
      ],
      chapters: [
        ['safe-greenhouse', 'La serre sûre', 'Amara vous montre un jardin où rien ne touche sans permission.', 'serre bioluminescente sécurisée', 'verdant-ambient'],
        ['unowned-creation', 'La création sans propriétaire', 'Une fleur consciente oblige Amara à repenser le contrôle.', 'laboratoire Art nouveau', 'biopunk-chill'],
        ['verdigris-bloom', 'La floraison Verdigris', 'Le jardin répond à vos voix et respecte chaque limite prononcée.', 'jardin privé sous verre', 'intimate-verdigris']
      ]
    }
  ];

  const kitSpecs = {
    nyx: {
      role: 'sabotage et vulnérabilité',
      passive: ['packet-ghost', 'Fantôme de Paquet', 'nyx_packet_ghost', 'La première cible de chaque route perd une part de sa résistance.', { resistanceReduction: 0.18, durationMs: 7000, targetsPerRoute: 1 }],
      active: ['chromatic-breach', 'Faille Chromatique', 'nyx_chromatic_breach', 'Ouvre une zone qui ralentit et amplifie les dégâts précis.', 11000, 'ground_point', { radius: 135, durationMs: 6000, slowMultiplier: 0.62, damageTakenMultiplier: 1.2 }],
      ultimate: ['city-blackout', 'Blackout de la Cité', 'nyx_city_blackout', 'Aveugle toutes les hordes et surcharge les railguns.', { stunDurationMs: 4200, railDamageMultiplier: 1.35, buffDurationMs: 6500 }]
    },
    aurelia: {
      role: 'accélération et maintenance',
      passive: ['brass-maintenance', 'Maintenance Brassheart', 'aurelia_brass_maintenance', 'Les défenses tombées sous 70 % d’intégrité se réparent lentement.', { regenerationPerSecond: 4, healthThreshold: 0.7 }],
      active: ['chrono-valve', 'Chrono-Soupape', 'aurelia_chrono_valve', 'Accélère temporairement les défenses dans une zone ciblée.', 13000, 'ground_point', { radius: 170, durationMs: 7000, fireRateMultiplier: 0.72, cooldownReductionMs: 400 }],
      ultimate: ['golden-minute', 'La Minute Dorée', 'aurelia_golden_minute', 'Suspend les ennemies tandis que les machines continuent de tirer.', { enemyFreezeMs: 4500, defenseFireRateMultiplier: 0.62, defenseBuffMs: 6000 }]
    },
    maris: {
      role: 'artillerie de route et butin',
      passive: ['corsair-share', 'Part de la Corsaire', 'maris_corsair_share', 'Les éliminations lointaines ont une chance de rendre des Bio-Coins.', { minimumDistance: 360, coinChance: 0.28, coinReward: 4 }],
      active: ['blacktide-broadside', 'Bordée Blacktide', 'maris_blacktide_broadside', 'Une bordée traverse la route sélectionnée en plusieurs impacts.', 14000, 'route', { shellCount: 7, damage: 105, blastRadius: 72, intervalMs: 180 }],
      ultimate: ['spectral-armada', 'Armada Spectrale', 'maris_spectral_armada', 'Trois navires fantômes bombardent toutes les routes.', { volleys: 3, shellsPerRoute: 4, damage: 150, intervalMs: 650 }]
    },
    zahra: {
      role: 'illusion et redirection',
      passive: ['desert-footprints', 'Traces du Désert', 'zahra_desert_footprints', 'Les ennemies redirigées restent révélées et ralenties.', { revealDurationMs: 8000, slowMultiplier: 0.8, redirectedDamageTakenMultiplier: 1.12 }],
      active: ['thousand-skies-mirage', 'Mirage des Mille-Ciels', 'zahra_thousand_skies_mirage', 'Un palais illusoire détourne les unités terrestres.', 12000, 'ground_point', { radius: 150, durationMs: 6500, tauntStrength: 1, burnDamagePerSecond: 38 }],
      ultimate: ['palace-of-dawn', 'Palais de l’Aube', 'zahra_palace_of_dawn', 'Chaque route reçoit un mirage qui absorbe une vague de projectiles.', { decoyHpPerRoute: 700, projectileAbsorptions: 12, durationMs: 8000 }]
    },
    mircalla: {
      role: 'interception et riposte',
      passive: ['porcelain-etiquette', 'Étiquette de Porcelaine', 'mircalla_porcelain_etiquette', 'Chaque projectile intercepté charge une riposte de précision.', { chargePerIntercept: 5, maximumCharge: 40, retaliationDamagePerCharge: 4 }],
      active: ['porcelain-court', 'Cour de Porcelaine', 'mircalla_porcelain_court', 'Déploie des sentinelles qui interceptent les tirs ennemis.', 15000, 'ground_point', { radius: 145, durationMs: 7500, sentinelCount: 4, interceptsPerSentinel: 3 }],
      ultimate: ['black-dollhouse', 'Maison de Poupée Noire', 'mircalla_black_dollhouse', 'Enferme les spécialistes dans une stase et leur renvoie leurs dégâts.', { specialistStasisMs: 5000, reflectedDamageMultiplier: 1.4, targetLimit: 8 }]
    },
    isolde: {
      role: 'affaiblissement et protection',
      passive: ['mourning-harmony', 'Harmonie du Deuil', 'isolde_mourning_harmony', 'Les élites blessées infligent moins de dégâts à la Citadelle.', { healthThreshold: 0.5, enemyDamageMultiplier: 0.78, eliteOnly: 1 }],
      active: ['mourne-requiem', 'Requiem Mourne', 'isolde_mourne_requiem', 'Une onde affaiblit les ennemies et répare les barrières.', 13000, 'ground_point', { radius: 210, enemyDamageMultiplier: 0.72, durationMs: 6000, barrierHealPercent: 0.22 }],
      ultimate: ['choir-of-the-last', 'Chœur des Dernières', 'isolde_choir_of_last', 'Toutes les routes subissent une pulsation funèbre cumulative.', { pulseCount: 5, pulseDamage: 95, intervalMs: 700, finalFearMs: 3200 }]
    },
    hana: {
      role: 'perforation et exécution',
      passive: ['empty-sheath', 'Fourreau Vide', 'hana_empty_sheath', 'Après une courte pause sans toucher de cible, la prochaine attaque frappe plus fort.', { idleChargeMs: 2200, damageMultiplier: 1.45 }],
      active: ['kurogane-moon', 'Lune Kurogane', 'hana_kurogane_moon', 'Une coupe orientée traverse et marque une ligne ennemie.', 10000, 'drag_line', { length: 620, width: 42, damage: 340, markDurationMs: 5500 }],
      ultimate: ['one-breath-seven-cuts', 'Un Souffle, Sept Coupes', 'hana_seven_cuts', 'Exécute sept frappes sur les cibles les plus avancées.', { strikeCount: 7, strikeDamage: 285, bossDamageMultiplier: 0.3, intervalMs: 120 }]
    },
    freyja: {
      role: 'contrôle cryonique et endurance',
      passive: ['rimebound-oath', 'Serment du Givre', 'freyja_rimebound_oath', 'Les lourdes ralenties perdent progressivement leur armure.', { stackReduction: 0.12, maximumStacks: 4, stackDurationMs: 5000 }],
      active: ['blizzard-oath', 'Serment du Blizzard', 'freyja_blizzard_oath', 'Un front de froid progresse depuis le point choisi.', 14000, 'ground_point', { radius: 175, durationMs: 7000, slowMultiplier: 0.5, projectileFreezeMs: 2500 }],
      ultimate: ['fimbul-countercharge', 'Contre-Charge Fimbul', 'freyja_fimbul_countercharge', 'Repousse toutes les hordes puis brise les armures gelées.', { pushDistance: 150, frozenDamage: 420, armorBreak: 0.3, armorBreakMs: 6500 }]
    },
    vega: {
      role: 'anti-ombre et perforation solaire',
      passive: ['heliosphere-vigil', 'Vigie Héliosphérique', 'vega_heliosphere_vigil', 'Les défenses plasma infligent davantage de dégâts aux ombres et aux cibles marquées.', { plasmaDamageMultiplier: 1.18, markedOrShadowRequired: 1 }],
      active: ['heliosphere-lance', 'Lance Héliosphérique', 'vega_heliosphere_lance', 'Une lance solaire perce les ennemies entre Vega et la cible.', 12000, 'drag_line', { length: 680, width: 48, damage: 390, armorPierce: 0.42 }],
      ultimate: ['solari-corona', 'Couronne Solari', 'vega_solari_corona', 'Une couronne solaire frappe trois fois et dissipe les projectiles.', { pulseCount: 3, globalDamage: 180, intervalMs: 800, projectileClearRadius: 1200 }]
    },
    amara: {
      role: 'corrosion et régénération',
      passive: ['symbiotic-garden', 'Jardin Symbiotique', 'amara_symbiotic_garden', 'Les zones persistantes alliées soignent légèrement les défenses voisines.', { healPerTick: 3, radius: 125, tickIntervalMs: 500 }],
      active: ['verdigris-bloom', 'Floraison Verdigris', 'amara_verdigris_bloom', 'Un jardin corrosif soigne les alliées et dissout les armures.', 15000, 'ground_point', { radius: 155, durationMs: 8500, damagePerSecond: 62, armorReduction: 0.24, defenseHealPerSecond: 8 }],
      ultimate: ['garden-after-ruin', 'Le Jardin après la Ruine', 'amara_garden_after_ruin', 'Toutes les anciennes zones d’impact fleurissent simultanément.', { gardenCount: 8, radius: 115, durationMs: 7000, damagePerSecond: 78, citadelHealPercent: 0.16 }]
    }
  };

  const bossSpecs = [
    ['xyra', 'xyra-bioforge', 'Xyra Bioforge', 'Démone Biomécanique', 214, ['boss', 'biomechanical', 'summoner', 'ground'], { hp: 5100, speed: 44, damage: 52, reward: 140, radius: 54 }, ['Éveil de la Forge', 'Mue d’Acier', 'Apothéose Biomécanique'], ['aimed', 'summon', 'spiral'], '#ff4d8d'],
    ['ossuary', 'lady-ossuary', 'Lady Ossuary', 'Maîtresse Squelette', 487, ['boss', 'undead', 'bone_shield', 'ground'], { hp: 5900, speed: 38, damage: 58, reward: 155, radius: 58 }, ['Valse des Os', 'Cathédrale Blanche', 'Trône Ossuaire'], ['ring', 'hazard', 'summon'], '#e7e5e4'],
    ['nhalzara', 'nhal-zara', 'Nhal’Zara', 'Impératrice du Vide', 1200, ['boss', 'void', 'teleport', 'flying'], { hp: 6400, speed: 48, damage: 62, reward: 170, radius: 61 }, ['Couronne du Néant', 'Horizon Brisé', 'Zéro Absolu'], ['ring', 'teleport', 'spiral'], '#a855f7'],
    ['astarra', 'astarra-infernal', 'Astarra Infernale', 'Reine des Enfers', 666, ['boss', 'infernal', 'burning_aura', 'ground'], { hp: 7200, speed: 42, damage: 70, reward: 185, radius: 64 }, ['Tribut de Braise', 'Portes de Gehenne', 'Règne Incandescent'], ['hazard', 'summon', 'ring'], '#f97316'],
    ['umbrael', 'umbrael-shadow', 'Umbrael Shadow', 'Maîtresse des Ombres', 308, ['boss', 'shadow', 'stealth', 'flying'], { hp: 6800, speed: 62, damage: 66, reward: 195, radius: 55 }, ['Voile Vivant', 'Nuit Sans Bord', 'Éclipse Dévorante'], ['teleport', 'aimed', 'spiral'], '#6366f1'],
    ['pestifera', 'pestifera', 'Pestifera', 'Duchesse des Pestes', 531, ['boss', 'plague', 'corrosive', 'ground'], { hp: 7900, speed: 36, damage: 74, reward: 210, radius: 67 }, ['Premier Miasme', 'Floraison Septique', 'Jardin de la Fin'], ['hazard', 'summon', 'ring'], '#84cc16'],
    ['vexara', 'vexara-dreadtide', 'Vexara Dreadtide', 'Amirale de l’Abîme', 402, ['boss', 'abyssal_pirate', 'artillery', 'ground'], { hp: 8500, speed: 40, damage: 78, reward: 225, radius: 70 }, ['Bordée Maudite', 'Marée des Noyées', 'Dernier Pavillon'], ['aimed', 'hazard', 'spiral'], '#06b6d4'],
    ['kalix', 'kali-x', 'Kali-X', 'Dominatrice Quantique', 289, ['boss', 'quantum', 'time_distortion', 'flying'], { hp: 8200, speed: 58, damage: 80, reward: 240, radius: 60 }, ['Calcul de Chasse', 'Temps Fractionné', 'Singularité Kali'], ['aimed', 'teleport', 'ring'], '#ec4899'],
    ['malika', 'malika-ash-djinn', 'Malika Ash-Djinn', 'Sultane des Cendres', 904, ['boss', 'ash_djinn', 'mirage', 'flying'], { hp: 9100, speed: 52, damage: 84, reward: 255, radius: 65 }, ['Mirage de Cendre', 'Palais Incendié', 'Souhait de Ruine'], ['summon', 'spiral', 'hazard'], '#f59e0b'],
    ['noctis', 'madame-noctis', 'Madame Noctis', 'Tisseuse de Cauchemars', 777, ['boss', 'nightmare', 'mind_control', 'flying'], { hp: 10500, speed: 46, damage: 92, reward: 300, radius: 74 }, ['Premier Songe', 'Sommeil de Haven', 'Nuit Éternelle'], ['teleport', 'summon', 'spiral'], '#7c3aed']
  ];

  const bossSignatures = {
    xyra: ['bioforge-reconstitution', 'Reconstitution Bioforge', 'À chaque mue, Xyra régénère sa chair d’acier et reforme un bouclier.', 'Conservez une rafale perforante pour briser la nouvelle carapace après chaque transition.'],
    ossuary: ['ossuary-bone-shield', 'Rempart Ossuaire', 'Lady Ossuary érige un bouclier d’os plus dense à chaque changement de phase.', 'Les dégâts de bouclier et les frappes arrière écourtent ses fenêtres protégées.'],
    nhalzara: ['void-horizon-shift', 'Translation d’Horizon', 'Nhal’Zara se translate autour de Haven à chaque rupture de son horizon vital.', 'Répartissez les défenses longue portée afin qu’aucune translation ne sorte du réseau de tir.'],
    astarra: ['infernal-burning-aura', 'Aura du Trône Ardent', 'Astarra laisse des couronnes de braise persistantes qui consument les défenses proches.', 'Écartez les tours majeures et revendez ou déplacez votre priorité avant que l’aura ne les encercle.'],
    umbrael: ['shadow-stealth-cycle', 'Voile Vivant', 'Umbrael disparaît brièvement entre ses salves et réapparaît lorsqu’elle est marquée ou proche de Vega.', 'Marquez-la avant la disparition ou maintenez une ligne de détection solaire près de la Citadelle.'],
    pestifera: ['plague-corrosive-bloom', 'Floraison Corrosive', 'Pestifera contamine plusieurs défenses investies avec des miasmes persistants.', 'Ne concentrez pas tous vos Bio-Coins dans un seul îlot et protégez les cibles contaminées.'],
    vexara: ['dreadtide-artillery', 'Bordée de l’Abîme', 'Vexara bombarde la défense la plus coûteuse avec des obus de zone incapacitants.', 'Isolez votre pièce maîtresse et interceptez les obus avant leur impact.'],
    kalix: ['quantum-time-distortion', 'Distorsion Kali', 'Kali-X suspend brièvement les défenses les plus investies.', 'Diversifiez les cadences et gardez une seconde ligne autonome durant la distorsion.'],
    malika: ['ash-djinn-mirage', 'Palais des Mirages', 'Malika matérialise des doubles de cendre autour de sa position.', 'Éliminez les mirages fragiles avec de la zone avant de reprendre le focus sur la Sultane.'],
    noctis: ['nightmare-mind-control', 'Emprise Nocturne', 'Madame Noctis retourne temporairement les défenses majeures contre Haven.', 'L’Aegis absorbe les tirs sous emprise ; répartissez les investissements pour limiter la trahison.']
  };

  function deepFreeze(value, seen = new Set()) {
    if (!value || typeof value !== 'object' || seen.has(value)) return value;
    seen.add(value);
    Object.getOwnPropertyNames(value).forEach(key => deepFreeze(value[key], seen));
    return Object.freeze(value);
  }

  function makeProfile(spec) {
    const portrait = `assets/characters/heroines/${spec.slug}-portrait-v1.webp`;
    const alternatePortrait = `assets/characters/heroines/${spec.slug}-night-portrait-v1.webp`;
    const atlasSrc = `assets/characters/heroines/${spec.slug}-atlas-v1.png`;
    return {
      id: spec.id,
      slug: spec.slug,
      name: spec.name,
      title: spec.title,
      age: spec.age,
      isAdult: true,
      style: spec.style,
      avatar: portrait,
      altAvatar: alternatePortrait,
      activeSkin: 'default',
      abilityName: spec.abilityName,
      abilityDesc: spec.abilityDesc,
      cooldown: spec.cooldown,
      startingWeapon: spec.startingWeapon,
      affinityLvl: 1,
      relationshipXp: 0,
      romanceOptIn: false,
      privateMomentUnlocked: false,
      unlocked: spec.unlockRule.type === 'default',
      relationship: {
        consentRequired: true,
        consentRevocable: true,
        refusalPenalty: 'none',
        militaryAllianceIsNotConsent: true
      },
      boundary: spec.boundary,
      loungeLines: [...spec.loungeLines],
      unlockRule: { ...spec.unlockRule },
      spriteAtlas: {
        src: atlasSrc,
        row: 0,
        columns: 4,
        rows: 4,
        layout: 'state_rows',
        stateRows: ['idle', 'move', 'attack', 'ultimate'],
        framesPerState: 4,
        size: 100
      }
    };
  }

  function makeKit(spec, kit) {
    const [passiveId, passiveName, passiveMechanic, passiveDescription, modifiers] = kit.passive;
    const [activeId, activeName, activeMechanic, activeDescription, cooldownMs, targeting, effect] = kit.active;
    const [ultimateId, ultimateName, ultimateMechanic, ultimateDescription, ultimateEffect] = kit.ultimate;
    return {
      id: spec.id,
      name: spec.name,
      role: kit.role,
      passive: {
        id: passiveId,
        name: passiveName,
        mechanic: passiveMechanic,
        description: passiveDescription,
        modifiers: { ...modifiers }
      },
      active: {
        id: activeId,
        name: activeName,
        mechanic: activeMechanic,
        description: activeDescription,
        cooldownMs,
        targeting,
        effect: { ...effect }
      },
      ultimate: {
        id: ultimateId,
        name: ultimateName,
        mechanic: ultimateMechanic,
        description: ultimateDescription,
        chargeRequired: 100,
        effect: { ...ultimateEffect }
      },
      preferredDefenses: ['railgun_pylon', 'aegis_barrier', 'plasma_mortar']
    };
  }

  function makeBoss(spec, index) {
    const [id, slug, name, title, age, traits, stats, phaseNames, patternTypes, color] = spec;
    const [signatureMechanic, signatureName, signatureDescription, signatureCounterplay] = bossSignatures[id];
    const atlasSrc = `assets/characters/villains/${slug}-atlas-v1.png`;
    return {
      id,
      slug,
      name,
      title,
      age,
      isAdult: true,
      color,
      portrait: `assets/characters/villains/${slug}-portrait-v1.webp`,
      traits: [...traits],
      signature: {
        mechanic: signatureMechanic,
        name: signatureName,
        description: signatureDescription,
        counterplay: signatureCounterplay
      },
      stats: { ...stats },
      phases: phaseNames.map((phaseName, phaseIndex) => ({
        number: phaseIndex + 1,
        threshold: [1, 0.66, 0.33][phaseIndex],
        name: phaseName,
        pattern: {
          mechanic: `${id}_phase_${phaseIndex + 1}`,
          type: patternTypes[phaseIndex],
          count: 7 + index + (phaseIndex * 3),
          speed: 185 + (index * 6) + (phaseIndex * 35),
          damage: 16 + index + (phaseIndex * 5),
          cooldownMs: 1450 - (phaseIndex * 180)
        }
      })),
      rewards: {
        score: 800 + (index * 180),
        coins: stats.reward,
        xp: 180 + (index * 25),
        metaCoins: 20 + (index * 4)
      },
      counterplay: [
        signatureCounterplay,
        patternTypes.includes('aimed')
          ? 'Décalez-vous avant la volée ciblée et gardez les barrières hors de son axe.'
          : 'Conservez une voie latérale libre.',
        patternTypes.includes('summon')
          ? 'Éliminez les renforts avant de reprendre le focus sur le Trône.'
          : 'Punissez la fin de son télégraphe.',
        patternTypes.includes('ring') || patternTypes.includes('spiral')
          ? 'Traversez les intervalles du motif au lieu de reculer en ligne droite.'
          : 'Quittez immédiatement les zones persistantes.'
      ],
      spriteAtlas: {
        src: atlasSrc,
        row: 0,
        columns: 4,
        rows: 4,
        layout: 'state_rows',
        stateRows: ['idle', 'move', 'attack', 'ultimate'],
        framesPerState: 4,
        size: 118 + (index * 4)
      },
      recruitment: {
        available: false,
        militaryAllianceIsNotRomanticConsent: true
      }
    };
  }

  function safeEffects(extra = {}) {
    return { ...SAFE_RELATION_EFFECTS, ...extra };
  }

  function dialogueLine(speaker, text, mood = 'neutral') {
    return { speaker, text, mood };
  }

  function makeLoreChoices(spec) {
    return spec.motifs.map((theme, index) => ({
      id: `${spec.id}.${theme}`,
      label: spec.loreQuestions[index],
      category: 'personality-lore',
      persistentTrait: theme,
      callbackId: `${spec.id}.remember.${theme}`,
      sexualContent: false,
      effects: {
        relationshipMemoryOnly: true,
        military: false,
        combat: false,
        economy: false
      }
    }));
  }

  function makeChapter(spec, chapterBlueprint, chapterIndex, loreChoices) {
    const [id, title, summary, setting, musicMood] = chapterBlueprint;
    const completionFlag = `vn.${spec.id}.${id}.complete`;
    const previousFlag = chapterIndex > 0
      ? `vn.${spec.id}.${spec.chapters[chapterIndex - 1][0]}.complete`
      : null;
    const chapterLoreChoices = loreChoices.map(choice => ({
      ...choice,
      id: `${id}.${choice.persistentTrait}`,
      callbackId: `${choice.callbackId}.${id}`
    }));
    const branchIds = ['lore-first', 'lore-second', 'lore-third'];

    return {
      id,
      heroId: spec.id,
      title,
      subtitle: `${spec.title} · ${setting}`,
      summary,
      estimatedMinutes: 10 + chapterIndex,
      unlock: {
        affinityMin: [1, 2, 4][chapterIndex],
        romanceOptIn: chapterIndex > 0,
        flags: previousFlag ? [previousFlag] : []
      },
      presentation: {
        portrait: `assets/characters/heroines/${spec.slug}-portrait-v1.webp`,
        alternatePortrait: `assets/characters/heroines/${spec.slug}-night-portrait-v1.webp`,
        backdrop: `assets/vn/cg/chapters/${spec.id}-${id}.webp`,
        expressionSheet: `assets/vn/expressions/${spec.id}-expressions-v1.webp`,
        musicMood,
        fadeToBlack: true,
        graphicContent: false
      },
      cgSrc: `assets/vn/cg/chapters/${spec.id}-${id}.webp`,
      expressionSheetSrc: `assets/vn/expressions/${spec.id}-expressions-v1.webp`,
      loreChoices: chapterLoreChoices,
      entryBeat: 'opening',
      onceEffects: true,
      beats: [
        {
          id: 'opening',
          kind: 'dialogue',
          lines: [
            dialogueLine('narrator', `La relève abandonne peu à peu le ${setting}. Les alarmes de Haven deviennent une vibration lointaine.`, 'atmosphere'),
            dialogueLine('narrator', spec.loungeLines[chapterIndex], 'atmosphere'),
            dialogueLine('hero', `« Ici, je suis ${spec.name}, pas seulement ${spec.title}. »`, 'soft'),
            dialogueLine('narrator', `${summary} Ce soir, elle choisit de raconter ce que cette phrase ne dit pas encore.`, 'reflective'),
            dialogueLine('narrator', `${spec.name} reste près de la sortie et vous laisse tout l’espace nécessaire pour repartir.`, 'safe'),
            dialogueLine('hero', '« Tu peux rester, demander une pause ou partir. Aucune de ces réponses ne changera notre travail. »', 'firm'),
            dialogueLine('player', '« Je souhaite rester et écouter, tant que tu le souhaites aussi. »', 'respectful'),
            dialogueLine('hero', '« Alors commençons sans raccourci. Si quelque chose change, nous le dirons. »', 'warm'),
            dialogueLine('narrator', `La lumière du ${setting} souligne sa tenue ${spec.style}, adulte et choisie, sans transformer son apparence en permission.`, 'atmosphere'),
            dialogueLine('hero', `« Cette histoire concerne ${spec.motifs[chapterIndex]}. Je ne la raconte pas souvent. »`, 'reflective'),
            dialogueLine('player', '« Tu gardes le droit de t’arrêter au milieu d’une phrase. »', 'supportive'),
            dialogueLine('hero', '« Et toi le droit de ne pas répondre. Oui, cette règle me convient. »', 'relieved')
          ],
          nextBeat: 'consent-check'
        },
        {
          id: 'consent-check',
          kind: 'choice',
          consentCheckpoint: true,
          prompt: 'Souhaitez-vous poursuivre cette conversation personnelle ?',
          options: [
            { id: 'affirm', label: 'Oui — poursuivre en vérifiant régulièrement nos limites', consentAction: 'affirm', nextBeat: 'shared-trust', effects: safeEffects({ relationshipXp: 2 }) },
            { id: 'pause', label: 'Pas maintenant — rester alliés sans poursuivre', consentAction: 'pause', nextBeat: 'pause', effects: safeEffects() },
            { id: 'revoke', label: 'Révoquer l’accord romantique et préserver l’alliance', consentAction: 'revoke', nextBeat: 'revoke', effects: safeEffects({ romanceOptIn: false }) }
          ]
        },
        {
          id: 'shared-trust',
          kind: 'dialogue',
          lines: [
            dialogueLine('narrator', `${spec.name} acquiesce sans considérer votre réponse comme valable au-delà de cet instant.`, 'safe'),
            dialogueLine('hero', `« Mon rapport à ${spec.motifs[chapterIndex]} n’est pas celui que les archives racontent. »`, 'reflective'),
            dialogueLine('hero', spec.loreAnswers[chapterIndex], 'vulnerable'),
            dialogueLine('hero', `« On attend de moi une voix ${spec.voice}. Cela ne signifie pas que je dois être ainsi à chaque minute. »`, 'vulnerable'),
            dialogueLine('player', '« Tu n’as aucun rôle à tenir ici. »', 'supportive'),
            dialogueLine('hero', '« Je veux pourtant choisir ce que je te montre, et choisir de le reprendre si nécessaire. »', 'firm'),
            dialogueLine('narrator', 'Un silence confortable s’installe. Il ne réclame ni réponse ni rapprochement.', 'quiet'),
            dialogueLine('player', '« Je peux poser une question, ou simplement rester présent. »', 'respectful'),
            dialogueLine('hero', '« Pose-la. Je répondrai seulement si la réponse m’appartient encore. »', 'warm')
          ],
          nextBeat: 'lore-choice'
        },
        {
          id: 'lore-choice',
          kind: 'choice',
          prompt: 'Choisir une question de lore purement narrative',
          narrativeOnly: true,
          options: chapterLoreChoices.map((choice, index) => ({
            id: choice.persistentTrait,
            label: choice.label,
            nextBeat: branchIds[index],
            loreChoiceId: choice.id,
            persistentTrait: choice.persistentTrait,
            callbackId: choice.callbackId,
            effects: safeEffects()
          }))
        },
        ...chapterLoreChoices.map((choice, index) => ({
          id: branchIds[index],
          kind: 'dialogue',
          lines: [
            dialogueLine('hero', `« Ta question touche à ${choice.persistentTrait}. Laisse-moi choisir par où commencer. »`, 'reflective'),
            dialogueLine('narrator', `${spec.name} reformule la question afin de s’assurer qu’aucune attente cachée ne l’accompagne.`, 'safe'),
            dialogueLine('hero', `« ${spec.loreQuestions[index]} Voilà ce que j’aurais aimé qu’on me demande plus tôt. »`, 'vulnerable'),
            dialogueLine('player', '« Tu peux conserver la réponse pour toi. La question n’est pas une dette. »', 'supportive'),
            dialogueLine('hero', spec.loreAnswers[index], 'vulnerable'),
            dialogueLine('hero', `« Dans le ${setting}, cette réponse prend une couleur différente. Je veux que cette version reste liée à notre conversation de ce soir. »`, 'firm'),
            dialogueLine('narrator', `Ce souvenir de ${choice.persistentTrait} rejoint votre histoire commune sans accorder bonus, ressource ni avantage militaire.`, 'memory')
          ],
          nextBeat: 'renewal'
        })),
        {
          id: 'renewal',
          kind: 'choice',
          consentCheckpoint: true,
          prompt: 'La conversation devient plus proche. Quelle limite choisissez-vous maintenant ?',
          options: [
            { id: 'continue', label: 'Continuer cette proximité non graphique', consentAction: 'affirm', nextBeat: 'close', effects: safeEffects() },
            { id: 'limit', label: 'Rester à la conversation et aux gestes déjà nommés', consentAction: 'limit', nextBeat: 'limited-close', effects: safeEffects() },
            { id: 'pause', label: 'Faire une pause sans perdre de confiance', consentAction: 'pause', nextBeat: 'pause', effects: safeEffects() },
            { id: 'revoke', label: 'Retirer maintenant l’accord romantique', consentAction: 'revoke', nextBeat: 'revoke', effects: safeEffects({ romanceOptIn: false }) }
          ]
        },
        {
          id: 'close',
          kind: 'dialogue',
          lines: [
            dialogueLine('hero', '« Oui. Je souhaite continuer, et je te le redemanderai si le rythme change. »', 'warm'),
            dialogueLine('player', '« Mon accord vaut pour cette étape seulement. »', 'respectful'),
            dialogueLine('narrator', `${spec.name} réduit lentement la distance, attentive à votre posture autant qu’à vos mots.`, 'intimate'),
            dialogueLine('hero', '« Tout va bien ? »', 'checking'),
            dialogueLine('player', '« Oui. Et toi ? »', 'checking'),
            dialogueLine('hero', '« Oui. Merci de l’avoir demandé. »', 'relieved'),
            dialogueLine('narrator', 'La tension adulte reste faite de regards, de paroles et de gestes consentis, sans détail graphique.', 'sensual'),
            dialogueLine('narrator', 'La scène préserve leur intimité en se fondant doucement au noir.', 'fade')
          ],
          nextBeat: 'completed'
        },
        {
          id: 'limited-close',
          kind: 'dialogue',
          lines: [
            dialogueLine('hero', '« La limite est claire. Nous restons exactement là. »', 'supportive'),
            dialogueLine('narrator', `${spec.name} reprend une distance confortable sans manifester ni déception ni reproche.`, 'safe'),
            dialogueLine('player', '« Je souhaite encore entendre la fin de ton histoire. »', 'warm'),
            dialogueLine('hero', '« Alors elle sera notre seule destination ce soir. »', 'warm'),
            dialogueLine('narrator', `Elle poursuit son récit sur ${spec.motifs[chapterIndex]}, libre de taire les détails qui ne lui appartiennent plus.`, 'reflective'),
            dialogueLine('hero', '« Cette conversation me suffit. Elle compte précisément parce qu’elle ne force rien. »', 'relieved'),
            dialogueLine('narrator', 'Les lumières restent allumées et la soirée s’achève dans une proximité strictement nommée.', 'quiet'),
            dialogueLine('narrator', 'L’archive ferme la scène sur un fondu au noir non graphique.', 'fade')
          ],
          nextBeat: 'completed-limited'
        },
        {
          id: 'completed',
          kind: 'dialogue',
          end: true,
          endState: 'completed-consensual',
          lines: [
            dialogueLine('narrator', 'Plus tard, chacun confirme que les limites ont été respectées.', 'aftercare'),
            dialogueLine('hero', '« Ce souvenir reste un choix, jamais une obligation pour la prochaine fois. »', 'firm'),
            dialogueLine('player', '« La prochaine invitation commencera par une nouvelle question. »', 'respectful'),
            dialogueLine('narrator', 'Alliance, efficacité militaire et économie demeurent entièrement inchangées.', 'safe')
          ],
          onEnterEffects: safeEffects({ setFlags: [completionFlag] })
        },
        {
          id: 'completed-limited',
          kind: 'dialogue',
          end: true,
          endState: 'completed-limited',
          lines: [
            dialogueLine('hero', '« Merci d’avoir nommé la limite sans l’excuser. »', 'relieved'),
            dialogueLine('player', '« Elle restera valable jusqu’à ce que tu choisisses autre chose. »', 'supportive'),
            dialogueLine('narrator', 'La confiance relationnelle progresse sans modifier le combat ni les ressources.', 'safe'),
            dialogueLine('narrator', 'La soirée se termine calmement, sans contenu graphique.', 'quiet')
          ],
          onEnterEffects: safeEffects({ setFlags: [completionFlag] })
        },
        {
          id: 'pause',
          kind: 'dialogue',
          end: true,
          endState: 'paused',
          lines: [
            dialogueLine('hero', '« D’accord. Nous nous arrêtons ici. »', 'supportive'),
            dialogueLine('narrator', `${spec.name} rouvre l’espace sans demander d’explication.`, 'safe'),
            dialogueLine('player', '« Merci. Notre alliance ne change pas. »', 'respectful'),
            dialogueLine('hero', '« Ni notre efficacité, ni ta place à Haven. »', 'firm')
          ],
          onEnterEffects: safeEffects()
        },
        {
          id: 'revoke',
          kind: 'dialogue',
          end: true,
          endState: 'revoked',
          lines: [
            dialogueLine('hero', '« Accord retiré. Je l’ai entendu et je le respecte immédiatement. »', 'supportive'),
            dialogueLine('narrator', 'Toute tension romantique cesse sans punition, dette ou tentative de négociation.', 'safe'),
            dialogueLine('player', '« Nous restons partenaires au combat si tu le souhaites. »', 'respectful'),
            dialogueLine('hero', '« Oui. Cette décision n’enlève rien à notre confiance militaire. »', 'firm')
          ],
          onEnterEffects: safeEffects({ romanceOptIn: false })
        }
      ]
    };
  }

  const heroines = Object.fromEntries(heroineSpecs.map(spec => [spec.id, makeProfile(spec)]));
  const heroKits = Object.fromEntries(heroineSpecs.map(spec => [spec.id, makeKit(spec, kitSpecs[spec.id])]));
  const bosses = Object.fromEntries(bossSpecs.map((spec, index) => [spec[0], makeBoss(spec, index)]));

  const vnHeroines = Object.fromEntries(heroineSpecs.map(spec => {
    const loreChoices = makeLoreChoices(spec);
    const chapters = spec.chapters.map((chapter, index) => makeChapter(spec, chapter, index, loreChoices));
    return [spec.id, {
      id: spec.id,
      displayName: spec.name,
      title: spec.title,
      age: spec.age,
      isAdult: true,
      voice: spec.voice,
      boundary: spec.boundary,
      portrait: `assets/characters/heroines/${spec.slug}-portrait-v1.webp`,
      expressionSheetSrc: `assets/vn/expressions/${spec.id}-expressions-v1.webp`,
      persistentBranchThemes: [...spec.motifs],
      loreChoices,
      chapters
    }];
  }));

  const chapterRegistry = Object.values(vnHeroines)
    .flatMap(heroine => heroine.chapters.map(chapter => ({
      heroId: heroine.id,
      chapterId: chapter.id,
      cgSrc: chapter.cgSrc,
      expressionSheetSrc: chapter.expressionSheetSrc,
      loreChoices: chapter.loreChoices
    })));

  const bossSchedule = Object.keys(bosses).map((bossId, index) => ({
    wave: (index + 1) * 2,
    bossId,
    routePolicy: index % 2 === 0 ? 'primary' : 'farthest',
    deterministic: true
  }));

  const tenThronesCampaign = {
    id: 'ten_thrones',
    name: 'Les Dix Trônes',
    description: 'Vingt vagues déterministes ; une souveraine antagoniste apparaît à chaque vague paire.',
    finalWave: 20,
    finalBossName: 'Madame Noctis',
    deterministic: true,
    seedPolicy: 'infernal-city.ten-thrones.v1',
    bossSchedule,
    completionRewards: {
      score: 12000,
      metaCoins: 500,
      galleryItemId: 'ten_thrones_conclusion'
    }
  };

  const persistentBlueprint = {
    schema: 'infernal-city.characters.vn-state/1',
    version: 1,
    storageRoot: 'heroines',
    savedFields: ['traits', 'memories', 'callbackHistory', 'consent'],
    excludedFields: ['coins', 'credits', 'resources', 'towerStats', 'enemyStats', 'waveState'],
    defaultHeroineState: {
      traits: {},
      memories: [],
      callbackHistory: [],
      consent: {
        granted: false,
        revoked: false,
        updatedAt: null
      }
    },
    heroinePaths: Object.fromEntries(heroineSpecs.map(spec => [spec.id, {
      path: `heroines.${spec.id}`,
      traitIds: [...spec.motifs],
      chapterIds: spec.chapters.map(chapter => chapter[0])
    }]))
  };

  const registry = deepFreeze({
    schema: SCHEMA,
    schemaVersion: VERSION,
    version: VERSION,
    content: {
      allCharactersAdults: true,
      minimumAge: 18,
      consentRequired: true,
      consentRevocable: true,
      refusalPenalty: 'none',
      graphicSex: false,
      fadeToBlack: true,
      loreChoicesAreNarrativeOnly: true,
      combatConsequences: false,
      economicConsequences: false
    },
    heroineIds: heroineSpecs.map(spec => spec.id),
    bossIds: bossSpecs.map(spec => spec[0]),
    heroines,
    heroKits,
    bosses,
    bossDefinitions: bosses,
    campaigns: {
      ten_thrones: tenThronesCampaign
    },
    vn: {
      schema: 'infernal-city.characters.vn/1',
      version: 1,
      chaptersPerHeroine: CHAPTERS_PER_HEROINE,
      persistentBlueprint,
      heroines: vnHeroines,
      chapters: chapterRegistry
    }
  });

  root.INFERNAL_CITY_CHARACTERS = registry;

  const existingScenes = root.INFERNAL_VN_SCENES;
  root.INFERNAL_VN_SCENES = {
    schema: existingScenes?.schema || 'infernal-city.vn-scenes/1',
    version: existingScenes?.version || '1.0.0',
    locale: existingScenes?.locale || 'fr-FR',
    title: existingScenes?.title || 'Salon Nocturne — Chroniques de Haven',
    content: {
      minimumAge: 18,
      allCharactersAdults: true,
      consentRequired: true,
      consentRevocable: true,
      explicitSexualDetail: false,
      endingStyle: 'fade-to-black',
      ...(existingScenes?.content || {})
    },
    consentContract: existingScenes?.consentContract || {
      romanceFlag: 'romanceOptIn',
      militaryAllianceIsNotRomanticConsent: true,
      pausePreservesRomanceOptIn: true,
      revokeSetsRomanceOptInFalse: true,
      refusalPenalty: 'none',
      preserveAffinityOnPauseOrRevoke: true,
      preserveCombatOnPauseOrRevoke: true,
      supportedActions: ['affirm', 'limit', 'pause', 'revoke']
    },
    integration: existingScenes?.integration || {
      heroineCollection: 'heroines',
      chapterCollection: 'chapters',
      chapterStartField: 'entryBeat',
      beatKinds: ['dialogue', 'choice'],
      lineSpeakers: ['narrator', 'hero', 'player'],
      saveKeySuggestion: 'vnSceneProgress'
    },
    heroines: {
      ...(existingScenes?.heroines || {}),
      ...vnHeroines
    }
  };
}(typeof window !== 'undefined' ? window : globalThis));
