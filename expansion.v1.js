/*
 * Infernal City — Expansion data pack 2.3
 *
 * This file deliberately contains data and deterministic helpers only. It can
 * be loaded before or after the game engine and exposes one stable browser
 * contract: window.INFERNAL_CITY_EXPANSION.
 */
(function exposeInfernalCityExpansion(root) {
  'use strict';

  const VERSION = '2.3.0';
  const WORLD = Object.freeze({ width: 1200, height: 800 });

  function point(x, y) {
    return { x, y };
  }

  function bounds(minX, minY, maxX, maxY) {
    return {
      minX,
      minY,
      maxX,
      maxY,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  function route(id, side, spawn, polyline, cadenceOffsetMs = 0) {
    return {
      id,
      side,
      spawn,
      polyline,
      cadenceOffsetMs
    };
  }

  const worldLayouts = {
    convergence: {
      id: 'convergence',
      name: 'La Convergence',
      description: 'La Citadelle centrale subit une convergence classique depuis les quatre portes cardinales.',
      tacticalNote: 'Le front le plus polyvalent : les défenses doivent couvrir plusieurs axes et pivoter rapidement.',
      world: { ...WORLD },
      terrainSrc: 'assets/environment/infernal-city-approach-terrain.png',
      previewSrc: 'assets/environment/infernal-city-approach-terrain.png',
      citadel: { x: 600, y: 400, radius: 76, facing: 'south' },
      approachBounds: bounds(-320, -320, 1520, 1120),
      buildBounds: bounds(240, 140, 960, 660),
      spawnRoutes: [
        route('convergence_north', 'north', point(600, -300), [
          point(600, -300), point(600, 40), point(530, 170), point(545, 285), point(600, 400)
        ], 0),
        route('convergence_east', 'east', point(1500, 400), [
          point(1500, 400), point(1160, 400), point(1030, 330), point(915, 345), point(600, 400)
        ], 220),
        route('convergence_south', 'south', point(600, 1100), [
          point(600, 1100), point(600, 760), point(670, 630), point(655, 515), point(600, 400)
        ], 440),
        route('convergence_west', 'west', point(-300, 400), [
          point(-300, 400), point(40, 400), point(170, 470), point(285, 455), point(600, 400)
        ], 660)
      ]
    },

    western_wall: {
      id: 'western_wall',
      name: 'Le Mur Occidental',
      description: 'La Citadelle est adossée au bord gauche ; trois colonnes ennemies traversent la longue plaine depuis l’est.',
      tacticalNote: 'Un front lisible et profond, idéal pour anticiper les hordes, créer des couloirs et superposer l’artillerie.',
      world: { ...WORLD },
      terrainSrc: 'assets/environment/map-western-wall.png',
      previewSrc: 'assets/environment/map-western-wall.png',
      citadel: { x: 140, y: 400, radius: 78, facing: 'east' },
      approachBounds: bounds(-120, -160, 1520, 960),
      buildBounds: bounds(235, 92, 1080, 708),
      spawnRoutes: [
        route('western_wall_east_north', 'east', point(1500, 150), [
          point(1500, 150), point(1180, 150), point(1010, 235), point(770, 245),
          point(540, 300), point(330, 345), point(140, 400)
        ], 0),
        route('western_wall_east_center', 'east', point(1500, 400), [
          point(1500, 400), point(1190, 400), point(960, 400), point(720, 400),
          point(470, 400), point(280, 400), point(140, 400)
        ], 260),
        route('western_wall_east_south', 'east', point(1500, 650), [
          point(1500, 650), point(1180, 650), point(1010, 565), point(770, 555),
          point(540, 500), point(330, 455), point(140, 400)
        ], 520)
      ]
    },

    southern_watch: {
      id: 'southern_watch',
      name: 'La Veille du Sud',
      description: 'La Citadelle domine le nord tandis que les hordes remontent trois vallées depuis la bordure sud.',
      tacticalNote: 'Les portées verticales et les zones de ralentissement contrôlent les lacets avant leur convergence finale.',
      world: { ...WORLD },
      terrainSrc: 'assets/environment/map-southern-watch.png',
      previewSrc: 'assets/environment/map-southern-watch.png',
      citadel: { x: 600, y: 125, radius: 76, facing: 'south' },
      approachBounds: bounds(-180, -140, 1380, 1120),
      buildBounds: bounds(185, 215, 1015, 690),
      spawnRoutes: [
        route('southern_watch_south_west', 'south', point(250, 1100), [
          point(250, 1100), point(250, 770), point(340, 650), point(360, 500),
          point(455, 360), point(520, 245), point(600, 125)
        ], 0),
        route('southern_watch_south_center', 'south', point(600, 1100), [
          point(600, 1100), point(600, 770), point(560, 650), point(620, 520),
          point(575, 380), point(600, 250), point(600, 125)
        ], 240),
        route('southern_watch_south_east', 'south', point(950, 1100), [
          point(950, 1100), point(950, 770), point(860, 650), point(840, 500),
          point(745, 360), point(680, 245), point(600, 125)
        ], 480)
      ]
    },

    twin_rift: {
      id: 'twin_rift',
      name: 'Les Failles Jumelles',
      description: 'Deux portes abyssales, au nord-est et au sud-est, encerclent la Citadelle retranchée à l’ouest.',
      tacticalNote: 'Deux fronts éloignés partagent un étranglement tardif : spécialisez chaque aile avant la jonction.',
      world: { ...WORLD },
      terrainSrc: 'assets/environment/map-twin-rift.png',
      previewSrc: 'assets/environment/map-twin-rift.png',
      citadel: { x: 165, y: 400, radius: 80, facing: 'east' },
      approachBounds: bounds(-120, -240, 1520, 1040),
      buildBounds: bounds(245, 105, 1060, 695),
      spawnRoutes: [
        route('twin_rift_east_high', 'east', point(1500, 80), [
          point(1500, 80), point(1190, 80), point(1035, 170), point(835, 190),
          point(690, 285), point(485, 315), point(310, 370), point(165, 400)
        ], 0),
        route('twin_rift_east_low', 'east', point(1500, 720), [
          point(1500, 720), point(1190, 720), point(1035, 630), point(835, 610),
          point(690, 515), point(485, 485), point(310, 430), point(165, 400)
        ], 360)
      ]
    }
  };

  const enemyDefinitions = {
    swarmer: {
      id: 'swarmer',
      name: 'Larve de Cendre',
      role: 'horde',
      stats: { hp: 55, speed: 72, damage: 5, reward: 3, radius: 13, attackRange: 22, attackCooldownMs: 900 },
      traits: ['ground', 'light', 'mass_spawn']
    },
    runner: {
      id: 'runner',
      name: 'Traqueuse Néon',
      role: 'flanker',
      stats: { hp: 95, speed: 128, damage: 8, reward: 5, radius: 14, attackRange: 24, attackCooldownMs: 760 },
      traits: ['ground', 'fast', 'slow_vulnerable']
    },
    brute: {
      id: 'brute',
      name: 'Brute Infernale',
      role: 'tank',
      stats: { hp: 620, speed: 42, damage: 30, reward: 18, radius: 27, attackRange: 34, attackCooldownMs: 1350 },
      traits: ['ground', 'heavy', 'knockback_resistant']
    },
    flying: {
      id: 'flying',
      name: 'Harpie du Vide',
      role: 'aerial_flanker',
      stats: { hp: 175, speed: 104, damage: 12, reward: 10, radius: 18, attackRange: 30, attackCooldownMs: 820 },
      traits: ['flying', 'ignores_ground_blockers', 'targeted_by_anti_air'],
      counterplay: 'Traverse les pièges au sol ; les drones, Tesla, railguns et missiles conservent leur verrouillage.'
    },
    bulwark: {
      id: 'bulwark',
      name: 'Rempart Possédé',
      role: 'shield_support',
      stats: { hp: 980, speed: 34, damage: 20, reward: 25, radius: 30, attackRange: 36, attackCooldownMs: 1450 },
      traits: ['ground', 'heavy', 'frontal_shield', 'ally_armor_aura'],
      shield: { capacity: 420, frontalArcDegrees: 150, regenerationPerSecond: 0 },
      aura: { radius: 105, alliedDamageReduction: 0.18 },
      counterplay: 'Contourner le bouclier, le repousser ou employer les dégâts de zone derrière sa ligne.'
    },
    artillery: {
      id: 'artillery',
      name: 'Bombardière Hextech',
      role: 'siege',
      stats: { hp: 360, speed: 38, damage: 44, reward: 22, radius: 23, attackRange: 330, attackCooldownMs: 2400 },
      traits: ['ground', 'ranged', 'targets_defenses', 'minimum_range'],
      siege: { minimumRange: 115, splashRadius: 62, deploymentTimeMs: 900, stunDurationMs: 800 },
      counterplay: 'L’intercepter avant son déploiement ou la forcer à combattre sous sa portée minimale.'
    },
    splitter: {
      id: 'splitter',
      name: 'Abomination Scissipare',
      role: 'multiplying_assault',
      stats: { hp: 410, speed: 58, damage: 16, reward: 16, radius: 22, attackRange: 28, attackCooldownMs: 980 },
      traits: ['ground', 'splits_on_death', 'acid_resistant'],
      split: { childType: 'swarmer', childCount: 3, childHpMultiplier: 0.8, spreadRadius: 34 },
      counterplay: 'Achever les groupes dans une zone persistante afin de supprimer immédiatement les rejetons.'
    }
  };

  const campaignWaves = [
    {
      number: 1,
      name: 'Premières braises',
      intermissionMs: 9000,
      reward: 45,
      groups: [
        { type: 'swarmer', count: 12, intervalMs: 700, delayMs: 0, routePattern: [0, 1, 2, 3] }
      ]
    },
    {
      number: 2,
      name: 'La chasse commence',
      intermissionMs: 8500,
      reward: 50,
      groups: [
        { type: 'swarmer', count: 10, intervalMs: 620, delayMs: 0, routePattern: [0, 2] },
        { type: 'runner', count: 5, intervalMs: 900, delayMs: 2600, routePattern: [1, 3] }
      ]
    },
    {
      number: 3,
      name: 'Poids mort',
      intermissionMs: 8500,
      reward: 58,
      groups: [
        { type: 'brute', count: 2, intervalMs: 3200, delayMs: 0, routePattern: [0, 2] },
        { type: 'swarmer', count: 18, intervalMs: 480, delayMs: 900, routePattern: [1, 3, 0, 2] }
      ]
    },
    {
      number: 4,
      name: 'Ombres au-dessus des murs',
      intermissionMs: 8000,
      reward: 66,
      groups: [
        { type: 'flying', count: 8, intervalMs: 760, delayMs: 0, routePattern: [0, 1, 2, 3] },
        { type: 'runner', count: 8, intervalMs: 580, delayMs: 1800, routePattern: [3, 1] }
      ]
    },
    {
      number: 5,
      name: 'Le premier rempart',
      intermissionMs: 8000,
      reward: 74,
      groups: [
        { type: 'bulwark', count: 2, intervalMs: 4800, delayMs: 0, routePattern: [0, 2] },
        { type: 'swarmer', count: 24, intervalMs: 420, delayMs: 500, routePattern: [0, 0, 2, 2] },
        { type: 'runner', count: 6, intervalMs: 760, delayMs: 3200, routePattern: [1, 3] }
      ]
    },
    {
      number: 6,
      name: 'Batteries abyssales',
      intermissionMs: 7800,
      reward: 82,
      groups: [
        { type: 'artillery', count: 3, intervalMs: 3600, delayMs: 0, routePattern: [1, 2, 0] },
        { type: 'brute', count: 4, intervalMs: 2400, delayMs: 900, routePattern: [1, 2] },
        { type: 'swarmer', count: 16, intervalMs: 470, delayMs: 1800, routePattern: [0, 3] }
      ]
    },
    {
      number: 7,
      name: 'Chair divisible',
      intermissionMs: 7600,
      reward: 90,
      groups: [
        { type: 'splitter', count: 8, intervalMs: 1100, delayMs: 0, routePattern: [0, 2, 1, 3] },
        { type: 'flying', count: 10, intervalMs: 650, delayMs: 2200, routePattern: [3, 1] }
      ]
    },
    {
      number: 8,
      name: 'Tenaille',
      intermissionMs: 7400,
      reward: 102,
      groups: [
        { type: 'bulwark', count: 3, intervalMs: 4000, delayMs: 0, routePattern: [0, 2, 1] },
        { type: 'runner', count: 18, intervalMs: 390, delayMs: 600, routePattern: [0, 2] },
        { type: 'artillery', count: 2, intervalMs: 4600, delayMs: 3700, routePattern: [1, 3] }
      ]
    },
    {
      number: 9,
      name: 'Pluie noire',
      intermissionMs: 7200,
      reward: 114,
      groups: [
        { type: 'flying', count: 20, intervalMs: 430, delayMs: 0, routePattern: [0, 1, 3, 2] },
        { type: 'splitter', count: 8, intervalMs: 960, delayMs: 2400, routePattern: [1, 3] },
        { type: 'brute', count: 4, intervalMs: 2700, delayMs: 3800, routePattern: [0, 2] }
      ]
    },
    {
      number: 10,
      name: 'Ligne de siège',
      intermissionMs: 7000,
      reward: 128,
      groups: [
        { type: 'bulwark', count: 4, intervalMs: 3500, delayMs: 0, routePattern: [0, 1, 2, 3] },
        { type: 'artillery', count: 5, intervalMs: 2700, delayMs: 1000, routePattern: [0, 1, 2, 3] },
        { type: 'swarmer', count: 30, intervalMs: 330, delayMs: 1500, routePattern: [0, 1, 2, 3] }
      ]
    },
    {
      number: 11,
      name: 'Fracture accélérée',
      intermissionMs: 6800,
      reward: 142,
      groups: [
        { type: 'splitter', count: 14, intervalMs: 720, delayMs: 0, routePattern: [0, 2] },
        { type: 'runner', count: 24, intervalMs: 310, delayMs: 1200, routePattern: [1, 3, 3, 1] },
        { type: 'flying', count: 12, intervalMs: 520, delayMs: 3200, routePattern: [0, 2] }
      ]
    },
    {
      number: 12,
      name: 'Marche des bastions',
      intermissionMs: 6600,
      reward: 158,
      groups: [
        { type: 'bulwark', count: 6, intervalMs: 2700, delayMs: 0, routePattern: [0, 1, 2, 3] },
        { type: 'brute', count: 10, intervalMs: 1500, delayMs: 600, routePattern: [0, 1, 2, 3] },
        { type: 'artillery', count: 4, intervalMs: 3000, delayMs: 2600, routePattern: [3, 1, 2, 0] }
      ]
    },
    {
      number: 13,
      name: 'Ciel et cendres',
      intermissionMs: 6400,
      reward: 176,
      groups: [
        { type: 'flying', count: 30, intervalMs: 300, delayMs: 0, routePattern: [0, 1, 2, 3] },
        { type: 'swarmer', count: 42, intervalMs: 250, delayMs: 800, routePattern: [3, 2, 1, 0] },
        { type: 'bulwark', count: 4, intervalMs: 3200, delayMs: 2400, routePattern: [0, 2] }
      ]
    },
    {
      number: 14,
      name: 'Assaut total',
      intermissionMs: 6200,
      reward: 198,
      groups: [
        { type: 'artillery', count: 7, intervalMs: 2100, delayMs: 0, routePattern: [0, 1, 2, 3] },
        { type: 'splitter', count: 18, intervalMs: 610, delayMs: 700, routePattern: [1, 3, 0, 2] },
        { type: 'runner', count: 30, intervalMs: 270, delayMs: 1800, routePattern: [0, 2, 1, 3] },
        { type: 'brute', count: 8, intervalMs: 1700, delayMs: 3300, routePattern: [0, 1, 2, 3] }
      ]
    },
    {
      number: 15,
      name: 'Guerre des Quatre Portes',
      intermissionMs: 0,
      reward: 250,
      groups: [
        { type: 'bulwark', count: 8, intervalMs: 2200, delayMs: 0, routePattern: [0, 1, 2, 3] },
        { type: 'artillery', count: 8, intervalMs: 1900, delayMs: 700, routePattern: [3, 2, 1, 0] },
        { type: 'flying', count: 24, intervalMs: 360, delayMs: 1200, routePattern: [0, 2, 1, 3] },
        { type: 'splitter', count: 20, intervalMs: 540, delayMs: 1900, routePattern: [1, 3, 0, 2] },
        { type: 'brute', count: 12, intervalMs: 1300, delayMs: 3000, routePattern: [0, 1, 2, 3] },
        { type: 'runner', count: 36, intervalMs: 240, delayMs: 4400, routePattern: [3, 1, 2, 0] }
      ]
    }
  ];

  const waveScripts = {
    siege_15: {
      id: 'siege_15',
      name: 'La Guerre des Quatre Portes',
      description: 'Quinze vagues entièrement scriptées, compatibles avec tout nombre de routes grâce aux index cycliques.',
      finalWave: 15,
      deterministic: true,
      waves: campaignWaves
    }
  };

  const heroKits = {
    aria: {
      id: 'aria',
      name: 'Commandante Aria',
      role: 'gardienne et contrôle',
      passive: {
        id: 'aegis_discipline',
        name: 'Discipline Aegis',
        description: 'Les défenses proches de la Citadelle gagnent 16 % de durabilité et résistent au premier étourdissement.',
        modifiers: { defenseHpMultiplier: 1.16, stunIgnoresPerWave: 1, radius: 250 }
      },
      active: {
        id: 'aegis_intercept',
        name: 'Interception Aegis',
        description: 'Pose un dôme ciblable qui bloque les projectiles et provoque les ennemis terrestres pendant six secondes.',
        cooldownMs: 12000,
        targeting: 'ground_point',
        effect: { radius: 125, durationMs: 6000, shieldHp: 850, taunt: true }
      },
      ultimate: {
        id: 'last_line_protocol',
        name: 'Protocole Dernière Ligne',
        description: 'Restaure la Citadelle et rend toutes les barrières invulnérables durant un bref contre-assaut.',
        chargeRequired: 100,
        effect: { citadelHealPercent: 0.2, barrierInvulnerabilityMs: 7000, defenseDamageMultiplier: 1.25 }
      },
      preferredDefenses: ['aegis_barrier', 'sonic_cannon', 'vulcan_turret']
    },
    kira: {
      id: 'kira',
      name: 'Kira l’Ombre',
      role: 'assassinat et diversion',
      passive: {
        id: 'marked_from_shadow',
        name: 'Marquée dans l’Ombre',
        description: 'La première cible touchée sur chaque route devient marquée et subit davantage de dégâts précis.',
        modifiers: { markedDamageTakenMultiplier: 1.22, markDurationMs: 8000, marksPerRoute: 1 }
      },
      active: {
        id: 'shadow_decoy',
        name: 'Hologramme d’Ombre',
        description: 'Projette un leurre à l’endroit choisi ; sa destruction déclenche une explosion de plasma.',
        cooldownMs: 10000,
        targeting: 'ground_point',
        effect: { durationMs: 5200, tauntRadius: 150, explosionDamage: 260, explosionRadius: 105 }
      },
      ultimate: {
        id: 'ghost_execution',
        name: 'Exécution Fantôme',
        description: 'Frappe successivement les six ennemis non-boss ayant le plus de points de vie et marque les survivants.',
        chargeRequired: 100,
        effect: { targetCount: 6, damage: 620, bossDamageMultiplier: 0.35, appliesMark: true }
      },
      preferredDefenses: ['railgun_pylon', 'laser_drone', 'landmine']
    },
    rin: {
      id: 'rin',
      name: 'Rin',
      role: 'dégâts persistants et rupture',
      passive: {
        id: 'sacred_embers',
        name: 'Braises Sacrées',
        description: 'Les dégâts de feu prolongés réduisent progressivement l’armure des ennemis.',
        modifiers: { armorReductionPerStack: 0.035, maxStacks: 5, stackDurationMs: 4500 }
      },
      active: {
        id: 'flame_vortex',
        name: 'Vortex Enflammé',
        description: 'Crée un vortex ciblé qui attire les unités légères et applique des brûlures cumulables.',
        cooldownMs: 14000,
        targeting: 'ground_point',
        effect: { radius: 145, durationMs: 6500, damagePerSecond: 72, pullStrength: 0.5, burnStacksPerSecond: 1 }
      },
      ultimate: {
        id: 'phoenix_covenant',
        name: 'Pacte du Phénix',
        description: 'Enflamme toutes les routes révélées et fait exploser immédiatement les brûlures maximales.',
        chargeRequired: 100,
        effect: { routeDamagePerSecond: 95, durationMs: 5500, detonateMaxBurn: true }
      },
      preferredDefenses: ['flame_trap', 'napalm_mine', 'plasma_mortar']
    },
    selene: {
      id: 'selene',
      name: 'Sélène',
      role: 'prédiction et ralentissement',
      passive: {
        id: 'lunar_forecast',
        name: 'Prévision Lunaire',
        description: 'Révèle la composition de la prochaine vague et augmente la portée des défenses contre les ennemis ralentis.',
        modifiers: { revealWavesAhead: 1, rangeVsSlowedMultiplier: 1.14 }
      },
      active: {
        id: 'lunar_lance',
        name: 'Faisceau Lunaire',
        description: 'Trace une ligne orientable qui blesse et ralentit toutes les cibles traversées.',
        cooldownMs: 11000,
        targeting: 'drag_line',
        effect: { length: 560, width: 52, damage: 310, slowMultiplier: 0.52, slowDurationMs: 5000 }
      },
      ultimate: {
        id: 'frozen_second',
        name: 'Seconde Immobile',
        description: 'Suspend les ennemis et projectiles hostiles ; les défenses continuent de tirer normalement.',
        chargeRequired: 100,
        effect: { enemyTimeStopMs: 5000, hostileProjectileTimeStopMs: 5000, defensesUnaffected: true }
      },
      preferredDefenses: ['cryo_cannon', 'gravity_well', 'orbital_beam']
    },
    vespera: {
      id: 'vespera',
      name: 'Impératrice Vespera',
      role: 'domination et conversion',
      passive: {
        id: 'imperial_tribute',
        name: 'Tribut Impérial',
        description: 'Les élites rapportent davantage et leur mort renforce brièvement les défenses adjacentes.',
        modifiers: { eliteRewardMultiplier: 1.3, onEliteDeathDamageMultiplier: 1.18, buffDurationMs: 6000, radius: 180 }
      },
      active: {
        id: 'abyssal_command',
        name: 'Ordre Abyssal',
        description: 'Retourne temporairement un ennemi non-boss ciblé contre sa propre colonne.',
        cooldownMs: 16000,
        targeting: 'enemy',
        effect: { durationMs: 8500, convertedDamageMultiplier: 1.4, invalidTraits: ['boss'] }
      },
      ultimate: {
        id: 'sovereigns_decree',
        name: 'Décret de la Souveraine',
        description: 'Terrifie chaque route et convertit définitivement un ennemi spécialisé affaibli.',
        chargeRequired: 100,
        effect: { fearDurationMs: 4200, permanentConvertHealthThreshold: 0.2, permanentConvertCount: 1 }
      },
      preferredDefenses: ['blood_shrine', 'bio_siphon', 'emp_tower']
    },
    carmilla: {
      id: 'carmilla',
      name: 'Carmilla',
      role: 'sacrifice et récupération',
      passive: {
        id: 'crimson_interest',
        name: 'Intérêt Écarlate',
        description: 'Les soins excédentaires de la Citadelle deviennent une réserve de puissance pour le prochain pouvoir.',
        modifiers: { overhealToChargeRatio: 0.45, maximumStoredCharge: 35 }
      },
      active: {
        id: 'blood_pact',
        name: 'Pacte de Sang',
        description: 'Sacrifie une part des points de vie d’une défense pour décupler ses tirs et lui donner du vol de vie.',
        cooldownMs: 13000,
        targeting: 'defense',
        effect: { defenseHpCostPercent: 0.22, damageMultiplier: 1.75, fireRateMultiplier: 0.65, lifesteal: 0.18, durationMs: 7500 }
      },
      ultimate: {
        id: 'scarlet_requiem',
        name: 'Requiem Écarlate',
        description: 'Draine toutes les hordes, soigne les défenses et rend la Citadelle incapable de tomber pendant le rituel.',
        chargeRequired: 100,
        effect: { globalDamage: 360, defenseHealPercent: 0.35, citadelMinimumHp: 1, durationMs: 6000 }
      },
      preferredDefenses: ['bio_siphon', 'blood_shrine', 'sawblade_turret']
    }
  };

  const defenseSpecializations = {
    vulcan_turret: [
      {
        id: 'vulcan_cerberus',
        name: 'Cerbère Rotatif',
        description: 'Trois canons chauffent progressivement et percent une cible supplémentaire à plein régime.',
        modifiers: { damageMultiplier: 1.28, fireRateMultiplier: 0.72, rangeMultiplier: 0.96, heatCapacityMultiplier: 1.45 },
        traits: ['spin_up', 'pierce_1', 'overheat_pause']
      },
      {
        id: 'vulcan_suppressor',
        name: 'Doctrine Suppressive',
        description: 'Des rafales larges marquent et ralentissent les unités légères au prix de dégâts directs.',
        modifiers: { damageMultiplier: 0.9, fireRateMultiplier: 0.82, rangeMultiplier: 1.2, slowMultiplier: 0.78 },
        traits: ['suppression_mark', 'light_enemy_slow', 'priority_runner']
      }
    ],
    plasma_mortar: [
      {
        id: 'plasma_nova',
        name: 'Nova Cataclysmique',
        description: 'Chaque obus crée deux détonations concentriques avec une zone brûlante résiduelle.',
        modifiers: { damageMultiplier: 1.34, fireRateMultiplier: 1.12, splashRadiusMultiplier: 1.45, burnDamageMultiplier: 1.2 },
        traits: ['double_detonation', 'plasma_burn', 'minimum_range']
      },
      {
        id: 'plasma_cluster',
        name: 'Batterie à Sous-Munitions',
        description: 'L’obus se divise pour saturer plusieurs routes proches.',
        modifiers: { damageMultiplier: 0.72, fireRateMultiplier: 0.9, rangeMultiplier: 1.1, projectileCount: 4 },
        traits: ['cluster_shells', 'multi_route_targeting', 'anti_splitter']
      }
    ],
    railgun_pylon: [
      {
        id: 'railgun_odins_lance',
        name: 'Lance d’Odin',
        description: 'Un rayon extrême traverse toute la colonne et brise les boucliers frontaux.',
        modifiers: { damageMultiplier: 1.65, fireRateMultiplier: 1.3, rangeMultiplier: 1.35, shieldDamageMultiplier: 2 },
        traits: ['infinite_pierce', 'shield_breaker', 'long_charge']
      },
      {
        id: 'railgun_hunter',
        name: 'Pylône Chasseur',
        description: 'Verrouille les unités aériennes ou d’artillerie et accélère après chaque élimination.',
        modifiers: { damageMultiplier: 1.22, fireRateMultiplier: 0.9, rangeMultiplier: 1.18, eliteDamageMultiplier: 1.25 },
        traits: ['priority_flying', 'priority_artillery', 'kill_haste']
      }
    ],
    flame_trap: [
      {
        id: 'flame_niflhel',
        name: 'Souffle de Niflhel',
        description: 'Un plasma froid brûle et ralentit simultanément les cibles.',
        modifiers: { damageMultiplier: 1.18, rangeMultiplier: 1.3, slowMultiplier: 0.7, burnDurationMultiplier: 1.4 },
        traits: ['cryo_fire', 'wide_cone', 'armor_soften']
      },
      {
        id: 'flame_furnace',
        name: 'Fournaise Vorace',
        description: 'Une flamme étroite gagne en puissance tant qu’elle reste sur le même ennemi.',
        modifiers: { damageMultiplier: 1.42, rangeMultiplier: 0.82, rampDamagePerSecond: 0.16, maximumRamp: 0.8 },
        traits: ['focus_ramp', 'anti_heavy', 'no_target_switch']
      }
    ],
    tesla_spire: [
      {
        id: 'tesla_tempest',
        name: 'Tempête Synaptique',
        description: 'Les arcs se multiplient dans les hordes denses et étourdissent la dernière cible.',
        modifiers: { damageMultiplier: 1.08, fireRateMultiplier: 0.84, chainCountBonus: 4, stunDurationMs: 650 },
        traits: ['extended_chain', 'terminal_stun', 'anti_swarm']
      },
      {
        id: 'tesla_grounding',
        name: 'Paratonnerre d’Exil',
        description: 'Des impulsions rares frappent prioritairement les volants et les artilleurs.',
        modifiers: { damageMultiplier: 1.62, fireRateMultiplier: 1.28, rangeMultiplier: 1.22, flyingDamageMultiplier: 1.5 },
        traits: ['priority_flying', 'priority_artillery', 'single_target']
      }
    ],
    cryo_cannon: [
      {
        id: 'cryo_absolute_zero',
        name: 'Zéro Absolu',
        description: 'Accumule du gel jusqu’à immobiliser puis fracturer les unités lourdes.',
        modifiers: { damageMultiplier: 1.1, fireRateMultiplier: 0.86, freezeThresholdMultiplier: 0.7, frozenDamageMultiplier: 1.45 },
        traits: ['freeze_stacks', 'shatter', 'heavy_control']
      },
      {
        id: 'cryo_whiteout',
        name: 'Brouillard Blanc',
        description: 'Diffuse un brouillard permanent qui ralentit une vaste section de route.',
        modifiers: { damageMultiplier: 0.62, rangeMultiplier: 1.5, auraSlowMultiplier: 0.74, auraRadiusMultiplier: 1.35 },
        traits: ['persistent_aura', 'route_control', 'no_freeze']
      }
    ],
    acid_trap: [
      {
        id: 'acid_royal_solvent',
        name: 'Solvant Royal',
        description: 'Dissout rapidement armures et boucliers dans une flaque plus concentrée.',
        modifiers: { damageMultiplier: 1.38, rangeMultiplier: 0.82, armorReductionMultiplier: 1.7, shieldDamageMultiplier: 1.55 },
        traits: ['armor_strip', 'shield_corrosion', 'stacking_acid']
      },
      {
        id: 'acid_creeping_pool',
        name: 'Marée Corrosive',
        description: 'La flaque s’étend lorsqu’un ennemi y meurt et couvre progressivement le couloir.',
        modifiers: { damageMultiplier: 0.92, durationMultiplier: 1.65, growthPerKill: 8, maximumRadiusMultiplier: 1.7 },
        traits: ['grows_on_kill', 'persistent_pool', 'anti_spawn']
      }
    ],
    laser_drone: [
      {
        id: 'laser_interceptor',
        name: 'Intercepteur Séraphin',
        description: 'Patrouille entre deux points et abat les unités aériennes en priorité.',
        modifiers: { damageMultiplier: 1.28, fireRateMultiplier: 0.78, flyingDamageMultiplier: 1.55, patrolRadiusMultiplier: 1.25 },
        traits: ['mobile_patrol', 'priority_flying', 'anti_air']
      },
      {
        id: 'laser_designator',
        name: 'Désignateur Fantôme',
        description: 'Sacrifie sa cadence pour marquer les cibles et amplifier les tirs alliés.',
        modifiers: { damageMultiplier: 0.7, fireRateMultiplier: 1.22, markedDamageTakenMultiplier: 1.24, markDurationMs: 5200 },
        traits: ['target_mark', 'allied_amplifier', 'priority_elite']
      }
    ],
    landmine: [
      {
        id: 'landmine_shaped_charge',
        name: 'Charge Creuse',
        description: 'Une explosion directionnelle transperce les remparts et les brutes.',
        modifiers: { damageMultiplier: 1.9, splashRadiusMultiplier: 0.7, heavyDamageMultiplier: 1.45, triggerRadiusMultiplier: 0.8 },
        traits: ['directional_blast', 'armor_piercing', 'anti_heavy']
      },
      {
        id: 'landmine_scatter',
        name: 'Nid de Vipères',
        description: 'Déploie quatre petites mines qui se réarment lentement entre les vagues.',
        modifiers: { damageMultiplier: 0.58, mineCount: 4, splashRadiusMultiplier: 0.8, rearmBetweenWaves: 1 },
        traits: ['multi_charge', 'lane_coverage', 'between_wave_rearm']
      }
    ],
    aegis_barrier: [
      {
        id: 'aegis_bastion',
        name: 'Bastion Inébranlable',
        description: 'Un mur compact doté d’une immense réserve de points de vie et d’une réparation autonome.',
        modifiers: { hpMultiplier: 2.1, widthMultiplier: 0.82, regenerationPerSecond: 12, damageTakenMultiplier: 0.9 },
        traits: ['self_repair', 'heavy_blocker', 'artillery_vulnerable']
      },
      {
        id: 'aegis_reflector',
        name: 'Miroir Aegis',
        description: 'Une barrière plus fragile renvoie les projectiles de siège vers leur source.',
        modifiers: { hpMultiplier: 1.25, widthMultiplier: 1.2, projectileReflectChance: 0.75, reflectedDamageMultiplier: 1.15 },
        traits: ['reflect_projectiles', 'wide_blocker', 'anti_artillery']
      }
    ],
    gravity_well: [
      {
        id: 'gravity_singularity',
        name: 'Singularité Affamée',
        description: 'Compacte brutalement les unités légères et leur inflige des dégâts croissants.',
        modifiers: { damageMultiplier: 1.4, rangeMultiplier: 0.88, pullStrengthMultiplier: 1.65, rampDamagePerSecond: 0.12 },
        traits: ['strong_pull', 'damage_ramp', 'anti_swarm']
      },
      {
        id: 'gravity_orbit',
        name: 'Anneau Orbital',
        description: 'Un champ large dévie les volants et allonge toutes les routes affectées.',
        modifiers: { damageMultiplier: 0.7, rangeMultiplier: 1.5, pullStrengthMultiplier: 0.75, pathLengthMultiplier: 1.18 },
        traits: ['flying_control', 'path_distortion', 'wide_field']
      }
    ],
    missile_pod: [
      {
        id: 'missile_hydra',
        name: 'Hydre de Saturation',
        description: 'Lance une salve de micro-missiles répartie entre toutes les cibles visibles.',
        modifiers: { damageMultiplier: 0.54, fireRateMultiplier: 0.82, projectileCount: 6, splashRadiusMultiplier: 0.78 },
        traits: ['multi_target', 'saturation_salvo', 'anti_flying_group']
      },
      {
        id: 'missile_bunker_buster',
        name: 'Brise-Forteresse',
        description: 'Un missile guidé lent détruit les boucliers et frappe l’artillerie à très longue portée.',
        modifiers: { damageMultiplier: 2.05, fireRateMultiplier: 1.48, rangeMultiplier: 1.32, shieldDamageMultiplier: 1.8 },
        traits: ['priority_artillery', 'shield_breaker', 'slow_projectile']
      }
    ],
    bio_siphon: [
      {
        id: 'siphon_citadel_vein',
        name: 'Veine de la Citadelle',
        description: 'Transfère l’essentiel du drain directement vers le noyau de la Citadelle.',
        modifiers: { damageMultiplier: 0.9, fireRateMultiplier: 0.86, citadelLifesteal: 0.42, defenseLifesteal: 0.05 },
        traits: ['citadel_heal', 'overheal_allowed', 'priority_high_hp']
      },
      {
        id: 'siphon_shared_blood',
        name: 'Sang Partagé',
        description: 'Distribue les soins aux défenses proches et accélère leur cadence.',
        modifiers: { damageMultiplier: 0.78, allyHealRatio: 0.26, auraRadiusMultiplier: 1.35, alliedFireRateMultiplier: 0.9 },
        traits: ['defense_heal', 'haste_aura', 'support']
      }
    ],
    magnet_drone: [
      {
        id: 'magnet_salvager',
        name: 'Récupérateur Haven',
        description: 'Collecte à grande distance et augmente légèrement la valeur des Bio-Coins.',
        modifiers: { rangeMultiplier: 1.7, collectionSpeedMultiplier: 1.4, coinValueMultiplier: 1.12, storageCapacity: 40 },
        traits: ['economy', 'remote_collection', 'coin_bonus']
      },
      {
        id: 'magnet_polarizer',
        name: 'Polariseur de Guerre',
        description: 'Renonce au bonus économique pour repousser les unités métalliques et les projectiles.',
        modifiers: { rangeMultiplier: 1.22, pulseCooldownMs: 3200, enemyPushDistance: 70, projectileDeflectChance: 0.35 },
        traits: ['control_pulse', 'projectile_deflection', 'no_coin_bonus']
      }
    ],
    sawblade_turret: [
      {
        id: 'sawblade_ricochet',
        name: 'Danse des Lames',
        description: 'Les scies ricochent entre les ennemis et regagnent des dégâts à chaque rebond.',
        modifiers: { damageMultiplier: 0.88, fireRateMultiplier: 0.82, ricochetCount: 5, ricochetDamageMultiplier: 1.08 },
        traits: ['ricochet', 'anti_cluster', 'moving_projectile']
      },
      {
        id: 'sawblade_executioner',
        name: 'Scie de l’Exécuteur',
        description: 'Une lourde lame revient vers la tourelle et exécute les unités très affaiblies.',
        modifiers: { damageMultiplier: 1.58, fireRateMultiplier: 1.3, executeHealthThreshold: 0.12, returnDamageMultiplier: 0.8 },
        traits: ['boomerang', 'execute', 'anti_splitter']
      }
    ],
    emp_tower: [
      {
        id: 'emp_blackout',
        name: 'Black-out Total',
        description: 'Une impulsion immense désactive durablement boucliers, auras et artilleries.',
        modifiers: { damageMultiplier: 0.85, fireRateMultiplier: 1.35, rangeMultiplier: 1.48, disableDurationMultiplier: 1.75 },
        traits: ['disable_special_traits', 'anti_artillery', 'anti_bulwark']
      },
      {
        id: 'emp_chain_pulse',
        name: 'Impulsion Cascade',
        description: 'Des décharges rapides bondissent entre quelques cibles et interrompent leurs attaques.',
        modifiers: { damageMultiplier: 1.08, fireRateMultiplier: 0.62, rangeMultiplier: 0.92, chainCountBonus: 3 },
        traits: ['chain_interrupt', 'rapid_pulse', 'short_stun']
      }
    ],
    orbital_beam: [
      {
        id: 'orbital_judgement',
        name: 'Jugement Zénithal',
        description: 'Un rayon prolongé suit l’ennemi le plus dangereux et augmente continuellement ses dégâts.',
        modifiers: { damageMultiplier: 1.38, fireRateMultiplier: 1.22, trackingDurationMs: 4200, rampDamagePerSecond: 0.2 },
        traits: ['elite_tracking', 'focus_ramp', 'boss_hunter']
      },
      {
        id: 'orbital_solar_grid',
        name: 'Grille Solaire',
        description: 'Divise le rayon en trois frappes moins puissantes réparties sur les routes.',
        modifiers: { damageMultiplier: 0.68, fireRateMultiplier: 0.88, beamCount: 3, splashRadiusMultiplier: 1.2 },
        traits: ['multi_route_targeting', 'area_denial', 'no_tracking']
      }
    ],
    napalm_mine: [
      {
        id: 'napalm_hellfield',
        name: 'Champ de Fournaise',
        description: 'La détonation laisse un brasier très large qui se propage aux unités embrasées.',
        modifiers: { damageMultiplier: 1.05, fireRadiusMultiplier: 1.65, burnDurationMultiplier: 1.55, spreadBurnChance: 0.4 },
        traits: ['wide_burn', 'spreading_fire', 'anti_swarm']
      },
      {
        id: 'napalm_thermobaric',
        name: 'Charge Thermobarique',
        description: 'Une explosion unique concentre ses dégâts sur les unités lourdes et projette les survivants.',
        modifiers: { damageMultiplier: 1.85, fireRadiusMultiplier: 0.72, heavyDamageMultiplier: 1.35, knockbackDistance: 95 },
        traits: ['heavy_burst', 'knockback', 'limited_burn']
      }
    ],
    blood_shrine: [
      {
        id: 'shrine_war_chorus',
        name: 'Chœur de Guerre',
        description: 'Amplifie les dégâts et la cadence des défenses dans son cercle rituel.',
        modifiers: { auraDamageMultiplier: 1.2, auraFireRateMultiplier: 0.9, auraRadiusMultiplier: 1.3, selfDamagePerSecond: 4 },
        traits: ['defense_buff_aura', 'health_upkeep', 'stack_limit_1']
      },
      {
        id: 'shrine_heroic_altar',
        name: 'Autel de la Valkyrie',
        description: 'Concentre le rituel sur l’héroïne et accélère fortement la charge de son ultime.',
        modifiers: { heroDamageMultiplier: 1.32, heroCooldownMultiplier: 0.85, ultimateChargeMultiplier: 1.28, auraRadiusMultiplier: 0.85 },
        traits: ['hero_buff', 'ultimate_charge', 'no_defense_buff']
      }
    ],
    sonic_cannon: [
      {
        id: 'sonic_repulsor',
        name: 'Onde Répulsive',
        description: 'Une détonation large repousse fortement les unités légères et interrompt les lourdes.',
        modifiers: { damageMultiplier: 0.9, fireRateMultiplier: 1.18, rangeMultiplier: 1.25, knockbackMultiplier: 1.8 },
        traits: ['strong_knockback', 'attack_interrupt', 'route_reset']
      },
      {
        id: 'sonic_resonator',
        name: 'Résonance Fractale',
        description: 'Chaque impact pose une résonance ; la troisième fait exploser l’armure de la cible.',
        modifiers: { damageMultiplier: 1.2, fireRateMultiplier: 0.88, resonanceThreshold: 3, resonanceBurstDamage: 180 },
        traits: ['resonance_stacks', 'armor_break', 'single_target_ramp']
      }
    ]
  };

  const infinitumMutators = [
    {
      id: 'iron_procession',
      name: 'Procession de Fer',
      description: 'Les ennemis lourds sont plus résistants mais avancent plus lentement.',
      difficulty: 2,
      modifiers: { heavyHpMultiplier: 1.55, heavySpeedMultiplier: 0.82, heavyRewardMultiplier: 1.2 },
      tags: ['enemy', 'heavy']
    },
    {
      id: 'razor_wind',
      name: 'Vent Rasoir',
      description: 'Les volants accélèrent hors de portée d’une défense.',
      difficulty: 2,
      modifiers: { flyingSpeedMultiplier: 1.3, flyingHpMultiplier: 1.15 },
      tags: ['enemy', 'flying']
    },
    {
      id: 'scarce_salvage',
      name: 'Récupération Rare',
      description: 'Les récompenses baissent, mais chaque dixième élimination produit un coffre garanti.',
      difficulty: 3,
      modifiers: { coinRewardMultiplier: 0.68, guaranteedCrateEveryKills: 10 },
      tags: ['economy', 'loot']
    },
    {
      id: 'volatile_core',
      name: 'Noyau Volatil',
      description: 'La Citadelle perd lentement ses points de vie mais ses défenses frappent plus fort.',
      difficulty: 3,
      modifiers: { citadelHpDrainPerSecond: 1, defenseDamageMultiplier: 1.3 },
      tags: ['citadel', 'risk_reward']
    },
    {
      id: 'split_decision',
      name: 'Décision Scissipare',
      description: 'Toute unité non-boss a une chance de produire une Larve de Cendre à sa mort.',
      difficulty: 3,
      modifiers: { splitOnDeathChance: 0.22, splitChildType: 'swarmer', splitChildCount: 1 },
      tags: ['enemy', 'swarm']
    },
    {
      id: 'blind_forecast',
      name: 'Prévision Aveugle',
      description: 'La composition suivante reste cachée jusqu’au déclenchement de la vague.',
      difficulty: 1,
      modifiers: { hiddenWavePreview: true, completionScoreMultiplier: 1.12 },
      tags: ['information', 'score']
    },
    {
      id: 'overclocked_grid',
      name: 'Réseau Surcadencé',
      description: 'Toutes les défenses tirent plus vite mais perdent continuellement de la durabilité.',
      difficulty: 2,
      modifiers: { defenseFireRateMultiplier: 0.72, defenseHpDrainPerSecond: 0.35 },
      tags: ['defense', 'risk_reward']
    },
    {
      id: 'long_march',
      name: 'La Longue Marche',
      description: 'Les routes sont rallongées et les hordes plus nombreuses.',
      difficulty: 2,
      modifiers: { routeLengthMultiplier: 1.18, groupCountMultiplier: 1.3, enemyHpMultiplier: 0.92 },
      tags: ['routes', 'swarm']
    },
    {
      id: 'siege_priority',
      name: 'Priorité au Siège',
      description: 'Les bombardiers apparaissent davantage et ciblent toujours la défense la plus coûteuse.',
      difficulty: 4,
      modifiers: { artilleryCountMultiplier: 1.7, artilleryDamageMultiplier: 1.2, artilleryTargeting: 'highest_investment' },
      tags: ['enemy', 'artillery']
    },
    {
      id: 'lunar_grace',
      name: 'Grâce Lunaire',
      description: 'Les ralentissements durent plus longtemps, mais les ennemis gelés gagnent une armure temporaire.',
      difficulty: 1,
      modifiers: { slowDurationMultiplier: 1.4, frozenArmorMultiplier: 1.35 },
      tags: ['control', 'tradeoff']
    }
  ];

  function hashString(value) {
    const text = String(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function normalizeSeed(seed) {
    if (typeof seed === 'number' && Number.isFinite(seed)) return seed >>> 0;
    return hashString(seed);
  }

  function createSeededRng(seed) {
    let state = normalizeSeed(seed) || 0x6d2b79f5;

    function next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    }

    next.int = function int(minimum, maximum) {
      const min = Math.ceil(Number(minimum));
      const max = Math.floor(Number(maximum));
      if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
        throw new RangeError('rng.int requires a finite inclusive range');
      }
      return min + Math.floor(next() * (max - min + 1));
    };

    next.pick = function pick(values) {
      if (!Array.isArray(values) || values.length === 0) {
        throw new RangeError('rng.pick requires a non-empty array');
      }
      return values[next.int(0, values.length - 1)];
    };

    next.shuffle = function shuffle(values) {
      if (!Array.isArray(values)) throw new TypeError('rng.shuffle requires an array');
      const result = values.slice();
      for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = next.int(0, index);
        const current = result[index];
        result[index] = result[swapIndex];
        result[swapIndex] = current;
      }
      return result;
    };

    next.getState = function getState() {
      return state >>> 0;
    };

    return next;
  }

  function dateKey(value = new Date()) {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError('dateKey requires a valid date');
    return [
      String(date.getUTCFullYear()).padStart(4, '0'),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0')
    ].join('-');
  }

  function createDailyChallenge(value = new Date(), playerSalt = '') {
    const day = dateKey(value);
    const seed = hashString(`infernal-city:${VERSION}:${day}:${String(playerSalt)}`);
    const rng = createSeededRng(seed);
    const layoutIds = Object.keys(worldLayouts);
    const heroIds = Object.keys(heroKits);
    const defenseIds = Object.keys(defenseSpecializations);
    const shuffledMutators = rng.shuffle(infinitumMutators.map(mutator => mutator.id));
    const mutatorCount = rng.int(2, 3);
    const layoutId = rng.pick(layoutIds);
    const heroId = rng.pick(heroIds);
    const startingDefenseIds = rng.shuffle(defenseIds).slice(0, 3);
    const mutatorIds = shuffledMutators.slice(0, mutatorCount);
    const difficultyRating = mutatorIds.reduce((sum, id) => {
      const mutator = infinitumMutators.find(candidate => candidate.id === id);
      return sum + (mutator ? mutator.difficulty : 0);
    }, 0);

    return {
      id: `daily-${day}-${seed.toString(16).padStart(8, '0')}`,
      date: day,
      seed,
      layoutId,
      heroId,
      waveScriptId: 'siege_15',
      mutatorIds,
      startingDefenseIds,
      rules: {
        retriesAllowed: true,
        deterministicSpawns: true,
        saveDuringRun: false,
        startingCoins: 145,
        scoreMultiplier: Number((1 + difficultyRating * 0.08).toFixed(2)),
        scoreBonuses: {
          citadelUntouched: 5000,
          noDefenseSold: 1800,
          allWavesCleared: 8000
        }
      }
    };
  }

  function deepFreeze(value, seen = new Set()) {
    if (!value || (typeof value !== 'object' && typeof value !== 'function') || seen.has(value)) return value;
    seen.add(value);
    Object.getOwnPropertyNames(value).forEach(key => deepFreeze(value[key], seen));
    return Object.freeze(value);
  }

  const expansion = deepFreeze({
    version: VERSION,
    schemaVersion: 1,
    title: 'La Guerre des Quatre Portes',
    world: { ...WORLD },
    worldLayouts,
    enemyDefinitions,
    waveScripts,
    heroKits,
    defenseSpecializations,
    infinitumMutators,
    utils: {
      hashString,
      normalizeSeed,
      createSeededRng,
      dateKey,
      createDailyChallenge
    }
  });

  root.INFERNAL_CITY_EXPANSION = expansion;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = expansion;
  }
}(typeof window !== 'undefined' ? window : globalThis));
