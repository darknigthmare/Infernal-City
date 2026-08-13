(function installInfernalCityCampaignContent(global) {
  'use strict';

  const base = global.INFERNAL_CITY_EXPANSION;
  if (!base || global.INFERNAL_CITY_CAMPAIGN_CONTENT) return;

  const waveNames = [
    'Les Griffes de Kali-X', 'Le Duel de Kali-X',
    'Cendres de Morwen', 'Le Sabbat de Morwen',
    'Les Forges de Vharra', 'Le Creuset de Vharra',
    'Procession de Nekrata', 'L’Ossuaire de Nekrata',
    'Voiles de Seraphyne', 'Le Vide de Seraphyne',
    'La Cour de Malika', 'Le Verdict de Malika',
    'Les Marionnettes de Mircalla', 'La Maison de Mircalla',
    'La Chasse de Skadi', 'Le Fimbul de Skadi',
    'Le Jardin de Lilith', 'L’Éden de Lilith',
    'Les Ombres de Noctis', 'La Nuit de Noctis'
  ];
  const enemyCycles = [
    ['runner', 'swarmer', 'flying'],
    ['brute', 'runner', 'bulwark'],
    ['artillery', 'swarmer', 'splitter'],
    ['bulwark', 'brute', 'artillery'],
    ['flying', 'runner', 'splitter'],
    ['splitter', 'bulwark', 'artillery'],
    ['runner', 'flying', 'artillery'],
    ['brute', 'splitter', 'bulwark'],
    ['swarmer', 'flying', 'runner'],
    ['bulwark', 'artillery', 'splitter']
  ];
  const tenThronesWaves = waveNames.map((name, index) => {
    const wave = index + 1;
    const contract = Math.floor(index / 2);
    const isBoss = wave % 2 === 0;
    const types = enemyCycles[contract];
    const baseCount = 7 + wave;
    return {
      number: wave,
      name,
      contract: contract + 1,
      objective: isBoss ? 'Interrompre le rituel du Trône' : 'Sécuriser le relais avancé',
      layoutPolicy: ['western_wall', 'southern_watch', 'twin_rift', 'convergence'][contract % 4],
      intermissionMs: isBoss ? 7200 : 5200,
      reward: 42 + (wave * 12),
      groups: [
        { type: types[0], count: baseCount + (isBoss ? 5 : 0), intervalMs: Math.max(260, 720 - wave * 16), delayMs: 0, routePattern: [contract % 4, (contract + 2) % 4] },
        { type: types[1], count: baseCount + 3, intervalMs: Math.max(220, 620 - wave * 14), delayMs: 850, routePattern: [(contract + 1) % 4, (contract + 3) % 4] },
        { type: types[2], count: Math.max(4, Math.round(baseCount * 0.62)), intervalMs: Math.max(360, 920 - wave * 15), delayMs: 1800, routePattern: [contract % 4, (contract + 1) % 4, (contract + 2) % 4, (contract + 3) % 4] }
      ]
    };
  });

  const extraMutators = [
    ['ashen_tax', 'Dîme de Cendre', 'Les constructions coûtent plus cher, les objectifs secondaires rapportent davantage.', 2, { defenseCostMultiplier: 1.15, secondaryRewardMultiplier: 1.5 }],
    ['glass_legion', 'Légion de Verre', 'Les ennemis frappent plus fort mais possèdent moins de santé.', 2, { enemyDamageMultiplier: 1.35, enemyHpMultiplier: 0.78 }],
    ['black_tide', 'Marée Noire', 'Les groupes sont plus nombreux et les troupes terrestres accélèrent.', 2, { groupCountMultiplier: 1.25, groundSpeedMultiplier: 1.08 }],
    ['silent_sky', 'Ciel Silencieux', 'Les volants entrent furtivement mais rapportent davantage de Bio-Coins.', 3, { flyingStealthSeconds: 3.5, flyingRewardMultiplier: 1.25 }],
    ['thorn_road', 'Route d’Épines', 'Les routes ralentissent les ennemis mais drainent les barrières.', 2, { enemySpeedMultiplier: 0.88, barrierHpDrainPerSecond: 0.5 }],
    ['royal_guard', 'Garde Royale', 'Davantage de lourds escortent des spécialistes renforcés.', 3, { heavyCountMultiplier: 1.4, specialistHpMultiplier: 1.2 }],
    ['broken_clock', 'Horloge Brisée', 'Les ennemis attaquent plus vite, mais le score de fin augmente.', 2, { enemyFireRateMultiplier: 0.78, completionScoreMultiplier: 1.12 }],
    ['blood_price', 'Prix du Sang', 'La vente rembourse moins, les éliminations valent davantage.', 3, { sellRatioMultiplier: 0.65, coinRewardMultiplier: 1.22 }],
    ['storm_cells', 'Cellules d’Orage', 'Les spécialistes résistent au contrôle mais rapportent davantage.', 3, { specialistControlResistanceMultiplier: 0.7, specialistRewardMultiplier: 1.25 }],
    ['hollow_armor', 'Armure Creuse', 'Les lourds résistent aux tirs directs mais craignent les zones.', 3, { heavyDirectDamageMultiplier: 0.78, heavySplashDamageMultiplier: 1.3 }],
    ['hungry_rift', 'Faille Affamée', 'La Citadelle perd lentement des points de vie, les caisses sont plus fréquentes.', 3, { citadelHpDrainPerSecond: 0.55, crateChanceMultiplier: 1.65 }],
    ['queen_gambit', 'Gambit de la Reine', 'Un objectif secondaire parfait multiplie le score.', 2, { secondaryRewardMultiplier: 2, completionScoreMultiplier: 1.1 }],
    ['neon_fog', 'Brouillard Néon', 'La portée des défenses baisse, les ennemis révélés subissent plus de dégâts.', 2, { defenseRangeMultiplier: 0.86, revealedDamageTakenMultiplier: 1.25 }],
    ['chain_reaction', 'Réaction en Chaîne', 'Les scissipares se multiplient, les dégâts de zone augmentent.', 3, { splitOnDeathChance: 0.18, splashDamageMultiplier: 1.22 }],
    ['siege_moon', 'Lune de Siège', 'L’artillerie tire plus vite, les projectiles hostiles sont plus lents.', 3, { artilleryFireRateMultiplier: 0.72, hostileProjectileSpeedMultiplier: 0.82 }],
    ['last_bastion', 'Dernier Bastion', 'Les barrières sont renforcées, les autres défenses sont plus fragiles.', 2, { barrierHpMultiplier: 1.6, defenseHpMultiplier: 0.88 }],
    ['wild_magic', 'Magie Sauvage', 'Les effets de contrôle durent plus longtemps mais les boss récupèrent plus vite.', 3, { controlDurationMultiplier: 1.28, bossControlResistanceMultiplier: 0.55 }],
    ['coin_eclipse', 'Éclipse Monétaire', 'Moins de Bio-Coins, davantage de Crédits aux paliers.', 2, { coinRewardMultiplier: 0.76, milestoneMetaMultiplier: 1.5 }]
  ].map(([id, name, description, difficulty, modifiers]) => ({ id, name, description, difficulty, modifiers, tags: ['professional', 'infinitum'] }));

  const defenseRoles = {
    direct: ['vulcan_turret', 'plasma_mortar', 'missile_pod', 'railgun_pylon', 'sawblade_turret', 'orbital_beam'],
    antiAir: ['laser_drone', 'railgun_pylon', 'tesla_spire', 'missile_pod'],
    utility: ['cryo_cannon', 'gravity_well', 'sonic_cannon', 'emp_tower', 'aegis_barrier', 'magnet_drone', 'blood_shrine']
  };
  function stablePick(rng, values) {
    return values[Math.floor(rng() * values.length) % values.length];
  }
  function createProfessionalDaily(value = new Date(), playerSalt = '') {
    const baseChallenge = base.utils.createDailyChallenge(value, playerSalt);
    const rng = base.utils.createSeededRng(baseChallenge.seed ^ 0xa53c9e1d);
    const heroines = ['aria', 'kira', 'rin', 'selene', 'vespera', 'carmilla', ...Object.keys(global.INFERNAL_CITY_CHARACTERS?.heroines || {})];
    const pickedDefenseIds = [];
    const pickRole = role => {
      const unused = defenseRoles[role].filter(id => !pickedDefenseIds.includes(id));
      const choice = stablePick(rng, unused.length > 0 ? unused : defenseRoles[role]);
      pickedDefenseIds.push(choice);
      return choice;
    };
    return {
      ...baseChallenge,
      heroId: stablePick(rng, [...new Set(heroines)]),
      startingDefenseIds: [
        pickRole('direct'),
        pickRole('antiAir'),
        pickRole('utility')
      ]
    };
  }

  global.INFERNAL_CITY_CAMPAIGN_CONTENT = Object.freeze({
    version: '3.0.0',
    tenThronesWaves,
    infinitumMutators: Object.freeze([...base.infinitumMutators, ...extraMutators]),
    createDailyChallenge: createProfessionalDaily,
    defenseRoles: Object.freeze(defenseRoles)
  });
})(typeof window !== 'undefined' ? window : globalThis);
