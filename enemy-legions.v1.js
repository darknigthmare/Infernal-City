/*
 * Infernal City — Enemy Legions data pack 1.0
 *
 * Fifty production-ready enemy definitions arranged into ten five-unit
 * factions. The pack is data-only: combat systems may consume its structured
 * attacks, mechanics, synergies and effect sheets without special-casing art.
 */
(function installInfernalCityEnemyLegions(global) {
  'use strict';

  if (global.INFERNAL_CITY_ENEMY_LEGIONS) {
    if (typeof module !== 'undefined' && module.exports) module.exports = global.INFERNAL_CITY_ENEMY_LEGIONS;
    return;
  }

  const VERSION = '1.0.0';
  const SPRITE_FRAMES = Object.freeze({ idle: 0, move: 1, attack: 2, impact: 3 });

  function deepFreeze(value, seen = new Set()) {
    if (!value || typeof value !== 'object' || seen.has(value)) return value;
    seen.add(value);
    Object.getOwnPropertyNames(value).forEach(key => deepFreeze(value[key], seen));
    return Object.freeze(value);
  }

  function sheet(src) {
    return {
      src,
      columns: 4,
      rows: 1,
      frameCount: 4,
      frameOrder: { ...SPRITE_FRAMES },
      playback: { idleFps: 3, moveFps: 7, attackFps: 9, impactFps: 8 },
      transparent: true
    };
  }

  const factionBlueprints = {
    bioforge: {
      id: 'bioforge', name: 'Couvée de la Bioforge', doctrine: 'Une meute organique qui soigne, protège puis multiplie sa première ligne.',
      signatureTags: ['biomechanical', 'regeneration', 'brood'],
      counterplay: 'Isoler les soigneurs et brûler les œufs avant leur éclosion.'
    },
    ossuary: {
      id: 'ossuary', name: 'Cour de l’Ossuaire', doctrine: 'Une procession nécromantique qui construit son propre champ de bataille.',
      signatureTags: ['undead', 'fortification', 'revival'],
      counterplay: 'Détruire les runes et les murs, puis concentrer les unités de soutien.'
    },
    void: {
      id: 'void', name: 'Conclave du Vide', doctrine: 'Des anomalies qui déplacent les lignes, neutralisent les tours et exécutent les cibles marquées.',
      signatureTags: ['void', 'control', 'phase'],
      counterplay: 'Espacer les défenses et conserver une source de dégâts soutenus hors des champs de nullité.'
    },
    infernal: {
      id: 'infernal', name: 'Légion de Géhenne', doctrine: 'Une armée de feu qui accélère autour de ses brasiers et pilonne les positions fixes.',
      signatureTags: ['fire', 'siege', 'frenzy'],
      counterplay: 'Éteindre les étendards-brasiers et interrompre les longues incantations.'
    },
    shadow: {
      id: 'shadow', name: 'Maison de l’Éclipse', doctrine: 'Des assassins furtifs qui masquent leurs tireurs et frappent les défenses vulnérables.',
      signatureTags: ['shadow', 'stealth', 'ambush'],
      counterplay: 'Révéler les unités camouflées et multiplier les angles de couverture.'
    },
    plague: {
      id: 'plague', name: 'Consortium de la Peste', doctrine: 'Une marée infectieuse qui contamine le terrain et recycle ses propres morts.',
      signatureTags: ['plague', 'damage_over_time', 'spores'],
      counterplay: 'Éviter les regroupements et éliminer les semeurs avant que les zones se chevauchent.'
    },
    dreadtide: {
      id: 'dreadtide', name: 'Flotte de la Marée Funeste', doctrine: 'Des noyés qui harponnent leurs cibles derrière des récifs mobiles.',
      signatureTags: ['drowned', 'displacement', 'barrage'],
      counterplay: 'Briser les remparts de corail et engager les canonniers sous leur portée minimale.'
    },
    quantum: {
      id: 'quantum', name: 'Essaim Quantique', doctrine: 'Des machines qui manipulent la cadence, partagent leurs blessures et rembobinent leur progression.',
      signatureTags: ['quantum', 'time', 'entanglement'],
      counterplay: 'Détruire les ancres chronales puis concentrer une sentinelle intriquée à la fois.'
    },
    ash: {
      id: 'ash', name: 'Caravane des Cendres', doctrine: 'Des djinns qui brouillent le ciblage avant de réaliser un souhait d’artillerie dévastateur.',
      signatureTags: ['ash', 'illusion', 'wishcraft'],
      counterplay: 'Employer les dégâts de zone pour dissiper les mirages et interrompre les souhaits.'
    },
    nightmare: {
      id: 'nightmare', name: 'Cortège du Cauchemar', doctrine: 'Des prédateurs oniriques qui accumulent la peur, endorment les tours et dévorent les cibles affaiblies.',
      signatureTags: ['nightmare', 'fear', 'sleep'],
      counterplay: 'Nettoyer les altérations et neutraliser la cloche avant son troisième glas.'
    }
  };

  const effectSpecs = [
    ['bio_acid_spore', 'Spore acide', 'projectile', 900, 18, 0, { impactDamageMultiplier: 1, armorShred: 0.12 }],
    ['bio_suture_beam', 'Rayon de suture', 'beam', 650, 12, 100, { healingPerTick: 18, chainCount: 2 }],
    ['bio_brood_egg', 'Œuf de couvée', 'deployable', 6200, 24, 500, { incubationMs: 4200, spawnCount: 3 }],
    ['bone_arrow', 'Flèche d’os', 'projectile', 1100, 9, 0, { impactDamageMultiplier: 1.1, pierceCount: 1 }],
    ['bone_tomb_wall', 'Mur sépulcral', 'deployable', 9000, 38, 250, { hitPoints: 420, pathSlowMultiplier: 0.8 }],
    ['bone_grave_rune', 'Rune funéraire', 'deployable', 8000, 34, 500, { reviveChargePerTick: 4, auraRadius: 105 }],
    ['void_null_orb', 'Orbe de nullité', 'projectile', 1500, 16, 0, { silenceMs: 1600, energyDrain: 18 }],
    ['void_gravity_maw', 'Gueule gravitationnelle', 'field', 4400, 58, 200, { pullPerTick: 7, slowMultiplier: 0.62 }],
    ['void_horizon_ray', 'Rayon d’horizon', 'beam', 1200, 20, 80, { executeThreshold: 0.18, lineWidth: 22 }],
    ['infernal_ember_bolt', 'Trait de braise', 'projectile', 1000, 13, 0, { burnDamagePerSecond: 9, burnDurationMs: 3200 }],
    ['infernal_brazier_standard', 'Étendard-brasier', 'deployable', 8500, 30, 250, { hasteMultiplier: 1.22, auraRadius: 120 }],
    ['infernal_brimstone_meteor', 'Météore de soufre', 'projectile', 1800, 32, 0, { splashRadius: 72, stunMs: 700 }],
    ['shadow_shard', 'Éclat d’ombre', 'projectile', 800, 8, 0, { impactDamageMultiplier: 0.85, blindMs: 900 }],
    ['shadow_black_lantern', 'Lanterne noire', 'deployable', 7500, 28, 250, { stealthRadius: 125, revealPenaltyMs: 1400 }],
    ['shadow_eclipse_round', 'Balle d’éclipse', 'projectile', 1350, 10, 0, { criticalMultiplier: 2.4, armorPierce: 0.45 }],
    ['plague_miasma_cloud', 'Nuage de miasmes', 'field', 5200, 52, 250, { damagePerTick: 6, healingReduction: 0.5 }],
    ['plague_septic_bomb', 'Bombe septique', 'projectile', 1600, 23, 0, { splashRadius: 56, infectionStacks: 2 }],
    ['plague_canker_pod', 'Cosse chancreuse', 'deployable', 7200, 27, 400, { pulseDamage: 11, pulseRadius: 80 }],
    ['dreadtide_harpoon', 'Harpon abyssal', 'projectile', 1250, 11, 0, { pullDistance: 68, tetherMs: 1200 }],
    ['dreadtide_coral_barricade', 'Récif mobile', 'deployable', 9500, 42, 250, { hitPoints: 520, coverReduction: 0.24 }],
    ['dreadtide_ghost_cannonball', 'Boulet spectral', 'projectile', 1900, 28, 0, { splashRadius: 78, defenseStunMs: 850 }],
    ['quantum_qubit_bolt', 'Trait qubit', 'projectile', 750, 9, 0, { chainCount: 2, chainDamageMultiplier: 0.72 }],
    ['quantum_chronal_anchor', 'Ancre chronale', 'deployable', 6800, 31, 200, { cooldownSlowMultiplier: 1.25, auraRadius: 115 }],
    ['ash_mirage_orb', 'Orbe mirage', 'projectile', 1300, 17, 0, { decoyCount: 2, accuracyPenalty: 0.3 }],
    ['ash_wish_shell', 'Obus de souhait', 'projectile', 2100, 30, 0, { splashRadius: 86, damageGrowthPerCast: 0.18 }],
    ['nightmare_bell_wave', 'Onde du glas', 'field', 1900, 64, 150, { fearStacks: 1, sleepThreshold: 3 }]
  ];

  const effects = Object.fromEntries(effectSpecs.map(([id, name, kind, durationMs, hitboxRadius, tickMs, gameplay]) => [id, {
    id,
    name,
    kind,
    sprite: sheet(`assets/animations/enemy-legions/effects/${id}.webp`),
    lifecycle: { durationMs, hitboxRadius, tickMs, destroyOnImpact: kind === 'projectile' },
    gameplay,
    visualOnly: false
  }]));

  function attack(mode, target, damageType, description, extras = {}) {
    return { mode, target, damageType, description, burstCount: 1, ...extras };
  }

  function mechanic(id, type, trigger, target, values, extras = {}) {
    return { id, type, trigger, target, values, ...extras };
  }

  function synergy(withIds, description, bonus, condition = 'ally_within_aura') {
    return { with: withIds, condition, radius: 125, description, bonus };
  }

  const specs = [
    // Bioforge
    {
      id: 'bioforge_scarab', factionId: 'bioforge', name: 'Scarabée de la Bioforge', role: 'armor_breaker', tier: 1,
      stats: [88, 92, 7, 5, 12, 170, 920, 0.04, 0.05], traits: ['ground', 'light', 'corrosive'],
      attack: attack('projectile', 'nearest_defense', 'acid', 'Crache une spore qui ronge progressivement l’armure.', { effectId: 'bio_acid_spore', projectileSpeed: 225 }),
      mechanics: [mechanic('scarab_corrosion', 'armor_shred', 'on_hit', 'defense', { armorShred: 0.12, durationMs: 4200, maxStacks: 3 }, { effectId: 'bio_acid_spore' })],
      synergies: [synergy(['bioforge_hound'], 'La meute inflige davantage de dégâts aux cibles corrodées.', { damageMultiplier: 1.28 })],
      counterplay: 'Les dégâts de zone éliminent les scarabées avant l’accumulation de corrosion.', lore: 'Des recycleurs de métal vivant libérés en avant-garde.'
    },
    {
      id: 'bioforge_hound', factionId: 'bioforge', name: 'Molosse Synaptique', role: 'pursuer', tier: 2,
      stats: [210, 128, 14, 9, 17, 28, 760, 0.08, 0.12], traits: ['ground', 'fast', 'pack_hunter'],
      attack: attack('melee', 'weakest_defense', 'physical', 'Bondit sur la défense la plus fragile et la lacère.'),
      mechanics: [mechanic('hound_pounce', 'gap_closer', 'target_out_of_melee', 'defense', { leapDistance: 92, bonusDamageMultiplier: 1.45, cooldownMs: 4800 })],
      synergies: [synergy(['bioforge_scarab'], 'Les phéromones des scarabées accélèrent sa ruée.', { speedMultiplier: 1.16 })],
      counterplay: 'Le ralentissement brise son bond et l’oblige à traverser les tirs croisés.', lore: 'Un prédateur assemblé autour d’un cerveau de chasse collectif.'
    },
    {
      id: 'bioforge_stitcher', factionId: 'bioforge', name: 'Sutureur Hémal', role: 'healer', tier: 3,
      stats: [330, 54, 8, 18, 19, 210, 1750, 0.12, 0.28], traits: ['ground', 'support', 'healer'],
      attack: attack('beam', 'nearest_defense', 'bioelectric', 'Fouette une tour avec une sonde de suture.', { effectId: 'bio_suture_beam' }),
      mechanics: [mechanic('stitcher_triage', 'chain_heal', 'ally_below_health', 'allies', { healPerSecond: 36, chainCount: 2, range: 175 }, { effectId: 'bio_suture_beam' })],
      synergies: [synergy(['bioforge_carapace'], 'Le rempart protège le rayon de soin et augmente sa portée.', { rangeMultiplier: 1.25 })],
      counterplay: 'Le railgun ou l’assassinat prioritaire coupe la régénération de la colonne.', lore: 'Ses filaments recousent chair et acier sans distinguer l’un de l’autre.'
    },
    {
      id: 'bioforge_carapace', factionId: 'bioforge', name: 'Carapace Cathédrale', role: 'tank_aura', tier: 4,
      stats: [1450, 34, 26, 36, 32, 38, 1420, 0.46, 0.55], traits: ['ground', 'heavy', 'protector'],
      attack: attack('melee', 'citadel', 'crushing', 'Écrase les obstacles sous sa masse chitineuse.'),
      mechanics: [mechanic('carapace_guard', 'damage_redirect', 'ally_damaged', 'nearby_allies', { redirectRatio: 0.3, radius: 110, internalCooldownMs: 350 })],
      synergies: [synergy(['bioforge_stitcher'], 'Les sutures reçues renforcent temporairement sa plaque frontale.', { armorBonus: 0.12 })],
      counterplay: 'Le contourner ou employer l’acide : les tirs frontaux alimentent son rôle de rempart.', lore: 'Une forteresse ambulante cultivée dans les cuves les plus anciennes.'
    },
    {
      id: 'bioforge_broodmother', factionId: 'bioforge', name: 'Matriarche Incubatrice', role: 'summoner', tier: 5,
      stats: [2200, 28, 34, 58, 38, 85, 2100, 0.34, 0.62], traits: ['ground', 'elite', 'summoner'],
      attack: attack('ranged_arc', 'citadel', 'organic', 'Projette des poches incubatrices derrière la ligne.', { effectId: 'bio_brood_egg', minimumRange: 55 }),
      mechanics: [mechanic('broodmother_lay_eggs', 'summon', 'cooldown', 'path', { count: 3, incubationMs: 4200, cooldownMs: 7600 }, { effectId: 'bio_brood_egg', summonIds: ['bioforge_scarab'] })],
      synergies: [synergy(['bioforge_carapace'], 'À couvert de la Carapace, ses œufs incubent plus vite.', { incubationTimeMultiplier: 0.7 })],
      counterplay: 'Détruire les œufs au sol et interrompre l’animation de ponte.', lore: 'La matrice qui transforme chaque champ de bataille en nouvelle bioforge.'
    },

    // Ossuary
    {
      id: 'ossuary_bone_thrall', factionId: 'ossuary', name: 'Serf d’Os', role: 'horde', tier: 1,
      stats: [105, 70, 9, 5, 13, 25, 980, 0.08, 0.08], traits: ['ground', 'undead', 'mass_spawn'],
      attack: attack('melee', 'citadel', 'physical', 'Frappe sans relâche avec un outil funéraire.'),
      mechanics: [mechanic('thrall_reassembly', 'revive', 'on_death', 'self', { reviveChance: 0.28, reviveHealthRatio: 0.38, delayMs: 2400 })],
      synergies: [synergy(['ossuary_funeral_chantress'], 'Le chant funéraire garantit sa première réanimation.', { reviveChanceBonus: 0.45 })],
      counterplay: 'Le feu ou les dégâts persistants détruisent les restes avant leur remontée.', lore: 'Un défunt rappelé pour payer une dette oubliée.'
    },
    {
      id: 'ossuary_spine_archer', factionId: 'ossuary', name: 'Archer Vertébral', role: 'ranged', tier: 2,
      stats: [190, 56, 18, 11, 16, 255, 1350, 0.1, 0.16], traits: ['ground', 'undead', 'piercing'],
      attack: attack('projectile', 'furthest_defense', 'piercing', 'Décoche une vertèbre qui traverse une seconde cible.', { effectId: 'bone_arrow', projectileSpeed: 315 }),
      mechanics: [mechanic('spine_pierce', 'pierce', 'on_attack', 'defense_line', { pierceCount: 1, secondaryDamageMultiplier: 0.62, lineWidth: 18 }, { effectId: 'bone_arrow' })],
      synergies: [synergy(['ossuary_sarcophagus_knight'], 'Tire à couvert du chevalier avec une cadence accrue.', { attackSpeedMultiplier: 1.2 })],
      counterplay: 'Décaler les tours importantes pour empêcher les alignements de pénétration.', lore: 'Son arc est tendu avec les nerfs de ses anciennes victimes.'
    },
    {
      id: 'ossuary_funeral_chantress', factionId: 'ossuary', name: 'Chantresse Funéraire', role: 'revival_support', tier: 3,
      stats: [310, 45, 10, 20, 19, 145, 1900, 0.13, 0.34], traits: ['ground', 'undead', 'support'],
      attack: attack('sonic', 'area_defenses', 'necrotic', 'Une plainte affaiblit la cadence des défenses proches.'),
      mechanics: [mechanic('chantress_grave_rune', 'revive_aura', 'cooldown', 'path', { auraRadius: 105, durationMs: 8000, cooldownMs: 10500 }, { effectId: 'bone_grave_rune' })],
      synergies: [synergy(['ossuary_bone_thrall'], 'Chaque réanimation recharge sa prochaine onde funéraire.', { cooldownReductionMs: 650 })],
      counterplay: 'La tuer avant les serfs empêche la boucle de réanimation.', lore: 'Sa voix conserve le dernier souffle de toute une nécropole.'
    },
    {
      id: 'ossuary_sarcophagus_knight', factionId: 'ossuary', name: 'Chevalier-Sarcophage', role: 'shield_tank', tier: 4,
      stats: [1680, 31, 32, 39, 34, 42, 1580, 0.5, 0.58], traits: ['ground', 'heavy', 'frontal_shield'],
      attack: attack('melee', 'citadel', 'crushing', 'Percute les barrières avec son cercueil blindé.'),
      mechanics: [mechanic('sarcophagus_interment', 'frontal_shield', 'always', 'self', { capacity: 620, frontalArcDegrees: 145, regenerationPerSecond: 8 })],
      synergies: [synergy(['ossuary_spine_archer'], 'Les projectiles alliés traversant son sarcophage gagnent en force.', { projectileDamageMultiplier: 1.18 })],
      counterplay: 'L’attaquer par les flancs ou le retourner avec un effet de déplacement.', lore: 'Un tombeau de guerre dont le chevalier et l’armure ne font plus qu’un.'
    },
    {
      id: 'ossuary_grave_architect', factionId: 'ossuary', name: 'Architecte des Tombes', role: 'fortifier', tier: 5,
      stats: [2050, 27, 22, 62, 36, 175, 2300, 0.38, 0.68], traits: ['ground', 'elite', 'builder'],
      attack: attack('ranged', 'nearest_defense', 'necrotic', 'Projette des moellons d’ossuaire sur les défenses.'),
      mechanics: [mechanic('architect_tomb_wall', 'deploy_barrier', 'cooldown', 'path_ahead', { hitPoints: 420, durationMs: 9000, cooldownMs: 8200 }, { effectId: 'bone_tomb_wall', summonIds: ['ossuary_bone_thrall'] })],
      synergies: [synergy(['ossuary_funeral_chantress'], 'Une rune proche transforme le mur détruit en deux serfs.', { spawnCount: 2 })],
      counterplay: 'Les dégâts de siège dégagent ses murs avant que la procession ne s’abrite.', lore: 'Il dessine des forteresses avec les os de ceux qui les défendaient.'
    },

    // Void
    {
      id: 'void_mote', factionId: 'void', name: 'Poussière du Vide', role: 'swarm_phase', tier: 1,
      stats: [72, 108, 6, 5, 11, 24, 790, 0.02, 0.18], traits: ['flying', 'void', 'swarm'],
      attack: attack('contact', 'citadel', 'void', 'Traverse la ligne et implose au contact de la Citadelle.'),
      mechanics: [mechanic('mote_flicker', 'evasion', 'periodic', 'self', { untargetableMs: 320, intervalMs: 2100, phaseSpeedMultiplier: 1.25 })],
      synergies: [synergy(['void_phasewalker'], 'Les passages de phase prolongent son scintillement.', { evasionDurationMultiplier: 1.4 })],
      counterplay: 'Les dégâts de zone et les chaînes électriques frappent entre deux scintillements.', lore: 'Un fragment de réalité qui a oublié sa propre masse.'
    },
    {
      id: 'void_phasewalker', factionId: 'void', name: 'Marche-Faille', role: 'phasing_flanker', tier: 2,
      stats: [235, 116, 16, 12, 17, 32, 880, 0.08, 0.36], traits: ['ground', 'void', 'phasing'],
      attack: attack('melee', 'rear_defense', 'void', 'Réapparaît derrière la dernière défense et tranche son noyau.'),
      mechanics: [mechanic('phasewalker_skip', 'path_skip', 'after_distance', 'self', { distanceRequired: 180, skipDistance: 95, untargetableMs: 520 })],
      synergies: [synergy(['void_gravity_maw'], 'Une gueule gravitationnelle choisit son point de sortie.', { attackDamageMultiplier: 1.32 })],
      counterplay: 'Garder une défense de proximité près de la Citadelle pour couvrir sa sortie.', lore: 'Il marche dans les espaces négatifs entre deux secondes.'
    },
    {
      id: 'void_nullifier', factionId: 'void', name: 'Nullificateur', role: 'tower_disabler', tier: 3,
      stats: [390, 47, 13, 23, 20, 285, 2200, 0.18, 0.44], traits: ['ground', 'void', 'disabler'],
      attack: attack('projectile', 'highest_cost_defense', 'void', 'Lance un orbe qui réduit une tour au silence.', { effectId: 'void_null_orb', projectileSpeed: 205 }),
      mechanics: [mechanic('nullifier_silence', 'silence', 'on_hit', 'defense', { silenceMs: 1600, energyDrain: 18, cooldownMs: 4600 }, { effectId: 'void_null_orb' })],
      synergies: [synergy(['void_horizon_oracle'], 'Les cibles marquées restent silencieuses plus longtemps.', { silenceDurationMultiplier: 1.5 })],
      counterplay: 'Le tuer à longue portée avant que son orbe n’atteigne une tour majeure.', lore: 'Une équation ambulante conçue pour prouver que les machines n’existent pas.'
    },
    {
      id: 'void_gravity_maw', factionId: 'void', name: 'Gueule Gravitationnelle', role: 'controller', tier: 4,
      stats: [1180, 30, 24, 42, 31, 120, 1680, 0.35, 0.65], traits: ['ground', 'heavy', 'control'],
      attack: attack('area', 'defense_cluster', 'gravity', 'Écrase une zone sous une poussée gravitationnelle.', { effectId: 'void_gravity_maw' }),
      mechanics: [mechanic('gravity_maw_field', 'pull_field', 'cooldown', 'area', { radius: 58, durationMs: 4400, cooldownMs: 7800 }, { effectId: 'void_gravity_maw' })],
      synergies: [synergy(['void_phasewalker'], 'Les Marche-Failles gagnent en vitesse dans son champ.', { speedMultiplier: 1.24 })],
      counterplay: 'Répartir les tours pour limiter l’aspiration et concentrer les dégâts de zone.', lore: 'Un horizon miniature enfermé dans une armure rituelle.'
    },
    {
      id: 'void_horizon_oracle', factionId: 'void', name: 'Oracle de l’Horizon', role: 'elite_marker', tier: 5,
      stats: [1860, 29, 48, 68, 35, 390, 2850, 0.3, 0.72], traits: ['floating', 'elite', 'executioner'],
      attack: attack('beam', 'marked_defense', 'void', 'Trace un horizon qui exécute les structures déjà affaiblies.', { effectId: 'void_horizon_ray', minimumRange: 95 }),
      mechanics: [mechanic('oracle_event_horizon', 'mark_execute', 'on_attack', 'defense', { markDurationMs: 5200, executeThreshold: 0.18, cooldownMs: 6900 }, { effectId: 'void_horizon_ray' })],
      synergies: [synergy(['void_nullifier'], 'Le Nullificateur privilégie la défense révélée par l’Oracle.', { targetingWeightMultiplier: 2.5 })],
      counterplay: 'Réparer la cible marquée au-dessus du seuil ou interrompre le rayon canalisé.', lore: 'Elle contemple la fin de chaque construction avant même sa fondation.'
    },

    // Infernal
    {
      id: 'infernal_ember_imp', factionId: 'infernal', name: 'Diablotin de Braise', role: 'ranged_horde', tier: 1,
      stats: [82, 86, 8, 5, 12, 180, 930, 0.03, 0.06], traits: ['ground', 'fire', 'light'],
      attack: attack('projectile', 'nearest_defense', 'fire', 'Crache un trait qui laisse la cible en combustion.', { effectId: 'infernal_ember_bolt', projectileSpeed: 245 }),
      mechanics: [mechanic('imp_kindling', 'burn', 'on_hit', 'defense', { damagePerSecond: 9, durationMs: 3200, maxStacks: 2 }, { effectId: 'infernal_ember_bolt' })],
      synergies: [synergy(['infernal_cinder_hound'], 'Les molosses mordent plus fort les structures en feu.', { damageMultiplier: 1.3 })],
      counterplay: 'Les éliminer avant qu’ils n’entretiennent plusieurs incendies.', lore: 'Une étincelle malveillante qui rit quand l’acier commence à fondre.'
    },
    {
      id: 'infernal_cinder_hound', factionId: 'infernal', name: 'Molosse de Scorie', role: 'burn_chaser', tier: 2,
      stats: [245, 122, 17, 11, 18, 29, 720, 0.1, 0.17], traits: ['ground', 'fire', 'fast'],
      attack: attack('melee', 'burning_defense', 'fire', 'Déchiquette en priorité les défenses embrasées.'),
      mechanics: [mechanic('hound_cinder_trail', 'hazard_trail', 'while_moving', 'path', { damagePerSecond: 5, trailDurationMs: 2600, width: 20 })],
      synergies: [synergy(['infernal_ember_imp'], 'Chaque combustion proche augmente sa vitesse.', { speedMultiplier: 1.18 })],
      counterplay: 'Le cryo retire sa frénésie et neutralise sa traînée ardente.', lore: 'Ses pattes vitrifiées impriment une piste rouge sur les routes.'
    },
    {
      id: 'infernal_brazier_flagellant', factionId: 'infernal', name: 'Flagellant du Brasier', role: 'haste_support', tier: 3,
      stats: [420, 49, 16, 24, 21, 80, 1580, 0.16, 0.3], traits: ['ground', 'fire', 'support'],
      attack: attack('melee', 'citadel', 'fire', 'Frappe avec les chaînes de son encensoir incandescent.'),
      mechanics: [mechanic('flagellant_raise_brazier', 'deploy_aura', 'cooldown', 'path', { durationMs: 8500, hasteMultiplier: 1.22, cooldownMs: 10800 }, { effectId: 'infernal_brazier_standard' })],
      synergies: [synergy(['infernal_gehenna_guard'], 'Le garde rend l’étendard plus résistant et plus large.', { auraRadiusMultiplier: 1.2 })],
      counterplay: 'Détruire l’étendard-brasier avant de traiter la vague accélérée.', lore: 'Il transforme sa souffrance volontaire en cadence militaire.'
    },
    {
      id: 'infernal_gehenna_guard', factionId: 'infernal', name: 'Garde de Géhenne', role: 'retaliation_tank', tier: 4,
      stats: [1580, 33, 36, 43, 34, 40, 1460, 0.48, 0.56], traits: ['ground', 'heavy', 'fire'],
      attack: attack('melee', 'citadel', 'fire', 'Abat un glaive chauffé à blanc sur la première ligne.'),
      mechanics: [mechanic('gehenna_retaliation', 'retaliation', 'after_direct_hits', 'attacker', { hitsRequired: 5, returnDamage: 22, internalCooldownMs: 1200 })],
      synergies: [synergy(['infernal_brazier_flagellant'], 'Un brasier proche régénère lentement son armure.', { armorPerSecond: 0.012 })],
      counterplay: 'Les dégâts sur la durée évitent de déclencher trop souvent sa riposte.', lore: 'Il garde une porte qui ne s’ouvre que vers des profondeurs plus brûlantes.'
    },
    {
      id: 'infernal_brimstone_magus', factionId: 'infernal', name: 'Mage du Soufre', role: 'siege_caster', tier: 5,
      stats: [1720, 26, 68, 70, 35, 370, 3300, 0.27, 0.64], traits: ['ground', 'elite', 'siege'],
      attack: attack('projectile_arc', 'defense_cluster', 'fire', 'Canalise un météore de soufre à large explosion.', { effectId: 'infernal_brimstone_meteor', projectileSpeed: 145, minimumRange: 120 }),
      mechanics: [mechanic('magus_meteor_ritual', 'siege_channel', 'cooldown', 'area', { channelMs: 1800, splashRadius: 72, cooldownMs: 7600 }, { effectId: 'infernal_brimstone_meteor' })],
      synergies: [synergy(['infernal_gehenna_guard'], 'Le garde absorbe les interruptions durant la canalisation.', { interruptResistanceMultiplier: 0.5 })],
      counterplay: 'Repousser ou étourdir le mage pendant ses 1,8 seconde de canalisation.', lore: 'Il négocie chaque météore avec les volcans prisonniers sous la cité.'
    },

    // Shadow
    {
      id: 'shadow_shardling', factionId: 'shadow', name: 'Éclatin d’Ombre', role: 'ranged_swarm', tier: 1,
      stats: [76, 96, 7, 5, 11, 155, 820, 0.02, 0.12], traits: ['ground', 'shadow', 'swarm'],
      attack: attack('projectile', 'nearest_defense', 'shadow', 'Lance un éclat aveuglant puis change de voie.', { effectId: 'shadow_shard', projectileSpeed: 285 }),
      mechanics: [mechanic('shardling_blind', 'accuracy_debuff', 'on_hit', 'defense', { accuracyPenalty: 0.24, durationMs: 900, laneShiftDistance: 28 }, { effectId: 'shadow_shard' })],
      synergies: [synergy(['shadow_blinkblade'], 'L’aveuglement garantit le premier critique de la Blinkblade.', { criticalChanceBonus: 1 })],
      counterplay: 'Les attaques à zone non ciblées ignorent la pénalité de précision.', lore: 'Un morceau d’obscurité aiguisé jusqu’à devenir affamé.'
    },
    {
      id: 'shadow_blinkblade', factionId: 'shadow', name: 'Blinkblade', role: 'assassin', tier: 2,
      stats: [225, 132, 23, 13, 16, 30, 920, 0.06, 0.32], traits: ['ground', 'shadow', 'assassin'],
      attack: attack('melee', 'lowest_health_defense', 'shadow', 'Se téléporte vers la structure la plus faible et frappe deux fois.'),
      mechanics: [mechanic('blinkblade_ambush', 'teleport_strike', 'target_acquired', 'defense', { teleportRange: 105, strikeCount: 2, cooldownMs: 5200 })],
      synergies: [synergy(['shadow_veil_specter'], 'Sous le voile, sa téléportation se recharge plus vite.', { cooldownMultiplier: 0.72 })],
      counterplay: 'Maintenir les défenses réparées et placer des pièges autour des cibles fragiles.', lore: 'Son reflet arrive toujours une attaque trop tard.'
    },
    {
      id: 'shadow_veil_specter', factionId: 'shadow', name: 'Spectre du Voile', role: 'stealth_support', tier: 3,
      stats: [340, 58, 11, 23, 20, 120, 1850, 0.14, 0.48], traits: ['floating', 'shadow', 'support'],
      attack: attack('drain', 'nearest_defense', 'shadow', 'Draine lentement l’énergie d’une défense.'),
      mechanics: [mechanic('specter_veil', 'stealth_aura', 'always', 'nearby_allies', { radius: 115, revealDelayMs: 1100, firstHitReduction: 0.55 })],
      synergies: [synergy(['shadow_eclipse_sniper'], 'Le tireur conserve le camouflage pendant sa visée.', { stealthBreakDelayMs: 1400 })],
      counterplay: 'Tesla, sonar et révélation dissipent son aura avant l’embuscade.', lore: 'Un rideau funéraire qui a appris à marcher seul.'
    },
    {
      id: 'shadow_black_lamplighter', factionId: 'shadow', name: 'Allumeur de Lampes Noires', role: 'stealth_deployer', tier: 4,
      stats: [910, 38, 20, 40, 28, 195, 1800, 0.3, 0.58], traits: ['ground', 'shadow', 'deployer'],
      attack: attack('ranged', 'nearest_defense', 'shadow', 'Projette une flamme noire qui réduit la vision tactique.'),
      mechanics: [mechanic('lamplighter_black_lantern', 'deploy_stealth', 'cooldown', 'path', { durationMs: 7500, stealthRadius: 125, cooldownMs: 9200 }, { effectId: 'shadow_black_lantern' })],
      synergies: [synergy(['shadow_veil_specter'], 'Deux zones de voile superposées réduisent les dégâts de zone.', { splashDamageTakenMultiplier: 0.72 })],
      counterplay: 'La lanterne est destructible : la cibler révèle toute l’escouade.', lore: 'Il éteint les rues une à une avant le passage de la Maison.'
    },
    {
      id: 'shadow_eclipse_sniper', factionId: 'shadow', name: 'Tireuse de l’Éclipse', role: 'elite_sniper', tier: 5,
      stats: [1320, 32, 92, 72, 31, 420, 3600, 0.2, 0.7], traits: ['ground', 'elite', 'sniper'],
      attack: attack('projectile', 'highest_damage_defense', 'shadow', 'Charge une balle qui perce l’armure d’une tour prioritaire.', { effectId: 'shadow_eclipse_round', projectileSpeed: 520, minimumRange: 145 }),
      mechanics: [mechanic('sniper_eclipse_shot', 'charged_critical', 'cooldown', 'defense', { aimMs: 1700, criticalMultiplier: 2.4, cooldownMs: 7200 }, { effectId: 'shadow_eclipse_round' })],
      synergies: [synergy(['shadow_black_lamplighter'], 'Une lanterne noire empêche les tours de l’interrompre pendant la visée.', { interruptResistanceMultiplier: 0.4 })],
      counterplay: 'Entrer sous sa portée minimale ou révéler sa position pendant la visée.', lore: 'Elle ne tire qu’au moment précis où sa cible cesse de croire au soleil.'
    },

    // Plague
    {
      id: 'plague_miasma_rat', factionId: 'plague', name: 'Rat de Miasmes', role: 'infectious_swarm', tier: 1,
      stats: [68, 118, 5, 4, 11, 23, 710, 0.01, 0.05], traits: ['ground', 'plague', 'swarm'],
      attack: attack('melee', 'citadel', 'toxic', 'Mord et transmet une infection cumulable.'),
      mechanics: [mechanic('rat_miasma_death', 'death_field', 'on_death', 'area', { durationMs: 2800, radius: 34, damagePerSecond: 5 }, { effectId: 'plague_miasma_cloud' })],
      synergies: [synergy(['plague_pustule_bearer'], 'La pustule absorbe les nuages proches pour grossir.', { maxHealthMultiplier: 1.18 })],
      counterplay: 'Les tuer loin des défenses empêche leurs nuages de couvrir la ligne.', lore: 'Chaque rat abrite une souche différente cultivée par le Consortium.'
    },
    {
      id: 'plague_pustule_bearer', factionId: 'plague', name: 'Porte-Pustule', role: 'death_bomber', tier: 2,
      stats: [280, 63, 14, 12, 20, 25, 1050, 0.15, 0.18], traits: ['ground', 'plague', 'volatile'],
      attack: attack('melee', 'nearest_defense', 'toxic', 'Percute une défense pour gonfler sa charge septique.'),
      mechanics: [mechanic('pustule_burst', 'death_burst', 'on_death', 'area', { splashDamage: 46, radius: 52, infectionStacks: 2 }, { effectId: 'plague_miasma_cloud' })],
      synergies: [synergy(['plague_septic_surgeon'], 'Le chirurgien peut le faire exploser à distance avec un rayon accru.', { radiusMultiplier: 1.35 })],
      counterplay: 'Le repousser ou le finir quand aucun autre ennemi ne profite de l’explosion.', lore: 'Un réservoir consentant dont la pression est mesurée en victimes.'
    },
    {
      id: 'plague_septic_surgeon', factionId: 'plague', name: 'Chirurgien Septique', role: 'ranged_support', tier: 3,
      stats: [375, 46, 19, 25, 20, 275, 2100, 0.17, 0.38], traits: ['ground', 'plague', 'support'],
      attack: attack('projectile_arc', 'defense_cluster', 'toxic', 'Lance une bombe qui répand deux charges d’infection.', { effectId: 'plague_septic_bomb', projectileSpeed: 175 }),
      mechanics: [mechanic('surgeon_septic_bomb', 'infection_splash', 'on_attack', 'area', { splashRadius: 56, infectionStacks: 2, healingReduction: 0.5 }, { effectId: 'plague_septic_bomb' })],
      synergies: [synergy(['plague_pustule_bearer'], 'Peut déclencher une pustule sous 30 % de santé.', { detonationThreshold: 0.3 })],
      counterplay: 'Espacer les tours et éliminer le chirurgien avant les unités de mêlée.', lore: 'Ses diagnostics commencent toujours par une amputation de la ville.'
    },
    {
      id: 'plague_fungal_colossus', factionId: 'plague', name: 'Colosse Fongique', role: 'regenerating_tank', tier: 4,
      stats: [1760, 29, 31, 47, 36, 44, 1620, 0.43, 0.62], traits: ['ground', 'heavy', 'plague'],
      attack: attack('melee', 'citadel', 'toxic', 'Écrase les défenses et disperse des spores à chaque impact.'),
      mechanics: [mechanic('colossus_spore_regen', 'conditional_regeneration', 'inside_hazard', 'self', { healthPerSecond: 34, damageReduction: 0.16, checkRadius: 52 }, { summonIds: ['plague_miasma_rat'] })],
      synergies: [synergy(['plague_miasma_rat'], 'Chaque nuage de rat active sa régénération fongique.', { regenerationMultiplier: 1.4 })],
      counterplay: 'Nettoyer les rats puis attirer le colosse hors des miasmes.', lore: 'Une forêt de champignons a choisi un même squelette pour avancer.'
    },
    {
      id: 'plague_canker_sower', factionId: 'plague', name: 'Semeuse de Chancres', role: 'zone_deployer', tier: 5,
      stats: [1540, 31, 30, 69, 34, 235, 2450, 0.31, 0.68], traits: ['ground', 'elite', 'deployer'],
      attack: attack('ranged_arc', 'path_near_defenses', 'toxic', 'Sème des cosses qui pulsent au passage des ennemis.', { effectId: 'plague_canker_pod' }),
      mechanics: [mechanic('sower_canker_pod', 'deploy_hazard', 'cooldown', 'path', { durationMs: 7200, pulseDamage: 11, cooldownMs: 6600 }, { effectId: 'plague_canker_pod', summonIds: ['plague_pustule_bearer'] })],
      synergies: [synergy(['plague_fungal_colossus'], 'Le Colosse double la résistance des cosses proches.', { deployableHealthMultiplier: 2 })],
      counterplay: 'Détruire les cosses avant qu’elles ne transforment la route en zone permanente.', lore: 'Elle plante des maladies dont la récolte se compte en quartiers morts.'
    },

    // Dreadtide
    {
      id: 'dreadtide_drowned_deckhand', factionId: 'dreadtide', name: 'Matelot Noyé', role: 'horde', tier: 1,
      stats: [115, 74, 10, 6, 14, 26, 960, 0.09, 0.1], traits: ['ground', 'drowned', 'horde'],
      attack: attack('melee', 'citadel', 'physical', 'Frappe avec un cabestan brisé et s’agrippe aux barrières.'),
      mechanics: [mechanic('deckhand_boarding', 'barrier_bonus', 'on_attack', 'barrier', { damageMultiplier: 1.55, latchDurationMs: 1800, slowResistance: 0.25 })],
      synergies: [synergy(['dreadtide_reef_cutlass'], 'La Cutlass ouvre une brèche qui accélère son abordage.', { attackSpeedMultiplier: 1.2 })],
      counterplay: 'Les flammes l’empêchent de s’agripper et accélèrent sa destruction.', lore: 'Son quart ne s’est jamais terminé, même après le naufrage.'
    },
    {
      id: 'dreadtide_reef_cutlass', factionId: 'dreadtide', name: 'Cutlass des Récifs', role: 'duelist', tier: 2,
      stats: [265, 101, 21, 13, 18, 31, 850, 0.13, 0.22], traits: ['ground', 'drowned', 'duelist'],
      attack: attack('melee', 'nearest_defense', 'physical', 'Enchaîne trois tailles de sabre contre la même défense.'),
      mechanics: [mechanic('cutlass_combo', 'attack_combo', 'consecutive_hits', 'defense', { hitsRequired: 3, finalHitMultiplier: 1.8, comboWindowMs: 2100 })],
      synergies: [synergy(['dreadtide_abyss_harpooner'], 'Une cible harponnée ne peut esquiver son coup final.', { finalHitMultiplier: 2.1 })],
      counterplay: 'Le repoussement réinitialise son combo avant la troisième frappe.', lore: 'Sa lame porte un récif entier de dents et de coquillages.'
    },
    {
      id: 'dreadtide_abyss_harpooner', factionId: 'dreadtide', name: 'Harponneur Abyssal', role: 'displacer', tier: 3,
      stats: [430, 48, 20, 26, 22, 285, 2050, 0.2, 0.42], traits: ['ground', 'drowned', 'controller'],
      attack: attack('projectile', 'rear_defense', 'piercing', 'Harponne une tour arrière et la désactive pendant la traction.', { effectId: 'dreadtide_harpoon', projectileSpeed: 260 }),
      mechanics: [mechanic('harpooner_tether', 'tether', 'on_hit', 'defense', { pullDistance: 68, disableMs: 1200, cooldownMs: 5100 }, { effectId: 'dreadtide_harpoon' })],
      synergies: [synergy(['dreadtide_reef_cutlass'], 'La Cutlass gagne une ruée vers la cible harponnée.', { leapDistance: 75 })],
      counterplay: 'Les barrières interceptent le harpon destiné aux tours arrière.', lore: 'Il pêche les machines comme d’autres pêchent les monstres marins.'
    },
    {
      id: 'dreadtide_coral_bulwark', factionId: 'dreadtide', name: 'Rempart Corallien', role: 'mobile_cover', tier: 4,
      stats: [1640, 30, 29, 45, 36, 43, 1650, 0.52, 0.58], traits: ['ground', 'heavy', 'cover'],
      attack: attack('melee', 'citadel', 'crushing', 'Fracasse la ligne en arrachant des blocs de corail.'),
      mechanics: [mechanic('bulwark_coral_barricade', 'deploy_cover', 'health_threshold', 'path', { triggerHealthRatio: 0.62, hitPoints: 520, durationMs: 9500 }, { effectId: 'dreadtide_coral_barricade' })],
      synergies: [synergy(['dreadtide_ghost_cannoneer'], 'Le canonnier derrière le récif subit moins de dégâts directs.', { directDamageTakenMultiplier: 0.65 })],
      counterplay: 'Le mortier et les dégâts indirects dépassent la couverture de corail.', lore: 'Un morceau du fond marin animé par la rancune des noyés.'
    },
    {
      id: 'dreadtide_ghost_cannoneer', factionId: 'dreadtide', name: 'Canonnier Fantôme', role: 'siege', tier: 5,
      stats: [1480, 25, 76, 73, 34, 385, 3450, 0.28, 0.65], traits: ['ground', 'elite', 'siege'],
      attack: attack('projectile_arc', 'defense_cluster', 'spectral', 'Tire un boulet qui traverse les obstacles avant d’exploser.', { effectId: 'dreadtide_ghost_cannonball', projectileSpeed: 155, minimumRange: 130 }),
      mechanics: [mechanic('cannoneer_broadside', 'siege_splash', 'cooldown', 'area', { splashRadius: 78, defenseStunMs: 850, cooldownMs: 6800 }, { effectId: 'dreadtide_ghost_cannonball' })],
      synergies: [synergy(['dreadtide_coral_bulwark'], 'Le récif réduit son temps de rechargement.', { cooldownMultiplier: 0.74 })],
      counterplay: 'Le forcer sous sa portée minimale ou briser sa couverture avant la bordée.', lore: 'Son canon continue de reculer, mais son navire n’est plus là pour l’absorber.'
    },

    // Quantum
    {
      id: 'quantum_qubit_drone', factionId: 'quantum', name: 'Drone Qubit', role: 'chain_ranged', tier: 1,
      stats: [92, 94, 8, 6, 12, 190, 900, 0.05, 0.16], traits: ['flying', 'quantum', 'light'],
      attack: attack('projectile', 'nearest_defense', 'energy', 'Tire un qubit qui rebondit sur une seconde défense.', { effectId: 'quantum_qubit_bolt', projectileSpeed: 340 }),
      mechanics: [mechanic('qubit_chain', 'chain_damage', 'on_hit', 'nearby_defense', { chainCount: 2, chainRange: 75, chainDamageMultiplier: 0.72 }, { effectId: 'quantum_qubit_bolt' })],
      synergies: [synergy(['quantum_entangled_sentinel'], 'La sentinelle ajoute une troisième cible à la chaîne.', { chainCountBonus: 1 })],
      counterplay: 'Espacer les tours empêche le trait de trouver une seconde cible.', lore: 'Une probabilité hostile enfermée dans quatre ailettes.'
    },
    {
      id: 'quantum_lag_runner', factionId: 'quantum', name: 'Coureuse de Latence', role: 'time_sprinter', tier: 2,
      stats: [205, 142, 15, 12, 15, 27, 770, 0.05, 0.28], traits: ['ground', 'quantum', 'fast'],
      attack: attack('melee', 'citadel', 'energy', 'Accumule des images retardées qui répètent sa dernière frappe.'),
      mechanics: [mechanic('lag_echo', 'delayed_repeat', 'after_attack', 'same_target', { delayMs: 900, repeatDamageMultiplier: 0.55, maxEchoes: 2 })],
      synergies: [synergy(['quantum_chronal_jammer'], 'Dans la zone ralentie, ses échos arrivent deux fois plus vite.', { echoDelayMultiplier: 0.5 })],
      counterplay: 'Une élimination rapide annule les échos qui n’ont pas encore convergé.', lore: 'Elle franchit la ligne d’arrivée avant que ses pas ne commencent.'
    },
    {
      id: 'quantum_chronal_jammer', factionId: 'quantum', name: 'Brouilleur Chronal', role: 'cooldown_controller', tier: 3,
      stats: [410, 44, 12, 26, 21, 165, 2250, 0.2, 0.48], traits: ['ground', 'quantum', 'support'],
      attack: attack('pulse', 'defense_cluster', 'temporal', 'Émet une impulsion qui ralentit la recharge des tours.'),
      mechanics: [mechanic('jammer_anchor', 'deploy_slow', 'cooldown', 'path', { durationMs: 6800, cooldownMultiplier: 1.25, cooldownMs: 8800 }, { effectId: 'quantum_chronal_anchor' })],
      synergies: [synergy(['quantum_lag_runner'], 'Les coureuses traversant l’ancre ignorent leur prochain ralentissement.', { controlImmunityMs: 1800 })],
      counterplay: 'Détruire l’ancre chronale restaure immédiatement les cadences.', lore: 'Il diffuse une seconde trop longue sur toutes les horloges voisines.'
    },
    {
      id: 'quantum_entangled_sentinel', factionId: 'quantum', name: 'Sentinelle Intriquée', role: 'linked_tank', tier: 4,
      stats: [1510, 35, 30, 46, 33, 48, 1520, 0.45, 0.64], traits: ['ground', 'heavy', 'quantum'],
      attack: attack('melee', 'citadel', 'energy', 'Frappe en synchronisation avec une autre sentinelle.'),
      mechanics: [mechanic('sentinel_entanglement', 'shared_health', 'ally_present', 'linked_ally', { sharedDamageRatio: 0.42, linkRange: 160, armorBonus: 0.1 }, { summonIds: ['quantum_qubit_drone'] })],
      synergies: [synergy(['quantum_paradox_markswoman'], 'Les tirs de la Paradoxe réparent une fraction du lien.', { linkedHealingPerShot: 18 })],
      counterplay: 'Séparer les sentinelles ou concentrer simultanément les deux extrémités du lien.', lore: 'Deux corps différents affirment être la même machine.'
    },
    {
      id: 'quantum_paradox_markswoman', factionId: 'quantum', name: 'Tireuse Paradoxe', role: 'rewind_sniper', tier: 5,
      stats: [1370, 30, 82, 74, 31, 405, 3200, 0.24, 0.74], traits: ['ground', 'elite', 'quantum'],
      attack: attack('projectile', 'highest_level_defense', 'energy', 'Tire un qubit qui mémorise l’état de sa cible.', { effectId: 'quantum_qubit_bolt', projectileSpeed: 470, minimumRange: 120 }),
      mechanics: [mechanic('marksman_rewind', 'position_rewind', 'health_threshold', 'self', { triggerHealthRatio: 0.35, rewindDistance: 150, healRatio: 0.22 }, { effectId: 'quantum_qubit_bolt' })],
      synergies: [synergy(['quantum_entangled_sentinel'], 'Le lien intriqué peut absorber les dégâts pendant son rembobinage.', { damageTakenMultiplier: 0.55 })],
      counterplay: 'Garder une compétence de contrôle pour son rembobinage à 35 % de vie.', lore: 'Chaque balle prouve une version différente de la bataille.'
    },

    // Ash
    {
      id: 'ash_ember_wisp', factionId: 'ash', name: 'Feu-Follet de Cendre', role: 'evasive_swarm', tier: 1,
      stats: [74, 112, 6, 5, 11, 24, 760, 0.01, 0.2], traits: ['flying', 'ash', 'swarm'],
      attack: attack('contact', 'citadel', 'fire', 'Tourbillonne au contact et masque les unités derrière lui.'),
      mechanics: [mechanic('wisp_ash_screen', 'evasion_aura', 'on_damage', 'nearby_allies', { radius: 44, accuracyPenalty: 0.18, durationMs: 1200 })],
      synergies: [synergy(['ash_cinder_dervish'], 'Le Derviche absorbe l’écran pour agrandir son tourbillon.', { areaRadiusMultiplier: 1.25 })],
      counterplay: 'Les Tesla et missiles guidés ne dépendent pas de la précision visuelle.', lore: 'Le dernier souffle d’un souhait consumé trop tôt.'
    },
    {
      id: 'ash_cinder_dervish', factionId: 'ash', name: 'Derviche de Cendre', role: 'spinning_bruiser', tier: 2,
      stats: [285, 96, 18, 13, 20, 34, 880, 0.12, 0.3], traits: ['ground', 'ash', 'area_attack'],
      attack: attack('melee_area', 'defense_cluster', 'physical', 'Tournoie et frappe toutes les structures à proximité.'),
      mechanics: [mechanic('dervish_whirl', 'moving_area_attack', 'after_three_hits', 'area', { hitsRequired: 3, radius: 48, damageMultiplier: 0.7 })],
      synergies: [synergy(['ash_mirage_weaver'], 'Chaque mirage ajoute une frappe fantôme au tourbillon.', { phantomStrikeCount: 2 })],
      counterplay: 'L’isoler avec une barrière évite que sa rotation touche plusieurs tours.', lore: 'Sa danse raconte une tempête qui n’a jamais cessé.'
    },
    {
      id: 'ash_mirage_weaver', factionId: 'ash', name: 'Tisseuse de Mirages', role: 'decoy_support', tier: 3,
      stats: [365, 52, 14, 25, 19, 245, 1980, 0.14, 0.46], traits: ['floating', 'ash', 'illusion'],
      attack: attack('projectile', 'nearest_defense', 'arcane', 'Lance un orbe qui crée deux silhouettes trompeuses.', { effectId: 'ash_mirage_orb', projectileSpeed: 205 }),
      mechanics: [mechanic('weaver_decoys', 'spawn_decoys', 'on_attack', 'path', { decoyCount: 2, decoyHealth: 1, durationMs: 3600 }, { effectId: 'ash_mirage_orb' })],
      synergies: [synergy(['ash_censer_ifrit'], 'Les mirages dans l’encens deviennent résistants aux dégâts de zone.', { splashDamageTakenMultiplier: 0.55 })],
      counterplay: 'Les dégâts de zone dissipent les leurres sans détourner longtemps les tirs.', lore: 'Elle brode des soldats avec la lumière tremblante des brasiers.'
    },
    {
      id: 'ash_censer_ifrit', factionId: 'ash', name: 'Ifrit au Censoir', role: 'resistance_aura', tier: 4,
      stats: [1320, 34, 34, 47, 34, 52, 1500, 0.4, 0.6], traits: ['ground', 'heavy', 'ash'],
      attack: attack('melee', 'citadel', 'fire', 'Balance son censoir et répand une fumée protectrice.'),
      mechanics: [mechanic('ifrit_incense', 'adaptive_resistance', 'damage_received', 'nearby_allies', { radius: 110, resistanceGain: 0.08, maxStacks: 4 })],
      synergies: [synergy(['ash_wish_artillerist'], 'La fumée empêche l’interruption du premier souhait.', { channelProtectionMs: 1600 })],
      counterplay: 'Alterner les types de dégâts empêche sa résistance adaptative de culminer.', lore: 'Chaque grain d’encens contient le nom d’une ville déjà disparue.'
    },
    {
      id: 'ash_wish_artillerist', factionId: 'ash', name: 'Artilleuse des Souhaits', role: 'scaling_siege', tier: 5,
      stats: [1580, 27, 71, 75, 34, 395, 3350, 0.27, 0.69], traits: ['ground', 'elite', 'siege'],
      attack: attack('projectile_arc', 'defense_cluster', 'arcane', 'Formule un souhait dont chaque obus est plus puissant que le précédent.', { effectId: 'ash_wish_shell', projectileSpeed: 150, minimumRange: 125 }),
      mechanics: [mechanic('artillerist_three_wishes', 'scaling_barrage', 'on_attack', 'area', { damageGrowthPerCast: 0.18, maxCasts: 3, resetDelayMs: 7000 }, { effectId: 'ash_wish_shell' })],
      synergies: [synergy(['ash_mirage_weaver'], 'Un mirage peut recevoir le recul à sa place et préserver la série.', { resetPreventionChance: 0.65 })],
      counterplay: 'L’interrompre entre deux souhaits remet à zéro l’escalade de dégâts.', lore: 'Elle accorde exactement trois souhaits, tous formulés comme des explosions.'
    },

    // Nightmare
    {
      id: 'nightmare_dream_claw', factionId: 'nightmare', name: 'Griffe de Songe', role: 'fear_swarm', tier: 1,
      stats: [86, 105, 8, 5, 12, 25, 800, 0.03, 0.2], traits: ['ground', 'nightmare', 'swarm'],
      attack: attack('melee', 'nearest_defense', 'psychic', 'Griffe une tour et lui applique une charge de peur.'),
      mechanics: [mechanic('claw_fear', 'fear_stack', 'on_hit', 'defense', { stacks: 1, durationMs: 5200, damagePenaltyPerStack: 0.06 })],
      synergies: [synergy(['nightmare_screaming_sleepwalker'], 'Les cris propagent sa peur à une seconde tour.', { spreadCount: 1 })],
      counterplay: 'Les éliminer par zone avant que trois charges de peur ne s’accumulent.', lore: 'La trace laissée par une chose trop grande pour entrer entièrement dans le rêve.'
    },
    {
      id: 'nightmare_screaming_sleepwalker', factionId: 'nightmare', name: 'Somnambule Hurlant', role: 'panic_runner', tier: 2,
      stats: [255, 98, 15, 12, 18, 70, 1120, 0.09, 0.34], traits: ['ground', 'nightmare', 'fear'],
      attack: attack('sonic', 'defense_cluster', 'psychic', 'Hurle et désoriente toutes les défenses proches.'),
      mechanics: [mechanic('sleepwalker_scream', 'target_scramble', 'health_threshold', 'area', { triggerHealthRatio: 0.5, radius: 82, durationMs: 1800 })],
      synergies: [synergy(['nightmare_dream_claw'], 'Chaque Griffe proche augmente la portée du hurlement.', { radiusBonusPerAlly: 8 })],
      counterplay: 'Le contrôle avant 50 % de vie empêche son cri de désorganiser la ligne.', lore: 'Il fuit un rêve qui continue pourtant de parler à travers sa bouche.'
    },
    {
      id: 'nightmare_hypnosis_weaver', factionId: 'nightmare', name: 'Tisseuse d’Hypnose', role: 'tower_charm', tier: 3,
      stats: [385, 43, 12, 27, 20, 260, 2400, 0.16, 0.54], traits: ['floating', 'nightmare', 'controller'],
      attack: attack('channel', 'highest_attack_speed_defense', 'psychic', 'Endort une tour et détourne brièvement son prochain tir.'),
      mechanics: [mechanic('weaver_hypnosis', 'sleep_charm', 'cooldown', 'defense', { channelMs: 1200, sleepMs: 2200, redirectedShots: 1 })],
      synergies: [synergy(['nightmare_dream_eater'], 'Le Mange-Rêve se soigne quand une tour s’endort.', { healRatio: 0.08 })],
      counterplay: 'Une interruption pendant la canalisation annule entièrement l’hypnose.', lore: 'Ses fils relient les paupières des vivants à une même nuit.'
    },
    {
      id: 'nightmare_dream_eater', factionId: 'nightmare', name: 'Mange-Rêve', role: 'drain_tank', tier: 4,
      stats: [1490, 32, 35, 48, 35, 48, 1480, 0.42, 0.66], traits: ['ground', 'heavy', 'nightmare'],
      attack: attack('drain', 'feared_defense', 'psychic', 'Dévore les charges de peur pour se soigner et amplifier ses dégâts.'),
      mechanics: [mechanic('eater_consume_fear', 'consume_debuff', 'on_attack', 'defense', { stacksConsumed: 3, healRatio: 0.12, damageMultiplier: 1.65 }, { summonIds: ['nightmare_dream_claw'] })],
      synergies: [synergy(['nightmare_hypnosis_weaver'], 'Une cible endormie compte comme trois charges de peur.', { virtualFearStacks: 3 })],
      counterplay: 'Purifier la peur prive le Mange-Rêve de soin et de son attaque amplifiée.', lore: 'Il grossit avec tout ce que la ville refuse de se rappeler au réveil.'
    },
    {
      id: 'nightmare_bell_toll', factionId: 'nightmare', name: 'Glas du Cauchemar', role: 'elite_pulse_boss', tier: 5,
      stats: [2380, 25, 54, 80, 38, 315, 2950, 0.36, 0.78], traits: ['floating', 'elite', 'nightmare'],
      attack: attack('area_pulse', 'all_defenses_in_range', 'psychic', 'Fait résonner une onde de peur sur toute la ligne.', { effectId: 'nightmare_bell_wave' }),
      mechanics: [mechanic('bell_third_toll', 'stacking_global_pulse', 'cooldown', 'all_defenses', { fearStacksPerPulse: 1, sleepThreshold: 3, cooldownMs: 6200 }, { effectId: 'nightmare_bell_wave' })],
      synergies: [synergy(['nightmare_dream_eater'], 'Le troisième glas déclenche immédiatement la consommation du Mange-Rêve.', { consumeTriggerStacks: 3 })],
      counterplay: 'L’étourdir avant chaque troisième glas remet son cycle à une cloche.', lore: 'Personne ne sait qui la sonne ; chacun reconnaît pourtant son propre enterrement.'
    }
  ];

  function makeEnemy(spec) {
    const [hp, speed, damage, reward, radius, attackRange, attackCooldownMs, armor, controlResistance] = spec.stats;
    const effectiveHp = hp / Math.max(0.3, 1 - armor);
    const sustainedDps = damage / Math.max(0.35, attackCooldownMs / 1000);
    const rangeMultiplier = 1 + Math.max(0, Math.min(0.55, (attackRange - 35) / 480));
    const mobilityMultiplier = 0.82 + (Math.min(180, speed) / 180) * 0.32;
    const resistanceMultiplier = 1 + controlResistance * 0.3;
    const mechanicType = spec.mechanics[0]?.type || '';
    const mechanicMultiplier = /heal|revive|deploy|summon|redirect|shared|control|sleep|fear|silence|infection|rewind|barrier|mark|pull|shred|stealth/.test(mechanicType)
      ? 1.16
      : (/execute|critical|retaliation|splash|chain|siege|pulse|burn|drain/.test(mechanicType) ? 1.1 : 1.04);
    const tierMultiplier = 1 + (spec.tier - 1) * 0.04;
    const threatRating = Math.max(5, Math.min(80, Math.round(
      ((effectiveHp / 120) + (sustainedDps * 0.5) + (spec.tier * 1.5))
      * rangeMultiplier * mobilityMultiplier * resistanceMultiplier * mechanicMultiplier * tierMultiplier
    )));
    return {
      id: spec.id,
      name: spec.name,
      factionId: spec.factionId,
      role: spec.role,
      tier: spec.tier,
      spriteSrc: `assets/animations/enemy-legions/enemies/${spec.id}.webp`,
      sprite: sheet(`assets/animations/enemy-legions/enemies/${spec.id}.webp`),
      stats: { hp, speed, damage, reward, radius, attackRange, attackCooldownMs, armor, controlResistance },
      balance: {
        threatRating,
        effectiveHp: Math.round(effectiveHp),
        sustainedDps: Number(sustainedDps.toFixed(2)),
        rangeMultiplier: Number(rangeMultiplier.toFixed(3)),
        mechanicMultiplier
      },
      traits: spec.traits,
      attack: spec.attack,
      mechanics: spec.mechanics,
      synergies: spec.synergies,
      counterplay: spec.counterplay,
      codex: {
        title: spec.name,
        threat: ['I', 'II', 'III', 'IV', 'V'][spec.tier - 1],
        summary: `${spec.name} — ${spec.role.replaceAll('_', ' ')} de la faction ${factionBlueprints[spec.factionId].name}.`,
        tactics: spec.counterplay,
        lore: spec.lore
      }
    };
  }

  const enemies = Object.fromEntries(specs.map(spec => [spec.id, makeEnemy(spec)]));
  const factions = Object.fromEntries(Object.values(factionBlueprints).map(faction => [faction.id, {
    ...faction,
    enemyIds: specs.filter(spec => spec.factionId === faction.id).map(spec => spec.id)
  }]));

  const wavePackages = Object.fromEntries(Object.values(factions).map((faction, factionIndex) => [faction.id, {
    id: `${faction.id}_combined_arms`,
    name: `Doctrine — ${faction.name}`,
    factionId: faction.id,
    recommendedWave: 4 + factionIndex * 2,
    difficultyRating: 2 + Math.floor(factionIndex / 2),
    groups: faction.enemyIds.map((type, index) => ({
      type,
      count: Math.max(1, 8 - index),
      intervalMs: 520 + index * 280,
      delayMs: index * 1350,
      formationRole: enemies[type].role
    })),
    synergyPlan: faction.doctrine,
    counterplay: faction.counterplay
  }]));

  const contract = deepFreeze({
    version: VERSION,
    schemaVersion: 1,
    spriteContract: { columns: 4, rows: 1, frames: { ...SPRITE_FRAMES } },
    factions,
    enemies,
    effects,
    wavePackages
  });

  global.INFERNAL_CITY_ENEMY_LEGIONS = contract;

  const expansion = global.INFERNAL_CITY_EXPANSION;
  if (expansion && expansion.enemyDefinitions) {
    global.INFERNAL_CITY_EXPANSION = deepFreeze({
      ...expansion,
      enemyDefinitions: {
        ...expansion.enemyDefinitions,
        ...enemies
      }
    });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = contract;
}(typeof window !== 'undefined' ? window : globalThis));
