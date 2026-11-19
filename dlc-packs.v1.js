'use strict';

(function initInfernalCityDlcs(root) {
  const deepFreeze = obj => {
    if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
    Object.values(obj).forEach(deepFreeze);
    return Object.freeze(obj);
  };

  const FREE_EXPANSIONS = [
    {
      id: 'free_first_breach',
      tier: 'free',
      code: 'EXT-G1',
      name: 'Archives de la Première Brèche',
      tagline: 'Préquelle d’Haven, 5 Opérations Mémoires, Synergies Élémentaires & Prestige Niv 4–5.',
      status: 'active',
      accentColor: '#00f0ff',
      operations: [
        { id: 'op_outer_fall', name: 'Chute du District Extérieur', waves: 2, modifier: 'arsenal_historique' },
        { id: 'op_convoy_haven', name: 'Escorte Civile d’Haven', waves: 2, modifier: 'citadel_no_shield' },
        { id: 'op_relay_zero', name: 'Relais Zéro', waves: 2, modifier: 'synergy_boost' },
        { id: 'op_aegis_birth', name: 'Éveil du Dôme Aegis', waves: 2, modifier: 'shield_overcharge' },
        { id: 'op_first_leviathan', name: 'Ombre du Premier Léviathan', waves: 2, modifier: 'boss_vanguard' }
      ],
      synergies: ['choc_thermique', 'tempete_magnetique', 'embrasement_toxique'],
      codexEntriesCount: 24,
      vnChaptersCount: 18,
      freeSkinsCount: 6
    },
    {
      id: 'free_aerial_horizon',
      tier: 'free',
      code: 'EXT-G2',
      name: 'Horizon Aérien & Météo de Siège',
      tagline: '10 unités aériennes de légion, 4 mini-boss, météo tactique dynamique & Arbre de Recherche du Bastion.',
      status: 'active',
      accentColor: '#38bdf8',
      aerialLegionUnits: [
        { id: 'air_bioforge_wasp', faction: 'bioforge', name: 'Guêpe Bioforge', hp: 115, speed: 128 },
        { id: 'air_ossuary_crow', faction: 'ossuary', name: 'Corbeau d’Os', hp: 105, speed: 136 },
        { id: 'air_void_manta', faction: 'void', name: 'Manta du Néant', hp: 130, speed: 120 },
        { id: 'air_infernal_harpy', faction: 'infernal', name: 'Harpyie de Braise', hp: 125, speed: 132 },
        { id: 'air_shadow_owl', faction: 'shadow', name: 'Chouette d’Éclipse', hp: 100, speed: 145 },
        { id: 'air_plague_locust', faction: 'plague', name: 'Criquet Miasmatique', hp: 120, speed: 124 },
        { id: 'air_dreadtide_albatross', faction: 'dreadtide', name: 'Albatros Maudit', hp: 135, speed: 118 },
        { id: 'air_quantum_glider', faction: 'quantum', name: 'Planeur Quantique', hp: 110, speed: 148 },
        { id: 'air_ash_ifrit', faction: 'ash', name: 'Ifrit de Cendre', hp: 140, speed: 126 },
        { id: 'air_nightmare_moth', faction: 'nightmare', name: 'Phalène Onirique', hp: 115, speed: 134 }
      ],
      miniBossWaves: [4, 8, 12, 14],
      researchTree: [
        { id: 'res_wall_plating', name: 'Blindage du Rempart', cost: 40, bonus: '+10 % PV Citadelle' },
        { id: 'res_aegis_capacitor', name: 'Condensateur Aegis', cost: 55, bonus: '+15 % absorption dôme' },
        { id: 'res_synergy_amp', name: 'Amplificateur de Synergie', cost: 65, bonus: '+10 % dégâts combos' },
        { id: 'res_repair_drones', name: 'Drones de Réparation', cost: 80, bonus: '+8 PV Citadelle / vague' }
      ],
      weatherStates: ['clear', 'acid_rain', 'ion_storm', 'infernal_fog'],
      newMutatorsCount: 12
    },
    {
      id: 'free_reign_of_thrones',
      tier: 'free',
      code: 'EXT-G3',
      name: 'Règne des Trônes : Assaut Inversé',
      tagline: 'Gameplay inversé POV Boss : incarnez les 10 Trônes (+ Léviathan) et commandez les hordes pour faire tomber Haven.',
      status: 'active',
      accentColor: '#ff2a5f',
      modeType: 'reverse_tower_defense',
      resourceName: 'Essence Abyssale',
      playableBosses: [
        'xyra', 'ossuary', 'nhalzara', 'astarra', 'umbrael',
        'pestifera', 'vexara', 'kalix', 'malika', 'noctis', 'leviathan'
      ],
      siegesPerBoss: 3,
      totalSiegeMissions: 30,
      squadCards: [
        { id: 'sq_vanguard', name: 'Meute d’Avant-Garde', essenceCost: 20, count: 6, role: 'fast' },
        { id: 'sq_bulwark', name: 'Phalange Blindée', essenceCost: 35, count: 3, role: 'tank' },
        { id: 'sq_artillery', name: 'Batterie de Siège', essenceCost: 45, count: 2, role: 'siege' },
        { id: 'sq_aerial', name: 'Essaim Aérien', essenceCost: 40, count: 4, role: 'air' },
        { id: 'sq_boss_phase', name: 'Déploiement du Trône (Phase II/III)', essenceCost: 90, count: 1, role: 'boss' }
      ]
    },
    {
      id: 'free_eclipse_pact',
      tier: 'free',
      code: 'EXT-G4',
      name: 'Pacte de l’Éclipse : L’Ennemi Supérieur',
      tagline: 'Aftermath : tous les Trônes ralliés s’unissent aux 16 Valkyries contre L’Architecture Zéro (Vagues 21–35).',
      status: 'active',
      accentColor: '#f59e0b',
      unlockCondition: 'all_ten_thrones_allied',
      actName: 'Acte III · Le Jugement du Zénith',
      wavesRange: [21, 35],
      superiorEnemyFaction: {
        id: 'zenith_architecture',
        name: 'L’Architecture Zéro (Veilleurs du Zénith)',
        unitsCount: 12,
        generalsCount: 3,
        finalBoss: { id: 'architect_zero', name: 'L’Architecte Zéro', phases: 4 }
      },
      duoCombos: [
        { id: 'duo_aria_astarra', pair: ['aria', 'astarra'], name: 'Rempart de Braise' },
        { id: 'duo_nyx_kalix', pair: ['nyx', 'kalix'], name: 'Faille Temporelle' },
        { id: 'duo_carmilla_ossuary', pair: ['carmilla', 'ossuary'], name: 'Cour Écarlate' },
        { id: 'duo_freyja_vexara', pair: ['freyja', 'vexara'], name: 'Maelström Polaire' }
      ],
      aftermathVnChapters: 20
    }
  ];

  const PAID_DLCS = [
    {
      id: 'dlc_astral_cathedral',
      tier: 'paid',
      code: 'DLC-01',
      name: 'Cathédrale Astrale & Nécropole Solaire',
      visualDomain: 'Gothique Sacré Doré, Marbre Blanc & Horlogerie Céleste',
      biomeKey: 'astral',
      biomeAtlas: 'assets/dlc/biome-astral-atlas.png',
      radioStation: 'celestial',
      radioLabel: 'CH-06 · Celestial Organ',
      palette: { bg: '#1e1b4b', primary: '#f59e0b', secondary: '#fef3c7', glow: '#38bdf8' },
      maps: ['Parvis Solaire', 'Nef d’Horlogerie'],
      heroines: [
        { id: 'seraphine', name: 'Séraphine Vesper-Sol', age: 29, isAdult: true, title: 'Garde du Méridien', ability: 'Prisme Orbital', ultimate: 'Zénith d’Or' },
        { id: 'beatrice', name: 'Béatrice Horologia', age: 33, isAdult: true, title: 'Maîtresse des Rouages', ability: 'Ralentissement Astral', ultimate: 'Minuit Solaire' }
      ],
      boss: { id: 'archon_aurelien', name: 'Archonte Aurélien-X', phases: ['Jugement de Verre', 'Éclipse Dorée', 'Effondrement d’Astrolabe'] },
      towers: [
        { id: 'solar_organ', name: 'Orgue Solaire', cost: 110, role: 'beam' },
        { id: 'stasis_pendulum', name: 'Pendule Stase', cost: 95, role: 'chrono' }
      ],
      weapon: { id: 'seraphic_ray', name: 'Rayon Séraphique', evolution: 'Chœur de Supernova' },
      enemiesCount: 8,
      vnPack: { name: 'Sanctuaire Solaire', chapters: 6, skins: 4, adultConsentContract: true }
    },
    {
      id: 'dlc_bioluminescent_abyss',
      tier: 'paid',
      code: 'DLC-02',
      name: 'Abysses Bioluminescents',
      visualDomain: 'Sous-Marin Abyssal, Récifs Mécaniques & Caustiques Lumineuses',
      biomeKey: 'abyss',
      biomeAtlas: 'assets/dlc/biome-abyss-atlas.png',
      radioStation: 'abyssal',
      radioLabel: 'CH-07 · Abyssal Pulse',
      palette: { bg: '#042f2e', primary: '#2dd4bf', secondary: '#a855f7', glow: '#fb7185' },
      maps: ['Fosse de Corail', 'Dôme Bathyal'],
      heroines: [
        { id: 'nerea', name: 'Néréa Kestrel', age: 28, isAdult: true, title: 'Plongeuse Pression', ability: 'Onde Sonar', ultimate: 'Maelström Bathyal' },
        { id: 'thalassa', name: 'Thalassa Vance', age: 35, isAdult: true, title: 'Commandante du Bathyscaphe', ability: 'Harpon Cryo-Pression', ultimate: 'Décompression Souveraine' }
      ],
      boss: { id: 'charybde', name: 'Léviathane Charybde', phases: ['Courant Noir', 'Essaim Médusaire', 'Pression Critique'] },
      towers: [
        { id: 'sonar_tower', name: 'Tour Sonar', cost: 90, role: 'anti_stealth' },
        { id: 'pressure_harpoon', name: 'Harpon Pression', cost: 115, role: 'anti_armor' }
      ],
      weapon: { id: 'cavitation_torpedo', name: 'Torpille à Cavitation', evolution: 'Vortex Abyssal' },
      enemiesCount: 8,
      vnPack: { name: 'Observatoire Sous-Marin', chapters: 6, skins: 4, adultConsentContract: true }
    },
    {
      id: 'dlc_art_nouveau_garden',
      tier: 'paid',
      code: 'DLC-03',
      name: 'Jardin de Cendre & Verrière Art Nouveau',
      visualDomain: 'Botanique Mutante, Fer Forgé Art Nouveau & Serres de Cristal',
      biomeKey: 'flora',
      biomeAtlas: 'assets/dlc/biome-flora-atlas.png',
      radioStation: 'flora',
      radioLabel: 'CH-08 · Velvet Flora',
      palette: { bg: '#064e3b', primary: '#34d399', secondary: '#e11d48', glow: '#fbbf24' },
      maps: ['Grande Serre', 'Racines du Cœur'],
      heroines: [
        { id: 'sylva', name: 'Sylva Rosier', age: 31, isAdult: true, title: 'Architecte Botanique', ability: 'Mur de Ronces Cristallines', ultimate: 'Éclosion Écarlate' },
        { id: 'ophelia', name: 'Ophélia Lierre', age: 37, isAdult: true, title: 'Maîtresse des Serres', ability: 'Nuage de Spores Dorées', ultimate: 'Canopée d’Émeraude' }
      ],
      boss: { id: 'noctiflora', name: 'Reine Noctiflora', phases: ['Pollen Hallucinogène', 'Lianes Étrangleuses', 'Floraison Finale'] },
      towers: [
        { id: 'spore_hive', name: 'Ruche de Spores', cost: 100, role: 'swarm' },
        { id: 'botanic_prism', name: 'Prisme Botanique', cost: 110, role: 'refract_laser' }
      ],
      weapon: { id: 'plasma_vine', name: 'Liane Plasma', evolution: 'Couronne d’Épines' },
      enemiesCount: 8,
      vnPack: { name: 'Serre Privée au Clair de Lune', chapters: 6, skins: 4, adultConsentContract: true }
    },
    {
      id: 'dlc_glass_desert',
      tier: 'paid',
      code: 'DLC-04',
      name: 'Mirage Chromatique & Cité des Sables de Verre',
      visualDomain: 'Désert Solarpunk, Silice Vitrifiée & Architecture Néo-Perse',
      biomeKey: 'desert',
      biomeAtlas: 'assets/dlc/biome-desert-atlas.png',
      radioStation: 'desert',
      radioLabel: 'CH-09 · Desert Synthwave',
      palette: { bg: '#1c1917', primary: '#ea580c', secondary: '#fde68a', glow: '#1d4ed8' },
      maps: ['Oasis Vitrifiée', 'Canyon des Miroirs'],
      heroines: [
        { id: 'sheherazade', name: 'Shéhérazade Solis', age: 30, isAdult: true, title: 'Tisseuse de Mirages', ability: 'Mirage Réfractaire', ultimate: 'Soleil de Silice' },
        { id: 'daria', name: 'Daria Al-Qamar', age: 34, isAdult: true, title: 'Lancière des Dunes', ability: 'Lance de Verre Fondu', ultimate: 'Tempête d’Or' }
      ],
      boss: { id: 'ignis_rah', name: 'Sultane Ignis-Rah', phases: ['Vitrification', 'Mirage Triple', 'Zénith Ardent'] },
      towers: [
        { id: 'helios_mirror', name: 'Tour Miroir Hélios', cost: 105, role: 'solar_amp' },
        { id: 'silica_mortar', name: 'Mortier Silice', cost: 120, role: 'aoe_glass' }
      ],
      weapon: { id: 'solar_saber', name: 'Sabre Solaire', evolution: 'Éclat d’Obsidienne' },
      enemiesCount: 8,
      vnPack: { name: 'Pavillon des Sables', chapters: 6, skins: 4, adultConsentContract: true }
    },
    {
      id: 'dlc_cryo_brutalist',
      tier: 'paid',
      code: 'DLC-05',
      name: 'Bastion Cryo-Brutaliste & Aurores Boréales',
      visualDomain: 'Monolithes Polaires Brutalistes, Glace Cristalline & Aurores Vert/Magenta',
      biomeKey: 'arctic',
      biomeAtlas: 'assets/dlc/biome-arctic-atlas.png',
      radioStation: 'arctic',
      radioLabel: 'CH-10 · Arctic Ambient',
      palette: { bg: '#0f172a', primary: '#4ade80', secondary: '#e879f9', glow: '#e0f2fe' },
      maps: ['Banquise Fracturée', 'Centrale Polaire'],
      heroines: [
        { id: 'astrid', name: 'Astrid Valen', age: 32, isAdult: true, title: 'Briseuse de Banquise', ability: 'Bris de Banquise', ultimate: 'Faille Glaciaire' },
        { id: 'katya', name: 'Katya Moroz', age: 36, isAdult: true, title: 'Sentinelle Boréale', ability: 'Dôme Boréal', ultimate: 'Nuit Polaire' }
      ],
      boss: { id: 'cryo_valkyr', name: 'Tsarine Cryo-Valkyr', phases: ['Givre Absolu', 'Aurore Brisée', 'Zéro Polaire'] },
      towers: [
        { id: 'icebreaker_cannon', name: 'Canon Brise-Glace', cost: 115, role: 'heavy_cryo' },
        { id: 'boreal_beacon', name: 'Balise Boréale', cost: 95, role: 'aura_buff' }
      ],
      weapon: { id: 'cryo_laser', name: 'Faisceau Cryo-Laser', evolution: 'Couronne Boréale' },
      enemiesCount: 8,
      vnPack: { name: 'Chalet Boréal & Sources Chaudes', chapters: 6, skins: 4, adultConsentContract: true }
    },
    {
      id: 'dlc_brass_palace',
      tier: 'paid',
      code: 'DLC-06',
      name: 'Palais Mécanique & Horlogerie de Cuivre',
      visualDomain: 'Steampunk Impérial, Cuivre, Laiton, Velours Pourpre & Vapeur Dorée',
      biomeKey: 'brass',
      biomeAtlas: 'assets/dlc/biome-brass-atlas.png',
      radioStation: 'brass',
      radioLabel: 'CH-11 · Brass Electro-Swing',
      palette: { bg: '#27121b', primary: '#d97706', secondary: '#fbbf24', glow: '#881337' },
      maps: ['Fonderie Impériale', 'Pont des Dirigeables'],
      heroines: [
        { id: 'vivienne', name: 'Lady Vivienne Gearhart', age: 33, isAdult: true, title: 'Ingénieure Impériale', ability: 'Surcharge Vapeur', ultimate: 'Pressurisation Totale' },
        { id: 'clarisse', name: 'Clarisse Pendule', age: 29, isAdult: true, title: 'Horlogère de Combat', ability: 'Griffe Mécanique', ultimate: 'Carillon de Cuivre' }
      ],
      boss: { id: 'brass_queen', name: 'Automate Brass-Queen', phases: ['Pression Nominale', 'Soupapes Ouvertes', 'Surchauffe Impériale'] },
      towers: [
        { id: 'steam_gatling', name: 'Gatling à Vapeur', cost: 95, role: 'rapid_steam' },
        { id: 'copper_tesla', name: 'Bobine Tesla Cuivre', cost: 110, role: 'arc_copper' }
      ],
      weapon: { id: 'voltaic_musket', name: 'Mousquet Voltaïque', evolution: 'Foudre Impériale' },
      enemiesCount: 8,
      vnPack: { name: 'Salon Privé de l’Horlogère', chapters: 6, skins: 4, adultConsentContract: true }
    }
  ];

  const CONTRACT = deepFreeze({
    version: '1.0.0',
    adultMinimumAge: 27,
    loreChoicesAreNarrativeOnly: true,
    freeExpansions: FREE_EXPANSIONS,
    paidDlcs: PAID_DLCS,
    allPacks: [...FREE_EXPANSIONS, ...PAID_DLCS]
  });

  if (root) {
    root.INFERNAL_CITY_DLCS = CONTRACT;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONTRACT;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
