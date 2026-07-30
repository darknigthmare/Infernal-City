/* Valkyrie Sweeper: Dark Siege - Comprehensive Game Engine */

const CAMPAIGN_FINAL_WAVE = 15;
const SAVE_VERSION = 8;
const RUN_CHECKPOINT_VERSION = 1;
// The player explicitly needs a long read on incoming hordes. Keep the compact
// construction arena intact, but make its traversable approach belt five times
// deeper than the previous 64-unit framing on every side.
const BATTLEFIELD_APPROACH_MARGIN = 64 * 5;
const BATTLEFIELD_MAX_CAMERA_ZOOM = 3.5;
const BATTLEFIELD_WORLD_WIDTH = 1200;
const BATTLEFIELD_WORLD_HEIGHT = 800;
const BATTLEFIELD_SPAWN_VISUAL_GUTTER = 12;
const BATTLEFIELD_PROJECTILE_PADDING = 120;
const DEFENSE_MIN_SCREEN_HIT_DIAMETER = 44;
const MIN_TOWER_SCREEN_SIZE = 30;
const MIN_ENEMY_SCREEN_SIZE = 14;
const MIN_BOSS_SCREEN_SIZE = 46;
const MIN_HERO_SCREEN_SIZE = 46;
const SPAWN_GATE_WORLD_SIZE = 132;
const SPAWN_GATE_SECTORS = ['north', 'east', 'south', 'west'];
const GAMEPAD_DEADZONE = 0.18;
const GAMEPAD_CAMERA_SPEED = 520;
const GAMEPAD_CURSOR_SPEED = 280;
const SPECIALIST_ENEMY_TYPES = ['flying', 'bulwark', 'artillery', 'splitter'];
const BOSS_PHASE_THRESHOLDS = [0.66, 0.33];
const LAYOUT_TERRAIN_SOURCES = {
  convergence: 'assets/environment/infernal-city-approach-terrain.png',
  western_wall: 'assets/environment/map-western-wall.png',
  southern_watch: 'assets/environment/map-southern-watch.png',
  twin_rift: 'assets/environment/map-twin-rift.png'
};

// The expansion normally arrives from expansion.v1.js. This deliberately small
// contract keeps the engine bootable when that optional data pack is blocked,
// loaded late or omitted by an older cached HTML shell.
const EXPANSION_FALLBACK = Object.freeze({
  version: 'fallback',
  world: { width: BATTLEFIELD_WORLD_WIDTH, height: BATTLEFIELD_WORLD_HEIGHT },
  worldLayouts: {
    convergence: {
      id: 'convergence',
      world: { width: BATTLEFIELD_WORLD_WIDTH, height: BATTLEFIELD_WORLD_HEIGHT },
      citadel: { x: 600, y: 400, radius: 45 },
      approachBounds: { minX: -320, minY: -320, maxX: 1520, maxY: 1120 },
      buildBounds: { minX: 24, minY: 24, maxX: 1176, maxY: 776 },
      spawnRoutes: SPAWN_GATE_SECTORS.map((side, index) => {
        const spawns = [
          { x: 600, y: -300 },
          { x: 1500, y: 400 },
          { x: 600, y: 1100 },
          { x: -300, y: 400 }
        ];
        return {
          id: `fallback_${side}`,
          side,
          spawn: spawns[index],
          polyline: [spawns[index], { x: 600, y: 400 }],
          cadenceOffsetMs: index * 180
        };
      })
    }
  },
  enemyDefinitions: {},
  waveScripts: {},
  heroKits: {},
  defenseSpecializations: {},
  infinitumMutators: [],
  utils: {}
});
const EXPANSION = (
  (typeof window !== 'undefined' && window.INFERNAL_CITY_EXPANSION)
  || (typeof globalThis !== 'undefined' && globalThis.INFERNAL_CITY_EXPANSION)
  || EXPANSION_FALLBACK
);
const CHARACTER_EXPANSION_FALLBACK = Object.freeze({
  version: 'fallback',
  heroines: {},
  heroKits: {},
  bosses: {},
  bossDefinitions: {},
  campaigns: {}
});
const CHARACTER_EXPANSION = (
  (typeof window !== 'undefined' && window.INFERNAL_CITY_CHARACTERS)
  || (typeof globalThis !== 'undefined' && globalThis.INFERNAL_CITY_CHARACTERS)
  || CHARACTER_EXPANSION_FALLBACK
);
const ADULT_SCENES_FALLBACK = Object.freeze({
  contentVersion: 'fallback',
  bodyRouteDataVersion: 'fallback',
  villainCinematics: {},
  bodyRoutes: [],
  bonusScenes: [],
  categories: { all: 'Toutes les archives' }
});
const ADULT_SCENES = (
  (typeof window !== 'undefined' && window.INFERNAL_CITY_ADULT_SCENES)
  || (typeof globalThis !== 'undefined' && globalThis.INFERNAL_CITY_ADULT_SCENES)
  || ADULT_SCENES_FALLBACK
);

const DIFFICULTY_DATA = {
  story: {
    id: 'story',
    name: 'Histoire sensuelle',
    enemyHp: 0.72,
    enemySpeed: 0.9,
    reward: 0.9,
    citadelHp: 1.2,
    desc: 'Pour découvrir Haven, ses alliances adultes et son histoire avec une pression modérée.'
  },
  standard: {
    id: 'standard',
    name: 'Siège standard',
    enemyHp: 1,
    enemySpeed: 1,
    reward: 1,
    citadelHp: 1,
    desc: 'L’expérience équilibrée prévue pour une première campagne complète.'
  },
  nightmare: {
    id: 'nightmare',
    name: 'Cauchemar néon',
    enemyHp: 1.35,
    enemySpeed: 1.12,
    reward: 1.2,
    citadelHp: 0.9,
    desc: 'Des hordes plus résistantes et rapides, avec davantage de Crédits Haven.'
  }
};

// 20 Deployable Defense Towers & Traps
const TOWER_TYPES = {
  vulcan_turret: { id: 'vulcan_turret', name: 'Tourelle Minigun', icon: '🔫', cost: 30, damage: 15, fireRate: 300, range: 240, type: 'bullet', desc: 'Tirs cinétiques rapides.' },
  plasma_mortar: { id: 'plasma_mortar', name: 'Mortier Plasma', icon: '🔮', cost: 60, damage: 40, fireRate: 900, range: 320, type: 'plasma', desc: 'Tirs d\'artillerie plasma à dégâts de zone.' },
  railgun_pylon: { id: 'railgun_pylon', name: 'Pylône Railgun', icon: '⚡', cost: 90, damage: 110, fireRate: 1600, range: 420, type: 'rail', desc: 'Faisceaux laser transperçants à longue portée.' },
  flame_trap: { id: 'flame_trap', name: 'Piège Inferno', icon: '🔥', cost: 45, damage: 6, fireRate: 100, range: 180, type: 'fire', desc: 'Cône continu de flammes incandescantes.' },
  tesla_spire: { id: 'tesla_spire', name: 'Spire Tesla', icon: '⚡', cost: 75, damage: 35, fireRate: 700, range: 260, type: 'tesla', desc: 'Éclairs électriques se propageant entre démons.' },
  cryo_cannon: { id: 'cryo_cannon', name: 'Canon Cryo', icon: '❄️', cost: 50, damage: 12, fireRate: 500, range: 250, type: 'cryo', desc: 'Ralentit et gèle les hordes démoniaques.' },
  acid_trap: { id: 'acid_trap', name: 'Flaque d\'Acide', icon: '🧪', cost: 35, damage: 10, fireRate: 200, range: 150, type: 'acid', desc: 'Flaque corrosive rongeant l\'armure.' },
  laser_drone: { id: 'laser_drone', name: 'Drone Laser', icon: '🛸', cost: 80, damage: 25, fireRate: 400, range: 300, type: 'drone', desc: 'Drone volant d\'attaque rapide.' },
  landmine: { id: 'landmine', name: 'Mine Explosive', icon: '💣', cost: 25, damage: 150, fireRate: 0, range: 40, type: 'mine', desc: 'Détonne au contact du premier démon.' },
  aegis_barrier: { id: 'aegis_barrier', name: 'Barrière Aegis', icon: '🛡️', cost: 40, damage: 0, fireRate: 0, range: 60, type: 'barrier', hp: 300, desc: 'Mur de force bloquant les vagues.' },
  gravity_well: { id: 'gravity_well', name: 'Puits de Gravité', icon: '🌀', cost: 100, damage: 20, fireRate: 800, range: 280, type: 'gravity', desc: 'Attire et compresse les monstres.' },
  missile_pod: { id: 'missile_pod', name: 'Pod de Missiles', icon: '🚀', cost: 110, damage: 85, fireRate: 1200, range: 380, type: 'missile', desc: 'Roquettes explosives à dégâts de zone.' },
  bio_siphon: { id: 'bio_siphon', name: 'Pique Siphon', icon: '💉', cost: 65, damage: 18, fireRate: 400, range: 200, type: 'siphon', desc: 'Vole la vie des monstres pour soigner la Citadelle.' },
  magnet_drone: { id: 'magnet_drone', name: 'Drone Aimant', icon: '🧲', cost: 50, damage: 0, fireRate: 0, range: 400, type: 'magnet', desc: 'Attire automatiquement tous les Bio-Coins.' },
  sawblade_turret: { id: 'sawblade_turret', name: 'Lance-Lames', icon: '⚙️', cost: 70, damage: 45, fireRate: 600, range: 260, type: 'saw', desc: 'Projette des scies perforant deux cibles.' },
  emp_tower: { id: 'emp_tower', name: 'Tour EMP', icon: '📡', cost: 85, damage: 15, fireRate: 1400, range: 300, type: 'emp', desc: 'Onde de choc étourdissant les démons 2s.' },
  orbital_beam: { id: 'orbital_beam', name: 'Canon Orbital', icon: '🛰️', cost: 150, damage: 250, fireRate: 2500, range: 500, type: 'orbital', desc: 'Rayon laser dévastateur descendu des cieux.' },
  napalm_mine: { id: 'napalm_mine', name: 'Mine Napalm', icon: '💥', cost: 45, damage: 100, fireRate: 0, range: 70, type: 'napalm', desc: 'Laisse une zone de feu persistant.' },
  blood_shrine: { id: 'blood_shrine', name: 'Autel de Sang', icon: '🍷', cost: 95, damage: 30, fireRate: 500, range: 250, type: 'shrine', desc: 'Augmente les dégâts de la Valkyrie active.' },
  sonic_cannon: { id: 'sonic_cannon', name: 'Canon Sonique', icon: '📢', cost: 75, damage: 22, fireRate: 750, range: 220, type: 'sonic', desc: 'Onde sonique repoussant les monstres.' }
};

// Power-Up Drops
const POWERUP_TYPES = [
  { id: 'nuke', icon: '💣', name: 'BOMBE NUCLÉAIRE', color: '#ff2a5f' },
  { id: 'freeze', icon: '❄️', name: 'GEL CHRONO', color: '#00f0ff' },
  { id: 'quad', icon: '⚡', name: 'DÉGÂTS QUADRUPLES', color: '#f59e0b' },
  { id: 'magnet', icon: '🧲', name: 'AIMANT TOTAL', color: '#a855f7' },
  { id: 'invincible', icon: '🛡️', name: 'BOUCLIER TOTAL', color: '#10b981' },
  { id: 'frenzy', icon: '🔥', name: 'OVERDRIVE RECHARGE', color: '#ec4899' }
];

const DEFENSE_MAX_LEVEL = 3;
const DEFENSE_SELL_RATIO = 0.6;
const DEFENSE_LEVEL_STATS = {
  1: { damage: 1, range: 1, fireRate: 1, hp: 1, effect: 1 },
  2: { damage: 1.55, range: 1.1, fireRate: 0.88, hp: 1.45, effect: 1.5 },
  3: { damage: 2.25, range: 1.2, fireRate: 0.76, hp: 2, effect: 2 }
};
const DEFENSE_UPGRADE_COST_MULTIPLIERS = { 1: 1.25, 2: 1.75 };
const LOOT_CONFIG = { maxCrates: 32, maxPowerups: 32, lifetime: 20 };
const SPRITE_ATLAS_COLUMNS = 4;
const SPRITE_ATLAS_ROWS = 4;
const FLOOR_TEXTURE_SRC = 'assets/environment/infernal-city-floor.png';
const COASTLINE_IMAGE_SRC = 'assets/environment/infernal-city-coastline.png';
const APPROACH_TERRAIN_IMAGE_SRC = 'assets/environment/infernal-city-approach-terrain.png';
const SPAWN_GATE_ATLAS_SRC = 'assets/environment/infernal-city-spawn-gate-atlas.png';

// Narrative CGs generated with OpenAI and anchored to each adult heroine's
// established portrait. They are loaded only when the player opens the VN.
const VN_NARRATIVE_CGS = {
  aria: 'assets/cg_aria_nightwatch.png',
  kira: 'assets/cg_kira_rooftop.png',
  rin: 'assets/cg_rin_embers.png',
  selene: 'assets/cg_selene_observatory.png',
  vespera: 'assets/cg_vespera_truce.png',
  carmilla: 'assets/cg_carmilla_library.png',
  ...Object.fromEntries(
    Object.values(CHARACTER_EXPANSION?.vn?.heroines || {})
      .map(heroine => [heroine.id, heroine.chapters?.[0]?.cgSrc || heroine.portrait])
  )
};

// OpenAI-authored defense atlases. Every row is one defense and every column
// is a gameplay phase: idle, charge, fire and recoil/cooldown.
const TOWER_SPRITE_DATA = {
  vulcan_turret: { src: 'assets/animations/towers/tower-atlas-01.png', row: 0, size: 56, rotate: true },
  plasma_mortar: { src: 'assets/animations/towers/tower-atlas-01.png', row: 1, size: 58, rotate: true },
  railgun_pylon: { src: 'assets/animations/towers/tower-atlas-01.png', row: 2, size: 58, rotate: true },
  flame_trap: { src: 'assets/animations/towers/tower-atlas-01.png', row: 3, size: 48, rotate: false },
  tesla_spire: { src: 'assets/animations/towers/tower-atlas-02.png', row: 0, size: 58, rotate: false, ambient: true },
  cryo_cannon: { src: 'assets/animations/towers/tower-atlas-02.png', row: 1, size: 58, rotate: true },
  acid_trap: { src: 'assets/animations/towers/tower-atlas-02.png', row: 2, size: 48, rotate: false, ambient: true },
  laser_drone: { src: 'assets/animations/towers/tower-atlas-02.png', row: 3, size: 54, rotate: true },
  landmine: { src: 'assets/animations/towers/tower-atlas-03.png', row: 0, size: 44, rotate: false },
  aegis_barrier: { src: 'assets/animations/towers/tower-atlas-03.png', row: 1, size: 64, rotate: false, ambient: true },
  gravity_well: { src: 'assets/animations/towers/tower-atlas-03.png', row: 2, size: 58, rotate: false, ambient: true },
  missile_pod: { src: 'assets/animations/towers/tower-atlas-03.png', row: 3, size: 58, rotate: true },
  bio_siphon: { src: 'assets/animations/towers/tower-atlas-04.png', row: 0, size: 56, rotate: true },
  magnet_drone: { src: 'assets/animations/towers/tower-atlas-04.png', row: 1, size: 54, rotate: false, ambient: true },
  sawblade_turret: { src: 'assets/animations/towers/tower-atlas-04.png', row: 2, size: 58, rotate: true },
  emp_tower: { src: 'assets/animations/towers/tower-atlas-04.png', row: 3, size: 58, rotate: false, ambient: true },
  orbital_beam: { src: 'assets/animations/towers/tower-atlas-05.png', row: 0, size: 64, rotate: true },
  napalm_mine: { src: 'assets/animations/towers/tower-atlas-05.png', row: 1, size: 46, rotate: false },
  blood_shrine: { src: 'assets/animations/towers/tower-atlas-05.png', row: 2, size: 62, rotate: false, ambient: true },
  sonic_cannon: { src: 'assets/animations/towers/tower-atlas-05.png', row: 3, size: 58, rotate: true }
};

// OpenAI-generated enemy animation rows. Collision radii remain gameplay-driven
// while visual sizes preserve each archetype's silhouette and boss hierarchy.
const ENEMY_SPRITE_DATA = {
  swarmer: { src: 'assets/animations/enemies/enemy-atlas-01.png', row: 0, size: 42, rotate: true, rotationOffset: 0, fps: 7 },
  runner: { src: 'assets/animations/enemies/enemy-atlas-01.png', row: 1, size: 34, rotate: true, rotationOffset: 0, fps: 10 },
  brute: { src: 'assets/animations/enemies/enemy-atlas-01.png', row: 2, size: 64, rotate: false, fps: 5 },
  hellwarden: { src: 'assets/animations/enemies/enemy-atlas-01.png', row: 3, size: 114, rotate: false, fps: 5 },
  flying: { src: 'assets/animations/enemies/enemy-specialist-atlas.png', row: 0, size: 54, rotate: false, fps: 9 },
  bulwark: { src: 'assets/animations/enemies/enemy-specialist-atlas.png', row: 1, size: 76, rotate: false, fps: 5 },
  artillery: { src: 'assets/animations/enemies/enemy-specialist-atlas.png', row: 2, size: 68, rotate: false, fps: 5 },
  splitter: { src: 'assets/animations/enemies/enemy-specialist-atlas.png', row: 3, size: 62, rotate: false, fps: 7 },
  vespera: { src: 'assets/animations/enemies/enemy-atlas-02.png', row: 0, size: 110, rotate: false, fps: 6 },
  carmilla: { src: 'assets/animations/enemies/enemy-atlas-02.png', row: 1, size: 124, rotate: false, fps: 6 },
  leviathan: { src: 'assets/animations/enemies/enemy-atlas-02.png', row: 2, size: 188, rotate: true, rotationOffset: 0, fps: 4 },
  ...Object.fromEntries(
    Object.values(CHARACTER_EXPANSION?.bossDefinitions || CHARACTER_EXPANSION?.bosses || {})
      .map(boss => [
        boss.id,
        {
          ...boss.spriteAtlas,
          row: 0,
          fps: 6,
          rotate: false,
          layout: 'state_rows'
        }
      ])
  )
};

// The selected adult hero is now a physical defender at the Citadel rather
// than a HUD portrait only. Columns: idle, command, attack, signature ability.
const HERO_SPRITE_DATA = {
  aria: { src: 'assets/animations/heroes/hero-atlas-01.png', row: 0, size: 94 },
  kira: { src: 'assets/animations/heroes/hero-atlas-01.png', row: 1, size: 92 },
  rin: { src: 'assets/animations/heroes/hero-atlas-01.png', row: 2, size: 94 },
  selene: { src: 'assets/animations/heroes/hero-atlas-01.png', row: 3, size: 96 },
  vespera: { src: 'assets/animations/heroes/hero-atlas-02.png', row: 0, size: 104 },
  carmilla: { src: 'assets/animations/heroes/hero-atlas-02.png', row: 1, size: 98 },
  ...Object.fromEntries(
    Object.values(CHARACTER_EXPANSION?.heroines || {})
      .map(hero => [
        hero.id,
        {
          ...hero.spriteAtlas,
          row: 0,
          fps: 7,
          layout: 'state_rows'
        }
      ])
  )
};

// Weapon Base Definitions
const WEAPONS_DATA = {
  vulcan: { id: 'vulcan', name: 'Vulcan Minigun', icon: '🔫', level: 0, maxLevel: 5, damage: 18, fireRate: 200, range: 280, type: 'ballistic', desc: 'Tirs cinétiques à haute cadence.', evolutionName: 'Vulcan Cerberus', evolutionDesc: 'Munitions surchargées capables de traverser trois cibles.' },
  plasma: { id: 'plasma', name: 'Mortier Plasma', icon: '🔮', level: 0, maxLevel: 5, damage: 45, fireRate: 800, range: 350, type: 'plasma', desc: 'Projectiles de plasma thermonucléaire de zone.', evolutionName: 'Nova Cataclysmique', evolutionDesc: 'Chaque impact déclenche une onde plasma de très grande portée.' },
  railgun: { id: 'railgun', name: 'Railgun à Particules', icon: '⚡', level: 0, maxLevel: 5, damage: 120, fireRate: 1500, range: 450, type: 'rail', desc: 'Faisceaux transperçant les rangs ennemis.', evolutionName: 'Lance d’Odin', evolutionDesc: 'Un rayon amplifié traverse tout le champ de bataille.' },
  flamethrower: { id: 'flamethrower', name: 'Lance-Flammes Inferno', icon: '🔥', level: 0, maxLevel: 5, damage: 8, fireRate: 80, range: 200, type: 'fire', desc: 'Cône continu de flammes rugissantes.', evolutionName: 'Souffle de Niflhel', evolutionDesc: 'Des flammes cryo-plasma couvrent un cône beaucoup plus large.' }
};

// Adult Valkyries. Relationship data is explicit so the mature mode never relies
// on visual age-coding or implied consent.
const HERO_CLASSES = {
  aria: {
    id: 'aria', name: 'Commandante Aria', title: 'Valkyrie Aegis', age: 34, isAdult: true,
    avatar: 'assets/cg_aria.jpg', altAvatar: 'assets/cg_aria_swimsuit.jpg', activeSkin: 'default',
    abilityName: 'Leurre Bouclier Aegis', abilityDesc: 'Déploie un leurre renforcé.', cooldown: 12, startingWeapon: 'vulcan',
    affinityLvl: 1, relationshipXp: 0, romanceOptIn: false, privateMomentUnlocked: false,
    boundary: 'Hors service, vous êtes d’égal à égal. Un refus ne change jamais son efficacité au combat.',
    loungeLines: [
      'Aria garde une distance professionnelle, mais vous accorde toute son attention.',
      'Elle accepte un verre après la relève et vous demande ce que vous attendez réellement.',
      'Sa voix baisse près de votre oreille ; la proximité est choisie, jamais présumée.',
      'Elle formule ses limites, écoute les vôtres et confirme que chacun peut arrêter à tout moment.',
      'Une invitation privée apparaît sur votre terminal. La porte ne s’ouvrira qu’à votre accord mutuel.'
    ]
  },
  kira: {
    id: 'kira', name: 'Kira l’Ombre', title: 'Infiltratrice Fantôme', age: 29, isAdult: true,
    avatar: 'assets/cg_kira.jpg', altAvatar: 'assets/cg_kira_lingerie.jpg', activeSkin: 'default',
    abilityName: 'Hologramme d’Ombre', abilityDesc: 'Déploie une illusion qui explose en plasma.', cooldown: 10, startingWeapon: 'railgun',
    affinityLvl: 1, relationshipXp: 0, romanceOptIn: false, privateMomentUnlocked: false,
    boundary: 'Kira contrôle le rythme et préfère les invitations directes, sans insistance.',
    loungeLines: [
      'Kira vous observe depuis la pénombre avant de vous offrir la place face à elle.',
      '« Approche quand je te ferai signe. » Son sourire confirme qu’elle joue selon ses propres règles.',
      'Elle réduit la distance, puis attend votre assentiment avant de poursuivre la conversation.',
      'Vos limites deviennent un code partagé, plus intime que n’importe quel secret militaire.',
      'Elle vous tend une clé cryptée pour une rencontre privée, révocable d’un simple geste.'
    ]
  },
  rin: {
    id: 'rin', name: 'Rin', title: 'Haute Prêtresse de Flamme', age: 28, isAdult: true,
    avatar: 'assets/cg_rin.jpg', altAvatar: 'assets/cg_rin_silk.jpg', activeSkin: 'default',
    abilityName: 'Vortex Enflammé', abilityDesc: 'Déploie un leurre qui embrase les monstres.', cooldown: 14, startingWeapon: 'flamethrower',
    affinityLvl: 1, relationshipXp: 0, romanceOptIn: false, privateMomentUnlocked: false,
    boundary: 'Rin aime la franchise et demande toujours une réponse claire avant de rapprocher les flammes.',
    loungeLines: [
      'Rin réchauffe deux coupes entre ses paumes et vous laisse choisir si vous restez.',
      'La soie de sa tenue capte les néons lorsqu’elle se rapproche pour partager une confidence.',
      'Elle pose une question directe, attend votre oui, puis laisse la tension s’installer sans la brusquer.',
      'Le rituel qu’elle propose commence par vos limites exprimées à voix haute.',
      'Les portes du sanctuaire se ferment sur un accord mutuel ; le récit se fond pudiquement au noir.'
    ]
  },
  selene: {
    id: 'selene', name: 'Sélène', title: 'Oracle Cyber-Lunaire', age: 31, isAdult: true,
    avatar: 'assets/cg_selene.jpg', altAvatar: 'assets/cg_selene_translucent.jpg', activeSkin: 'default',
    abilityName: 'Faisceau Lunaire', abilityDesc: 'Déploie un leurre lunaire à impulsions de zone.', cooldown: 11, startingWeapon: 'plasma',
    affinityLvl: 1, relationshipXp: 0, romanceOptIn: false, privateMomentUnlocked: false,
    boundary: 'Sélène privilégie la douceur, les mots précis et un consentement renouvelé à chaque étape.',
    loungeLines: [
      'Sélène vous invite à observer la lune artificielle, sans exiger que le silence soit comblé.',
      'Son reflet se mêle au vôtre dans la baie vitrée tandis qu’elle vérifie votre confort.',
      'Ses doigts restent à quelques centimètres des vôtres jusqu’à votre signe explicite.',
      'Elle nomme chaque limite avec calme ; l’anticipation gagne en intensité parce qu’elle reste sûre.',
      'La lumière lunaire baisse sur votre double invitation, puis l’archive choisit un fondu au noir.'
    ]
  },
  vespera: {
    id: 'vespera', name: 'Impératrice Vespera', title: 'Souveraine Abyssale', age: 146, isAdult: true,
    avatar: 'assets/cg_vespera.jpg', altAvatar: 'assets/cg_vespera.jpg', activeSkin: 'default',
    abilityName: 'Orbes Abyssales', abilityDesc: 'Déploie un orbe-leurre à puissantes impulsions abyssales.', cooldown: 10, startingWeapon: 'plasma',
    affinityLvl: 1, relationshipXp: 0, romanceOptIn: false, privateMomentUnlocked: false, unlocked: false, allied: false,
    allianceResponse: '« Je ne sers personne. Mais je choisis de défendre Haven à tes côtés. »',
    boundary: 'L’alliance militaire ne vaut jamais accord romantique. Vespera décide séparément de rejoindre le Salon.',
    loungeLines: [
      'Vespera accepte de négocier, sans céder un pouce de sa souveraineté.',
      'Elle choisit elle-même le lieu du rendez-vous et rappelle que l’alliance ne vous donne aucun droit sur elle.',
      'Son regard soutient le vôtre ; la tension vient de deux volontés aussi fortes.',
      'Elle transforme vos limites en pacte verbal, amendable ou annulable à tout instant.',
      'Le sceau abyssal s’illumine sur une invitation réciproque, avant un fondu au noir.'
    ]
  },
  carmilla: {
    id: 'carmilla', name: 'Reine Carmilla', title: 'Impératrice de Sang', age: 312, isAdult: true,
    avatar: 'assets/cg_carmilla.jpg', altAvatar: 'assets/cg_carmilla.jpg', activeSkin: 'default',
    abilityName: 'Vortex de Sang', abilityDesc: 'Déploie un leurre vampire absorbant la vie.', cooldown: 9, startingWeapon: 'railgun',
    affinityLvl: 1, relationshipXp: 0, romanceOptIn: false, privateMomentUnlocked: false, unlocked: false, allied: false,
    allianceResponse: '« Un pacte n’a de valeur que signé sans peur. J’accepte, selon mes propres termes. »',
    boundary: 'Carmilla exige des accords explicites et considère toute hésitation comme une pause immédiate.',
    loungeLines: [
      'Carmilla vous reçoit en souveraine alliée, non en conquête.',
      'Elle offre une coupe scellée et attend que vous décidiez librement de la partager.',
      'La conversation devient plus proche ; chaque silence est une question à laquelle vous pouvez répondre non.',
      'Votre pacte privé inscrit limites, signal d’arrêt et soin mutuel après toute rencontre.',
      'Elle ouvre les rideaux de velours sur une invitation réciproque ; la scène se fond au noir.'
    ]
  },
  ...Object.fromEntries(
    Object.values(CHARACTER_EXPANSION.heroines || {}).map(hero => [
      hero.id,
      {
        ...hero,
        relationship: { ...(hero.relationship || {}) },
        loungeLines: [...(hero.loungeLines || [])],
        unlockRule: { ...(hero.unlockRule || {}) }
      }
    ])
  )
};

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'Premier Sang', desc: 'Éliminer votre premier démon.', unlocked: false, reward: 50 },
  { id: 'wave_5', name: 'Vanguard Defender', desc: 'Survivre jusqu\'à la Vague 5.', unlocked: false, reward: 100 },
  { id: 'wave_10', name: 'Master Sweeper', desc: 'Survivre jusqu\'à la Vague 10.', unlocked: false, reward: 200 },
  { id: 'wave_15', name: 'Titan Slayer', desc: 'Survivre au Mega-Boss Léviathan à la Vague 15.', unlocked: false, reward: 500 },
  { id: 'frenzy_master', name: 'Frénésie Totale', desc: 'Activer le Mode Overdrive 3 fois.', unlocked: false, reward: 150 },
  { id: 'super_weapon', name: 'Arsenal Suprême', desc: 'Faire évoluer une arme en Super-Arme.', unlocked: false, reward: 250 },
  { id: 'builder', name: 'Architecte de Citadelle', desc: 'Construire 10 tourelles de défense.', unlocked: false, reward: 150 },
  { id: 'recruiter', name: 'Alliance Souveraine', desc: 'Conclure une trêve libre avec une ancienne adversaire.', unlocked: false, reward: 300 },
  { id: 'harem_lover', name: 'Confiance Nocturne', desc: 'Atteindre une affinité mutuelle de rang 2.', unlocked: false, reward: 200 },
  { id: 'campaign_clear', name: 'Aube sur Haven', desc: 'Terminer la campagne de 15 vagues.', unlocked: false, reward: 350 },
  { id: 'tower_100', name: 'Maîtresse de l’Infinitum', desc: 'Sécuriser les 100 étages de la Tour Infinitum.', unlocked: false, reward: 750 }
];

// Secret Archives Gallery Items
const GALLERY_ITEMS = [
  { id: 'aria', age: 34, name: 'Commandante Aria', subtitle: 'Gardienne adulte de la Citadelle Haven', img: 'assets/cg_aria.jpg', altImg: 'assets/cg_aria_swimsuit.jpg', unlockReq: 'Survivre à la Vague 3', unlocked: false, quote: '"Hors service, nous sommes d’égal à égal. Reste seulement si tu le veux."', story: 'Commandante Aegis de 34 ans, Aria protège Haven par choix. Sa confiance se gagne au combat et ses invitations privées exigent un accord mutuel.', stats: { Âge: '34 ans', Puissance: 'S', Agilité: 'A', Armure: 'EX' } },
  { id: 'kira', age: 29, name: 'Kira l’Ombre', subtitle: 'Infiltratrice adulte des Forces Spéciales', img: 'assets/cg_kira.jpg', altImg: 'assets/cg_kira_lingerie.jpg', unlockReq: 'Déployer 3 leurres au cours d\'un combat', unlocked: false, quote: '"Approche quand je te ferai signe."', story: 'À 29 ans, Kira manie les illusions et fixe elle-même le rythme de chaque rapprochement.', stats: { Âge: '29 ans', Puissance: 'A', Agilité: 'EX', Armure: 'B' } },
  { id: 'rin', age: 28, name: 'Rin', subtitle: 'Haute Prêtresse adulte de Flamme', img: 'assets/cg_rin.jpg', altImg: 'assets/cg_rin_silk.jpg', unlockReq: 'Faire évoluer n\'importe quelle arme', unlocked: false, quote: '"Le feu sacré ne s’approche qu’après un oui clair."', story: 'Prêtresse de 28 ans, Rin consume les armées démoniaques et réserve ses rituels privés aux accords explicites.', stats: { Âge: '28 ans', Puissance: 'EX', Agilité: 'B', Armure: 'A' } },
  { id: 'vespera', age: 146, name: 'Impératrice Vespera', subtitle: 'Souveraine Abyssale adulte', img: 'assets/cg_vespera.jpg', unlockReq: 'Conclure une alliance libre avec Vespera (Vague 5)', unlocked: false, quote: '"Je ne sers personne. Mais je pourrais choisir de marcher à tes côtés."', story: 'Souveraine adulte de 146 ans, Vespera ne confond jamais alliance, désir et soumission.', stats: { Âge: '146 ans', Puissance: 'EX+', Agilité: 'S', Armure: 'S' } },
  { id: 'carmilla', age: 312, name: 'Reine Carmilla', subtitle: 'Impératrice gothique adulte', img: 'assets/cg_carmilla.jpg', unlockReq: 'Conclure une alliance libre avec Carmilla (Vague 10)', unlocked: false, quote: '"Un pacte n’a de valeur que signé sans peur."', story: 'Souveraine adulte de 312 ans, Carmilla protège sa liberté comme celle de ses partenaires.', stats: { Âge: '312 ans', Puissance: 'EX+', Agilité: 'S+', Armure: 'S' } },
  { id: 'selene', age: 31, name: 'Sélène', subtitle: 'Oracle Cyber-Lunaire adulte', img: 'assets/cg_selene.jpg', altImg: 'assets/cg_selene_translucent.jpg', unlockReq: 'Activer le Mode Overdrive', unlocked: false, quote: '"La lumière stellaire guidera notre victoire."', story: 'Oracle de 31 ans, Sélène canalise l\'énergie lunaire et renouvelle son consentement à chaque étape.', stats: { Âge: '31 ans', Puissance: 'S+', Agilité: 'A+', Armure: 'A' } },
  { id: 'nova', age: 27, name: 'Nova', subtitle: 'Ingénieure adulte de l’Armurerie', img: 'assets/cg_nova.jpg', unlockReq: 'Récolter 500 Bio-Coins', unlocked: false, quote: '"Systèmes au maximum de puissance !"', story: 'Ingénieure de 27 ans, Nova dirige l’armurerie et garde le plein contrôle de son image dans les archives.', stats: { Âge: '27 ans', Puissance: 'A', Agilité: 'S', Armure: 'A+' } },
  ...Object.values(CHARACTER_EXPANSION.heroines || {}).map(hero => ({
    id: hero.id,
    age: hero.age,
    name: hero.name,
    subtitle: `${hero.title} · héroïne adulte`,
    img: hero.avatar,
    altImg: hero.altAvatar,
    unlockReq: hero.unlockRule?.label || 'Progresser dans Les Dix Trônes.',
    unlocked: hero.unlockRule?.type === 'default',
    quote: `"${hero.boundary}"`,
    story: `${hero.name}, ${hero.age} ans, rejoint Haven avec un kit jouable consacré à ${CHARACTER_EXPANSION.heroKits?.[hero.id]?.role || 'la défense'}. Ses choix relationnels restent séparés de sa valeur militaire.`,
    stats: { Âge: `${hero.age} ans`, Puissance: 'S', Agilité: 'S', Armure: 'A+' }
  })),
  {
    id: 'ten_thrones_conclusion',
    age: 28,
    name: 'L’Aube après les Dix Trônes',
    subtitle: 'Conclusion de campagne · protagonistes adultes',
    img: 'assets/vn/cg/ten-thrones-conclusion-v1.webp',
    unlockReq: 'Achever les vingt vagues des Dix Trônes',
    unlocked: false,
    quote: '"Les Trônes sont tombés. Nos choix, eux, restent les nôtres."',
    story: 'La dernière archive rassemble les héroïnes adultes de Haven après la chute de Madame Noctis. Elle célèbre leur victoire sans confondre camaraderie, alliance et consentement romantique.',
    stats: { Âge: '28 ans et plus', Puissance: 'EX', Agilité: 'S', Armure: 'EX' }
  }
];

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.selectedHero = HERO_CLASSES.aria;
    this.selectedTowerToBuild = TOWER_TYPES.vulcan_turret;
    this.selectedPlacedDefense = null;
    this.lastFocusedElement = null;
    this.modalFocusStack = [];

    this.citadel = { x: 600, y: 400, radius: 45, hp: 500, maxHp: 500 };
    this.selectedLayoutId = 'convergence';
    this.activeCampaignId = 'four_gates';
    this.defeatedBossIds = [];
    this.activeBossHuntId = null;
    this.seenBossIntroIds = new Set();
    this.seenBossDefeatIds = new Set();
    this.pendingCinematics = [];
    this.activeCinematic = null;
    this.activeAdultSceneFilter = 'all';
    this.activeBodyRouteParticipantFilter = 'all';
    this.worldLayout = null;
    this.spawnRoutes = [];
    this.mapRotation = [];
    this.mapRotationIndex = 0;
    this.rotationEnabled = false;

    this.wave = 1;
    this.towerFloor = 1;
    this.waveActive = true;
    this.waveIntermissionTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.waveSpawnTarget = 10;
    this.bossSpawnedThisWave = false;
    this.waveRewardClaimed = false;
    this.isTowerMode = false;
    this.towerMutator = null;
    this.campaignStateBeforeTower = null;
    this.towerCompleted = false;
    this.towerCompletionPending = false;
    this.towerCompletionEarnedReward = 0;
    this.pendingTowerMutator = null;
    this.pendingTowerMutatorFloor = null;
    this.towerMutators = [];
    this.activeRunMutators = [];
    this.infinitumCanReturn = false;
    this.waveSpawnQueue = [];
    this.waveSpawnElapsedMs = 0;
    this.activeWaveDefinition = null;
    this.lastWaveStatusSecond = null;
    this.difficulty = 'standard';
    this.endlessMode = false;
    this.campaignVictory = false;
    this.campaignVictoryClaimed = false;
    this.runtimeError = null;
    this.lastPausedRenderTime = 0;
    this.accessibilityStatusTimer = 0;
    this.threatReadoutTimer = 0;
    this.runElapsedSeconds = 0;
    this.runMetaCoinsEarned = 0;
    this.activeRunCheckpoint = null;
    this.savedRunCheckpoint = null;
    this.bestScore = 0;
    this.bestWave = 0;
    this.campaignCompletions = 0;
    this.resumeWasOffered = false;
    this.hasEnteredAdultExperience = false;
    this.saveLoadError = null;
    this.preferredMusicEnabled = false;
    this.preferredCrtEnabled = true;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.8;
    this.contrastMode = 'default';
    this.textSize = 'default';
    this.score = 0;
    this.coins = 400;
    this.metaCoins = 0;
    this.totalCoinsEarned = 0;
    this.decoysDeployedCount = 0;
    this.towersBuiltThisRun = 0;
    this.evolvedWeaponsCount = 0;
    this.mutantsKilled = 0;
    this.overdriveCount = 0;
    this.dailyChallenge = null;
    this.dailyRng = null;
    this.runHistory = [];
    this.connectedGamepadIndex = null;
    this.lastGamepadStatusPoll = 0;
    this.gamepadButtonState = [];
    this.kiraMarkedRoutes = new Set();
    this.nyxExposedRoutes = new Set();
    this.carmillaStoredCharge = 0;
    this.mircallaRetaliationCharge = 0;
    this.hanaPassiveChargeTimer = 0;
    this.hanaPassiveReady = false;

    this.freezeTimer = 0;
    this.quadDamageTimer = 0;
    this.invincibleTimer = 0;
    this.frenzyMeter = 0;
    this.maxFrenzyMeter = 100;
    this.isOverdriveActive = false;
    this.overdriveTimer = 0;

    this.xp = 0;
    this.level = 1;
    this.nextLevelXp = 100;
    this.pendingLevelChoices = 0;
    this.affinityXp = 0;
    this.nextAffinityXp = 200;

    this.weapons = JSON.parse(JSON.stringify(WEAPONS_DATA));
    this.weaponTimers = {};
    this.placedTowers = [];
    this.towerAnimationGhosts = [];

    this.mercenaries = [];
    this.petDrones = [];

    this.enemies = [];
    this.enemySpriteImages = {};
    this.towerSpriteImages = {};
    this.heroSpriteImages = {};
    this.spriteAtlasImages = {};
    this.floorImage = null;
    this.floorPattern = null;
    this.coastlineImage = null;
    this.approachTerrainImage = null;
    this.spawnGateAtlasImage = null;
    this.spawnGatePulses = Object.fromEntries(SPAWN_GATE_SECTORS.map(side => [side, 0]));
    this.nextSpawnGateIndex = 0;
    this.battlefieldViewScale = 1;
    // Camera coordinates stay in the fixed logical world. Zoom 1 is the
    // responsive cover view, so the approach terrain fills the usable viewport
    // without being stretched.
    this.camera = {
      x: BATTLEFIELD_WORLD_WIDTH / 2,
      y: BATTLEFIELD_WORLD_HEIGHT / 2,
      zoom: 1
    };
    this.enemyBullets = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.decoys = [];
    this.crates = [];
    this.powerups = [];
    this.hazards = [];
    this.bossHazards = [];

    this.abilityCooldownTimer = 0;
    this.activeHeroTargeting = null;
    this.hostileProjectileFreezeTimer = 0;
    this.heroUltimateDefenseDamageTimer = 0;
    this.shopUpgrades = { hpBonus: 0, fireRateBonus: 0, magnetRange: 0 };
    this.buildCursor = { x: 720, y: 400, visible: false };

    this.isPaused = false;
    this.isGameOver = false;
    this.requiresPortraitOrientation = false;
    this.lastTime = 0;

    this.gridOffset = 0;
    this.animationClock = 0;
    this.heroAnimationState = 'idle';
    this.heroAnimationTimer = 0;
    this.heroFacingAngle = 0;
    this.vnSceneProgress = {
      dataVersion: '1.0.0',
      flags: [],
      chapterResults: {},
      appliedEffects: [],
      active: null
    };
    this.activeVnSession = null;
    this.bodyRouteProgress = {
      dataVersion: ADULT_SCENES.bodyRouteDataVersion || ADULT_SCENES.contentVersion,
      routes: {}
    };
    this.activeBodyRouteId = null;
    this.vnExpansionState = this.loadVnExpansionState();
    this.lastVnCallbackMessage = '';
    this.vnPreviousRadioStation = null;

    this.applyWorldLayout(this.selectedLayoutId, { force: true, repositionUnits: false });
    this.loadProgress();
  }

  init() {
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.setupModalAccessibility();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    const hudHeader = document.getElementById('hud-header');
    if (hudHeader && typeof ResizeObserver === 'function') {
      this.hudResizeObserver = new ResizeObserver(() => this.syncMissionStatusPosition());
      this.hudResizeObserver.observe(hudHeader);
    }
    requestAnimationFrame(() => this.syncMissionStatusPosition());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.wasPausedBeforeHidden = this.isPaused;
        this.isPaused = true;
        this.saveProgress();
      } else if (!this.wasPausedBeforeHidden && !this.getTopOpenModal() && !this.isGameOver && !this.campaignVictory) {
        this.isPaused = false;
      }
    });
    window.addEventListener('pagehide', () => this.saveProgress());

    this.bindEvents();
    this.initWeapons();
    this.renderBuildBar();
    this.updateHUD();
    this.renderGallery();

    // Prepare the arena behind the mandatory adult-content notice.
    this.startNewGame({ preserveCheckpoint: true, silent: true });
    const adultGate = document.getElementById('adult-gate-modal');
    if (adultGate && adultGate.classList.contains('active')) {
      this.isPaused = true;
      requestAnimationFrame(() => document.getElementById('btn-enter-adult')?.focus());
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  getWorldLayout(layoutId = this.selectedLayoutId) {
    const layouts = EXPANSION?.worldLayouts || EXPANSION_FALLBACK.worldLayouts;
    return layouts[layoutId] || layouts.convergence || EXPANSION_FALLBACK.worldLayouts.convergence;
  }

  normalizeSpawnRoute(route, index = 0) {
    const citadel = this.worldLayout?.citadel || this.citadel || { x: 600, y: 400 };
    const spawn = route?.spawn || route?.polyline?.[0] || { x: 1500, y: 400 };
    const polyline = Array.isArray(route?.polyline) && route.polyline.length > 1
      ? route.polyline
      : [spawn, { x: citadel.x, y: citadel.y }];
    return {
      id: String(route?.id || `route_${index}`),
      side: SPAWN_GATE_SECTORS.includes(route?.side) ? route.side : 'east',
      spawn: { x: Number(spawn.x) || 0, y: Number(spawn.y) || 0 },
      polyline: polyline.map(point => ({
        x: Number(point?.x) || 0,
        y: Number(point?.y) || 0
      })),
      cadenceOffsetMs: Math.max(0, Number(route?.cadenceOffsetMs) || 0)
    };
  }

  applyWorldLayout(layoutId = this.selectedLayoutId, options = {}) {
    const layout = this.getWorldLayout(layoutId);
    const requestedAsRotation = options.rotation === true;
    if (
      requestedAsRotation
      && !options.force
      && (this.waveActive || (this.enemies?.length || 0) > 0)
    ) {
      return { ok: false, reason: 'wave-active', layout: this.worldLayout };
    }

    const previousCitadel = this.worldLayout?.citadel || this.citadel || { x: 600, y: 400 };
    const nextCitadel = layout.citadel || { x: 600, y: 400, radius: 45 };
    const world = layout.world || EXPANSION.world || EXPANSION_FALLBACK.world;
    const dx = (Number(nextCitadel.x) || 0) - (Number(previousCitadel.x) || 0);
    const dy = (Number(nextCitadel.y) || 0) - (Number(previousCitadel.y) || 0);

    this.selectedLayoutId = layout.id || layoutId || 'convergence';
    this.worldLayout = layout;
    this.worldWidth = Math.max(1, Number(world.width) || BATTLEFIELD_WORLD_WIDTH);
    this.worldHeight = Math.max(1, Number(world.height) || BATTLEFIELD_WORLD_HEIGHT);
    this.citadel.x = Number(nextCitadel.x) || (this.worldWidth / 2);
    this.citadel.y = Number(nextCitadel.y) || (this.worldHeight / 2);
    this.citadel.radius = Math.max(30, Number(nextCitadel.radius) || 45);
    this.spawnRoutes = (layout.spawnRoutes || []).map((route, index) => this.normalizeSpawnRoute(route, index));
    if (this.spawnRoutes.length === 0) {
      this.spawnRoutes = EXPANSION_FALLBACK.worldLayouts.convergence.spawnRoutes
        .map((route, index) => this.normalizeSpawnRoute(route, index));
    }

    if (options.repositionUnits !== false && (dx !== 0 || dy !== 0)) {
      const buildBounds = layout.buildBounds || {
        minX: 24,
        minY: 24,
        maxX: this.worldWidth - 24,
        maxY: this.worldHeight - 24
      };
      const translateAndClamp = entity => {
        if (!entity) return;
        entity.x = Math.max(
          Number(buildBounds.minX) || 24,
          Math.min(Number(buildBounds.maxX) || (this.worldWidth - 24), (Number(entity.x) || 0) + dx)
        );
        entity.y = Math.max(
          Number(buildBounds.minY) || 24,
          Math.min(Number(buildBounds.maxY) || (this.worldHeight - 24), (Number(entity.y) || 0) + dy)
        );
      };
      [
        ...(this.placedTowers || []),
        ...(this.mercenaries || []),
        ...(this.petDrones || []),
        ...(this.decoys || [])
      ].forEach(translateAndClamp);
      translateAndClamp(this.buildCursor);
    }

    if (this.camera) {
      this.camera.x = this.citadel.x;
      this.camera.y = this.citadel.y;
      this.constrainBattlefieldCamera();
    }
    const terrainSrc = LAYOUT_TERRAIN_SOURCES[this.selectedLayoutId] || layout.terrainSrc;
    if (terrainSrc && this.spriteAtlasImages) {
      this.approachTerrainImage = this.preloadSpriteAsset(terrainSrc, 'Terrain tactique');
    }
    return { ok: true, layout };
  }

  setMapRotation(rotation = []) {
    const validIds = Array.isArray(rotation)
      ? rotation.filter(id => EXPANSION?.worldLayouts?.[id])
      : [];
    this.mapRotation = [...new Set(validIds)];
    this.rotationEnabled = this.mapRotation.length > 1;
    this.mapRotationIndex = Math.max(0, this.mapRotation.indexOf(this.selectedLayoutId));
    return this.mapRotation.slice();
  }

  rotateWorldLayoutBetweenWaves() {
    if (this.mapRotation.length < 2 || this.waveActive || this.enemies.length > 0) return false;
    this.mapRotationIndex = (this.mapRotationIndex + 1) % this.mapRotation.length;
    const nextLayoutId = this.mapRotation[this.mapRotationIndex];
    return this.applyWorldLayout(nextLayoutId, { rotation: true }).ok;
  }

  createFallbackSeededRng(seed) {
    let state = (Number(seed) >>> 0) || 0x6d2b79f5;
    return function seededRandom() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  getRunRandom() {
    if (!this.dailyRng) return Math.random();
    const rng = this.dailyRng;
    return rng();
  }

  getActiveRunMutators() {
    return this.isTowerMode ? this.towerMutators : this.activeRunMutators;
  }

  getRunModifierProduct(key, fallback = 1) {
    return this.getActiveRunMutators().reduce((product, mutator) => {
      const value = Number(mutator?.modifiers?.[key]);
      return product * (Number.isFinite(value) && value > 0 ? value : 1);
    }, fallback);
  }

  getRunModifierMaximum(key, fallback = 0) {
    return this.getActiveRunMutators().reduce((maximum, mutator) => {
      const value = Number(mutator?.modifiers?.[key]);
      return Number.isFinite(value) ? Math.max(maximum, value) : maximum;
    }, fallback);
  }

  startDailyChallenge(value = new Date(), playerSalt = '') {
    const createChallenge = EXPANSION?.utils?.createDailyChallenge;
    let challenge;
    if (typeof createChallenge === 'function') {
      challenge = createChallenge(value, playerSalt);
    } else {
      const day = new Date(value).toISOString().slice(0, 10);
      let seed = 2166136261;
      for (const character of `${day}:${playerSalt}`) {
        seed ^= character.charCodeAt(0);
        seed = Math.imul(seed, 16777619);
      }
      challenge = {
        id: `daily-${day}-${(seed >>> 0).toString(16)}`,
        date: day,
        seed: seed >>> 0,
        layoutId: 'convergence',
        heroId: 'aria',
        mutatorIds: [],
        rules: { startingCoins: 145, scoreMultiplier: 1 }
      };
    }
    this.dailyChallenge = challenge;
    const createRng = EXPANSION?.utils?.createSeededRng;
    this.dailyRng = typeof createRng === 'function'
      ? createRng(challenge.seed)
      : this.createFallbackSeededRng(challenge.seed);
    this.selectedLayoutId = EXPANSION?.worldLayouts?.[challenge.layoutId]
      ? challenge.layoutId
      : 'convergence';
    const dailyHero = HERO_CLASSES[challenge.heroId];
    if (dailyHero && dailyHero.unlocked !== false) this.selectedHero = dailyHero;
    this.activeRunMutators = (challenge.mutatorIds || [])
      .map(id => (EXPANSION.infinitumMutators || []).find(mutator => mutator.id === id))
      .filter(Boolean);
    this.startNewGame({
      layoutId: this.selectedLayoutId,
      dailyChallenge: challenge,
      preserveCheckpoint: true
    });
    this.coins = Math.max(0, Number(challenge.rules?.startingCoins) || this.coins);
    this.updateHUD();
    return challenge;
  }

  recordRunHistory(result = {}) {
    const entry = {
      id: String(result.id || `${Date.now()}-${this.runHistory.length}`),
      mode: result.mode || (this.dailyChallenge ? 'daily' : (this.isTowerMode ? 'infinitum' : (this.endlessMode ? 'endless' : 'campaign'))),
      dailyId: this.dailyChallenge?.id || null,
      date: result.date || new Date().toISOString(),
      layoutId: this.selectedLayoutId,
      heroId: this.selectedHero?.id || 'aria',
      wave: Math.max(1, Math.floor(Number(result.wave) || this.wave || 1)),
      score: Math.max(0, Math.floor(Number(result.score) || this.score || 0)),
      victory: result.victory === true,
      durationSeconds: Math.max(0, Math.floor(Number(result.durationSeconds) || this.runElapsedSeconds || 0))
    };
    this.runHistory.unshift(entry);
    this.runHistory = this.runHistory.slice(0, 10);
    this.saveProgress();
    return entry;
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const newWidth = window.innerWidth || 1200;
    const newHeight = window.innerHeight || 800;
    const shortLandscape = newWidth > newHeight && newHeight <= 500;
    const orientationNotice = document.getElementById('short-landscape-notice');
    this.requiresPortraitOrientation = shortLandscape;
    if (orientationNotice) {
      const gateIsActive = document.getElementById('adult-gate-modal')?.classList.contains('active') === true;
      const exposeToAssistiveTech = shortLandscape && !gateIsActive;
      orientationNotice.hidden = !shortLandscape;
      orientationNotice.inert = !exposeToAssistiveTech;
      orientationNotice.setAttribute('aria-hidden', exposeToAssistiveTech ? 'false' : 'true');
    }
    // Canvas pixels are only a viewport. Gameplay always stays in a fixed
    // 1200×800 logical arena, so rotating/resizing cannot teleport a distant
    // horde toward the Citadel or distort projectile trajectories.
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    const layout = this.getWorldLayout();
    this.worldWidth = Number(layout.world?.width) || BATTLEFIELD_WORLD_WIDTH;
    this.worldHeight = Number(layout.world?.height) || BATTLEFIELD_WORLD_HEIGHT;
    this.citadel.x = Number(layout.citadel?.x) || (this.worldWidth / 2);
    this.citadel.y = Number(layout.citadel?.y) || (this.worldHeight / 2);
    if (!this.buildCursor.visible) {
      this.buildCursor.x = this.citadel.x + 120;
      this.buildCursor.y = this.citadel.y;
    }
    this.constrainBattlefieldCamera(newWidth, newHeight);
    this.updateBattlefieldCameraControls(newWidth, newHeight);
    requestAnimationFrame(() => this.syncMissionStatusPosition());
  }

  getBattlefieldCameraMetrics(width = this.canvas?.width || 1200, height = this.canvas?.height || 800) {
    const rect = this.canvas?.getBoundingClientRect?.() || {
      left: 0,
      top: 0,
      width,
      height
    };
    const cssWidth = Math.max(1, rect.width || width);
    const cssHeight = Math.max(1, rect.height || height);
    const cssToCanvasY = height / cssHeight;
    const headerRect = document.getElementById('hud-header')?.getBoundingClientRect?.();
    const missionStatusRect = document.getElementById('mission-status-panel')?.getBoundingClientRect?.();
    const buildBarRect = document.getElementById('hud-build-bar')?.getBoundingClientRect?.();
    const topObstructionBottom = Math.max(
      headerRect?.bottom ?? (rect.top + 76),
      missionStatusRect?.bottom ?? 0
    );
    const safeTop = Math.min(
      height - 1,
      Math.max(
        0,
        ((topObstructionBottom - rect.top) + 8) * cssToCanvasY
      )
    );
    const safeBottom = Math.max(
      safeTop + 1,
      Math.min(
        height,
        (((buildBarRect?.top ?? (rect.top + cssHeight - 170)) - rect.top) - 8) * cssToCanvasY
      )
    );
    const safeHeight = Math.max(1, safeBottom - safeTop);
    const worldWidth = this.worldWidth || BATTLEFIELD_WORLD_WIDTH;
    const worldHeight = this.worldHeight || BATTLEFIELD_WORLD_HEIGHT;
    const layoutBounds = this.worldLayout?.approachBounds;
    const approachLeft = Number.isFinite(layoutBounds?.minX) ? layoutBounds.minX : -BATTLEFIELD_APPROACH_MARGIN;
    const approachTop = Number.isFinite(layoutBounds?.minY) ? layoutBounds.minY : -BATTLEFIELD_APPROACH_MARGIN;
    const approachRight = Number.isFinite(layoutBounds?.maxX) ? layoutBounds.maxX : worldWidth + BATTLEFIELD_APPROACH_MARGIN;
    const approachBottom = Number.isFinite(layoutBounds?.maxY) ? layoutBounds.maxY : worldHeight + BATTLEFIELD_APPROACH_MARGIN;
    const approachWidth = approachRight - approachLeft;
    const approachHeight = approachBottom - approachTop;
    const fitScale = Math.min(
      width / approachWidth,
      safeHeight / approachHeight
    );
    // Zoom 100% is a uniform cover view. The authored terrain spans the full
    // width and usable height without stretching; the dynamic minimum exposes
    // all four distant approaches when the player asks to "Cadrer".
    const baseScale = Math.max(
      width / approachWidth,
      safeHeight / approachHeight
    );
    const minZoom = Math.min(1, fitScale / Math.max(0.0001, baseScale));

    return {
      width,
      height,
      safeTop,
      safeBottom,
      safeHeight,
      screenCenterX: width / 2,
      screenCenterY: safeTop + (safeHeight / 2),
      worldWidth,
      worldHeight,
      approachLeft,
      approachTop,
      approachRight,
      approachBottom,
      approachWidth,
      approachHeight,
      fitScale,
      baseScale,
      minZoom,
      maxZoom: BATTLEFIELD_MAX_CAMERA_ZOOM
    };
  }

  constrainBattlefieldCamera(width = this.canvas?.width || 1200, height = this.canvas?.height || 800, metrics = this.getBattlefieldCameraMetrics(width, height)) {
    if (!this.camera) {
      this.camera = {
        x: metrics.worldWidth / 2,
        y: metrics.worldHeight / 2,
        zoom: 1
      };
    }
    this.camera.zoom = Math.max(
      metrics.minZoom,
      Math.min(metrics.maxZoom, Number(this.camera.zoom) || 1)
    );
    const scale = Math.max(0.0001, metrics.baseScale * this.camera.zoom);
    const visibleWidth = width / scale;
    const visibleSafeHeight = metrics.safeHeight / scale;
    if (visibleWidth >= metrics.approachWidth) {
      this.camera.x = (metrics.approachLeft + metrics.approachRight) / 2;
    } else {
      this.camera.x = Math.max(
        metrics.approachLeft + (visibleWidth / 2),
        Math.min(metrics.approachRight - (visibleWidth / 2), Number(this.camera.x) || 0)
      );
    }
    if (visibleSafeHeight >= metrics.approachHeight) {
      this.camera.y = (metrics.approachTop + metrics.approachBottom) / 2;
    } else {
      this.camera.y = Math.max(
        metrics.approachTop + (visibleSafeHeight / 2),
        Math.min(metrics.approachBottom - (visibleSafeHeight / 2), Number(this.camera.y) || 0)
      );
    }
    return this.camera;
  }

  getBattlefieldView(width = this.canvas?.width || 1200, height = this.canvas?.height || 800) {
    const metrics = this.getBattlefieldCameraMetrics(width, height);
    const camera = this.constrainBattlefieldCamera(width, height, metrics);
    const scale = metrics.baseScale * camera.zoom;
    const screenCenterX = metrics.screenCenterX;
    const screenCenterY = metrics.screenCenterY;
    const worldCenterX = camera.x;
    const worldCenterY = camera.y;

    return {
      scale,
      baseScale: metrics.baseScale,
      fitScale: metrics.fitScale,
      minZoom: metrics.minZoom,
      maxZoom: metrics.maxZoom,
      zoom: camera.zoom,
      screenCenterX,
      screenCenterY,
      worldCenterX,
      worldCenterY,
      safeTop: metrics.safeTop,
      safeBottom: metrics.safeBottom,
      left: worldCenterX + ((0 - screenCenterX) / scale),
      top: worldCenterY + ((0 - screenCenterY) / scale),
      right: worldCenterX + ((width - screenCenterX) / scale),
      bottom: worldCenterY + ((height - screenCenterY) / scale)
    };
  }

  setBattlefieldCameraZoom(zoom, anchorX, anchorY, width = this.canvas?.width || 1200, height = this.canvas?.height || 800) {
    const beforeView = this.getBattlefieldView(width, height);
    const safeAnchorX = Number.isFinite(anchorX) ? anchorX : beforeView.screenCenterX;
    const safeAnchorY = Number.isFinite(anchorY) ? anchorY : beforeView.screenCenterY;
    const anchoredWorldPoint = this.screenToBattlefieldPoint(
      safeAnchorX,
      safeAnchorY,
      beforeView
    );
    const metrics = this.getBattlefieldCameraMetrics(width, height);
    this.camera.zoom = Math.max(
      metrics.minZoom,
      Math.min(metrics.maxZoom, Number(zoom) || 1)
    );
    const newScale = Math.max(0.0001, metrics.baseScale * this.camera.zoom);
    const worldAfterZoom = {
      x: this.camera.x + ((safeAnchorX - metrics.screenCenterX) / newScale),
      y: this.camera.y + ((safeAnchorY - metrics.screenCenterY) / newScale)
    };
    this.camera.x += anchoredWorldPoint.x - worldAfterZoom.x;
    this.camera.y += anchoredWorldPoint.y - worldAfterZoom.y;
    this.constrainBattlefieldCamera(width, height, metrics);
    this.updateBattlefieldCameraControls(width, height);
    return this.camera.zoom;
  }

  zoomBattlefieldCameraBy(factor, anchorX, anchorY, width = this.canvas?.width || 1200, height = this.canvas?.height || 800) {
    return this.setBattlefieldCameraZoom(
      this.camera.zoom * Math.max(0.01, Number(factor) || 1),
      anchorX,
      anchorY,
      width,
      height
    );
  }

  panBattlefieldCameraBy(deltaScreenX, deltaScreenY, width = this.canvas?.width || 1200, height = this.canvas?.height || 800) {
    const view = this.getBattlefieldView(width, height);
    this.camera.x -= (Number(deltaScreenX) || 0) / Math.max(0.0001, view.scale);
    this.camera.y -= (Number(deltaScreenY) || 0) / Math.max(0.0001, view.scale);
    this.constrainBattlefieldCamera(width, height);
    this.updateBattlefieldCameraControls(width, height);
    return this.camera;
  }

  resetBattlefieldCamera(width = this.canvas?.width || 1200, height = this.canvas?.height || 800) {
    const metrics = this.getBattlefieldCameraMetrics(width, height);
    this.camera.x = this.citadel?.x ?? (metrics.worldWidth / 2);
    this.camera.y = this.citadel?.y ?? (metrics.worldHeight / 2);
    this.camera.zoom = 1;
    this.constrainBattlefieldCamera(width, height, metrics);
    this.updateBattlefieldCameraControls(width, height);
    return this.camera;
  }

  fitBattlefieldCamera(width = this.canvas?.width || 1200, height = this.canvas?.height || 800) {
    const metrics = this.getBattlefieldCameraMetrics(width, height);
    this.camera.x = (metrics.approachLeft + metrics.approachRight) / 2;
    this.camera.y = (metrics.approachTop + metrics.approachBottom) / 2;
    this.camera.zoom = metrics.minZoom;
    this.constrainBattlefieldCamera(width, height, metrics);
    this.updateBattlefieldCameraControls(width, height);
    return this.camera;
  }

  updateBattlefieldCameraControls(width = this.canvas?.width || 1200, height = this.canvas?.height || 800) {
    const metrics = this.getBattlefieldCameraMetrics(width, height);
    const zoom = Math.max(
      metrics.minZoom,
      Math.min(metrics.maxZoom, Number(this.camera?.zoom) || 1)
    );
    const label = `${Math.round(zoom * 100)} %`;
    const output = document.getElementById('camera-zoom-txt');
    if (output && output.textContent !== label) {
      output.textContent = label;
      output.value = label;
    }
    const zoomOut = document.getElementById('btn-camera-zoom-out');
    const zoomIn = document.getElementById('btn-camera-zoom-in');
    if (zoomOut) zoomOut.disabled = zoom <= metrics.minZoom + 0.0001;
    if (zoomIn) zoomIn.disabled = zoom >= metrics.maxZoom - 0.0001;
  }

  announceBattlefieldCameraZoom() {
    this.announce(`Zoom caméra ${Math.round((Number(this.camera?.zoom) || 1) * 100)} pour cent.`);
  }

  screenToBattlefieldPoint(screenX, screenY, view = this.getBattlefieldView()) {
    return {
      x: view.worldCenterX + ((screenX - view.screenCenterX) / view.scale),
      y: view.worldCenterY + ((screenY - view.screenCenterY) / view.scale)
    };
  }

  applyBattlefieldView(view) {
    this.ctx.translate(view.screenCenterX, view.screenCenterY);
    this.ctx.scale(view.scale, view.scale);
    this.ctx.translate(-view.worldCenterX, -view.worldCenterY);
  }

  getReadableWorldSize(baseWorldSize, minScreenSize, scale = this.battlefieldViewScale || 1) {
    const safeBaseSize = Math.max(0, Number(baseWorldSize) || 0);
    const safeScale = Math.max(0.01, Number(scale) || 1);
    return Math.max(safeBaseSize, Math.max(0, Number(minScreenSize) || 0) / safeScale);
  }

  getDefenseHitRadius(defense, view = this.getBattlefieldView()) {
    const collisionRadius = Math.max(26, (Number(defense?.radius) || 18) + 8);
    const minScreenRadiusInWorld = (DEFENSE_MIN_SCREEN_HIT_DIAMETER / 2)
      / Math.max(0.01, Number(view?.scale) || 1);
    return Math.max(collisionRadius, minScreenRadiusInWorld);
  }

  getApproachCullBounds(padding = 0) {
    const extra = Math.max(0, Number(padding) || 0);
    const metrics = this.getBattlefieldCameraMetrics();
    return {
      left: metrics.approachLeft - extra,
      top: metrics.approachTop - extra,
      right: metrics.approachRight + extra,
      bottom: metrics.approachBottom + extra
    };
  }

  getSpawnPosition(side, type, width = this.worldWidth || BATTLEFIELD_WORLD_WIDTH, height = this.worldHeight || BATTLEFIELD_WORLD_HEIGHT) {
    const isBossVisual = ['leviathan', 'vespera', 'carmilla', 'hellwarden'].includes(type);
    const baseVisualSize = ENEMY_SPRITE_DATA[type]?.size || 42;
    const spawnViewScale = this.getBattlefieldView(
      this.canvas?.width || width,
      this.canvas?.height || height
    ).scale;
    const spriteVisualRadius = this.getReadableWorldSize(
      baseVisualSize,
      isBossVisual ? MIN_BOSS_SCREEN_SIZE : MIN_ENEMY_SCREEN_SIZE,
      spawnViewScale
    ) / 2;
    // The complete silhouette, including the Leviathan, remains inside the
    // camera envelope from its first frame.
    const offset = Math.max(
      30,
      BATTLEFIELD_APPROACH_MARGIN - spriteVisualRadius - BATTLEFIELD_SPAWN_VISUAL_GUTTER
    );
    const lateralExtent = side === 'north' || side === 'south' ? width : height;
    const lateralJitter = isBossVisual
      ? 0
      : (Math.random() - 0.5) * Math.min(48, lateralExtent * 0.1);
    const centerX = width / 2;
    const centerY = height / 2;

    if (side === 'north') return { x: centerX + lateralJitter, y: -offset };
    if (side === 'east') return { x: width + offset, y: centerY + lateralJitter };
    if (side === 'south') return { x: centerX + lateralJitter, y: height + offset };
    return { x: -offset, y: centerY + lateralJitter };
  }

  getSpawnGatePosition(side, width = this.worldWidth || BATTLEFIELD_WORLD_WIDTH, height = this.worldHeight || BATTLEFIELD_WORLD_HEIGHT) {
    const offset = BATTLEFIELD_APPROACH_MARGIN - (SPAWN_GATE_WORLD_SIZE / 2) - 8;
    if (side === 'north') return { x: width / 2, y: -offset };
    if (side === 'east') return { x: width + offset, y: height / 2 };
    if (side === 'south') return { x: width / 2, y: height + offset };
    return { x: -offset, y: height / 2 };
  }

  syncMissionStatusPosition() {
    const header = document.getElementById('hud-header');
    const status = document.getElementById('mission-status-panel');
    if (!header || !status) return;
    const headerBottom = Math.ceil(header.getBoundingClientRect().bottom);
    status.style.top = `${Math.max(76, headerBottom + 8)}px`;
  }

  preloadSpriteAsset(src, label) {
    if (typeof document?.createElement !== 'function') return;
    if (this.spriteAtlasImages[src]) return this.spriteAtlasImages[src];

    const image = document.createElement('img');
    image.decoding = 'async';
    image.addEventListener('error', () => {
      delete this.spriteAtlasImages[src];
      console.warn(`${label} indisponible : ${src}`);
    }, { once: true });
    image.src = src;
    this.spriteAtlasImages[src] = image;
    return image;
  }

  ensureEnemySprite(type) {
    const spriteData = ENEMY_SPRITE_DATA[type];
    if (!spriteData) return null;
    const image = this.preloadSpriteAsset(spriteData.src, 'Planche ennemie');
    if (image) this.enemySpriteImages[type] = image;
    return image || null;
  }

  ensureHeroSprite(heroId = this.selectedHero?.id) {
    const spriteData = HERO_SPRITE_DATA[heroId];
    if (!spriteData) return null;
    const image = this.preloadSpriteAsset(spriteData.src, 'Planche de héros');
    if (image) this.heroSpriteImages[heroId] = image;
    return image || null;
  }

  preloadEnemySprites() {
    Object.keys(ENEMY_SPRITE_DATA)
      .filter(type => !this.getBossDefinition(type))
      .forEach(type => this.ensureEnemySprite(type));
  }

  preloadWaveCharacterBosses(queue = this.waveSpawnQueue) {
    if (!this.hasEnteredAdultExperience || !Array.isArray(queue)) return [];
    const bossTypes = [...new Set(queue.map(entry => entry?.type).filter(Boolean))]
      .filter(type => this.getBossDefinition(type));
    bossTypes.forEach(type => this.ensureEnemySprite(type));
    return bossTypes;
  }

  preloadBattleSprites() {
    this.preloadEnemySprites();
    Object.entries(TOWER_SPRITE_DATA).forEach(([id, spriteData]) => {
      this.towerSpriteImages[id] = this.preloadSpriteAsset(spriteData.src, 'Planche de défense');
    });
    Object.keys(HERO_SPRITE_DATA).forEach(heroId => {
      const isCharacterExpansionHero = Boolean(CHARACTER_EXPANSION?.heroines?.[heroId]);
      if (!isCharacterExpansionHero || heroId === this.selectedHero?.id) {
        this.ensureHeroSprite(heroId);
      }
    });

    this.floorImage = this.preloadSpriteAsset(FLOOR_TEXTURE_SRC, 'Texture de sol');
    this.coastlineImage = this.preloadSpriteAsset(COASTLINE_IMAGE_SRC, 'Côte infernale');
    const terrainSrc = LAYOUT_TERRAIN_SOURCES[this.selectedLayoutId] || APPROACH_TERRAIN_IMAGE_SRC;
    this.approachTerrainImage = this.preloadSpriteAsset(terrainSrc, 'Terrain d’approche');
    this.spawnGateAtlasImage = this.preloadSpriteAsset(SPAWN_GATE_ATLAS_SRC, 'Portails d’approche');
    this.floorImage?.addEventListener('load', () => {
      // Recreate the pattern after late decoding or a context restoration.
      this.floorPattern = null;
    }, { once: true });
  }

  isValidRunCheckpoint(checkpoint) {
    if (!checkpoint || typeof checkpoint !== 'object') return false;
    if (Number(checkpoint.version) !== RUN_CHECKPOINT_VERSION) return false;
    if (!DIFFICULTY_DATA[checkpoint.difficulty]) return false;
    const nextWave = Math.floor(Number(checkpoint.nextWave));
    const checkpointCampaign = CHARACTER_EXPANSION?.campaigns?.[checkpoint.activeCampaignId];
    const checkpointFinalWave = Number(checkpointCampaign?.finalWave) || CAMPAIGN_FINAL_WAVE;
    if (!Number.isFinite(nextWave) || nextWave < 2 || nextWave > checkpointFinalWave) return false;
    if (!Array.isArray(checkpoint.placedTowers) || !checkpoint.weapons || typeof checkpoint.weapons !== 'object') return false;
    return Number.isFinite(checkpoint.citadelHp)
      && Number.isFinite(checkpoint.coins)
      && Number.isFinite(checkpoint.score);
  }

  createRunCheckpoint() {
    if (
      this.isTowerMode
      || this.endlessMode
      || this.dailyChallenge
      || this.campaignVictory
      || this.wave >= this.getCampaignFinalWave()
    ) return null;
    return {
      version: RUN_CHECKPOINT_VERSION,
      nextWave: this.wave + 1,
      activeCampaignId: this.activeCampaignId,
      difficulty: this.difficulty,
      selectedHeroId: this.selectedHero.id,
      selectedLayoutId: this.selectedLayoutId,
      worldWidth: this.worldWidth || this.canvas?.width || 1200,
      worldHeight: this.worldHeight || this.canvas?.height || 800,
      citadelHp: Math.max(1, this.citadel.hp),
      citadelMaxHp: this.citadel.maxHp,
      score: this.score,
      coins: this.coins,
      xp: this.xp,
      level: this.level,
      nextLevelXp: this.nextLevelXp,
      frenzyMeter: this.frenzyMeter,
      carmillaStoredCharge: this.carmillaStoredCharge,
      runElapsedSeconds: this.runElapsedSeconds,
      runMetaCoinsEarned: this.runMetaCoinsEarned,
      weapons: JSON.parse(JSON.stringify(this.weapons)),
      placedTowers: JSON.parse(JSON.stringify(this.placedTowers)),
      mercenaries: JSON.parse(JSON.stringify(this.mercenaries)),
      petDrones: JSON.parse(JSON.stringify(this.petDrones)),
      counters: {
        decoysDeployedCount: this.decoysDeployedCount,
        towersBuiltThisRun: this.towersBuiltThisRun,
        evolvedWeaponsCount: this.evolvedWeaponsCount,
        mutantsKilled: this.mutantsKilled,
        overdriveCount: this.overdriveCount
      }
    };
  }

  saveRunCheckpoint() {
    const checkpoint = this.createRunCheckpoint();
    if (!checkpoint) return;
    this.activeRunCheckpoint = checkpoint;
    this.savedRunCheckpoint = checkpoint;
    this.saveProgress();
  }

  clearRunCheckpoint() {
    this.activeRunCheckpoint = null;
    this.savedRunCheckpoint = null;
  }

  restoreRunCheckpoint(checkpoint = this.savedRunCheckpoint) {
    if (!this.isValidRunCheckpoint(checkpoint)) return false;
    const hero = HERO_CLASSES[checkpoint.selectedHeroId];
    if (hero && hero.unlocked !== false) this.selectedHero = hero;
    if (EXPANSION?.worldLayouts?.[checkpoint.selectedLayoutId]) {
      this.selectedLayoutId = checkpoint.selectedLayoutId;
    }
    this.startNewGame({
      difficulty: checkpoint.difficulty,
      campaignId: checkpoint.activeCampaignId || 'four_gates',
      layoutId: this.selectedLayoutId,
      preserveCheckpoint: true,
      silent: true
    });

    const scaleX = (this.worldWidth || 1200) / Math.max(1, Number(checkpoint.worldWidth) || 1200);
    const scaleY = (this.worldHeight || 800) / Math.max(1, Number(checkpoint.worldHeight) || 800);
    const scaleEntities = collection => collection.map(entity => {
      const restored = { ...entity };
      if (Number.isFinite(restored.x)) restored.x *= scaleX;
      if (Number.isFinite(restored.y)) restored.y *= scaleY;
      return restored;
    });

    this.citadel.hp = Math.min(this.citadel.maxHp, Math.max(1, Number(checkpoint.citadelHp) || this.citadel.maxHp));
    this.score = Math.max(0, Math.floor(Number(checkpoint.score) || 0));
    this.coins = Math.max(0, Math.floor(Number(checkpoint.coins) || 0));
    this.xp = Math.max(0, Math.floor(Number(checkpoint.xp) || 0));
    this.level = Math.max(1, Math.floor(Number(checkpoint.level) || 1));
    this.nextLevelXp = Math.max(1, Math.floor(Number(checkpoint.nextLevelXp) || 100));
    this.frenzyMeter = Math.max(0, Math.min(this.maxFrenzyMeter, Number(checkpoint.frenzyMeter) || 0));
    this.carmillaStoredCharge = Math.max(0, Math.min(35, Number(checkpoint.carmillaStoredCharge) || 0));
    this.runElapsedSeconds = Math.max(0, Number(checkpoint.runElapsedSeconds) || 0);
    this.runMetaCoinsEarned = Math.max(0, Math.floor(Number(checkpoint.runMetaCoinsEarned) || 0));
    this.weapons = JSON.parse(JSON.stringify(checkpoint.weapons));
    this.placedTowers = scaleEntities(JSON.parse(JSON.stringify(checkpoint.placedTowers)));
    this.mercenaries = scaleEntities(JSON.parse(JSON.stringify(checkpoint.mercenaries || [])));
    this.petDrones = JSON.parse(JSON.stringify(checkpoint.petDrones || []));
    this.decoysDeployedCount = Math.max(0, Math.floor(Number(checkpoint.counters?.decoysDeployedCount) || 0));
    this.towersBuiltThisRun = Math.max(0, Math.floor(Number(checkpoint.counters?.towersBuiltThisRun) || 0));
    this.evolvedWeaponsCount = Math.max(0, Math.floor(Number(checkpoint.counters?.evolvedWeaponsCount) || 0));
    this.mutantsKilled = Math.max(0, Math.floor(Number(checkpoint.counters?.mutantsKilled) || 0));
    this.overdriveCount = Math.max(0, Math.floor(Number(checkpoint.counters?.overdriveCount) || 0));
    this.enemies = [];
    this.enemyBullets = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.decoys = [];
    this.crates = [];
    this.powerups = [];
    this.hazards = [];
    this.bossHazards = [];
    this.activeRunCheckpoint = checkpoint;
    this.savedRunCheckpoint = checkpoint;
    this.configureWave(checkpoint.nextWave);
    this.updateWeaponsHUD();
    this.updateHeroPresentation();
    this.updateHUD();
    this.showFeedback(`Point de contrôle restauré · vague ${checkpoint.nextWave}`, '#10b981');
    this.announce(`Campagne restaurée à la vague ${checkpoint.nextWave}.`);
    return true;
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('valkyrie_sweeper_save');
      if (saved) {
        const data = JSON.parse(saved);
        const saveVersion = Math.max(1, Math.floor(Number(data.version) || 1));
        const legacyMetaCoins = Number.isFinite(data.coins) ? data.coins : 0;
        this.metaCoins = Number.isFinite(data.metaCoins)
          ? Math.max(0, Math.floor(data.metaCoins))
          : Math.max(0, Math.floor(legacyMetaCoins));
        const savedTotalCoins = Number.isFinite(data.totalCoinsEarned) ? Math.max(0, Math.floor(data.totalCoinsEarned)) : 0;
        this.totalCoinsEarned = saveVersion >= 3 ? savedTotalCoins : Math.max(0, savedTotalCoins - 400);
        this.towerFloor = Number.isFinite(data.towerFloor) ? Math.max(1, Math.min(100, Math.floor(data.towerFloor))) : 1;
        this.towerCompleted = data.towerCompleted === true;
        if (EXPANSION?.worldLayouts?.[data.selectedLayoutId]) {
          this.selectedLayoutId = data.selectedLayoutId;
          this.applyWorldLayout(this.selectedLayoutId, { force: true, repositionUnits: false });
        }
        if (Array.isArray(data.mapRotation)) this.setMapRotation(data.mapRotation);
        this.activeCampaignId = CHARACTER_EXPANSION?.campaigns?.[data.activeCampaignId]
          ? data.activeCampaignId
          : 'four_gates';
        this.defeatedBossIds = Array.isArray(data.defeatedBossIds)
          ? [...new Set(data.defeatedBossIds.filter(id => this.getBossDefinition(id)))]
          : [];
        this.runHistory = Array.isArray(data.runHistory)
          ? data.runHistory.filter(entry => entry && typeof entry === 'object').slice(0, 10)
          : [];
        this.towerMutators = Array.isArray(data.towerMutatorIds)
          ? data.towerMutatorIds
            .map(id => (EXPANSION.infinitumMutators || []).find(mutator => mutator.id === id))
            .filter(Boolean)
          : [];
        this.bestScore = Math.max(0, Math.floor(Number(data.bestScore) || 0));
        this.bestWave = Math.max(0, Math.floor(Number(data.bestWave) || 0));
        this.campaignCompletions = Math.max(0, Math.floor(Number(data.campaignCompletions) || 0));
        this.preferredMusicEnabled = data.musicEnabled === true;
        this.preferredCrtEnabled = data.crtEnabled !== false;
        this.musicVolume = Number.isFinite(Number(data.musicVolume))
          ? Math.max(0, Math.min(1, Number(data.musicVolume)))
          : this.musicVolume;
        this.sfxVolume = Number.isFinite(Number(data.sfxVolume))
          ? Math.max(0, Math.min(1, Number(data.sfxVolume)))
          : this.sfxVolume;
        this.contrastMode = ['default', 'high', 'mono'].includes(data.contrastMode)
          ? data.contrastMode
          : this.contrastMode;
        this.textSize = ['default', 'large', 'extra-large'].includes(data.textSize)
          ? data.textSize
          : this.textSize;
        if (this.isValidRunCheckpoint(data.activeRun)) {
          this.activeRunCheckpoint = data.activeRun;
          this.savedRunCheckpoint = data.activeRun;
        } else if (data.activeRun != null) {
          this.saveLoadError = new Error('Point de contrôle de campagne invalide.');
        }
        if (data.shopUpgrades && typeof data.shopUpgrades === 'object') {
          this.shopUpgrades = {
            hpBonus: Math.min(100, Math.max(0, Math.floor(Number(data.shopUpgrades.hpBonus) || 0))),
            fireRateBonus: Math.min(10, Math.max(0, Math.floor(Number(data.shopUpgrades.fireRateBonus) || 0))),
            magnetRange: Math.min(10, Math.max(0, Math.floor(Number(data.shopUpgrades.magnetRange) || 0)))
          };
        }
        if (Array.isArray(data.unlockedGallery)) {
          GALLERY_ITEMS.forEach(item => {
            if (data.unlockedGallery.includes(item.id)) item.unlocked = true;
          });
        }
        if (Array.isArray(data.recruitedBosses)) {
          data.recruitedBosses.forEach(bossId => {
            if (HERO_CLASSES[bossId]) {
              HERO_CLASSES[bossId].unlocked = true;
              HERO_CLASSES[bossId].allied = true;
            }
          });
        }
        if (Array.isArray(data.achievements)) {
          ACHIEVEMENTS.forEach(a => {
            if (data.achievements.includes(a.id)) a.unlocked = true;
          });
        }
        if (Array.isArray(data.unlockedHeroIds)) {
          data.unlockedHeroIds.forEach(heroId => {
            if (HERO_CLASSES[heroId]) HERO_CLASSES[heroId].unlocked = true;
          });
        }
        if (data.characterProgress && typeof data.characterProgress === 'object') {
          Object.values(HERO_CLASSES).forEach(hero => {
            const progress = data.characterProgress[hero.id];
            if (!progress || typeof progress !== 'object') return;
            hero.activeSkin = progress.activeSkin === 'alt' ? 'alt' : 'default';
            hero.affinityLvl = Math.max(1, Math.min(5, Math.floor(Number(progress.affinityLvl) || 1)));
            hero.relationshipXp = Math.max(0, Math.floor(Number(progress.relationshipXp) || 0));
            hero.privateMomentUnlocked = progress.privateMomentUnlocked === true;
            if ((hero.unlocked !== false || hero.allied === true) && typeof progress.romanceOptIn === 'boolean') {
              hero.romanceOptIn = progress.romanceOptIn;
            }
          });
        }
        const loadedVnProgress = this.sanitizeLoadedVnProgress(data.vnSceneProgress);
        if (loadedVnProgress) this.vnSceneProgress = loadedVnProgress;
        this.bodyRouteProgress = this.sanitizeLoadedBodyRouteProgress(data.bodyRouteProgress);
        if (data.selectedHeroId && HERO_CLASSES[data.selectedHeroId] && HERO_CLASSES[data.selectedHeroId].unlocked !== false) {
          this.selectedHero = HERO_CLASSES[data.selectedHeroId];
        }
        if (['synthwave', 'gothic', 'industrial', 'chillwave', 'heavy'].includes(data.radioStation)) {
          this.preferredRadioStation = data.radioStation;
        }
        audio.isMuted = data.sfxMuted === true;
      }
      audio.setMusicVolume?.(this.musicVolume);
      audio.setSfxVolume?.(this.sfxVolume);
      this.applyVisualPreferences();
    } catch (e) {
      this.saveLoadError = e;
      console.warn('Failed to load save data:', e);
    }
  }

  saveProgress() {
    try {
      const unlockedIds = GALLERY_ITEMS.filter(i => i.unlocked).map(i => i.id);
      const recruitedBosses = Object.values(HERO_CLASSES).filter(h => h.allied).map(h => h.id);
      const achievements = ACHIEVEMENTS.filter(a => a.unlocked).map(a => a.id);
      const unlockedHeroIds = Object.values(HERO_CLASSES)
        .filter(hero => hero.unlocked !== false)
        .map(hero => hero.id);
      const characterProgress = {};
      Object.values(HERO_CLASSES).forEach(hero => {
        characterProgress[hero.id] = {
          activeSkin: hero.activeSkin,
          affinityLvl: hero.affinityLvl,
          relationshipXp: hero.relationshipXp,
          romanceOptIn: hero.romanceOptIn,
          privateMomentUnlocked: hero.privateMomentUnlocked
        };
      });
      const data = {
        version: SAVE_VERSION,
        metaCoins: this.metaCoins,
        totalCoinsEarned: this.totalCoinsEarned,
        shopUpgrades: this.shopUpgrades,
        towerFloor: this.towerFloor,
        towerCompleted: this.towerCompleted,
        towerMutatorIds: this.towerMutators.map(mutator => mutator.id),
        selectedLayoutId: this.selectedLayoutId,
        activeCampaignId: this.activeCampaignId,
        defeatedBossIds: this.defeatedBossIds.slice(0, 32),
        mapRotation: this.mapRotation.slice(),
        runHistory: this.runHistory.slice(0, 10),
        bestScore: this.bestScore,
        bestWave: this.bestWave,
        campaignCompletions: this.campaignCompletions,
        activeRun: this.activeRunCheckpoint,
        selectedHeroId: this.selectedHero.id,
        radioStation: audio.currentStation,
        musicEnabled: audio.isPlayingMusic === true,
        sfxMuted: audio.isMuted,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        contrastMode: this.contrastMode,
        textSize: this.textSize,
        crtEnabled: !document.querySelector?.('.crt-overlay')?.classList.contains('disabled'),
        unlockedGallery: unlockedIds,
        recruitedBosses,
        achievements,
        unlockedHeroIds,
        characterProgress,
        vnSceneProgress: {
          dataVersion: this.vnSceneProgress.dataVersion,
          flags: [...this.vnSceneProgress.flags],
          chapterResults: { ...this.vnSceneProgress.chapterResults },
          appliedEffects: [...this.vnSceneProgress.appliedEffects],
          active: this.vnSceneProgress.active
        },
        bodyRouteProgress: this.sanitizeLoadedBodyRouteProgress(this.bodyRouteProgress)
      };
      localStorage.setItem('valkyrie_sweeper_save', JSON.stringify(data));
    } catch (e) {
      this.saveLoadError = e;
      console.warn('Failed to save data:', e);
    }
  }

  applyVisualPreferences() {
    const body = document.body;
    if (!body) return;
    body.dataset.contrast = this.contrastMode;
    body.dataset.textSize = this.textSize;
    ['contrast-high', 'contrast-mono'].forEach(className => body.classList.remove(className));
    ['text-large', 'text-extra-large'].forEach(className => body.classList.remove(className));
    if (this.contrastMode !== 'default') body.classList.add(`contrast-${this.contrastMode}`);
    if (this.textSize !== 'default') body.classList.add(`text-${this.textSize}`);
  }

  syncSettingsControls() {
    const music = document.getElementById('music-volume');
    const sfx = document.getElementById('sfx-volume');
    const contrast = document.getElementById('contrast-mode');
    const textSize = document.getElementById('text-size');
    const musicOutput = document.getElementById('music-volume-output');
    const sfxOutput = document.getElementById('sfx-volume-output');
    if (music) music.value = String(Math.round(this.musicVolume * 100));
    if (sfx) sfx.value = String(Math.round(this.sfxVolume * 100));
    if (contrast) contrast.value = this.contrastMode;
    if (textSize) textSize.value = this.textSize;
    if (musicOutput) musicOutput.textContent = `${Math.round(this.musicVolume * 100)} %`;
    if (sfxOutput) sfxOutput.textContent = `${Math.round(this.sfxVolume * 100)} %`;
  }

  initializeSettingsControls() {
    this.syncSettingsControls();
    const bindRange = (id, outputId, setter) => {
      const input = document.getElementById(id);
      const output = document.getElementById(outputId);
      input?.addEventListener('input', event => {
        const value = Math.max(0, Math.min(100, Number(event.target.value) || 0));
        if (output) output.textContent = `${Math.round(value)} %`;
        setter(value / 100);
      });
      input?.addEventListener('change', () => this.saveProgress());
    };
    bindRange('music-volume', 'music-volume-output', value => {
      this.musicVolume = audio.setMusicVolume?.(value) ?? value;
    });
    bindRange('sfx-volume', 'sfx-volume-output', value => {
      this.sfxVolume = audio.setSfxVolume?.(value) ?? value;
    });

    document.getElementById('contrast-mode')?.addEventListener('change', event => {
      this.contrastMode = ['default', 'high', 'mono'].includes(event.target.value)
        ? event.target.value
        : 'default';
      this.applyVisualPreferences();
      this.saveProgress();
    });
    document.getElementById('text-size')?.addEventListener('change', event => {
      this.textSize = ['default', 'large', 'extra-large'].includes(event.target.value)
        ? event.target.value
        : 'default';
      this.applyVisualPreferences();
      this.saveProgress();
    });
    document.getElementById('btn-export-save')?.addEventListener('click', () => this.exportPortableSave());
    document.getElementById('import-save-input')?.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) this.importPortableSaveFile(file);
      event.target.value = '';
    });

    window.addEventListener?.('gamepadconnected', event => {
      this.connectedGamepadIndex = event.gamepad?.index ?? null;
      this.refreshGamepadStatus(true);
    });
    window.addEventListener?.('gamepaddisconnected', event => {
      if (this.connectedGamepadIndex === event.gamepad?.index) this.connectedGamepadIndex = null;
      this.refreshGamepadStatus(true);
    });
    this.refreshGamepadStatus(true);
  }

  setSettingsStatus(message, isError = false) {
    const status = document.getElementById('settings-status');
    if (!status) return;
    status.textContent = message;
    status.dataset.state = isError ? 'error' : 'success';
  }

  createPortableSavePayload() {
    this.saveProgress();
    let campaignSave = {};
    try {
      campaignSave = JSON.parse(localStorage.getItem('valkyrie_sweeper_save') || '{}');
    } catch (_error) {
      campaignSave = {};
    }
    const expansion = this.getVnExpansion();
    const narrativeState = expansion?.persistence?.sanitizeState
      ? expansion.persistence.sanitizeState(this.vnExpansionState)
      : this.vnExpansionState;
    return {
      schema: 'infernal-city.portable-save/1',
      exportedAt: new Date().toISOString(),
      campaign: campaignSave,
      narrative: narrativeState || null
    };
  }

  exportPortableSave() {
    try {
      const payload = this.createPortableSavePayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `infernal-city-save-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove?.();
      URL.revokeObjectURL(objectUrl);
      this.setSettingsStatus('Sauvegarde exportée. Conservez ce fichier dans un emplacement privé.');
    } catch (error) {
      console.warn('Export de sauvegarde impossible :', error);
      this.setSettingsStatus('Échec de l’export. Vérifiez les autorisations de téléchargement.', true);
    }
  }

  importPortableSaveFile(file) {
    if (!file || Number(file.size) > 2 * 1024 * 1024 || typeof file.text !== 'function') {
      this.setSettingsStatus('Import refusé : fichier absent, illisible ou supérieur à 2 Mo.', true);
      return Promise.resolve(false);
    }
    return file.text().then(serialized => {
      const parsed = JSON.parse(serialized);
      const campaign = parsed?.schema === 'infernal-city.portable-save/1'
        ? parsed.campaign
        : parsed;
      if (!campaign || typeof campaign !== 'object' || Array.isArray(campaign)) {
        throw new Error('Sauvegarde de campagne absente.');
      }
      const version = Math.floor(Number(campaign.version));
      if (!Number.isFinite(version) || version < 1 || version > SAVE_VERSION) {
        throw new Error('Version de sauvegarde incompatible.');
      }

      const expansion = this.getVnExpansion();
      const narrative = parsed?.schema === 'infernal-city.portable-save/1'
        ? parsed.narrative
        : null;
      const cleanNarrative = narrative && expansion?.persistence?.sanitizeState
        ? expansion.persistence.sanitizeState(narrative)
        : null;

      // Validation is complete before either key is replaced, so a malformed
      // file can never leave the two progression stores half-imported.
      localStorage.setItem('valkyrie_sweeper_save', JSON.stringify(campaign));
      if (cleanNarrative && expansion?.persistence?.saveState) {
        this.vnExpansionState = expansion.persistence.saveState(cleanNarrative, localStorage);
      }
      this.setSettingsStatus('Progression importée et validée. Rechargement du jeu…');
      setTimeout(() => window.location?.reload?.(), 450);
      return true;
    }).catch(error => {
      console.warn('Import de sauvegarde refusé :', error);
      this.setSettingsStatus(`Import refusé : ${error.message || 'fichier invalide'}.`, true);
      return false;
    });
  }

  refreshGamepadStatus(force = false, timestamp = Date.now()) {
    if (!force && timestamp - this.lastGamepadStatusPoll < 1000) return;
    this.lastGamepadStatusPoll = timestamp;
    const getGamepads = typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function'
      ? navigator.getGamepads.bind(navigator)
      : null;
    const pads = getGamepads ? Array.from(getGamepads() || []).filter(Boolean) : [];
    const gamepad = pads.find(pad => pad.connected !== false) || null;
    this.connectedGamepadIndex = gamepad?.index ?? null;
    const status = document.getElementById('gamepad-status');
    if (status) {
      status.textContent = gamepad
        ? `Manette détectée : ${gamepad.id || `port ${gamepad.index + 1}`}.`
        : 'Aucune manette détectée. Connectez-en une puis appuyez sur un bouton.';
      status.dataset.connected = String(Boolean(gamepad));
    }
    return gamepad;
  }

  getConnectedGamepad() {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
    const pads = Array.from(navigator.getGamepads() || []).filter(Boolean);
    if (this.connectedGamepadIndex !== null) {
      const preferred = pads.find(pad => pad.index === this.connectedGamepadIndex && pad.connected !== false);
      if (preferred) return preferred;
    }
    return pads.find(pad => pad.connected !== false) || null;
  }

  cycleSelectedBuildTower(direction) {
    const towers = Object.values(TOWER_TYPES);
    if (!towers.length) return null;
    const currentIndex = Math.max(0, towers.findIndex(tower => tower.id === this.selectedTowerToBuild?.id));
    const nextIndex = (currentIndex + Math.sign(direction || 1) + towers.length) % towers.length;
    this.selectedTowerToBuild = towers[nextIndex];
    this.renderBuildBar();
    this.announce(`${this.selectedTowerToBuild.name} sélectionnée par la manette.`);
    return this.selectedTowerToBuild;
  }

  updateGamepadControls(dt) {
    const gamepad = this.getConnectedGamepad();
    if (!gamepad) {
      this.gamepadButtonState = [];
      return false;
    }

    const pressed = index => {
      const button = gamepad.buttons?.[index];
      return Boolean(button && (button.pressed || Number(button.value) > 0.5));
    };
    const edge = index => pressed(index) && !this.gamepadButtonState[index];
    const rememberButtons = () => {
      this.gamepadButtonState = Array.from(
        { length: gamepad.buttons?.length || 0 },
        (_, index) => pressed(index)
      );
    };

    const adultGate = document.getElementById('adult-gate-modal');
    const topModal = this.getTopOpenModal();
    if (adultGate?.classList.contains('active')) {
      rememberButtons();
      return false;
    }
    if (topModal) {
      if (topModal.id === 'body-route-vn-modal') {
        const context = this.getActiveBodyRouteContext();
        if (edge(1)) {
          this.pauseBodyRouteToArchives();
        } else if (context?.node.kind === 'choice' && (edge(12) || edge(13) || edge(14) || edge(15))) {
          const options = [...topModal.querySelectorAll('.body-route-vn-choice')];
          const currentIndex = Math.max(0, options.indexOf(document.activeElement));
          const direction = edge(12) || edge(14) ? -1 : 1;
          options[(currentIndex + direction + options.length) % options.length]?.focus();
        } else if (edge(0)) {
          if (context?.node.kind === 'choice') {
            const focusedChoice = document.activeElement?.closest?.('.body-route-vn-choice');
            (focusedChoice || topModal.querySelector('.body-route-vn-choice'))?.click();
          } else {
            this.advanceBodyRouteDialogue();
          }
        }
        rememberButtons();
        return true;
      }
      if (edge(1) && topModal.querySelector?.('.btn-close')) {
        this.closeModal(topModal);
      }
      rememberButtons();
      return true;
    }

    const axis = index => {
      const value = Number(gamepad.axes?.[index]) || 0;
      if (Math.abs(value) <= GAMEPAD_DEADZONE) return 0;
      return Math.sign(value) * ((Math.abs(value) - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE));
    };
    const dpadX = (pressed(15) ? 1 : 0) - (pressed(14) ? 1 : 0);
    const dpadY = (pressed(13) ? 1 : 0) - (pressed(12) ? 1 : 0);
    const cameraX = Math.max(-1, Math.min(1, axis(0) + dpadX));
    const cameraY = Math.max(-1, Math.min(1, axis(1) + dpadY));
    if (cameraX || cameraY) {
      this.panBattlefieldCameraBy(
        -cameraX * GAMEPAD_CAMERA_SPEED * dt,
        -cameraY * GAMEPAD_CAMERA_SPEED * dt
      );
    }

    const cursorX = axis(2);
    const cursorY = axis(3);
    if (cursorX || cursorY) {
      const view = this.getBattlefieldView();
      const buildBounds = this.worldLayout?.buildBounds || {
        minX: 25,
        minY: 25,
        maxX: this.worldWidth - 25,
        maxY: this.worldHeight - 25
      };
      this.buildCursor.x = Math.max(
        buildBounds.minX,
        Math.min(buildBounds.maxX, this.buildCursor.x + ((cursorX * GAMEPAD_CURSOR_SPEED * dt) / view.scale))
      );
      this.buildCursor.y = Math.max(
        buildBounds.minY,
        Math.min(buildBounds.maxY, this.buildCursor.y + ((cursorY * GAMEPAD_CURSOR_SPEED * dt) / view.scale))
      );
      this.buildCursor.visible = true;
    }

    const leftTrigger = Number(gamepad.buttons?.[6]?.value) || 0;
    const rightTrigger = Number(gamepad.buttons?.[7]?.value) || 0;
    const zoomAxis = rightTrigger - leftTrigger;
    if (Math.abs(zoomAxis) > 0.05) {
      const view = this.getBattlefieldView();
      this.zoomBattlefieldCameraBy(
        Math.exp(zoomAxis * 1.5 * dt),
        view.screenCenterX,
        view.screenCenterY
      );
    }

    if (edge(4)) this.cycleSelectedBuildTower(-1);
    if (edge(5)) this.cycleSelectedBuildTower(1);
    if (edge(2)) this.triggerHeroAbility();
    if (edge(3)) this.triggerOverdrive();
    if (edge(1)) {
      if (!this.cancelHeroAbilityTargeting()) this.fitBattlefieldCamera();
    }
    if (edge(0)) {
      if (this.activeHeroTargeting) {
        this.executeHeroAbilityAt(this.buildCursor.x, this.buildCursor.y);
      } else {
        const defense = this.findPlacedDefenseAt(this.buildCursor.x, this.buildCursor.y);
        if (defense) this.openDefenseManagementModal(defense);
        else this.buildSelectedTowerAt(this.buildCursor.x, this.buildCursor.y);
      }
    }
    if (edge(9)) document.getElementById('btn-open-hq')?.click();

    rememberButtons();
    return true;
  }

  openSettingsModal() {
    this.syncSettingsControls();
    this.refreshGamepadStatus(true);
    this.setSettingsStatus('Paramètres chargés. Les changements sont sauvegardés localement.');
    this.openModal('settings-modal');
  }

  renderRunHistory() {
    const list = document.getElementById('run-history-list');
    if (!list) return;
    list.innerHTML = '';
    if (this.runHistory.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'Aucune sortie archivée. Votre prochaine campagne apparaîtra ici.';
      list.appendChild(empty);
      return;
    }
    this.runHistory.slice(0, 10).forEach(entry => {
      const item = document.createElement('li');
      const date = new Date(entry.date);
      const dateText = Number.isNaN(date.getTime())
        ? 'Date inconnue'
        : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const layout = EXPANSION?.worldLayouts?.[entry.layoutId];
      const result = entry.victory
        ? 'Victoire'
        : `${entry.mode === 'infinitum' ? 'Palier' : 'Vague'} ${entry.wave}`;
      [dateText, layout?.name || entry.layoutId || 'Convergence', result, String(entry.score || 0)]
        .forEach(value => {
          const cell = document.createElement('span');
          cell.textContent = value;
          item.appendChild(cell);
        });
      item.dataset.result = entry.victory ? 'victory' : 'defeat';
      list.appendChild(item);
    });
  }

  openRunHistoryModal() {
    this.renderRunHistory();
    this.openModal('run-history-modal');
  }

  setupModalAccessibility() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      if (!modal.hasAttribute('aria-labelledby') && !modal.hasAttribute('aria-label')) {
        const title = modal.querySelector('.modal-title, h1, h2');
        if (title) {
          if (!title.id) title.id = `${modal.id}-title`;
          modal.setAttribute('aria-labelledby', title.id);
        } else {
          modal.setAttribute('aria-label', 'Fenêtre du jeu');
        }
      }
    });
    document.querySelectorAll('.btn-close').forEach(button => {
      button.type = 'button';
      if (!button.hasAttribute('aria-label')) {
        button.setAttribute('aria-label', 'Fermer cette fenêtre');
      }
    });
    this.syncModalAccessibility();
  }

  getTopOpenModal() {
    const gate = document.getElementById('adult-gate-modal');
    if (gate?.classList.contains('active')) return gate;
    const stacked = this.modalFocusStack
      .map(entry => entry.modal)
      .filter(modal => modal?.classList.contains('active'));
    if (stacked.length) return stacked[stacked.length - 1];
    const active = [...document.querySelectorAll('.modal-overlay.active')];
    return active.length ? active[active.length - 1] : null;
  }

  syncModalAccessibility() {
    const topModal = this.getTopOpenModal();
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      const isTop = modal === topModal;
      modal.setAttribute('aria-hidden', isTop ? 'false' : 'true');
      modal.inert = !isTop;
    });

    const app = document.getElementById('app-container');
    if (app) {
      [...app.children].forEach(child => {
        if (child.id === 'short-landscape-notice') {
          const gateIsTop = topModal?.id === 'adult-gate-modal';
          const exposeToAssistiveTech = this.requiresPortraitOrientation && !gateIsTop;
          child.inert = !exposeToAssistiveTech;
          child.setAttribute('aria-hidden', exposeToAssistiveTech ? 'false' : 'true');
          return;
        }
        if (
          child.classList?.contains('modal-overlay')
          || child.id === 'game-announcer'
        ) return;
        child.inert = Boolean(topModal);
      });
    }
  }

  getFocusableControls(modal) {
    if (!modal) return [];
    return [...modal.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter(element => {
        if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
        const blockedAncestor = element.closest?.('[hidden], [inert], [aria-hidden="true"]');
        if (blockedAncestor && blockedAncestor !== modal) return false;
        if (typeof element.getClientRects === 'function' && element.getClientRects().length === 0) return false;
        if (typeof window.getComputedStyle !== 'function') return true;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
  }

  trapModalFocus(event, modal) {
    if (event.key !== 'Tab' || !modal) return false;
    const controls = this.getFocusableControls(modal);
    if (!controls.length) {
      modal.tabIndex = -1;
      modal.focus();
      event.preventDefault();
      return true;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
      return true;
    }
    if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
      return true;
    }
    if (!modal.contains(document.activeElement)) {
      first.focus();
      event.preventDefault();
      return true;
    }
    return false;
  }

  openModal(modalOrId) {
    const modal = typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
    if (!modal) return;
    const adultGate = document.getElementById('adult-gate-modal');
    if (adultGate?.classList.contains('active') && modal !== adultGate) return;
    const wasOpen = modal.classList.contains('active');
    if (!wasOpen) {
      this.modalFocusStack.push({ modal, returnTo: document.activeElement });
    }
    this.lastFocusedElement = document.activeElement;
    modal.classList.add('active');
    this.syncModalAccessibility();
    this.isPaused = true;
    if (!wasOpen) {
      const firstControl = this.getFocusableControls(modal)[0];
      if (firstControl) requestAnimationFrame(() => firstControl.focus());
    }
  }

  closeModal(modalOrId, restoreFocus = true) {
    const modal = typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
    if (!modal || modal.id === 'adult-gate-modal') return;
    const focusEntryIndex = this.modalFocusStack.map(entry => entry.modal).lastIndexOf(modal);
    const focusEntry = focusEntryIndex >= 0 ? this.modalFocusStack[focusEntryIndex] : null;
    if (focusEntryIndex >= 0) this.modalFocusStack.splice(focusEntryIndex, 1);
    if (modal.id === 'visual-novel-modal') this.restoreVnMusicMood();
    modal.classList.remove('active');
    this.syncModalAccessibility();
    this.isPaused = Boolean(this.getTopOpenModal());
    const returnTo = focusEntry?.returnTo || this.lastFocusedElement;
    if (restoreFocus && returnTo && typeof returnTo.focus === 'function') {
      requestAnimationFrame(() => returnTo.focus());
    }
    if (modal.id === 'cinematic-modal') this.activeCinematic = null;
    if (!this.getTopOpenModal()) this.processCinematicQueue();
  }

  closeAllGameplayModals(excludedIds = []) {
    const excluded = new Set(['adult-gate-modal', ...excludedIds]);
    if (!excluded.has('visual-novel-modal')) this.restoreVnMusicMood();
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      if (!excluded.has(modal.id)) modal.classList.remove('active');
    });
    this.modalFocusStack = this.modalFocusStack.filter(entry => excluded.has(entry.modal?.id));
    this.syncModalAccessibility();
    this.isPaused = Boolean(this.getTopOpenModal());
  }

  syncMusicButtonState() {
    const button = document.getElementById('btn-music-toggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(audio.isPlayingMusic));
    button.setAttribute('aria-label', audio.isPlayingMusic ? 'Couper la musique' : 'Activer la musique');
  }

  announce(message) {
    const announcer = document.getElementById('game-announcer');
    if (announcer) announcer.textContent = message;
  }

  showFeedback(message, color = '#00f0ff') {
    this.addFloatingText(message, this.citadel.x, this.citadel.y - 70, color);
    this.announce(message.replace(/[^\p{L}\p{N}\s.,'’!?+-]/gu, '').trim());
  }

  formatRunTime(seconds = this.runElapsedSeconds) {
    const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  getHeroKit(heroId = this.selectedHero?.id) {
    return CHARACTER_EXPANSION?.heroKits?.[heroId]
      || EXPANSION?.heroKits?.[heroId]
      || null;
  }

  getBossDefinition(type) {
    return CHARACTER_EXPANSION?.bossDefinitions?.[type]
      || CHARACTER_EXPANSION?.bosses?.[type]
      || null;
  }

  isEnemyFlying(enemy) {
    if (!enemy) return false;
    if (enemy.type === 'flying') return true;
    const definition = this.getBossDefinition(enemy.bossDefinitionId || enemy.type);
    return definition?.traits?.includes('flying') === true;
  }

  getCampaignDefinition(campaignId = this.activeCampaignId) {
    return CHARACTER_EXPANSION?.campaigns?.[campaignId] || null;
  }

  getCampaignFinalWave() {
    return Number(this.getCampaignDefinition()?.finalWave) || CAMPAIGN_FINAL_WAVE;
  }

  getCampaignDisplayName() {
    return this.getCampaignDefinition()?.name || 'La Guerre des Quatre Portes';
  }

  openMissionBriefing() {
    const modal = document.getElementById('mission-briefing-modal');
    if (!modal) return;
    const checkpoint = this.isValidRunCheckpoint(this.savedRunCheckpoint) ? this.savedRunCheckpoint : null;
    const checkpointCard = document.getElementById('checkpoint-card');
    const continueButton = document.getElementById('btn-continue-run');
    const difficultySelect = document.getElementById('difficulty-select');
    const campaignSelect = document.getElementById('campaign-select');
    const layoutSelect = document.getElementById('layout-select');
    const saveWarning = document.getElementById('save-warning');
    const selectedDifficulty = checkpoint?.difficulty || this.difficulty || 'standard';
    if (difficultySelect) difficultySelect.value = selectedDifficulty;
    if (campaignSelect) campaignSelect.value = checkpoint?.activeCampaignId
      || this.activeCampaignId
      || 'four_gates';
    if (layoutSelect) layoutSelect.value = this.rotationEnabled
      ? 'rotation'
      : (checkpoint?.selectedLayoutId || this.selectedLayoutId);
    if (saveWarning) saveWarning.hidden = !this.saveLoadError;
    this.updateDifficultyDescription(selectedDifficulty);
    this.updateCampaignDescription(campaignSelect?.value || this.activeCampaignId);
    this.updateLayoutDescription(layoutSelect?.value || this.selectedLayoutId);

    if (checkpointCard) checkpointCard.hidden = !checkpoint;
    if (continueButton) continueButton.hidden = !checkpoint;
    if (checkpoint) {
      const summary = document.getElementById('checkpoint-summary');
      if (summary) {
        summary.textContent = `Vague ${checkpoint.nextWave} · Citadelle ${Math.ceil(checkpoint.citadelHp)} HP · ${this.formatRunTime(checkpoint.runElapsedSeconds)}`;
      }
    }
    this.resumeWasOffered = Boolean(checkpoint);
    this.openModal(modal);
  }

  updateDifficultyDescription(difficultyId) {
    const difficulty = DIFFICULTY_DATA[difficultyId] || DIFFICULTY_DATA.standard;
    const description = document.getElementById('difficulty-description');
    if (description) description.textContent = difficulty.desc;
  }

  updateCampaignDescription(campaignId) {
    const campaign = CHARACTER_EXPANSION?.campaigns?.[campaignId];
    const description = document.getElementById('campaign-description');
    const objective = document.getElementById('campaign-objective');
    if (description) {
      description.textContent = campaign?.description
        || 'La campagne historique mène au Léviathan en quinze vagues.';
    }
    if (objective) {
      objective.textContent = campaign
        ? `Vague ${campaign.finalWave} · ${campaign.finalBossName || 'Dixième Trône'}`
        : 'Vague 15 · Titan Léviathan';
    }
  }

  updateLayoutDescription(layoutId) {
    const layout = this.getWorldLayout(layoutId);
    const description = document.getElementById('layout-description');
    if (description) description.textContent = layout.description || layout.tacticalNote || '';
    const missionMap = document.getElementById('mission-map-txt');
    if (missionMap) missionMap.textContent = layout.name || layout.id || 'La Convergence';
  }

  beginNewCampaign() {
    const difficultyId = document.getElementById('difficulty-select')?.value || 'standard';
    const campaignId = document.getElementById('campaign-select')?.value || 'four_gates';
    const layoutId = document.getElementById('layout-select')?.value || this.selectedLayoutId;
    const rotation = layoutId === 'rotation' ? Object.keys(EXPANSION?.worldLayouts || {}) : [];
    this.selectedLayoutId = EXPANSION?.worldLayouts?.[layoutId] ? layoutId : 'convergence';
    this.closeModal('mission-briefing-modal', false);
    this.startNewGame({
      difficulty: difficultyId,
      campaignId,
      layoutId: this.selectedLayoutId,
      rotation
    });
    this.focusBattlefield();
    this.announce(
      `Nouvelle campagne ${this.getCampaignDisplayName()} en difficulté ${DIFFICULTY_DATA[this.difficulty].name}. `
      + `Objectif : tenir ${this.getCampaignFinalWave()} vagues.`
    );
  }

  continueSavedCampaign() {
    if (!this.restoreRunCheckpoint()) {
      this.clearRunCheckpoint();
      this.saveProgress();
      this.updateDifficultyDescription(document.getElementById('difficulty-select')?.value || 'standard');
      this.announce('Le point de contrôle est invalide. Lancez une nouvelle campagne.');
      return;
    }
    this.closeModal('mission-briefing-modal', false);
    this.focusBattlefield();
  }

  focusBattlefield() {
    requestAnimationFrame(() => this.canvas?.focus({ preventScroll: true }));
  }

  returnToMissionBriefing() {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      if (modal.id !== 'adult-gate-modal' && modal.id !== 'mission-briefing-modal') {
        modal.classList.remove('active');
      }
    });
    this.modalFocusStack = [];
    this.syncModalAccessibility();
    this.isPaused = true;
    this.openMissionBriefing();
  }

  focusSelectedBuildCard() {
    const bar = document.getElementById('hud-build-bar');
    const selectedCard = bar?.querySelector('.build-tower-card[aria-pressed="true"]')
      || bar?.querySelector('.build-tower-card');
    if (!selectedCard) return false;

    bar.querySelectorAll('.build-tower-card').forEach(card => {
      card.tabIndex = card === selectedCard ? 0 : -1;
    });
    selectedCard.focus({ preventScroll: true });
    selectedCard.scrollIntoView?.({ block: 'nearest', inline: 'center' });
    const tower = TOWER_TYPES[selectedCard.dataset.towerId];
    this.announce(`Barre des défenses. ${tower?.name || 'Défense'} sélectionnée. Utilisez les flèches pour parcourir, puis Échap pour retourner au champ de bataille.`);
    return true;
  }

  enterAdultExperience() {
    const gate = document.getElementById('adult-gate-modal');
    if (!gate) return;
    gate.classList.remove('active');
    this.hasEnteredAdultExperience = true;
    const battleAtlasesMissing = (
      !Object.keys(this.enemySpriteImages).length
      || !Object.keys(this.towerSpriteImages).length
      || !Object.keys(this.heroSpriteImages).length
    );
    if (battleAtlasesMissing) this.preloadBattleSprites();
    if (this.preferredMusicEnabled && !audio.isPlayingMusic) audio.startMusic();
    this.syncMusicButtonState();
    this.syncModalAccessibility();
    this.isPaused = true;
    this.announce('Accès adulte confirmé. Consultez le briefing avant de lancer la campagne.');
    this.openMissionBriefing();
  }

  declineAdultExperience() {
    const gate = document.getElementById('adult-gate-modal');
    if (!gate) return;
    gate.classList.add('declined');
    gate.querySelector('#adult-gate-title').textContent = 'ACCÈS AU JEU DÉSACTIVÉ';
    gate.querySelector('#adult-gate-description').textContent = 'Vous avez choisi de ne pas accéder à cette expérience réservée aux adultes. Vous pouvez fermer cet onglet en toute sécurité.';
    this.isPaused = true;
    this.announce('Accès au jeu désactivé.');
    gate.tabIndex = -1;
    gate.focus();
  }

  bindEvents() {
    if (this.canvas) {
      this.canvas.tabIndex = 0;
      this.canvas.setAttribute('role', 'application');
      this.canvas.setAttribute('aria-label', 'Champ de bataille. Faites glisser ou utilisez W A S D pour déplacer la caméra. Utilisez la molette, un pincement, plus ou moins pour zoomer, et zéro pour tout cadrer. Un clic ou toucher bref construit ou gère une défense. Les flèches déplacent le curseur de construction.');
      this.canvas.setAttribute('aria-keyshortcuts', 'B W A S D + - 0');
      this.cameraPointers = new Map();
      this.cameraGesture = null;
      this.suppressNextBattlefieldClick = false;
      this.cameraClickSuppressionTimer = null;
      this.cameraZoomAnnouncementTimer = null;
      const toCanvasPoint = (clientX, clientY) => {
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: (clientX - rect.left) * (this.canvas.width / Math.max(1, rect.width)),
          y: (clientY - rect.top) * (this.canvas.height / Math.max(1, rect.height))
        };
      };
      const beginSinglePointerPan = (pointerId, point, alreadyMoved = false) => {
        this.cameraGesture = {
          type: 'pan',
          pointerId,
          startX: point.x,
          startY: point.y,
          lastX: point.x,
          lastY: point.y,
          moved: alreadyMoved
        };
      };
      const updatePointerGesture = (e) => {
        if (!this.cameraPointers.has(e.pointerId)) return;
        const point = toCanvasPoint(e.clientX, e.clientY);
        this.cameraPointers.set(e.pointerId, point);
        const activePointers = [...this.cameraPointers.entries()];

        if (activePointers.length >= 2) {
          const [[, first], [, second]] = activePointers;
          const midpoint = {
            x: (first.x + second.x) / 2,
            y: (first.y + second.y) / 2
          };
          const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
          if (this.cameraGesture?.type !== 'pinch') {
            this.cameraGesture = {
              type: 'pinch',
              lastMidpoint: midpoint,
              lastDistance: distance,
              moved: true
            };
          } else {
            const factor = distance / Math.max(1, this.cameraGesture.lastDistance);
            // Preserve the world point under the previous midpoint, then move
            // it to the new midpoint. Anchoring on the new midpoint before
            // panning would make a translating pinch drift across the map.
            this.zoomBattlefieldCameraBy(
              factor,
              this.cameraGesture.lastMidpoint.x,
              this.cameraGesture.lastMidpoint.y
            );
            this.panBattlefieldCameraBy(
              midpoint.x - this.cameraGesture.lastMidpoint.x,
              midpoint.y - this.cameraGesture.lastMidpoint.y
            );
            this.cameraGesture.lastMidpoint = midpoint;
            this.cameraGesture.lastDistance = distance;
          }
          this.canvas.classList.add('is-panning');
          this.canvas.dataset.cameraDragging = 'true';
          e.preventDefault();
          return;
        }

        const gesture = this.cameraGesture;
        if (gesture?.type !== 'pan' || gesture.pointerId !== e.pointerId) return;
        const crossedDragThreshold = Math.hypot(
          point.x - gesture.startX,
          point.y - gesture.startY
        ) >= 6;
        if (!gesture.moved && crossedDragThreshold) {
          gesture.moved = true;
          this.panBattlefieldCameraBy(
            point.x - gesture.startX,
            point.y - gesture.startY
          );
        } else if (gesture.moved) {
          this.panBattlefieldCameraBy(
            point.x - gesture.lastX,
            point.y - gesture.lastY
          );
        }
        gesture.lastX = point.x;
        gesture.lastY = point.y;
        if (gesture.moved) {
          this.canvas.classList.add('is-panning');
          this.canvas.dataset.cameraDragging = 'true';
          e.preventDefault();
        }
      };
      const finishPointerGesture = (e, suppressClickAfterMovement = true) => {
        if (!this.cameraPointers.has(e.pointerId)) return;
        const gestureWasPinch = this.cameraGesture?.type === 'pinch';
        const gestureWasMoved = this.cameraGesture?.moved === true
          || gestureWasPinch;
        this.cameraPointers.delete(e.pointerId);
        if (this.canvas.hasPointerCapture?.(e.pointerId)) {
          this.canvas.releasePointerCapture(e.pointerId);
        }
        const remaining = [...this.cameraPointers.entries()];
        if (remaining.length === 1) {
          const [pointerId, point] = remaining[0];
          beginSinglePointerPan(pointerId, point, gestureWasMoved);
        } else if (remaining.length === 0) {
          this.cameraGesture = null;
          this.canvas.classList.remove('is-panning');
          delete this.canvas.dataset.cameraDragging;
        }
        // pointercancel never synthesizes a click. Arming suppression here
        // would incorrectly discard the player's next deliberate placement.
        if (gestureWasMoved && suppressClickAfterMovement) {
          this.suppressNextBattlefieldClick = true;
          clearTimeout(this.cameraClickSuppressionTimer);
          // Compatibility clicks follow pointerup immediately. Clear the guard
          // soon afterwards so a browser that emits no synthetic click cannot
          // make the next deliberate tap disappear.
          this.cameraClickSuppressionTimer = setTimeout(() => {
            this.suppressNextBattlefieldClick = false;
          }, 120);
        }
        if (gestureWasPinch) this.announceBattlefieldCameraZoom();
      };

      this.canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const point = toCanvasPoint(e.clientX, e.clientY);
        this.cameraPointers.set(e.pointerId, point);
        this.canvas.setPointerCapture?.(e.pointerId);
        if (this.cameraPointers.size === 1) {
          beginSinglePointerPan(e.pointerId, point);
        } else {
          // The first move initializes the pinch from the two live pointers.
          this.cameraGesture = null;
        }
      });
      this.canvas.addEventListener('pointermove', updatePointerGesture);
      this.canvas.addEventListener('pointerup', finishPointerGesture);
      this.canvas.addEventListener('pointercancel', e => finishPointerGesture(e, false));
      this.canvas.addEventListener('wheel', (e) => {
        const point = toCanvasPoint(e.clientX, e.clientY);
        const factor = Math.max(0.75, Math.min(1.25, Math.exp(-e.deltaY * 0.0015)));
        this.zoomBattlefieldCameraBy(factor, point.x, point.y);
        clearTimeout(this.cameraZoomAnnouncementTimer);
        this.cameraZoomAnnouncementTimer = setTimeout(
          () => this.announceBattlefieldCameraZoom(),
          250
        );
        e.preventDefault();
      }, { passive: false });
      this.canvas.addEventListener('click', (e) => {
        if (this.suppressNextBattlefieldClick) {
          this.suppressNextBattlefieldClick = false;
          return;
        }
        if (this.isPaused || this.isGameOver) return;
        const { x: screenX, y: screenY } = toCanvasPoint(e.clientX, e.clientY);
        const { x, y } = this.screenToBattlefieldPoint(screenX, screenY);
        this.buildCursor.x = x;
        this.buildCursor.y = y;
        if (this.activeHeroTargeting) {
          this.executeHeroAbilityAt(x, y);
          this.canvas.focus({ preventScroll: true });
          return;
        }
        const existingDefense = this.findPlacedDefenseAt(x, y);
        if (existingDefense) {
          this.canvas.focus({ preventScroll: true });
          this.openDefenseManagementModal(existingDefense);
          return;
        }
        this.buildSelectedTowerAt(x, y);
      });
      this.canvas.addEventListener('focus', () => { this.buildCursor.visible = true; });
      this.canvas.addEventListener('blur', () => { this.buildCursor.visible = false; });
    }

    const zoomCameraAtSafeCenter = factor => {
      const view = this.getBattlefieldView();
      this.zoomBattlefieldCameraBy(factor, view.screenCenterX, view.screenCenterY);
    };
    document.getElementById('btn-camera-zoom-out')?.addEventListener('click', () => {
      zoomCameraAtSafeCenter(1 / 1.2);
      this.announceBattlefieldCameraZoom();
    });
    document.getElementById('btn-camera-fit')?.addEventListener('click', () => {
      this.fitBattlefieldCamera();
      this.announceBattlefieldCameraZoom();
    });
    document.getElementById('btn-camera-zoom-in')?.addEventListener('click', () => {
      zoomCameraAtSafeCenter(1.2);
      this.announceBattlefieldCameraZoom();
    });
    this.updateBattlefieldCameraControls();

    document.getElementById('btn-enter-adult')?.addEventListener('click', () => this.enterAdultExperience());
    document.getElementById('btn-decline-adult')?.addEventListener('click', () => this.declineAdultExperience());
    document.getElementById('difficulty-select')?.addEventListener('change', event => {
      this.updateDifficultyDescription(event.target.value);
    });
    document.getElementById('campaign-select')?.addEventListener('change', event => {
      this.updateCampaignDescription(event.target.value);
    });
    document.getElementById('layout-select')?.addEventListener('change', event => {
      if (event.target.value === 'rotation') {
        this.setMapRotation(Object.keys(EXPANSION?.worldLayouts || {}));
        this.updateLayoutDescription(this.selectedLayoutId);
        return;
      }
      if (!EXPANSION?.worldLayouts?.[event.target.value]) return;
      this.setMapRotation([]);
      this.selectedLayoutId = event.target.value;
      this.updateLayoutDescription(this.selectedLayoutId);
    });
    document.getElementById('btn-start-campaign')?.addEventListener('click', () => this.beginNewCampaign());
    document.getElementById('btn-daily-challenge')?.addEventListener('click', () => {
      const challenge = this.startDailyChallenge(new Date());
      const dateText = document.getElementById('daily-challenge-date');
      const layoutText = document.getElementById('daily-challenge-layout');
      const mutatorText = document.getElementById('daily-challenge-mutators');
      if (dateText) dateText.textContent = challenge.date;
      if (layoutText) layoutText.textContent = this.getWorldLayout(challenge.layoutId).name || challenge.layoutId;
      if (mutatorText) {
        mutatorText.textContent = this.activeRunMutators.map(mutator => mutator.name).join(' · ') || 'Aucun mutateur';
      }
      this.closeModal('mission-briefing-modal', false);
      this.closeModal('hq-menu-modal', false);
      this.focusBattlefield();
    });
    document.getElementById('btn-continue-run')?.addEventListener('click', () => this.continueSavedCampaign());
    document.getElementById('btn-reset-save')?.addEventListener('click', () => {
      localStorage.removeItem('valkyrie_sweeper_save');
      window.location.reload();
    });
    document.getElementById('btn-new-campaign')?.addEventListener('click', () => {
      this.closeModal('victory-modal', false);
      this.openMissionBriefing();
    });
    document.getElementById('btn-continue-endless')?.addEventListener('click', () => this.continueEndlessMode());
    document.getElementById('btn-close-tower-complete')?.addEventListener('click', () => {
      this.closeModal('tower-complete-modal', false);
      this.focusBattlefield();
    });
    document.getElementById('btn-gameover-hq')?.addEventListener('click', () => {
      this.returnToMissionBriefing();
    });
    document.getElementById('btn-reload-game')?.addEventListener('click', () => window.location.reload());
    document.getElementById('btn-dismiss-error')?.addEventListener('click', () => {
      this.returnToMissionBriefing();
    });

    const btnSkill = document.getElementById('btn-hero-skill');
    if (btnSkill) btnSkill.addEventListener('click', () => this.triggerHeroAbility());

    document.getElementById('btn-vn-continue')?.addEventListener('click', () => this.advanceVnDialogue());
    document.getElementById('btn-vn-chapters')?.addEventListener('click', () => this.pauseVnToChapterBrowser());
    document.getElementById('btn-vn-revoke')?.addEventListener('click', () => this.revokeActiveVnConsent());
    this.initializeSettingsControls();

    const btnOverdrive = document.getElementById('btn-overdrive');
    if (btnOverdrive) btnOverdrive.addEventListener('click', () => this.triggerOverdrive());

    window.addEventListener('keydown', (e) => {
      const activeModal = this.getTopOpenModal();
      if (activeModal && this.trapModalFocus(e, activeModal)) return;
      if (e.key === 'Escape' && this.activeHeroTargeting && !activeModal) {
        e.preventDefault();
        this.cancelHeroAbilityTargeting();
        return;
      }
      if (e.key === 'Escape' && activeModal?.id !== 'adult-gate-modal' && activeModal?.querySelector('.btn-close')) {
        e.preventDefault();
        if (activeModal.id === 'body-route-vn-modal') this.pauseBodyRouteToArchives();
        else this.closeModal(activeModal);
        return;
      }

      if (document.getElementById('adult-gate-modal')?.classList.contains('active')) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      if (!activeModal && (e.key === 'b' || e.key === 'B')) {
        if (this.focusSelectedBuildCard()) e.preventDefault();
        return;
      }
      if (!activeModal && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoomCameraAtSafeCenter(1.2);
        this.announceBattlefieldCameraZoom();
        return;
      }
      if (!activeModal && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        zoomCameraAtSafeCenter(1 / 1.2);
        this.announceBattlefieldCameraZoom();
        return;
      }
      if (!activeModal && e.key === '0') {
        e.preventDefault();
        this.fitBattlefieldCamera();
        this.announceBattlefieldCameraZoom();
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.triggerOverdrive();
        return;
      }

      if (document.activeElement === this.canvas) {
        const view = this.getBattlefieldView();
        const cameraStep = e.shiftKey ? 140 : 70;
        const cameraKey = e.key.toLowerCase();
        if (cameraKey === 'a') this.panBattlefieldCameraBy(cameraStep, 0);
        else if (cameraKey === 'd') this.panBattlefieldCameraBy(-cameraStep, 0);
        else if (cameraKey === 'w') this.panBattlefieldCameraBy(0, cameraStep);
        else if (cameraKey === 's') this.panBattlefieldCameraBy(0, -cameraStep);
        else {
          // Keep keyboard travel constant in screen pixels despite the long-range
          // tactical zoom used for the five-times-deeper approaches.
          const step = (e.shiftKey ? 50 : 20) / Math.max(0.01, view.scale);
          if (e.key === 'ArrowLeft') this.buildCursor.x -= step;
          else if (e.key === 'ArrowRight') this.buildCursor.x += step;
          else if (e.key === 'ArrowUp') this.buildCursor.y -= step;
          else if (e.key === 'ArrowDown') this.buildCursor.y += step;
          else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const existingDefense = this.findPlacedDefenseAt(this.buildCursor.x, this.buildCursor.y);
            if (existingDefense) {
              this.openDefenseManagementModal(existingDefense);
              return;
            }
            this.buildSelectedTowerAt(this.buildCursor.x, this.buildCursor.y);
            return;
          } else return;
          this.buildCursor.x = Math.max(25, Math.min(this.worldWidth - 25, this.buildCursor.x));
          this.buildCursor.y = Math.max(25, Math.min(this.worldHeight - 25, this.buildCursor.y));
        }
        e.preventDefault();
      }
    });

    const radioSel = document.getElementById('radio-station-select');
    if (radioSel) {
      radioSel.setAttribute('aria-label', 'Station de radio');
      if ([...radioSel.options].some(option => option.value === this.preferredRadioStation)) {
        radioSel.value = this.preferredRadioStation;
        audio.setStation(this.preferredRadioStation);
      }
      radioSel.addEventListener('change', (e) => {
        audio.setStation(e.target.value);
        if (audio.isPlayingMusic) {
          audio.stopMusic();
          audio.startMusic();
        }
        this.saveProgress();
      });
    }

    // HQ Central Hub Opener Button in HUD
    const btnOpenHQ = document.getElementById('btn-open-hq');
    if (btnOpenHQ) {
      btnOpenHQ.addEventListener('click', () => {
        this.openModal('hq-menu-modal');
      });
    }

    // Sub-modal triggers from HQ Hub Menu
    document.querySelectorAll('.hq-card').forEach(card => {
      card.addEventListener('click', () => {
        const targetId = card.id;
        if (targetId === 'btn-harem-toggle') this.openHaremModal();
        else if (targetId === 'btn-roster-toggle') this.openRosterModal();
        else if (targetId === 'btn-antagonist-codex-toggle') this.openAntagonistCodex();
        else if (targetId === 'btn-wardrobe-toggle') this.openWardrobeModal();
        else if (targetId === 'btn-biolab-toggle') this.openBiolabModal();
        else if (targetId === 'btn-mercs-toggle') this.openMercenaryModal();
        else if (targetId === 'btn-tower-toggle') this.openTowerInfinitumModal();
        else if (targetId === 'btn-studio-toggle') this.openPhotoStudioModal();
        else if (targetId === 'btn-slot-toggle') this.openSlotMachineModal();
        else if (targetId === 'btn-shop-toggle') this.openShopModal();
        else if (targetId === 'btn-gallery-toggle') this.openGalleryModal();
        else if (targetId === 'btn-adult-scenes-toggle') this.openAdultScenesModal();
        else if (targetId === 'btn-achieve-toggle') this.openAchievementsModal();
        else if (targetId === 'btn-run-history-toggle') this.openRunHistoryModal();
        else if (targetId === 'btn-settings-toggle') this.openSettingsModal();
      });
    });

    document.getElementById('btn-resume-combat')?.addEventListener('click', () => this.closeModal('hq-menu-modal'));
    document.getElementById('btn-cinematic-continue')?.addEventListener('click', () => {
      this.closeModal('cinematic-modal');
    });
    document.getElementById('adult-scenes-filter-select')?.addEventListener('change', event => {
      this.activeAdultSceneFilter = event.target.value;
      this.renderAdultScenes(this.activeAdultSceneFilter);
    });
    document.getElementById('body-route-participant-select')?.addEventListener('change', event => {
      this.activeBodyRouteParticipantFilter = event.target.value;
      this.renderAdultScenes(this.activeAdultSceneFilter);
      this.announce(document.getElementById('body-route-progress-summary')?.textContent || 'Filtre des archives mis à jour.');
    });

    document.querySelectorAll('[data-studio-color]').forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        const color = button.dataset.studioColor;
        document.getElementById('studio-preview-img').style.filter = `drop-shadow(0 0 18px ${color})`;
        document.querySelectorAll('[data-studio-color]').forEach(filterButton => filterButton.setAttribute('aria-pressed', String(filterButton === button)));
      });
    });
    document.getElementById('studio-pose-select')?.addEventListener('change', () => this.updatePhotoStudioPreview());
    document.getElementById('studio-ambience-select')?.addEventListener('change', () => this.updatePhotoStudioPreview());
    document.getElementById('studio-maturity-select')?.addEventListener('change', event => {
      this.setStudioMaturity(event.target.value);
    });

    const btnCrt = document.getElementById('btn-crt-toggle');
    if (btnCrt) {
      const crt = document.querySelector('.crt-overlay');
      crt?.classList.toggle('disabled', !this.preferredCrtEnabled);
      btnCrt.setAttribute('aria-pressed', String(this.preferredCrtEnabled));
      btnCrt.setAttribute('aria-label', this.preferredCrtEnabled ? 'Désactiver l’effet CRT' : 'Activer l’effet CRT');
      btnCrt.addEventListener('click', () => {
        if (crt) {
          crt.classList.toggle('disabled');
          const enabled = !crt.classList.contains('disabled');
          btnCrt.setAttribute('aria-pressed', String(enabled));
          btnCrt.setAttribute('aria-label', enabled ? 'Désactiver l’effet CRT' : 'Activer l’effet CRT');
          this.saveProgress();
        }
      });
    }

    const btnMusic = document.getElementById('btn-music-toggle');
    if (btnMusic) {
      this.syncMusicButtonState();
      btnMusic.addEventListener('click', () => {
        audio.toggleMusic();
        this.syncMusicButtonState();
        this.saveProgress();
      });
    }

    const btnSfx = document.getElementById('btn-sfx-toggle');
    if (btnSfx) {
      const updateSfxState = () => {
        const enabled = !audio.isMuted;
        btnSfx.setAttribute('aria-pressed', String(enabled));
        btnSfx.setAttribute('aria-label', enabled ? 'Couper les effets sonores' : 'Activer les effets sonores');
        btnSfx.textContent = enabled ? '🔊' : '🔇';
      };
      updateSfxState();
      btnSfx.addEventListener('click', () => {
        audio.toggleSfx();
        updateSfxState();
        this.saveProgress();
      });
    }

    document.querySelectorAll('.btn-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal?.id === 'body-route-vn-modal') this.pauseBodyRouteToArchives();
        else if (modal) this.closeModal(modal);
      });
    });

    document.getElementById('btn-defense-upgrade')?.addEventListener('click', () => {
      this.handleDefenseUpgrade();
    });
    document.getElementById('btn-defense-sell')?.addEventListener('click', () => {
      this.handleDefenseSale();
    });

    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.closeAllGameplayModals();
        this.startNewGame({ difficulty: this.difficulty });
        this.focusBattlefield();
      });
    }

    document.getElementById('btn-boss-release')?.addEventListener('click', () => {
      this.showFeedback('Aucune proposition n’est faite. Elle repart librement.', '#cbd5e1');
      this.closeModal('boss-recruit-modal', false);
      this.focusBattlefield();
    });
  }

  renderBuildBar() {
    const bar = document.getElementById('hud-build-bar');
    if (!bar) return;
    bar.innerHTML = '';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Défenses à construire. Flèches gauche et droite pour parcourir, Échap pour retourner au champ de bataille.');
    bar.setAttribute('aria-orientation', 'horizontal');

    Object.values(TOWER_TYPES).forEach(t => {
      const card = document.createElement('button');
      const isSelected = this.selectedTowerToBuild.id === t.id;
      card.type = 'button';
      card.className = `build-tower-card ${isSelected ? 'selected' : ''}`;
      card.title = `${t.name} (${t.cost} 🪙) - ${t.desc}`;
      card.dataset.towerId = t.id;
      card.setAttribute('aria-label', `${t.name}, coût ${t.cost} Bio-Coins. ${t.desc}`);
      card.setAttribute('aria-pressed', String(isSelected));
      card.tabIndex = isSelected ? 0 : -1;
      card.innerHTML = `<span class="icon" aria-hidden="true">${t.icon}</span><span class="tower-name">${t.name}</span><span class="cost">${t.cost}🪙</span>`;
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        if (card.dataset.affordable === 'false') {
          this.announce(`${t.name} indisponible : ${t.cost} Bio-Coins requis, ${this.coins} disponibles.`);
          return;
        }
        bar.querySelectorAll('.build-tower-card').forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-pressed', 'false');
          c.tabIndex = c === card ? 0 : -1;
        });
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
        this.selectedTowerToBuild = t;
        this.announce(`${t.name} sélectionnée. Coût ${t.cost} Bio-Coins.`);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          this.focusBattlefield();
          this.announce('Retour au champ de bataille.');
          return;
        }

        const cards = [...bar.querySelectorAll('.build-tower-card')];
        const currentIndex = cards.indexOf(card);
        let targetIndex = currentIndex;
        if (e.key === 'ArrowLeft') targetIndex = (currentIndex - 1 + cards.length) % cards.length;
        else if (e.key === 'ArrowRight') targetIndex = (currentIndex + 1) % cards.length;
        else if (e.key === 'Home') targetIndex = 0;
        else if (e.key === 'End') targetIndex = cards.length - 1;
        else return;

        e.preventDefault();
        e.stopPropagation();
        card.tabIndex = -1;
        const target = cards[targetIndex];
        target.tabIndex = 0;
        target.focus({ preventScroll: true });
        target.scrollIntoView?.({ block: 'nearest', inline: 'center' });
      });
      bar.appendChild(card);
    });
    this.updateBuildBarAffordability();
  }

  updateBuildBarAffordability() {
    document.querySelectorAll('.build-tower-card').forEach(card => {
      const tower = TOWER_TYPES[card.dataset.towerId];
      if (!tower) return;
      const affordable = this.coins >= tower.cost;
      card.classList.toggle('unaffordable', !affordable);
      card.dataset.affordable = String(affordable);
      card.setAttribute('aria-disabled', String(!affordable));
    });
  }

  createPlacedDefense(towerType, x, y, options = {}) {
    const ariaPassive = this.selectedHero?.id === 'aria'
      ? this.getHeroKit('aria')?.passive
      : null;
    const ariaModifiers = ariaPassive?.modifiers || {};
    const isInsideAriaAegis = ariaPassive
      && Math.hypot(x - this.citadel.x, y - this.citadel.y)
        <= (Number(ariaModifiers.radius) || 250);
    const baseHp = Math.round(
      (towerType.hp || 180)
        * (isInsideAriaAegis ? (Number(ariaModifiers.defenseHpMultiplier) || 1.16) : 1)
    );
    const defense = {
      id: towerType.id,
      x, y,
      level: 1,
      type: towerType.type,
      icon: towerType.icon,
      name: towerType.name,
      baseCost: towerType.cost,
      investedCost: towerType.cost,
      baseDamage: towerType.damage,
      baseFireRate: towerType.fireRate,
      baseRange: towerType.range,
      baseMaxHp: baseHp,
      baseRadius: 18,
      damage: towerType.damage,
      fireRate: towerType.fireRate,
      range: towerType.range,
      radius: 18,
      timer: 0,
      facingAngle: 0,
      animationTimer: 0,
      animationPhase: Math.random() * 4,
      hp: baseHp,
      maxHp: baseHp,
      stunIgnoresPerWave: isInsideAriaAegis
        ? Math.max(0, Math.floor(Number(ariaModifiers.stunIgnoresPerWave) || 0))
        : 0,
      stunIgnoresRemaining: isInsideAriaAegis
        ? Math.max(0, Math.floor(Number(ariaModifiers.stunIgnoresPerWave) || 0))
        : 0,
      disabledTimer: 0,
      effectPower: 1,
      isStarter: options.starter === true
    };
    return this.applyDefenseLevelStats(defense, 1);
  }

  getDefenseStatsAtLevel(defense, requestedLevel) {
    const typeData = TOWER_TYPES[defense?.id] || {};
    const level = Math.max(1, Math.min(DEFENSE_MAX_LEVEL, Math.floor(requestedLevel || 1)));
    const levelStats = DEFENSE_LEVEL_STATS[level];
    const baseDamage = Number.isFinite(defense?.baseDamage) ? defense.baseDamage : (Number(typeData.damage) || 0);
    const baseFireRate = Number.isFinite(defense?.baseFireRate) ? defense.baseFireRate : (Number(typeData.fireRate) || 0);
    const baseRange = Number.isFinite(defense?.baseRange) ? defense.baseRange : (Number(typeData.range) || 0);
    const baseMaxHp = Number.isFinite(defense?.baseMaxHp) ? defense.baseMaxHp : (Number(typeData.hp) || 180);
    const baseRadius = Number.isFinite(defense?.baseRadius) ? defense.baseRadius : 18;

    const specialization = this.getDefenseSpecializationOptions(defense)
      .find(option => option.id === defense?.specializationId);
    const modifiers = specialization?.modifiers || {};
    return {
      level,
      damage: Math.round(baseDamage * levelStats.damage * (Number(modifiers.damageMultiplier) || 1) * 100) / 100,
      fireRate: baseFireRate > 0
        ? Math.max(70, Math.round(baseFireRate * levelStats.fireRate * (Number(modifiers.fireRateMultiplier) || 1)))
        : 0,
      range: Math.round(baseRange * levelStats.range * (Number(modifiers.rangeMultiplier) || 1)),
      maxHp: Math.round(baseMaxHp * levelStats.hp * (Number(modifiers.hpMultiplier) || 1)),
      radius: Math.max(12, Math.round(baseRadius * (Number(modifiers.widthMultiplier) || 1))),
      effectPower: levelStats.effect * (Number(modifiers.effectMultiplier) || 1)
    };
  }

  getDefenseSpecializationOptions(defense) {
    if (!defense?.id) return [];
    const options = EXPANSION?.defenseSpecializations?.[defense.id];
    return Array.isArray(options) ? options.slice(0, 2) : [];
  }

  getSpecializationTargetPriorities(specialization) {
    const traits = specialization?.traits || [];
    const priorities = [];
    traits.forEach(trait => {
      if (trait.includes('flying') || trait.includes('anti_air')) priorities.push('flying');
      if (trait.includes('artillery')) priorities.push('artillery');
      if (trait.includes('bulwark') || trait.includes('shield')) priorities.push('bulwark');
      if (trait.includes('splitter')) priorities.push('splitter');
      if (trait.includes('elite') || trait.includes('boss')) priorities.push('boss');
      if (trait.includes('heavy')) priorities.push('heavy');
      if (trait.includes('cluster') || trait.includes('swarm')) priorities.push('swarmer');
    });
    return [...new Set(priorities)];
  }

  chooseDefenseSpecialization(defense, specializationId) {
    if (!defense || defense.level < 2) return { ok: false, reason: 'level' };
    if (defense.specializationId) return { ok: false, reason: 'chosen' };
    const specialization = this.getDefenseSpecializationOptions(defense)
      .find(option => option.id === specializationId);
    if (!specialization) return { ok: false, reason: 'invalid' };
    defense.specializationId = specialization.id;
    defense.specializationName = specialization.name;
    defense.specializationTraits = (specialization.traits || []).slice();
    defense.targetPriorities = this.getSpecializationTargetPriorities(specialization);
    defense.pendingSpecialization = false;
    if (Number(specialization.modifiers?.mineCount) > 1) {
      defense.remainingCharges = Math.floor(Number(specialization.modifiers.mineCount));
    }
    this.applyDefenseLevelStats(defense, defense.level);
    return { ok: true, specialization, defense };
  }

  applyDefenseLevelStats(defense, requestedLevel) {
    if (!defense) return null;
    const typeData = TOWER_TYPES[defense.id] || {};
    const previousMaxHp = Math.max(1, Number(defense.maxHp) || Number(defense.baseMaxHp) || Number(typeData.hp) || 180);
    const previousHpRatio = Math.max(0, Math.min(1, (Number(defense.hp) || previousMaxHp) / previousMaxHp));
    const stats = this.getDefenseStatsAtLevel(defense, requestedLevel);

    defense.baseCost = Number.isFinite(defense.baseCost) ? Math.max(0, Math.floor(defense.baseCost)) : Math.max(0, Math.floor(Number(typeData.cost) || 0));
    defense.investedCost = Number.isFinite(defense.investedCost) ? Math.max(defense.baseCost, Math.floor(defense.investedCost)) : defense.baseCost;
    defense.baseDamage = Number.isFinite(defense.baseDamage) ? defense.baseDamage : (Number(typeData.damage) || 0);
    defense.baseFireRate = Number.isFinite(defense.baseFireRate) ? defense.baseFireRate : (Number(typeData.fireRate) || 0);
    defense.baseRange = Number.isFinite(defense.baseRange) ? defense.baseRange : (Number(typeData.range) || 0);
    defense.baseMaxHp = Number.isFinite(defense.baseMaxHp) ? defense.baseMaxHp : (Number(typeData.hp) || 180);
    defense.baseRadius = Number.isFinite(defense.baseRadius) ? defense.baseRadius : 18;
    defense.level = stats.level;
    defense.damage = stats.damage;
    defense.fireRate = stats.fireRate;
    defense.range = stats.range;
    defense.maxHp = stats.maxHp;
    defense.radius = stats.radius;
    defense.hp = Math.max(1, Math.round(stats.maxHp * previousHpRatio));
    defense.effectPower = stats.effectPower;
    return defense;
  }

  getDefenseUpgradeCost(defense) {
    if (!defense || defense.level >= DEFENSE_MAX_LEVEL) return null;
    const typeData = TOWER_TYPES[defense.id] || {};
    const baseCost = Number.isFinite(defense.baseCost) ? defense.baseCost : (Number(typeData.cost) || 0);
    return Math.ceil(baseCost * DEFENSE_UPGRADE_COST_MULTIPLIERS[defense.level]);
  }

  getDefenseSellValue(defense) {
    if (!defense) return 0;
    const typeData = TOWER_TYPES[defense.id] || {};
    const baseCost = Number.isFinite(defense.baseCost) ? defense.baseCost : (Number(typeData.cost) || 0);
    const investedCost = Number.isFinite(defense.investedCost) ? Math.max(baseCost, defense.investedCost) : baseCost;
    return Math.floor(investedCost * DEFENSE_SELL_RATIO);
  }

  upgradeDefense(defense) {
    if (!defense || !this.placedTowers.includes(defense)) return { ok: false, reason: 'missing' };
    const cost = this.getDefenseUpgradeCost(defense);
    if (cost === null) return { ok: false, reason: 'max' };
    if (this.coins < cost) return { ok: false, reason: 'coins', cost };

    this.coins -= cost;
    defense.investedCost = (Number.isFinite(defense.investedCost) ? defense.investedCost : defense.baseCost) + cost;
    this.applyDefenseLevelStats(defense, defense.level + 1);
    const specializationOptions = defense.level >= 2 && !defense.specializationId
      ? this.getDefenseSpecializationOptions(defense)
      : [];
    defense.pendingSpecialization = specializationOptions.length === 2;
    return {
      ok: true,
      cost,
      level: defense.level,
      requiresSpecialization: defense.pendingSpecialization,
      specializationOptions
    };
  }

  sellDefense(defense) {
    const index = this.placedTowers.indexOf(defense);
    if (!defense || index < 0) return { ok: false, reason: 'missing', refund: 0 };
    const refund = this.getDefenseSellValue(defense);
    this.placedTowers.splice(index, 1);
    this.coins += refund;
    if (this.selectedPlacedDefense === defense) this.selectedPlacedDefense = null;
    return { ok: true, refund };
  }

  findPlacedDefenseAt(x, y) {
    let nearest = null;
    let nearestDistance = Infinity;
    const view = this.getBattlefieldView();
    this.placedTowers.forEach(defense => {
      const distance = Math.hypot(defense.x - x, defense.y - y);
      const hitRadius = this.getDefenseHitRadius(defense, view);
      if (distance <= hitRadius && distance < nearestDistance) {
        nearest = defense;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  renderDefenseManagementModal(defense) {
    const title = document.getElementById('defense-management-title');
    const levelText = document.getElementById('defense-management-level');
    const statsContainer = document.getElementById('defense-management-stats');
    const investmentText = document.getElementById('defense-management-investment');
    const status = document.getElementById('defense-management-status');
    const upgradeButton = document.getElementById('btn-defense-upgrade');
    const sellButton = document.getElementById('btn-defense-sell');
    if (!title || !levelText || !statsContainer || !investmentText || !status || !upgradeButton || !sellButton) return;

    const isPassive = ['barrier', 'magnet', 'shrine'].includes(defense.type);
    const cadence = !isPassive && defense.fireRate > 0 ? `${(1000 / defense.fireRate).toFixed(2)} tirs/s` : 'Effet passif';
    const durability = defense.type === 'barrier' ? `${Math.round(defense.hp)} / ${defense.maxHp} HP` : `${defense.maxHp} HP`;
    const stats = [
      ['Dégâts', !isPassive && defense.damage > 0 ? `${Math.round(defense.damage * 100) / 100}` : '—'],
      ['Cadence', cadence],
      ['Portée', `${defense.range} px`],
      ['Durabilité', durability],
      ['Puissance auxiliaire', `×${defense.effectPower}`]
    ];

    title.textContent = defense.name;
    levelText.textContent = `Niveau ${defense.level} / ${DEFENSE_MAX_LEVEL}${defense.isStarter ? ' · Défense initiale' : ''}`;
    statsContainer.replaceChildren();
    stats.forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      statsContainer.appendChild(row);
    });
    const specializationSection = document.getElementById('defense-specialization-section');
    const specializationOptions = document.getElementById('defense-specialization-options');
    if (specializationSection && specializationOptions) {
      const options = this.getDefenseSpecializationOptions(defense);
      specializationSection.hidden = !(defense.level >= 2 && options.length === 2);
      specializationOptions.replaceChildren();
      if (defense.specializationId) {
        const selected = options.find(option => option.id === defense.specializationId);
        const label = document.createElement('p');
        label.textContent = `${selected?.name || defense.specializationName} — ${selected?.description || ''}`;
        specializationOptions.appendChild(label);
      } else if (defense.level >= 2) {
        options.forEach(option => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'btn-secondary';
          button.textContent = option.name;
          button.setAttribute('aria-label', `Spécialiser ${defense.name} : ${option.name}`);
          button.addEventListener('click', () => {
            if (!this.chooseDefenseSpecialization(defense, option.id).ok) return;
            this.showFeedback(`${defense.name} · ${option.name}`, '#a855f7');
            this.renderDefenseManagementModal(defense);
            this.updateHUD();
          });
          specializationOptions.appendChild(button);
        });
      }
    }
    investmentText.textContent = `Valeur investie : ${defense.investedCost} 🪙 · Revente : ${this.getDefenseSellValue(defense)} 🪙`;
    status.textContent = '';

    const upgradeCost = this.getDefenseUpgradeCost(defense);
    upgradeButton.disabled = upgradeCost === null || this.coins < upgradeCost;
    upgradeButton.textContent = upgradeCost === null ? 'NIVEAU MAXIMUM' : `AMÉLIORER (${upgradeCost} 🪙)`;
    upgradeButton.setAttribute('aria-label', upgradeCost === null
      ? `${defense.name}, niveau maximum atteint`
      : `Améliorer ${defense.name} au niveau ${defense.level + 1}, coût ${upgradeCost} Bio-Coins`);
    sellButton.textContent = `VENDRE (+${this.getDefenseSellValue(defense)} 🪙)`;
    sellButton.setAttribute('aria-label', `Vendre ${defense.name} et récupérer ${this.getDefenseSellValue(defense)} Bio-Coins`);
  }

  openDefenseManagementModal(defense) {
    const modal = document.getElementById('defense-management-modal');
    if (!modal || !defense || !this.placedTowers.includes(defense)) return;
    this.selectedPlacedDefense = defense;
    this.buildCursor.x = defense.x;
    this.buildCursor.y = defense.y;
    this.renderDefenseManagementModal(defense);
    this.openModal(modal);
    const upgradeButton = document.getElementById('btn-defense-upgrade');
    const sellButton = document.getElementById('btn-defense-sell');
    requestAnimationFrame(() => (upgradeButton?.disabled ? sellButton : upgradeButton)?.focus());
  }

  focusCanvasAfterDefenseAction() {
    requestAnimationFrame(() => {
      this.canvas?.focus({ preventScroll: true });
    });
  }

  handleDefenseUpgrade() {
    const defense = this.selectedPlacedDefense;
    const status = document.getElementById('defense-management-status');
    const result = this.upgradeDefense(defense);
    if (!result.ok) {
      const message = result.reason === 'coins'
        ? `Bio-Coins insuffisants : ${result.cost} requis.`
        : result.reason === 'max' ? 'Cette défense a déjà atteint le niveau maximum.' : 'Cette défense n’est plus disponible.';
      if (status) status.textContent = message;
      this.announce(message);
      return;
    }

    audio.playPickup();
    this.showFeedback(`${defense.name} améliorée au niveau ${result.level}`, '#10b981');
    this.updateHUD();
    if (result.requiresSpecialization) {
      this.renderDefenseManagementModal(defense);
      this.announce(`Choisissez une spécialisation pour ${defense.name}.`);
      return;
    }
    this.closeModal('defense-management-modal', false);
    this.selectedPlacedDefense = null;
    this.focusCanvasAfterDefenseAction();
  }

  handleDefenseSale() {
    const defense = this.selectedPlacedDefense;
    const defenseName = defense?.name || 'Défense';
    const result = this.sellDefense(defense);
    if (!result.ok) {
      const status = document.getElementById('defense-management-status');
      if (status) status.textContent = 'Cette défense n’est plus disponible.';
      this.announce('Cette défense n’est plus disponible.');
      return;
    }

    audio.playPickup();
    this.showFeedback(`${defenseName} vendue : +${result.refund} 🪙`, '#f59e0b');
    this.updateHUD();
    this.closeModal('defense-management-modal', false);
    this.focusCanvasAfterDefenseAction();
  }

  buildSelectedTowerAt(x, y) {
    if (this.isPaused || this.isGameOver) return;
    // The camera already maps the logical arena between the two HUD panels.
    // Reject only its actual world-space perimeter so mouse, touch and keyboard
    // placement all target the same collision coordinates at every zoom level.
    if (x < 24 || x > this.worldWidth - 24 || y < 24 || y > this.worldHeight - 24) {
      this.showFeedback('Placement impossible sous le HUD.', '#ef4444');
      return;
    }
    if (Math.hypot(this.citadel.x - x, this.citadel.y - y) < this.citadel.radius + 20) {
      this.showFeedback('Zone de Citadelle protégée.', '#ef4444');
      return;
    }
    if (this.placedTowers.some(tower => Math.hypot(tower.x - x, tower.y - y) < tower.radius + 24)) {
      this.showFeedback('Espace déjà occupé par une défense.', '#ef4444');
      return;
    }

    const towerType = this.selectedTowerToBuild;
    if (this.coins < towerType.cost) {
      audio.playHurtVoice();
      this.showFeedback(`Bio-Coins insuffisants : ${towerType.cost} requis.`, '#ef4444');
      return;
    }

    this.coins -= towerType.cost;
    audio.playPickup();

    this.placedTowers.push(this.createPlacedDefense(towerType, x, y));

    this.towersBuiltThisRun++;
    if (this.towersBuiltThisRun >= 10) this.unlockAchievement('builder');
    this.addFloatingText(`+1 ${towerType.name}`, x, y - 20, '#00f0ff');
    this.announce(`${towerType.name} construite. ${this.coins} Bio-Coins restants.`);
    this.updateHUD();
  }

  initWeapons() {
    this.weapons = JSON.parse(JSON.stringify(WEAPONS_DATA));
    const startWp = this.selectedHero.startingWeapon;
    if (this.weapons[startWp]) {
      this.weapons[startWp].level = 1;
    }
    this.updateWeaponsHUD();
  }

  startNewGame(options = {}) {
    const requestedDifficulty = options.difficulty || this.difficulty || 'standard';
    this.difficulty = DIFFICULTY_DATA[requestedDifficulty] ? requestedDifficulty : 'standard';
    const requestedCampaignId = options.campaignId || this.activeCampaignId || 'four_gates';
    this.activeCampaignId = CHARACTER_EXPANSION?.campaigns?.[requestedCampaignId]
      ? requestedCampaignId
      : 'four_gates';
    if (!options.preserveCheckpoint) this.clearRunCheckpoint();
    const requestedLayoutId = options.layoutId || this.selectedLayoutId || 'convergence';
    this.selectedLayoutId = EXPANSION?.worldLayouts?.[requestedLayoutId]
      ? requestedLayoutId
      : 'convergence';
    this.applyWorldLayout(this.selectedLayoutId, { force: true, repositionUnits: false });
    if (Array.isArray(options.rotation)) this.setMapRotation(options.rotation);
    if (!options.dailyChallenge && options.keepDaily !== true) {
      this.dailyChallenge = null;
      this.dailyRng = null;
      this.activeRunMutators = [];
    }
    this.resizeCanvas();
    this.citadel.maxHp = Math.round((500 + (this.shopUpgrades.hpBonus * 50)) * DIFFICULTY_DATA[this.difficulty].citadelHp);
    this.citadel.hp = this.citadel.maxHp;

    this.endlessMode = false;
    this.campaignVictory = false;
    this.campaignVictoryClaimed = false;
    this.activeBossHuntId = null;
    this.seenBossIntroIds = new Set();
    this.seenBossDefeatIds = new Set();
    this.pendingCinematics = [];
    this.activeCinematic = null;
    this.runtimeError = null;
    this.accessibilityStatusTimer = 0;
    this.threatReadoutTimer = 0;
    this.runElapsedSeconds = 0;
    this.runMetaCoinsEarned = 0;
    this.score = 0;
    this.coins = 400;
    this.xp = 0;
    this.level = 1;
    this.nextLevelXp = 100;
    this.pendingLevelChoices = 0;
    this.affinityXp = this.selectedHero.relationshipXp || 0;
    this.nextAffinityXp = this.getAffinityThreshold(this.selectedHero);
    this.frenzyMeter = 0;
    this.isOverdriveActive = false;
    this.overdriveTimer = 0;
    this.freezeTimer = 0;
    this.quadDamageTimer = 0;
    this.invincibleTimer = 0;
    this.abilityCooldownTimer = 0;
    this.activeHeroTargeting = null;
    this.hostileProjectileFreezeTimer = 0;
    this.heroUltimateDefenseDamageTimer = 0;
    this.spawnTimer = 0;
    this.weaponTimers = {};
    this.decoysDeployedCount = 0;
    this.towersBuiltThisRun = 0;
    this.evolvedWeaponsCount = 0;
    this.mutantsKilled = 0;
    this.overdriveCount = 0;
    this.kiraMarkedRoutes = new Set();
    this.nyxExposedRoutes = new Set();
    this.carmillaStoredCharge = 0;
    this.mircallaRetaliationCharge = 0;
    this.hanaPassiveChargeTimer = 0;
    this.hanaPassiveReady = false;
    this.lastTime = 0;
    this.animationClock = 0;
    this.heroAnimationState = 'idle';
    this.heroAnimationTimer = 0;
    this.heroFacingAngle = 0;
    this.isTowerMode = false;
    this.towerMutator = null;
    this.campaignStateBeforeTower = null;
    this.towerCompletionPending = false;
    this.towerCompletionEarnedReward = 0;
    this.pendingTowerMutator = null;
    this.pendingTowerMutatorFloor = null;
    this.selectedPlacedDefense = null;

    this.placedTowers = [];
    this.towerAnimationGhosts = [];
    this.mercenaries = [];
    this.petDrones = [];
    this.enemies = [];
    this.nextSpawnGateIndex = 0;
    SPAWN_GATE_SECTORS.forEach(side => { this.spawnGatePulses[side] = 0; });
    this.enemyBullets = [];
    this.projectiles = [];
    this.particles = [];
    this.decoys = [];
    this.crates = [];
    this.powerups = [];
    this.hazards = [];
    this.bossHazards = [];
    this.floatingTexts = [];

    this.configureWave(1);

    // Pre-spawn starter defenses and enemies so the arena immediately communicates
    // the core loop after the adult-content notice is accepted.
    const cx = this.citadel.x || (window.innerWidth / 2);
    const cy = this.citadel.y || (window.innerHeight / 2);
    const placeX = Math.max(35, Math.min(this.worldWidth - 35, cx + (cx < this.worldWidth / 2 ? 125 : -90)));

    this.placedTowers.push(this.createPlacedDefense(TOWER_TYPES.vulcan_turret, placeX, Math.max(35, cy - 90), { starter: true }));
    this.placedTowers.push(this.createPlacedDefense(TOWER_TYPES.flame_trap, placeX, Math.min(this.worldHeight - 35, cy + 90), { starter: true }));

    for (let i = 0; i < 4; i++) {
      this.spawnMutant();
    }

    this.initWeapons();
    this.updateHeroPresentation();

    this.isGameOver = false;
    this.isPaused = options.silent === true;
    const skillButton = document.getElementById('btn-hero-skill');
    if (skillButton) skillButton.disabled = false;

    this.checkGalleryUnlocks();
    this.updateHUD();
    if (!options.preserveCheckpoint) this.saveProgress();
  }

  getAdjustedWaveGroupCount(group) {
    let count = Math.max(
      1,
      Math.round((Number(group?.count) || 1) * this.getRunModifierProduct('groupCountMultiplier'))
    );
    if (group?.type === 'artillery') {
      count = Math.max(
        1,
        Math.round(count * this.getRunModifierProduct('artilleryCountMultiplier'))
      );
    }
    return count;
  }

  configureWave(number, options = {}) {
    this.wave = Math.max(1, Math.floor(number));
    if (this.nyxExposedRoutes instanceof Set) this.nyxExposedRoutes.clear();
    this.waveActive = true;
    this.waveIntermissionTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.bossSpawnedThisWave = false;
    this.waveRewardClaimed = false;
    this.spawnTimer = 0;
    this.waveSpawnElapsedMs = 0;
    this.lastWaveStatusSecond = null;
    this.placedTowers.forEach(defense => {
      defense.stunIgnoresRemaining = Math.max(
        0,
        Math.floor(Number(defense.stunIgnoresPerWave) || 0)
      );
    });
    this.isTowerMode = options.towerMode === true;
    this.towerMutator = options.mutator || null;
    if (this.isTowerMode) {
      this.towerMutators = Array.isArray(options.mutators)
        ? options.mutators.filter(Boolean)
        : (this.towerMutator ? [this.towerMutator] : this.towerMutators);
    }
    const baseTarget = 8 + (this.wave * 2);
    const hasSwarmMutator = this.getActiveRunMutators().some(mutator => ['swarm', 'long_march'].includes(mutator.id));
    this.waveSpawnTarget = Math.min(96, Math.round(baseTarget * (hasSwarmMutator ? 1.5 : 1)));
    this.waveSpawnQueue = this.buildWaveSpawnQueue(this.wave);
    this.preloadWaveCharacterBosses(this.waveSpawnQueue);
    if (this.waveSpawnQueue.length > 0) this.waveSpawnTarget = this.waveSpawnQueue.length;
    const nextWaveText = document.getElementById('mission-next-wave-txt');
    if (nextWaveText) {
      const groups = this.activeWaveDefinition?.groups || [];
      const previewHidden = this.getActiveRunMutators()
        .some(mutator => mutator.modifiers?.hiddenWavePreview === true);
      nextWaveText.textContent = previewHidden
        ? `Vague ${this.wave} · composition brouillée par le mutateur`
        : groups.length > 0
        ? `${this.activeWaveDefinition.name} · ${groups.map(group => `${this.getAdjustedWaveGroupCount(group)} ${EXPANSION.enemyDefinitions?.[group.type]?.name || group.type}`).join(' · ')}`
        : `Vague ${this.wave} · composition adaptative`;
    }
    this.updateLayoutDescription(this.selectedLayoutId);
    this.updateHUD();
  }

  buildWaveSpawnQueue(waveNumber = this.wave) {
    const finalWave = this.getCampaignFinalWave();
    if (this.isTowerMode || this.endlessMode || waveNumber > finalWave) {
      this.activeWaveDefinition = null;
      return [];
    }
    const waveScript = EXPANSION?.waveScripts?.siege_15;
    const authoredWaveNumber = this.activeCampaignId === 'ten_thrones'
      ? (((Math.max(1, waveNumber) - 1) % CAMPAIGN_FINAL_WAVE) + 1)
      : waveNumber;
    const waveDefinition = waveScript?.waves?.find(candidate => candidate.number === authoredWaveNumber);
    this.activeWaveDefinition = waveDefinition || null;
    if (!waveDefinition?.groups) return [];
    const routeCount = Math.max(1, this.spawnRoutes.length);
    const queue = [];
    waveDefinition.groups.forEach((group, groupIndex) => {
      const pattern = Array.isArray(group.routePattern) && group.routePattern.length > 0
        ? group.routePattern
        : [groupIndex];
      const adjustedCount = this.getAdjustedWaveGroupCount(group);
      for (let index = 0; index < adjustedCount; index++) {
        const routeIndex = Math.abs(Number(pattern[index % pattern.length]) || 0) % routeCount;
        queue.push({
          type: group.type,
          routeIndex,
          atMs: Math.max(0, Number(group.delayMs) || 0)
            + (index * Math.max(1, Number(group.intervalMs) || 1))
            + (this.spawnRoutes[routeIndex]?.cadenceOffsetMs || 0)
        });
      }
    });
    const historicBossTypes = { 5: 'vespera', 10: 'carmilla', 15: 'leviathan' };
    const campaign = this.getCampaignDefinition();
    const bossSchedule = campaign?.bossSchedule;
    const scheduledBossEntry = Array.isArray(bossSchedule)
      ? bossSchedule.find(entry => Number(entry.wave) === Number(waveNumber))
      : null;
    const scheduledBoss = scheduledBossEntry?.bossId || bossSchedule?.[waveNumber];
    const bossType = campaign ? scheduledBoss : historicBossTypes[waveNumber];
    if (bossType) {
      const lastAtMs = queue.reduce((maximum, entry) => Math.max(maximum, entry.atMs), 0);
      const bossRouteIndex = scheduledBossEntry?.routePolicy === 'farthest'
        ? routeCount - 1
        : (waveNumber === 10 && !campaign ? Math.min(1, routeCount - 1) : 0);
      queue.push({
        type: bossType,
        routeIndex: bossRouteIndex,
        atMs: lastAtMs + 1600,
        boss: true
      });
    }
    return queue.sort((left, right) => left.atMs - right.atMs);
  }

  completeWave() {
    if (this.waveRewardClaimed || !this.waveActive) return;
    this.waveRewardClaimed = true;
    this.waveActive = false;
    this.waveIntermissionTimer = 3.5;
    const rewardMultiplier = DIFFICULTY_DATA[this.difficulty]?.reward || 1;
    const isBossHunt = !this.isTowerMode && Boolean(this.activeBossHuntId);
    const runReward = isBossHunt
      ? 0
      : Math.round((25 + (this.wave * 5)) * rewardMultiplier);
    const metaReward = isBossHunt
      ? 0
      : Math.round((8 + (this.wave * 2)) * rewardMultiplier);
    this.coins += runReward;
    this.metaCoins += metaReward;
    this.runMetaCoinsEarned += metaReward;
    this.totalCoinsEarned += runReward;
    if (!isBossHunt) this.score += this.wave * 100;
    if (!this.isTowerMode && !isBossHunt) {
      this.bestWave = Math.max(this.bestWave, this.wave);
      this.bestScore = Math.max(this.bestScore, this.score);
    }
    this.showFeedback(
      isBossHunt
        ? `Chasse de la vague ${this.wave} sécurisée · seules les récompenses propres au Trône sont conservées`
        : `Vague ${this.wave} sécurisée : +${runReward} 🪙 et +${metaReward} ◆`,
      '#10b981'
    );
    if (!this.isTowerMode && !isBossHunt && this.wave >= 5) this.unlockAchievement('wave_5');
    if (!this.isTowerMode && !isBossHunt && this.wave >= 10) this.unlockAchievement('wave_10');
    if (!this.isTowerMode && !isBossHunt && this.activeCampaignId === 'ten_thrones') {
      Object.values(HERO_CLASSES).forEach(hero => {
        if (
          hero.unlocked === false
          && hero.unlockRule?.type === 'wave_cleared'
          && this.wave >= Number(hero.unlockRule.threshold)
        ) {
          hero.unlocked = true;
          this.unlockGalleryItem(hero.id);
          this.showFeedback(`${hero.name} rejoint la Salle de Commandement.`, '#00f0ff');
        }
      });
    }
    if (isBossHunt) {
      const huntedBoss = this.getBossDefinition(this.activeBossHuntId);
      this.activeBossHuntId = null;
      this.waveIntermissionTimer = 0;
      this.clearRunCheckpoint();
      this.saveProgress();
      this.updateHUD();
      this.openAntagonistCodex();
      this.announce(
        `Chasse terminée contre ${huntedBoss?.name || 'le Trône'}. `
        + 'Aucune récompense de fin de campagne ni point de contrôle n’a été accordé.'
      );
      return;
    }
    if (this.isTowerMode) {
      if (this.towerFloor >= 100) {
        const towerAchievement = ACHIEVEMENTS.find(item => item.id === 'tower_100');
        this.towerCompletionEarnedReward = towerAchievement && !towerAchievement.unlocked
          ? towerAchievement.reward
          : 0;
        this.towerCompleted = true;
        this.towerCompletionPending = true;
        this.unlockAchievement('tower_100');
        this.showFeedback('Tour Infinitum maîtrisée : étage 100 sécurisé.', '#f59e0b');
      } else {
        this.towerFloor++;
      }
    }
    if (!this.isTowerMode && !this.endlessMode && this.wave >= this.getCampaignFinalWave()) {
      this.triggerCampaignVictory();
      return;
    }
    if (!this.isTowerMode && !this.endlessMode && !this.dailyChallenge) this.saveRunCheckpoint();
    this.saveProgress();
    this.updateHUD();
  }

  advanceWave() {
    if (this.isTowerMode) {
      const completedFloor = this.wave;
      const reachedCheckpoint = completedFloor % 10 === 0 || completedFloor >= 100;
      if (!reachedCheckpoint) {
        const nextFloor = completedFloor + 1;
        this.infinitumCanReturn = false;
        this.configureWave(nextFloor, {
          towerMode: true,
          mutators: this.towerMutators
        });
        this.showFeedback(`Ascension continue · étage ${nextFloor}`, '#a855f7');
        this.updateInfinitumProgress();
        return;
      }

      const state = this.campaignStateBeforeTower;
      const returnWave = Math.max(1, state?.wave || 1);
      this.infinitumCanReturn = true;
      if (state) {
        this.wave = state.wave;
        this.waveActive = state.waveActive;
        this.waveIntermissionTimer = state.waveIntermissionTimer;
        this.enemiesSpawnedThisWave = state.enemiesSpawnedThisWave;
        this.waveSpawnTarget = state.waveSpawnTarget;
        this.bossSpawnedThisWave = state.bossSpawnedThisWave;
        this.waveRewardClaimed = state.waveRewardClaimed;
        this.spawnTimer = state.spawnTimer;
        this.waveSpawnQueue = state.waveSpawnQueue || [];
        this.waveSpawnElapsedMs = state.waveSpawnElapsedMs || 0;
        this.activeWaveDefinition = state.activeWaveDefinition || null;
        this.enemies = state.enemies;
        this.enemyBullets = state.enemyBullets;
        this.projectiles = state.projectiles;
        this.particles = state.particles;
        this.floatingTexts = state.floatingTexts;
        this.decoys = state.decoys;
        this.crates = state.crates;
        this.powerups = state.powerups;
        this.hazards = state.hazards;
        this.bossHazards = state.bossHazards || [];
        this.isTowerMode = false;
        this.towerMutator = null;
        this.lastWaveStatusSecond = null;
        this.updateHUD();
      } else {
        this.configureWave(returnWave);
      }
      this.campaignStateBeforeTower = null;
      this.showFeedback(`Palier ${completedFloor} sécurisé. Retour au QG autorisé.`, '#a855f7');
      this.updateInfinitumProgress();
      if (this.towerCompletionPending) {
        this.towerCompletionPending = false;
        this.triggerTowerCompletion();
      }
      return;
    }
    const nextWave = this.wave + 1;
    this.rotateWorldLayoutBetweenWaves();
    this.configureWave(nextWave);
    this.showFeedback(`Vague ${nextWave} engagée`, '#00f0ff');
  }

  triggerCampaignVictory() {
    if (this.campaignVictoryClaimed) return;
    this.campaignVictoryClaimed = true;
    this.campaignVictory = true;
    this.waveIntermissionTimer = 0;
    this.clearRunCheckpoint();
    const campaignDefinition = this.getCampaignDefinition();
    const completionRewards = campaignDefinition?.completionRewards || {};
    this.score += Math.max(0, Math.floor(Number(completionRewards.score) || 0));
    const campaignMetaReward = Math.max(
      0,
      Math.floor(Number(completionRewards.metaCoins) || 0)
    );
    this.metaCoins += campaignMetaReward;
    this.runMetaCoinsEarned += campaignMetaReward;
    const conclusionGalleryId = typeof completionRewards.galleryItemId === 'string'
      ? completionRewards.galleryItemId
      : '';
    if (conclusionGalleryId) this.unlockGalleryItem(conclusionGalleryId);
    const finalScoreMultiplier = (Number(this.dailyChallenge?.rules?.scoreMultiplier) || 1)
      * this.getRunModifierProduct('completionScoreMultiplier');
    this.score = Math.max(0, Math.round(this.score * finalScoreMultiplier));
    this.bestScore = Math.max(this.bestScore, this.score);
    const finalWave = this.getCampaignFinalWave();
    this.bestWave = Math.max(this.bestWave, finalWave);
    this.campaignCompletions++;
    this.unlockAchievement('campaign_clear');

    const difficulty = DIFFICULTY_DATA[this.difficulty] || DIFFICULTY_DATA.standard;
    const setSummaryText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };
    setSummaryText('victory-wave-txt', `${finalWave} / ${finalWave}`);
    setSummaryText('victory-kills-txt', this.mutantsKilled);
    setSummaryText('victory-score-txt', this.score);
    setSummaryText('victory-time-txt', this.formatRunTime());
    setSummaryText('victory-meta-txt', `${this.runMetaCoinsEarned} ◆`);
    setSummaryText('victory-difficulty-txt', difficulty.name);
    const victoryTitle = document.getElementById('victory-title');
    const victoryDescription = document.getElementById('victory-description');
    if (victoryTitle) {
      victoryTitle.textContent = campaignDefinition
        ? `${campaignDefinition.finalBossName || 'LE DIXIÈME TRÔNE'} EST NEUTRALISÉE`
        : 'LE LÉVIATHAN EST NEUTRALISÉ';
    }
    if (victoryDescription) {
      victoryDescription.textContent = campaignDefinition
        ? `${campaignDefinition.name} est achevée. Les dix assauts ont été lus, contrés et consignés dans le Codex de Haven.`
        : 'La guerre des Quatre Portes est achevée. Haven survit au Titan Léviathan et reprend le contrôle de ses remparts.';
    }
    const ending = document.getElementById('victory-ending-copy');
    if (ending) {
      ending.textContent = this.selectedHero.romanceOptIn && this.selectedHero.privateMomentUnlocked
        ? `${this.selectedHero.name} vous retrouve au sommet de Haven. Vos limites et votre signal d’arrêt sont confirmés une dernière fois ; la porte se referme sur un baiser choisi, puis l’épilogue se fond au noir.`
        : `${this.selectedHero.name} vous rejoint au sommet de Haven. Votre victoire scelle une confiance entre égales, sans transformer le pacte militaire en promesse romantique.`;
    }
    this.recordRunHistory({ victory: true });
    this.saveProgress();
    this.openModal('victory-modal');
    const finalBossName = campaignDefinition?.finalBossName || 'Titan Léviathan';
    this.announce(`Campagne ${this.getCampaignDisplayName()} terminée. Haven est sauvée et ${finalBossName} neutralisée.`);
  }

  continueEndlessMode() {
    if (!this.campaignVictory) return;
    this.endlessMode = true;
    this.campaignVictory = false;
    this.closeModal('victory-modal', false);
    this.configureWave(this.getCampaignFinalWave() + 1);
    this.showFeedback('Mode infini engagé · les vagues n’ont plus de limite.', '#f59e0b');
    this.saveProgress();
    this.focusBattlefield();
  }

  triggerTowerCompletion() {
    const modal = document.getElementById('tower-complete-modal');
    if (!modal) return;
    const time = document.getElementById('tower-complete-time-txt');
    const score = document.getElementById('tower-complete-score-txt');
    const reward = document.getElementById('tower-complete-reward-txt');
    const description = document.getElementById('tower-complete-description');
    if (time) time.textContent = this.formatRunTime();
    if (score) score.textContent = this.score;
    if (reward) {
      reward.textContent = this.towerCompletionEarnedReward > 0
        ? `${this.towerCompletionEarnedReward} ◆`
        : 'Déjà obtenue';
    }
    if (description) {
      description.textContent = this.towerCompletionEarnedReward > 0
        ? 'La Tour reconnaît votre première maîtrise. Le mutateur final s’effondre et la récompense permanente rejoint l’Armurerie.'
        : 'Les cent étages sont de nouveau sécurisés. La prime de maîtrise est unique ; aucun Crédit Haven supplémentaire n’est attribué.';
    }
    this.openModal(modal);
    this.announce('Tour Infinitum terminée. Les cent étages sont sécurisés.');
  }

  getAffinityThreshold(hero = this.selectedHero) {
    if (!hero || hero.affinityLvl >= 5) return 1;
    return 40 + ((hero.affinityLvl - 1) * 30);
  }

  syncSelectedHeroAffinity() {
    this.affinityXp = this.selectedHero.relationshipXp || 0;
    this.nextAffinityXp = this.getAffinityThreshold(this.selectedHero);
  }

  gainAffinity(amount) {
    this.gainHeroAffinity(this.selectedHero, amount);
  }

  gainHeroAffinity(hero, amount) {
    if (!hero || hero.affinityLvl >= 5) return;
    hero.relationshipXp = (hero.relationshipXp || 0) + amount;
    let threshold = this.getAffinityThreshold(hero);
    let rankChanged = false;
    while (hero.relationshipXp >= threshold && hero.affinityLvl < 5) {
      hero.relationshipXp -= threshold;
      hero.affinityLvl++;
      rankChanged = true;
      this.showFeedback(`Confiance avec ${hero.name} : rang ${hero.affinityLvl}`, '#ec4899');
      if (hero.affinityLvl >= 2) this.unlockAchievement('harem_lover');
      threshold = this.getAffinityThreshold(hero);
    }
    if (hero === this.selectedHero) this.syncSelectedHeroAffinity();
    if (rankChanged) this.saveProgress();
  }

  gameLoop(timestamp) {
    try {
      if (this.runtimeError) return;
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;
      this.refreshGamepadStatus(false);
      this.updateGamepadControls(dt);

      const timeScale = this.isOverdriveActive ? 0.7 : 1.0;

      if (!this.isPaused && !this.requiresPortraitOrientation && !this.isGameOver && !this.campaignVictory) {
        this.update(dt * timeScale);
      }
      const shouldRender = !document.hidden
        && (!this.isPaused || (timestamp - this.lastPausedRenderTime) >= 250);
      if (shouldRender) {
        this.render();
        if (this.isPaused) this.lastPausedRenderTime = timestamp;
      }
    } catch (error) {
      this.handleRuntimeError(error);
    } finally {
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  update(dt) {
    this.runElapsedSeconds += dt;
    this.animationClock += dt;
    const citadelDrain = this.getRunModifierMaximum('citadelHpDrainPerSecond');
    if (citadelDrain > 0 && this.invincibleTimer <= 0 && !this.isOverdriveActive) {
      this.citadel.hp -= citadelDrain * dt;
    }
    if (this.heroAnimationTimer > 0) {
      this.heroAnimationTimer -= dt;
      if (this.heroAnimationTimer <= 0) {
        this.heroAnimationTimer = 0;
        this.heroAnimationState = 'idle';
      }
    }
    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.quadDamageTimer > 0) this.quadDamageTimer -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.hostileProjectileFreezeTimer > 0) this.hostileProjectileFreezeTimer -= dt;
    if (this.heroUltimateDefenseDamageTimer > 0) this.heroUltimateDefenseDamageTimer -= dt;
    if (this.selectedHero?.id === 'hana') {
      const chargeMs = Number(this.getHeroKit('hana')?.passive?.modifiers?.idleChargeMs) || 2200;
      this.hanaPassiveChargeTimer += dt;
      if (this.hanaPassiveChargeTimer >= chargeMs / 1000) this.hanaPassiveReady = true;
    }
    if (this.selectedHero?.id === 'aurelia') {
      const modifiers = this.getHeroKit('aurelia')?.passive?.modifiers || {};
      const threshold = Number(modifiers.healthThreshold) || 0.7;
      const regeneration = Number(modifiers.regenerationPerSecond) || 4;
      this.placedTowers.forEach(defense => {
        if (defense.hp / Math.max(1, defense.maxHp) > threshold) return;
        defense.hp = Math.min(defense.maxHp, defense.hp + (regeneration * dt));
      });
    }
    if (this.selectedHero?.id === 'isolde') {
      const modifiers = this.getHeroKit('isolde')?.passive?.modifiers || {};
      this.enemies.forEach(enemy => {
        const isElite = enemy.isBoss || SPECIALIST_ENEMY_TYPES.includes(enemy.type);
        if (!isElite || enemy.hp / Math.max(1, enemy.maxHp) > Number(modifiers.healthThreshold || 0.5)) return;
        enemy.damageDebuffMultiplier = Math.min(
          Number(enemy.damageDebuffMultiplier) || 1,
          Number(modifiers.enemyDamageMultiplier) || 0.78
        );
        enemy.damageDebuffTimer = Math.max(Number(enemy.damageDebuffTimer) || 0, 0.25);
      });
    }

    if (this.abilityCooldownTimer > 0) {
      this.abilityCooldownTimer -= dt;
      if (this.abilityCooldownTimer <= 0) {
        this.abilityCooldownTimer = 0;
        const btn = document.getElementById('btn-hero-skill');
        if (btn) {
          btn.disabled = false;
          btn.setAttribute('aria-label', `${this.selectedHero.abilityName}, prêt`);
        }
        this.announce(`${this.selectedHero.abilityName} est de nouveau prête.`);
      } else {
        const btn = document.getElementById('btn-hero-skill');
        if (btn) {
          btn.disabled = true;
          btn.setAttribute('aria-label', `${this.selectedHero.abilityName}, recharge ${Math.ceil(this.abilityCooldownTimer)} secondes`);
        }
      }
    }

    if (this.isOverdriveActive) {
      this.overdriveTimer -= dt;
      if (this.overdriveTimer <= 0) {
        this.isOverdriveActive = false;
        this.frenzyMeter = 0;
        this.updateHUD();
      }
    }

    this.updateTurrets(dt);
    this.updatePlacedTowers(dt);
    this.updateTowerAnimationGhosts(dt);
    this.updateMercenaries(dt);
    this.updatePetDrones(dt);
    this.updateSpawns(dt);
    this.updateProjectiles(dt);
    this.updateEnemyBullets(dt);
    this.updateEnemies(dt);
    this.updateDecoys(dt);
    this.updateHazards(dt);
    this.updateBossHazards(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateCrates(dt);
    this.updatePowerups(dt);
    this.accessibilityStatusTimer -= dt;
    if (this.accessibilityStatusTimer <= 0) {
      this.updateAccessibleBattlefieldStatus();
      this.accessibilityStatusTimer = 4;
    }
    this.threatReadoutTimer -= dt;
    if (this.threatReadoutTimer <= 0) {
      this.updateThreatReadout();
      this.threatReadoutTimer = 1;
    }

    if (this.citadel.hp <= 0 && this.invincibleTimer <= 0) {
      this.triggerGameOver();
    }
  }

  updateAccessibleBattlefieldStatus() {
    const status = document.getElementById('battlefield-status');
    if (!status) return;
    if (!this.enemies.length) {
      status.textContent = this.waveActive
        ? `Vague ${this.wave}. Aucune menace actuellement sur le champ.`
        : `Vague ${this.wave} sécurisée.`;
      return;
    }
    const nearest = this.enemies.reduce((closest, enemy) => {
      const distance = Math.hypot(enemy.x - this.citadel.x, enemy.y - this.citadel.y);
      return !closest || distance < closest.distance ? { enemy, distance } : closest;
    }, null);
    const angle = Math.atan2(nearest.enemy.y - this.citadel.y, nearest.enemy.x - this.citadel.x);
    const sectors = ['est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest', 'nord', 'nord-est'];
    const sectorIndex = Math.round(((angle + (Math.PI * 2)) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
    const bossWarning = nearest.enemy.isBoss ? ` Boss ${nearest.enemy.name}.` : '';
    const effectiveSpeed = nearest.enemy.speed
      * (nearest.enemy.slowTimer > 0 ? (nearest.enemy.slowSpeedMultiplier || 0.45) : 1);
    const remainingDistance = Math.max(0, nearest.distance - this.citadel.radius - nearest.enemy.radius);
    const eta = Math.ceil(remainingDistance / Math.max(1, effectiveSpeed));
    status.textContent = `Vague ${this.wave}. ${this.enemies.length} menaces.${bossWarning} Contact estimé dans ${eta} secondes, secteur ${sectors[sectorIndex]}. Citadelle ${Math.max(0, Math.round(this.citadel.hp))} points de vie.`;
  }

  updateThreatReadout() {
    const readout = document.getElementById('mission-threat-txt');
    if (!readout) return;
    if (!this.enemies.length) {
      readout.textContent = this.waveActive ? 'Approches · en observation' : 'Approches · sécurisées';
      readout.dataset.state = 'calm';
      return;
    }

    const nearest = this.enemies.reduce((closest, enemy) => {
      const distance = Math.hypot(enemy.x - this.citadel.x, enemy.y - this.citadel.y);
      return !closest || distance < closest.distance ? { enemy, distance } : closest;
    }, null);
    const sectorLabels = { north: 'nord', east: 'est', south: 'sud', west: 'ouest' };
    const effectiveSpeed = nearest.enemy.speed
      * (nearest.enemy.slowTimer > 0 ? (nearest.enemy.slowSpeedMultiplier || 0.45) : 1);
    const remainingDistance = Math.max(
      0,
      nearest.distance - this.citadel.radius - nearest.enemy.radius
    );
    const eta = Math.ceil(remainingDistance / Math.max(1, effectiveSpeed));
    const sector = sectorLabels[nearest.enemy.spawnSide] || 'multiple';
    readout.textContent = `${nearest.enemy.isBoss ? 'BOSS' : 'Approche'} · ${this.enemies.length} · ${sector} · ${eta} s`;
    readout.dataset.state = nearest.enemy.isBoss ? 'boss' : 'approach';
  }

  updateMercenaries(dt) {
    this.mercenaries.forEach((m, index) => {
      m.angle = Number.isFinite(m.angle) ? m.angle + (dt * 0.42) : (index * ((Math.PI * 2) / 3));
      const patrolRadius = 125 + (index * 22);
      m.x = this.citadel.x + Math.cos(m.angle) * patrolRadius;
      m.y = this.citadel.y + Math.sin(m.angle) * patrolRadius;
      m.timer += dt * 1000;
      if (m.timer >= m.fireRate) {
        const target = this.findTarget(m.x, m.y, m.range);
        if (target) {
          audio.playShoot();
          const angle = Math.atan2(target.y - m.y, target.x - m.x);
          [-0.055, 0.055].forEach(spread => {
            this.projectiles.push({
              x: m.x, y: m.y,
              vx: Math.cos(angle + spread) * 700, vy: Math.sin(angle + spread) * 700,
              damage: m.damage, color: '#f59e0b', radius: 4, type: 'bullet'
            });
          });
          m.timer -= m.fireRate;
        }
      }
    });
  }

  updatePetDrones(dt) {
    this.petDrones.forEach((d) => {
      d.angle += dt * 1.5;
      d.x = this.citadel.x + Math.cos(d.angle) * 90;
      d.y = this.citadel.y + Math.sin(d.angle) * 90;

      d.timer += dt * 1000;
      const fireRate = Number(d.fireRate) || 400;
      if (d.timer >= fireRate) {
        const target = this.findTarget(d.x, d.y, 250);
        if (target) {
          audio.playPlasma();
          const angle = Math.atan2(target.y - d.y, target.x - d.x);
          this.projectiles.push({
            x: d.x, y: d.y,
            vx: Math.cos(angle) * 550, vy: Math.sin(angle) * 550,
            damage: Number(d.damage) || 25, color: '#ec4899', radius: 5, type: 'bullet'
          });
          d.timer -= fireRate;
        }
      }
    });
  }

  updateTurrets(dt) {
    Object.values(this.weapons).forEach(wp => {
      if (wp.level <= 0) return;

      if (!this.weaponTimers[wp.id]) this.weaponTimers[wp.id] = 0;
      const fireMultiplier = (this.isOverdriveActive ? 3.0 : 1.0) * (this.quadDamageTimer > 0 ? 1.5 : 1.0);
      this.weaponTimers[wp.id] += dt * 1000 * fireMultiplier;

      const rateBonus = Math.min(0.65, this.shopUpgrades.fireRateBonus * 0.05);
      const rate = Math.max(60, wp.fireRate * (1 - rateBonus));

      if (this.weaponTimers[wp.id] >= rate) {
        const target = this.findTarget(this.citadel.x, this.citadel.y, wp.range);
        if (target) {
          this.fireWeapon(wp, target);
          this.weaponTimers[wp.id] = 0;
        }
      }
    });
  }

  updatePlacedTowers(dt) {
    for (let i = this.placedTowers.length - 1; i >= 0; i--) {
      const t = this.placedTowers[i];
      if (t.ultimateInvulnerableTimer > 0) {
        t.ultimateInvulnerableTimer = Math.max(0, t.ultimateInvulnerableTimer - dt);
      }
      const specialization = this.getDefenseSpecializationOptions(t)
        .find(option => option.id === t.specializationId);
      const durabilityDrain = this.getRunModifierMaximum('defenseHpDrainPerSecond')
        + (Number(specialization?.modifiers?.selfDamagePerSecond) || 0);
      if (durabilityDrain > 0 && !(t.ultimateInvulnerableTimer > 0)) {
        t.hp -= durabilityDrain * dt;
        if (t.hp <= 0) {
          this.placedTowers.splice(i, 1);
          this.showFeedback(`${t.name} s’est désintégrée sous la surcharge.`, '#ef4444');
          continue;
        }
      }
      const regeneration = Number(specialization?.modifiers?.regenerationPerSecond) || 0;
      if (regeneration > 0 && t.hp < t.maxHp) {
        t.hp = Math.min(t.maxHp, t.hp + (regeneration * dt));
      }
      const auraSlowMultiplier = Number(specialization?.modifiers?.auraSlowMultiplier) || 0;
      if (auraSlowMultiplier > 0) {
        const auraRadius = t.range * (Number(specialization?.modifiers?.auraRadiusMultiplier) || 1);
        this.getEnemiesInRange(t.x, t.y, auraRadius, t).forEach(enemy => {
          enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.25);
          enemy.slowSpeedMultiplier = Math.min(
            Number(enemy.slowSpeedMultiplier) || 1,
            auraSlowMultiplier
          );
        });
      }
      const pulseCooldownMs = Number(specialization?.modifiers?.pulseCooldownMs) || 0;
      if (pulseCooldownMs > 0) {
        t.controlPulseTimer = Math.max(0, (Number(t.controlPulseTimer) || 0) - (dt * 1000));
        if (t.controlPulseTimer <= 0) {
          t.controlPulseTimer = pulseCooldownMs;
          const pushDistance = Number(specialization?.modifiers?.enemyPushDistance) || 0;
          this.getEnemiesInRange(t.x, t.y, t.range, t).forEach(enemy => {
            const pushAngle = Math.atan2(enemy.y - t.y, enemy.x - t.x);
            enemy.x += Math.cos(pushAngle) * pushDistance;
            enemy.y += Math.sin(pushAngle) * pushDistance;
          });
          const deflectChance = Number(specialization?.modifiers?.projectileDeflectChance) || 0;
          for (let bulletIndex = this.enemyBullets.length - 1; bulletIndex >= 0; bulletIndex--) {
            const bullet = this.enemyBullets[bulletIndex];
            if (
              Math.hypot(bullet.x - t.x, bullet.y - t.y) <= t.range
              && this.getRunRandom() < deflectChance
            ) {
              this.enemyBullets.splice(bulletIndex, 1);
            }
          }
          this.particles.push({
            type: 'gravity_ring',
            x: t.x,
            y: t.y,
            radius: t.range,
            life: 0.3,
            color: '#67e8f9'
          });
        }
      }
      if (t.abilityBuffTimer > 0) {
        t.abilityBuffTimer -= dt;
        if (t.abilityBuffTimer <= 0) {
          t.abilityBuffTimer = 0;
          this.applyDefenseLevelStats(t, t.level);
        }
      }
      if (t.imperialBuffTimer > 0) {
        t.imperialBuffTimer = Math.max(0, t.imperialBuffTimer - dt);
        if (t.imperialBuffTimer <= 0) t.imperialDamageMultiplier = 1;
      }
      if (t.mindControlledTimer > 0) {
        t.mindControlledTimer = Math.max(0, t.mindControlledTimer - dt);
        t.mindControlPulseTimer = Math.max(0, (Number(t.mindControlPulseTimer) || 0) - dt);
        if (t.mindControlPulseTimer <= 0) {
          t.mindControlPulseTimer = 0.8;
          const allyTarget = this.placedTowers
            .filter(candidate => candidate !== t)
            .sort((left, right) => (
              Math.hypot(left.x - t.x, left.y - t.y)
              - Math.hypot(right.x - t.x, right.y - t.y)
            ))[0];
          if (allyTarget && allyTarget.ultimateInvulnerableTimer <= 0) {
            const betrayalDamage = Math.max(8, Math.round((Number(t.damage) || 18) * 0.32));
            allyTarget.hp -= betrayalDamage;
            this.addFloatingText(`EMPRISE -${betrayalDamage}`, allyTarget.x, allyTarget.y - 28, '#a855f7');
            if (allyTarget.hp <= 0) {
              const allyIndex = this.placedTowers.indexOf(allyTarget);
              if (allyIndex >= 0) this.placedTowers.splice(allyIndex, 1);
              this.showFeedback(`${allyTarget.name} détruite sous l’emprise de Noctis.`, '#a855f7');
            }
          } else if (!this.isOverdriveActive && this.invincibleTimer <= 0) {
            this.citadel.hp -= 8;
            this.addFloatingText('EMPRISE -8', this.citadel.x, this.citadel.y - 30, '#a855f7');
          }
        }
        t.animationTimer = Math.max(t.animationTimer || 0, 0.12);
        continue;
      }
      if (t.disabledTimer > 0) {
        t.disabledTimer = Math.max(0, t.disabledTimer - dt);
        t.animationTimer = Math.max(t.animationTimer || 0, 0.12);
        continue;
      }
      if (t.animationTimer > 0) t.animationTimer = Math.max(0, t.animationTimer - dt);
      if (t.type === 'mine' || t.type === 'napalm') {
        if (t.rearmTimer > 0) {
          t.rearmTimer = Math.max(0, t.rearmTimer - dt);
          continue;
        }
        if (!Number.isFinite(t.remainingCharges)) {
          t.remainingCharges = Math.max(1, Math.floor(Number(specialization?.modifiers?.mineCount) || 1));
        }
        const triggerRadius = t.range
          * (Number(specialization?.modifiers?.triggerRadiusMultiplier) || 1);
        const trigger = this.findTarget(t.x, t.y, triggerRadius, t);
        if (trigger) {
          audio.playExplosion();
          const explosionRadius = t.type === 'napalm'
            ? 90 * (Number(specialization?.modifiers?.fireRadiusMultiplier) || 1)
            : 65 * (Number(specialization?.modifiers?.splashRadiusMultiplier) || 1);
          if (t.type === 'napalm') {
            this.hazards.push({
              x: t.x,
              y: t.y,
              radius: explosionRadius,
              damage: 18 * (t.effectPower || 1),
              life: 5 * (Number(specialization?.modifiers?.burnDurationMultiplier) || 1),
              tickTimer: 0,
              color: '#f97316',
              sourceDefense: t
            });
          }
          // Gameplay resolves immediately; this short visual clone lets the
          // authored trigger and cooldown frames complete without double damage.
          this.towerAnimationGhosts.push({ ...t, animationTimer: 0.34, visualLife: 0.34 });
          this.createExplosion(t.x, t.y, explosionRadius, t.damage, {
            groundOnly: true,
            sourceDefense: t
          });
          t.remainingCharges--;
          if (t.remainingCharges <= 0) this.placedTowers.splice(i, 1);
          else t.rearmTimer = 0.9;
        }
        continue;
      }
      if (t.type === 'barrier' || t.type === 'magnet' || t.type === 'shrine') continue;

      t.timer += dt * 1000 * (this.quadDamageTimer > 0 ? 1.5 : 1);
      const rateBonus = Math.min(0.65, this.shopUpgrades.fireRateBonus * 0.05);
      const effectiveRate = Math.max(
        70,
        t.fireRate
          * (1 - rateBonus)
          * this.getRunModifierProduct('defenseFireRateMultiplier')
          * this.getDefenseAuraModifiers(t).fireRateMultiplier
      );
      if (t.timer >= effectiveRate) {
        const target = this.findTarget(t.x, t.y, t.range, t);
        if (target) {
          this.fireTower(t, target);
          t.timer = 0;
        }
      }
    }
  }

  updateTowerAnimationGhosts(dt) {
    for (let i = this.towerAnimationGhosts.length - 1; i >= 0; i--) {
      const ghost = this.towerAnimationGhosts[i];
      ghost.visualLife -= dt;
      ghost.animationTimer = Math.max(0, ghost.visualLife);
      if (ghost.visualLife <= 0) this.towerAnimationGhosts.splice(i, 1);
    }
  }

  handleRuntimeError(error) {
    this.runtimeError = error instanceof Error ? error : new Error(String(error));
    this.isPaused = true;
    const message = document.getElementById('runtime-error-message');
    if (message) message.textContent = `La partie a été mise en pause : ${this.runtimeError.message}`;
    console.error('Infernal City runtime error:', this.runtimeError);
    this.saveProgress();
    if (this.hasEnteredAdultExperience) this.openModal('runtime-error-modal');
    this.announce('Erreur du système de combat. La partie est en pause.');
  }

  fireTower(t, target) {
    const angle = Math.atan2(target.y - t.y, target.x - t.x);
    const specialization = this.getDefenseSpecializationOptions(t)
      .find(option => option.id === t.specializationId);
    const modifiers = specialization?.modifiers || {};
    const mult = (this.quadDamageTimer > 0 ? 4 : 1)
      * this.getRunModifierProduct('defenseDamageMultiplier')
      * this.getDefenseAuraModifiers(t).damageMultiplier
      * (this.heroUltimateDefenseDamageTimer > 0 ? 1.25 : 1)
      * (t.imperialBuffTimer > 0 ? (Number(t.imperialDamageMultiplier) || 1) : 1);
    const lifesteal = t.abilityBuffTimer > 0 ? (Number(t.abilityLifesteal) || 0) : 0;
    const projectileHeal = t.damage * mult * lifesteal;
    const applyDirectLifesteal = damage => {
      if (lifesteal <= 0) return;
      this.healCitadel(damage * lifesteal);
    };
    t.facingAngle = angle;
    t.animationTimer = 0.34;

    if (t.type === 'bullet' || t.type === 'saw') {
      audio.playShoot();
      const pierce = Math.max(
        t.type === 'saw' ? 1 : 0,
        Math.floor(Number(modifiers.ricochetCount) || 0)
      );
      this.projectiles.push({
        x: t.x,
        y: t.y,
        vx: Math.cos(angle) * 700,
        vy: Math.sin(angle) * 700,
        damage: t.damage * mult,
        color: '#00f0ff',
        radius: t.type === 'saw' ? 7 : 4,
        type: 'bullet',
        pierce,
        slow: Number(modifiers.slowMultiplier) > 0 ? 1.5 : 0,
        slowSpeedMultiplier: Number(modifiers.slowMultiplier) || undefined,
        heal: projectileHeal,
        sourceDefense: t
      });
    } else if (t.type === 'plasma' || t.type === 'missile') {
      audio.playPlasma();
      const projectileCount = Math.max(1, Math.floor(Number(modifiers.projectileCount) || 1));
      const targets = [target, ...this.getEnemiesInRange(t.x, t.y, t.range, t)
        .filter(enemy => enemy !== target)]
        .slice(0, projectileCount);
      for (let projectileIndex = 0; projectileIndex < projectileCount; projectileIndex++) {
        const projectileTarget = targets[projectileIndex % targets.length] || target;
        const spread = targets.length === 1
          ? (projectileIndex - ((projectileCount - 1) / 2)) * 0.055
          : 0;
        const projectileAngle = Math.atan2(projectileTarget.y - t.y, projectileTarget.x - t.x) + spread;
        const speed = specialization?.id === 'missile_bunker_buster' ? 330 : 450;
        this.projectiles.push({
          x: t.x,
          y: t.y,
          vx: Math.cos(projectileAngle) * speed,
          vy: Math.sin(projectileAngle) * speed,
          damage: t.damage * mult,
          color: '#a855f7',
          radius: 9,
          type: 'plasma_mortar',
          aoe: 70 * (Number(modifiers.splashRadiusMultiplier) || 1),
          heal: projectileHeal,
          sourceDefense: t
        });
      }
    } else if (t.type === 'rail' || t.type === 'orbital') {
      audio.playRailgun();
      const beamCount = Math.max(1, Math.floor(Number(modifiers.beamCount) || 1));
      const beamTargets = [target, ...this.getEnemiesInRange(t.x, t.y, t.range, t)
        .filter(enemy => enemy !== target)]
        .slice(0, beamCount);
      beamTargets.forEach(beamTarget => {
        const beamAngle = Math.atan2(beamTarget.y - t.y, beamTarget.x - t.x);
        const endX = t.x + Math.cos(beamAngle) * t.range;
        const endY = t.y + Math.sin(beamAngle) * t.range;
        this.particles.push({ type: 'rail_beam', x1: t.x, y1: t.y, x2: endX, y2: endY, life: 0.2, color: '#f59e0b' });
        [...this.enemies].forEach(e => {
          if (!this.canDefenseTargetEnemy(t, e)) return;
          if (this.distToSegment({ x: e.x, y: e.y }, { x: t.x, y: t.y }, { x: endX, y: endY }) < e.radius + 12) {
            this.damageEnemyFromDefense(t, e, t.damage * mult);
            applyDirectLifesteal(t.damage * mult);
          }
        });
      });
    } else if (t.type === 'fire') {
      audio.playFlame();
      this.projectiles.push({
        x: t.x,
        y: t.y,
        vx: Math.cos(angle) * 330,
        vy: Math.sin(angle) * 330,
        damage: t.damage * mult,
        color: '#ff2a5f',
        radius: 7,
        life: 0.65 * (Number(modifiers.burnDurationMultiplier) || 1),
        type: 'flame',
        slow: Number(modifiers.slowMultiplier) > 0 ? 2 : 0,
        slowSpeedMultiplier: Number(modifiers.slowMultiplier) || undefined,
        heal: projectileHeal,
        sourceDefense: t
      });
    } else if (t.type === 'tesla') {
      audio.playRailgun();
      const chainTargets = this.getEnemiesInRange(t.x, t.y, t.range, t)
        .sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))
        .slice(0, 4 + Math.floor(Number(modifiers.chainCountBonus) || 0));
      let previous = { x: t.x, y: t.y };
      chainTargets.forEach((enemy, index) => {
        this.particles.push({ type: 'rail_beam', x1: previous.x, y1: previous.y, x2: enemy.x, y2: enemy.y, life: 0.14, color: '#38bdf8' });
        const chainDamage = t.damage * mult * (1 - index * 0.14);
        this.damageEnemyFromDefense(t, enemy, chainDamage);
        applyDirectLifesteal(chainDamage);
        if (index === chainTargets.length - 1 && Number(modifiers.stunDurationMs) > 0) {
          enemy.stunTimer = Math.max(enemy.stunTimer || 0, Number(modifiers.stunDurationMs) / 1000);
        }
        previous = enemy;
      });
    } else if (t.type === 'cryo') {
      audio.playFreeze();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 470, vy: Math.sin(angle) * 470, damage: t.damage * mult, color: '#67e8f9', radius: 7, type: 'bullet', slow: 2.8, slowSpeedMultiplier: 0.45, heal: projectileHeal, sourceDefense: t });
    } else if (t.type === 'acid') {
      audio.playPlasma();
      this.projectiles.push({
        x: t.x,
        y: t.y,
        vx: Math.cos(angle) * 390,
        vy: Math.sin(angle) * 390,
        damage: t.damage * mult,
        color: '#84cc16',
        radius: 7,
        type: 'acid',
        aoe: 62,
        hazardDuration: 3.2 * (Number(modifiers.durationMultiplier) || 1),
        heal: projectileHeal,
        sourceDefense: t
      });
    } else if (t.type === 'drone') {
      audio.playShoot();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 820, vy: Math.sin(angle) * 820, damage: t.damage * mult, color: '#f0abfc', radius: 4, type: 'bullet', pierce: 1, heal: projectileHeal, sourceDefense: t });
    } else if (t.type === 'gravity') {
      audio.playAbility();
      this.getEnemiesInRange(t.x, t.y, t.range, t).forEach(enemy => {
        const pullAngle = Math.atan2(t.y - enemy.y, t.x - enemy.x);
        const pullDistance = 32 * (Number(modifiers.pullStrengthMultiplier) || 1);
        enemy.x += Math.cos(pullAngle) * pullDistance;
        enemy.y += Math.sin(pullAngle) * pullDistance;
        this.damageEnemyFromDefense(t, enemy, t.damage * mult);
        applyDirectLifesteal(t.damage * mult);
      });
      this.particles.push({ type: 'gravity_ring', x: t.x, y: t.y, radius: t.range, life: 0.35, color: '#a855f7' });
    } else if (t.type === 'siphon') {
      audio.playPlasma();
      const citadelHeal = Number(modifiers.citadelLifesteal) > 0
        ? t.damage * mult * Number(modifiers.citadelLifesteal)
        : 6 * (t.effectPower || 1);
      this.projectiles.push({
        x: t.x,
        y: t.y,
        vx: Math.cos(angle) * 500,
        vy: Math.sin(angle) * 500,
        damage: t.damage * mult,
        color: '#10b981',
        radius: 6,
        type: 'bullet',
        heal: citadelHeal + projectileHeal,
        allyHealRatio: Number(modifiers.allyHealRatio) || 0,
        allyHealRadius: t.range * (Number(modifiers.auraRadiusMultiplier) || 1),
        sourceDefense: t
      });
    } else if (t.type === 'emp') {
      audio.playAbility();
      this.getEnemiesInRange(t.x, t.y, t.range, t).forEach(enemy => {
        enemy.stunTimer = Math.max(
          enemy.stunTimer || 0,
          2 * (Number(modifiers.disableDurationMultiplier) || 1)
        );
        this.damageEnemyFromDefense(t, enemy, t.damage * mult);
        applyDirectLifesteal(t.damage * mult);
      });
      this.particles.push({ type: 'gravity_ring', x: t.x, y: t.y, radius: t.range, life: 0.28, color: '#00f0ff' });
    } else if (t.type === 'sonic') {
      audio.playAbility();
      this.getEnemiesInRange(t.x, t.y, t.range, t).forEach(enemy => {
        const pushAngle = Math.atan2(enemy.y - t.y, enemy.x - t.x);
        const pushDistance = Number(modifiers.knockbackDistance)
          || 38 * (Number(modifiers.knockbackMultiplier) || 1);
        enemy.x += Math.cos(pushAngle) * pushDistance;
        enemy.y += Math.sin(pushAngle) * pushDistance;
        this.damageEnemyFromDefense(t, enemy, t.damage * mult);
        applyDirectLifesteal(t.damage * mult);
      });
      this.particles.push({ type: 'gravity_ring', x: t.x, y: t.y, radius: t.range, life: 0.25, color: '#f59e0b' });
    }
  }

  canDefenseTargetEnemy(defense, enemy) {
    if (!enemy || enemy.dead) return false;
    if (
      this.isEnemyFlying(enemy)
      && ['mine', 'napalm', 'acid', 'fire', 'barrier'].includes(defense?.type)
    ) return false;
    if (
      enemy.stealthTimer > 0
      && enemy.markedTimer <= 0
      && !(
        this.selectedHero?.id === 'vega'
        && Math.hypot(enemy.x - this.citadel.x, enemy.y - this.citadel.y) <= 260
      )
    ) return false;
    return true;
  }

  getEnemyPriorityScore(defense, enemy) {
    const priorities = defense?.targetPriorities || [];
    let score = 0;
    priorities.forEach((priority, index) => {
      const weight = (priorities.length - index) * 1000;
      if (priority === enemy.type) score += weight;
      else if (priority === 'boss' && enemy.isBoss) score += weight;
      else if (priority === 'heavy' && ['brute', 'bulwark'].includes(enemy.type)) score += weight;
    });
    return score;
  }

  getEnemiesInRange(x, y, range, defense = null) {
    return this.enemies.filter(enemy => (
      this.canDefenseTargetEnemy(defense, enemy)
      && Math.hypot(enemy.x - x, enemy.y - y) <= range + enemy.radius
    ));
  }

  getDefenseAuraModifiers(defense) {
    let damageMultiplier = 1;
    let fireRateMultiplier = 1;
    this.placedTowers
      .filter(tower => tower !== defense && ['shrine', 'siphon'].includes(tower.type))
      .forEach(support => {
        const specialization = this.getDefenseSpecializationOptions(support)
          .find(option => option.id === support.specializationId);
        const radius = support.range * (Number(specialization?.modifiers?.auraRadiusMultiplier) || 1);
        if (Math.hypot(support.x - defense.x, support.y - defense.y) > radius) return;
        damageMultiplier = Math.max(
          damageMultiplier,
          Number(specialization?.modifiers?.auraDamageMultiplier) || 1
        );
        fireRateMultiplier = Math.min(
          fireRateMultiplier,
          Number(specialization?.modifiers?.auraFireRateMultiplier)
            || Number(specialization?.modifiers?.alliedFireRateMultiplier)
            || 1
        );
      });
    return { damageMultiplier, fireRateMultiplier };
  }

  getShrineDamageMultiplier() {
    return this.placedTowers
      .filter(tower => tower.type === 'shrine')
      .reduce((multiplier, shrine) => {
        const specialization = this.getDefenseSpecializationOptions(shrine)
          .find(option => option.id === shrine.specializationId);
        if (specialization?.id === 'shrine_war_chorus') return multiplier;
        const heroMultiplier = Number(specialization?.modifiers?.heroDamageMultiplier);
        return multiplier * (
          Number.isFinite(heroMultiplier)
            ? heroMultiplier
            : 1 + Math.min(0.8, (shrine.effectPower || 1) * 0.12)
        );
      }, 1);
  }

  getHeroCooldownMultiplier() {
    return this.placedTowers
      .filter(tower => tower.type === 'shrine')
      .reduce((multiplier, shrine) => {
        const specialization = this.getDefenseSpecializationOptions(shrine)
          .find(option => option.id === shrine.specializationId);
        return multiplier * (Number(specialization?.modifiers?.heroCooldownMultiplier) || 1);
      }, 1);
  }

  findTarget(x, y, range, defense = null) {
    let nearest = null;
    const seleneRangeMultiplier = (
      defense
      && this.selectedHero?.id === 'selene'
    )
      ? (Number(this.getHeroKit('selene')?.passive?.modifiers?.rangeVsSlowedMultiplier) || 1.14)
      : 1;
    let minDist = range * seleneRangeMultiplier;
    let bestPriority = -1;
    this.enemies.forEach(e => {
      if (!this.canDefenseTargetEnemy(defense, e)) return;
      const dist = Math.hypot(e.x - x, e.y - y);
      const priority = this.getEnemyPriorityScore(defense, e);
      const effectiveRange = range * (e.slowTimer > 0 ? seleneRangeMultiplier : 1);
      if (dist < effectiveRange && (priority > bestPriority || (priority === bestPriority && dist < minDist))) {
        bestPriority = priority;
        minDist = dist;
        nearest = e;
      }
    });
    return nearest;
  }

  fireWeapon(wp, target) {
    const angle = Math.atan2(target.y - this.citadel.y, target.x - this.citadel.x);
    const damageMult = (this.quadDamageTimer > 0 ? 4 : 1) * this.getShrineDamageMultiplier();
    this.heroFacingAngle = angle;
    this.heroAnimationState = 'attack';
    this.heroAnimationTimer = 0.3;

    if (wp.id === 'vulcan') {
      audio.playShoot();
      this.projectiles.push({ x: this.citadel.x, y: this.citadel.y, vx: Math.cos(angle) * 750, vy: Math.sin(angle) * 750, damage: wp.damage * wp.level * damageMult, color: this.isOverdriveActive ? '#f59e0b' : '#00f0ff', radius: 4, type: 'bullet', pierce: wp.isEvolved ? 2 : 0 });
    } else if (wp.id === 'plasma') {
      audio.playPlasma();
      this.projectiles.push({ x: this.citadel.x, y: this.citadel.y, vx: Math.cos(angle) * 450, vy: Math.sin(angle) * 450, damage: wp.damage * wp.level * damageMult, color: '#a855f7', radius: 11, type: 'plasma_mortar', aoe: wp.isEvolved ? 150 : 85 });
    } else if (wp.id === 'railgun') {
      audio.playRailgun();
      const endX = this.citadel.x + Math.cos(angle) * wp.range;
      const endY = this.citadel.y + Math.sin(angle) * wp.range;
      this.particles.push({ type: 'rail_beam', x1: this.citadel.x, y1: this.citadel.y, x2: endX, y2: endY, life: 0.25, color: wp.isEvolved ? '#f59e0b' : '#00f0ff' });
      [...this.enemies].forEach(e => {
        if (this.distToSegment({ x: e.x, y: e.y }, { x: this.citadel.x, y: this.citadel.y }, { x: endX, y: endY }) < e.radius + 14) {
          this.damageEnemy(e, wp.damage * wp.level * damageMult);
        }
      });
    } else if (wp.id === 'flamethrower') {
      audio.playFlame();
      for (let i = 0; i < (wp.isEvolved ? 5 : 3); i++) {
        const spread = (this.getRunRandom() - 0.5) * 0.4;
        this.projectiles.push({ x: this.citadel.x, y: this.citadel.y, vx: Math.cos(angle + spread) * 320, vy: Math.sin(angle + spread) * 320, damage: wp.damage * wp.level * damageMult, color: wp.isEvolved ? '#38bdf8' : '#ff2a5f', radius: 6, life: 0.5, type: 'flame' });
      }
    }
  }

  updateSpawns(dt) {
    SPAWN_GATE_SECTORS.forEach(side => {
      this.spawnGatePulses[side] = Math.max(0, (this.spawnGatePulses[side] || 0) - dt);
    });
    if (this.campaignVictory) return;
    if (!this.waveActive) {
      this.waveIntermissionTimer -= dt;
      const statusSecond = Math.max(0, Math.ceil(this.waveIntermissionTimer));
      if (statusSecond !== this.lastWaveStatusSecond) {
        this.lastWaveStatusSecond = statusSecond;
        this.updateHUD();
      }
      if (this.waveIntermissionTimer <= 0) this.advanceWave();
      return;
    }

    if (this.enemiesSpawnedThisWave >= this.waveSpawnTarget) {
      if (this.enemies.length === 0) this.completeWave();
      return;
    }

    if (this.waveSpawnQueue.length > 0) {
      this.waveSpawnElapsedMs += dt * 1000;
      while (
        this.waveSpawnQueue.length > 0
        && this.waveSpawnQueue[0].atMs <= this.waveSpawnElapsedMs
      ) {
        this.spawnMutant(this.waveSpawnQueue.shift());
      }
      return;
    }

    this.spawnTimer += dt;
    const mutatorRate = this.getActiveRunMutators().some(mutator => ['swarm', 'long_march'].includes(mutator.id)) ? 0.68 : 1;
    const spawnInterval = Math.max(0.32, (2.0 - (this.wave * 0.09)) * mutatorRate);

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnMutant();
    }
  }

  chooseFallbackEnemyType() {
    const roll = this.getRunRandom();
    if (this.wave >= 12 && roll < 0.12) return 'artillery';
    if (this.wave >= 9 && roll < 0.24) return 'bulwark';
    if (this.wave >= 7 && roll < 0.38) return 'splitter';
    if (this.wave >= 4 && roll < 0.53) return 'flying';
    if (roll < 0.68) return 'runner';
    if (roll < 0.82) return 'brute';
    return 'swarmer';
  }

  spawnMutant(spawnSpec = null) {
    let spec = spawnSpec;
    if (!spec && this.waveSpawnQueue.length > 0) spec = this.waveSpawnQueue.shift();
    const bossDue = !spec
      && this.wave % 5 === 0
      && !this.bossSpawnedThisWave
      && this.enemiesSpawnedThisWave >= this.waveSpawnTarget - 1;
    if (!spec) {
      let type = this.chooseFallbackEnemyType();
      if (bossDue) {
        type = this.isTowerMode
          ? 'hellwarden'
          : (this.wave % 15 === 0 ? 'leviathan' : (this.wave % 10 === 0 ? 'carmilla' : 'vespera'));
      }
      spec = {
        type,
        routeIndex: this.nextSpawnGateIndex % Math.max(1, this.spawnRoutes.length),
        boss: bossDue
      };
    }
    if (['vespera', 'carmilla'].includes(spec.type) && HERO_CLASSES[spec.type]?.allied) {
      spec = { ...spec, type: 'hellwarden', boss: true };
    }
    return this.spawnEnemy(spec.type, spec.routeIndex, {
      isBoss: spec.boss,
      countForWave: true
    });
  }

  spawnEnemy(type = 'swarmer', routeIndex = 0, options = {}) {
    const routes = this.spawnRoutes.length > 0
      ? this.spawnRoutes
      : EXPANSION_FALLBACK.worldLayouts.convergence.spawnRoutes
        .map((route, index) => this.normalizeSpawnRoute(route, index));
    const normalizedRouteIndex = Math.abs(Math.floor(Number(routeIndex) || 0)) % routes.length;
    const route = routes[normalizedRouteIndex];
    const start = {
      x: Number.isFinite(options.x) ? options.x : route.polyline[0].x,
      y: Number.isFinite(options.y) ? options.y : route.polyline[0].y
    };
    const bossDefinition = this.getBossDefinition(type);
    if (bossDefinition && this.hasEnteredAdultExperience) this.ensureEnemySprite(type);
    const definition = bossDefinition || EXPANSION?.enemyDefinitions?.[type];
    const stats = definition?.stats || {};
    const scale = 1 + (Math.max(0, this.wave - 1) * 0.1);
    let hp = (Number(stats.hp) || 45) * scale;
    let speed = Number(stats.speed) || (90 + this.getRunRandom() * 30);
    let radius = Number(stats.radius) || 14;
    let damage = Number(stats.damage) || 8;
    let color = '#ff2a5f';
    let name = definition?.name || 'Démon Swarmer';
    const bossTypes = ['vespera', 'carmilla', 'leviathan', 'hellwarden'];
    const isBoss = options.isBoss === true || bossTypes.includes(type) || Boolean(bossDefinition);
    let recruitableBossId = null;

    if (type === 'leviathan') {
      audio.playDragonRoar();
      hp = 4500 + (this.wave * 800); speed = 35; radius = 75; damage = 80;
      color = '#ec4899'; name = 'MEGA-BOSS TITAN LÉVIATHAN';
    } else if (type === 'vespera') {
      hp = 900 + (this.wave * 350); speed = 45; radius = 42; damage = 40;
      color = '#f59e0b'; name = 'Boss Vespera'; recruitableBossId = 'vespera';
    } else if (type === 'carmilla') {
      hp = 1600 + (this.wave * 500); speed = 50; radius = 48; damage = 45;
      color = '#ff2a5f'; name = 'Reine Carmilla'; recruitableBossId = 'carmilla';
    } else if (type === 'hellwarden') {
      hp = 1100 + (this.wave * 420); speed = 52; radius = 44; damage = 45;
      color = '#f97316'; name = 'Gardienne Infernale';
    } else if (bossDefinition) {
      color = bossDefinition.color || '#ec4899';
      name = bossDefinition.name || bossDefinition.title || type;
      recruitableBossId = bossDefinition.recruitment?.available === true ? type : null;
    } else if (type === 'runner') color = '#00f0ff';
    else if (type === 'brute') color = '#a855f7';
    else if (type === 'flying') color = '#38bdf8';
    else if (type === 'bulwark') color = '#67e8f9';
    else if (type === 'artillery') color = '#f97316';
    else if (type === 'splitter') color = '#84cc16';

    const difficulty = DIFFICULTY_DATA[this.difficulty] || DIFFICULTY_DATA.standard;
    hp *= difficulty.enemyHp;
    speed *= difficulty.enemySpeed;
    this.getActiveRunMutators().forEach(mutator => {
      const modifiers = mutator.modifiers || {};
      if (mutator.id === 'armored') hp *= 1.65;
      if (mutator.id === 'haste') speed *= 1.35;
      hp *= Number(modifiers.enemyHpMultiplier) || 1;
      if (type === 'flying') {
        hp *= Number(modifiers.flyingHpMultiplier) || 1;
        speed *= Number(modifiers.flyingSpeedMultiplier) || 1;
      }
      if (['brute', 'bulwark'].includes(type)) {
        hp *= Number(modifiers.heavyHpMultiplier) || 1;
        speed *= Number(modifiers.heavySpeedMultiplier) || 1;
      }
    });
    // A longer route is represented as slower progress along the authored
    // polyline so enemies remain aligned with the visible portals and roads.
    speed /= this.getRunModifierProduct('routeLengthMultiplier');
    if (type === 'artillery') {
      damage *= this.getRunModifierProduct('artilleryDamageMultiplier');
    }
    if (Number.isFinite(options.hpMultiplier)) hp *= options.hpMultiplier;
    const enemy = {
      x: start.x,
      y: start.y,
      hp,
      maxHp: hp,
      speed,
      baseSpeed: speed,
      damage,
      radius,
      color,
      name,
      isBoss,
      isLeviathan: type === 'leviathan',
      type,
      bossDefinitionId: bossDefinition?.id || null,
      bossRewards: bossDefinition?.rewards ? { ...bossDefinition.rewards } : null,
      recruitableBossId,
      spawnSide: route.side,
      routeId: route.id,
      routeIndex: normalizedRouteIndex,
      routePolyline: route.polyline.map(point => ({ ...point })),
      waypointIndex: Number.isFinite(options.waypointIndex) ? options.waypointIndex : 1,
      facingAngle: Math.atan2(this.citadel.y - start.y, this.citadel.x - start.x),
      animationPhase: this.getRunRandom() * 8,
      attackAnimationTimer: 0,
      hitAnimationTimer: 0,
      bulletTimer: 0,
      contactTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      slowSpeedMultiplier: 1,
      markedTimer: 0,
      markedDamageTakenMultiplier: 1,
      armorBreakTimer: 0,
      armorBreakMultiplier: 1,
      resonanceStacks: 0,
      dead: false,
      bossPhase: isBoss ? 1 : 0,
      telegraphTimer: isBoss ? 0.8 : 0,
      patternIndex: 0,
      shield: type === 'bulwark' ? (Number(definition?.shield?.capacity) || 420) : 0,
      maxShield: type === 'bulwark' ? (Number(definition?.shield?.capacity) || 420) : 0,
      auraRadius: type === 'bulwark' ? (Number(definition?.aura?.radius) || 105) : 0,
      auraDamageReduction: type === 'bulwark'
        ? (Number(definition?.aura?.alliedDamageReduction) || 0.18)
        : 0,
      siegeTimer: 0,
      siegeDeployTimer: type === 'artillery'
        ? (Number(definition?.siege?.deploymentTimeMs) || 900) / 1000
        : 0
    };
    if (options.countForWave !== false) this.enemiesSpawnedThisWave++;
    if (isBoss) this.bossSpawnedThisWave = true;
    this.nextSpawnGateIndex = (normalizedRouteIndex + 1) % routes.length;
    this.spawnGatePulses[route.side] = 0.82;
    this.enemies.push(enemy);
    if (enemy.bossDefinitionId && options.suppressCinematic !== true) {
      this.queueBossCinematic(enemy.bossDefinitionId, 'intro');
    }
    this.updateHUD();
    return enemy;
  }

  updateProjectiles(dt) {
    const cullBounds = this.getApproachCullBounds(BATTLEFIELD_PROJECTILE_PADDING);
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'flame') {
        p.life -= dt;
        if (!(p.hitEnemies instanceof Set)) p.hitEnemies = new Set();
        if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }
      }

      if (p.x < cullBounds.left || p.x > cullBounds.right || p.y < cullBounds.top || p.y > cullBounds.bottom) {
        this.projectiles.splice(i, 1);
        continue;
      }

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (e.dead) continue;
        if (p.type === 'flame' && p.hitEnemies.has(e)) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
          if (p.type === 'flame') p.hitEnemies.add(e);
          this.damageEnemyFromDefense(p.sourceDefense, e, p.damage);
          if (p.type === 'flame') this.applyRinArmorBreak(e);
          if (p.slow) {
            e.slowTimer = Math.max(
              e.slowTimer || 0,
              p.slow * this.getRunModifierProduct('slowDurationMultiplier')
            );
            e.slowSpeedMultiplier = Math.min(
              Number(e.slowSpeedMultiplier) || 1,
              Number(p.slowSpeedMultiplier) || 0.45
            );
          }
          if (p.heal) {
            this.healCitadel(p.heal);
            this.updateHUD();
          }
          if (p.allyHealRatio > 0 && p.sourceDefense) {
            this.placedTowers.forEach(defense => {
              if (
                defense === p.sourceDefense
                || Math.hypot(defense.x - p.sourceDefense.x, defense.y - p.sourceDefense.y)
                  > (Number(p.allyHealRadius) || p.sourceDefense.range)
              ) return;
              defense.hp = Math.min(
                defense.maxHp,
                defense.hp + (p.damage * p.allyHealRatio)
              );
            });
          }

          if (p.type === 'plasma_mortar') {
            audio.playExplosion();
            this.createExplosion(p.x, p.y, p.aoe, p.damage * 0.7, {
              sourceDefense: p.sourceDefense
            });
            this.projectiles.splice(i, 1);
            break;
          } else if (p.type === 'acid') {
            this.hazards.push({ x: p.x, y: p.y, radius: p.aoe, initialRadius: p.aoe, damage: Math.max(2, p.damage * 0.22), life: Number(p.hazardDuration) || 3.2, tickTimer: 0, color: '#84cc16', sourceDefense: p.sourceDefense });
            this.createExplosion(p.x, p.y, p.aoe, p.damage * 0.35, {
              sourceDefense: p.sourceDefense
            });
            this.projectiles.splice(i, 1);
            break;
          } else if (p.type === 'bullet') {
            if (p.pierce && p.pierce > 0) { p.pierce--; }
            else { this.projectiles.splice(i, 1); break; }
          }
        }
      }
    }
  }

  updateEnemyBullets(dt) {
    if (this.hostileProjectileFreezeTimer > 0) return;
    const cullBounds = this.getApproachCullBounds(BATTLEFIELD_PROJECTILE_PADDING);
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const interceptionField = this.decoys.find(decoy => (
        (decoy.shieldHp > 0 || decoy.projectileInterceptions > 0)
        && Math.hypot(decoy.x - b.x, decoy.y - b.y) <= decoy.radius + b.radius
      ));
      if (interceptionField) {
        if (interceptionField.projectileInterceptions > 0) {
          interceptionField.projectileInterceptions--;
          if (this.selectedHero?.id === 'mircalla') {
            const modifiers = this.getHeroKit('mircalla')?.passive?.modifiers || {};
            const maximumCharge = Number(modifiers.maximumCharge) || 40;
            this.mircallaRetaliationCharge = Math.min(
              maximumCharge,
              (Number(this.mircallaRetaliationCharge) || 0)
                + (Number(modifiers.chargePerIntercept) || 5)
            );
            if (this.mircallaRetaliationCharge >= maximumCharge) {
              const retaliationTarget = this.enemies
                .filter(enemy => !enemy.dead)
                .sort((left, right) => (
                  Math.hypot(left.x - interceptionField.x, left.y - interceptionField.y)
                  - Math.hypot(right.x - interceptionField.x, right.y - interceptionField.y)
                ))[0];
              if (retaliationTarget) {
                this.damageEnemy(
                  retaliationTarget,
                  maximumCharge * (Number(modifiers.retaliationDamagePerCharge) || 4)
                );
              }
              this.mircallaRetaliationCharge = 0;
            }
          }
        } else {
          interceptionField.shieldHp -= b.damage;
        }
        this.enemyBullets.splice(i, 1);
        continue;
      }

      const impactedDefense = this.placedTowers.find(defense => (
        Math.hypot(defense.x - b.x, defense.y - b.y) < defense.radius + b.radius
      ));
      if (impactedDefense) {
        if (impactedDefense.ultimateInvulnerableTimer > 0) {
          this.enemyBullets.splice(i, 1);
          continue;
        }
        const impactSpecialization = this.getDefenseSpecializationOptions(impactedDefense)
          .find(option => option.id === impactedDefense.specializationId);
        const reflectChance = Number(impactSpecialization?.modifiers?.projectileReflectChance) || 0;
        if (
          b.sourceType === 'artillery'
          && b.sourceEnemy
          && !b.sourceEnemy.dead
          && this.getRunRandom() < reflectChance
        ) {
          const reflectedDamage = b.damage
            * (Number(impactSpecialization?.modifiers?.reflectedDamageMultiplier) || 1);
          this.damageEnemy(b.sourceEnemy, reflectedDamage);
          this.showFeedback('Miroir Aegis · obus renvoyé', '#67e8f9');
          this.enemyBullets.splice(i, 1);
          continue;
        }

        const splashRadius = Math.max(0, Number(b.splashRadius) || 0);
        const affectedDefenses = splashRadius > 0
          ? this.placedTowers.filter(defense => (
            Math.hypot(defense.x - impactedDefense.x, defense.y - impactedDefense.y) <= splashRadius
          ))
          : [impactedDefense];
        affectedDefenses.forEach(defense => {
          const defenseSpecialization = this.getDefenseSpecializationOptions(defense)
            .find(option => option.id === defense.specializationId);
          const damageTakenMultiplier = Number(defenseSpecialization?.modifiers?.damageTakenMultiplier) || 1;
          const impactDamage = Math.max(1, Math.round(b.damage * damageTakenMultiplier));
          defense.hp -= impactDamage;
          const stunDuration = Math.max(0, Number(b.stunDuration) || 0);
          if (stunDuration > 0) {
            if ((Number(defense.stunIgnoresRemaining) || 0) > 0) {
              defense.stunIgnoresRemaining--;
              this.addFloatingText('AEGIS', defense.x, defense.y - 38, '#67e8f9');
            } else {
              defense.disabledTimer = Math.max(
                Number(defense.disabledTimer) || 0,
                stunDuration
              );
            }
          }
          this.addFloatingText(`-${impactDamage}`, defense.x, defense.y - 24, '#fca5a5');
        });
        for (let defenseIndex = this.placedTowers.length - 1; defenseIndex >= 0; defenseIndex--) {
          const defense = this.placedTowers[defenseIndex];
          if (defense.hp > 0) continue;
          this.placedTowers.splice(defenseIndex, 1);
          this.showFeedback(`${defense.name} détruite par un bombardement.`, '#ef4444');
        }
        if (
          splashRadius > 0
          && Math.hypot(this.citadel.x - impactedDefense.x, this.citadel.y - impactedDefense.y)
            <= splashRadius + this.citadel.radius
          && !this.isOverdriveActive
          && this.invincibleTimer <= 0
        ) {
          this.citadel.hp -= Math.round(b.damage * 0.65);
          this.updateHUD();
        }
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (Math.hypot(this.citadel.x - b.x, this.citadel.y - b.y) < this.citadel.radius + b.radius) {
        if (!this.isOverdriveActive && this.invincibleTimer <= 0) {
          this.citadel.hp -= b.damage;
          audio.playHurtVoice();
          this.addFloatingText(`-${b.damage}`, this.citadel.x, this.citadel.y - 30, '#ff2a5f');
          this.updateHUD();
        }
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.x < cullBounds.left || b.x > cullBounds.right || b.y < cullBounds.top || b.y > cullBounds.bottom) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  getEnemyRouteTarget(enemy) {
    const points = enemy?.routePolyline;
    if (!Array.isArray(points) || points.length === 0) {
      return { x: this.citadel.x, y: this.citadel.y };
    }
    const waypointIndex = Math.max(0, Math.min(points.length - 1, enemy.waypointIndex || 0));
    return points[waypointIndex] || { x: this.citadel.x, y: this.citadel.y };
  }

  advanceEnemyWaypoint(enemy, threshold = 12) {
    const points = enemy?.routePolyline;
    if (!Array.isArray(points) || points.length === 0) return false;
    let target = this.getEnemyRouteTarget(enemy);
    let advanced = false;
    while (
      enemy.waypointIndex < points.length - 1
      && Math.hypot(target.x - enemy.x, target.y - enemy.y) <= threshold + enemy.radius
    ) {
      enemy.waypointIndex++;
      target = this.getEnemyRouteTarget(enemy);
      advanced = true;
    }
    return advanced;
  }

  updateBossPhase(boss) {
    if (!boss?.isBoss || boss.dead) return 0;
    const hpRatio = Math.max(0, boss.hp / Math.max(1, boss.maxHp));
    const bossDefinition = this.getBossDefinition(boss.type);
    const authoredPhases = bossDefinition?.phases;
    const nextPhase = Array.isArray(authoredPhases)
      ? authoredPhases.reduce(
        (phaseNumber, phase) => (
          hpRatio <= Number(phase.threshold) ? Math.max(phaseNumber, phase.number) : phaseNumber
        ),
        1
      )
      : (hpRatio <= BOSS_PHASE_THRESHOLDS[1]
        ? 3
        : (hpRatio <= BOSS_PHASE_THRESHOLDS[0] ? 2 : 1));
    if (nextPhase > (boss.bossPhase || 1)) {
      boss.bossPhase = nextPhase;
      boss.telegraphTimer = boss.type === 'leviathan' ? 1.35 : 0.9;
      boss.patternIndex = 0;
      const patternNames = {
        vespera: ['Couronne abyssale', 'Portes du vide', 'Éclipse impériale'],
        carmilla: ['Saigne-lune', 'Danse des lances', 'Banquet écarlate'],
        leviathan: ['Souffle du titan', 'Marée cataclysmique', 'Extinction']
      };
      const patternName = authoredPhases?.[nextPhase - 1]?.name
        || patternNames[boss.type]?.[nextPhase - 1]
        || `Phase ${nextPhase}`;
      this.showFeedback(`${boss.name} · ${patternName}`, boss.color);
      this.particles.push({
        type: 'gravity_ring',
        x: boss.x,
        y: boss.y,
        radius: boss.radius * (2 + nextPhase),
        life: boss.telegraphTimer,
        color: boss.color
      });
      this.applyBossSignature(boss, bossDefinition, nextPhase, 'phase');
    }
    return boss.bossPhase;
  }

  applyBossSignature(boss, definition, phase = 1, trigger = 'pattern') {
    if (!boss || !definition) return null;
    const result = { mechanic: definition.signature?.mechanic || definition.id, affected: 0 };
    const selectInvestedDefenses = count => this.placedTowers
      .slice()
      .sort((left, right) => (right.investedCost || 0) - (left.investedCost || 0))
      .slice(0, count);

    if (definition.id === 'xyra' && trigger === 'phase') {
      const restored = Math.min(boss.maxHp * 0.09, Math.max(0, boss.maxHp - boss.hp));
      boss.hp += restored;
      boss.shield = Math.max(Number(boss.shield) || 0, boss.maxHp * (0.08 + (phase * 0.02)));
      boss.maxShield = Math.max(Number(boss.maxShield) || 0, boss.shield);
      result.affected = Math.round(restored + boss.shield);
    } else if (definition.id === 'ossuary' && trigger === 'phase') {
      const shield = boss.maxHp * (0.12 + (phase * 0.04));
      boss.shield = Math.max(Number(boss.shield) || 0, shield);
      boss.maxShield = Math.max(Number(boss.maxShield) || 0, shield);
      result.affected = Math.round(shield);
    } else if (definition.id === 'nhalzara' && trigger === 'phase') {
      const angle = (phase * 2.399) % (Math.PI * 2);
      boss.x = Math.max(50, Math.min(this.worldWidth - 50, this.citadel.x + Math.cos(angle) * 360));
      boss.y = Math.max(50, Math.min(this.worldHeight - 50, this.citadel.y + Math.sin(angle) * 250));
      boss.telegraphTimer = Math.max(Number(boss.telegraphTimer) || 0, 1.1);
      result.affected = 1;
    } else if (definition.id === 'astarra' && (trigger === 'phase' || boss.patternIndex % 2 === 0)) {
      this.bossHazards.push({
        x: boss.x,
        y: boss.y,
        radius: 105 + (phase * 18),
        damage: 12 + (phase * 5),
        life: 4.8,
        tickTimer: 0,
        color: boss.color,
        sourceType: boss.type,
        label: 'AURA DE BRAISE'
      });
      result.affected = 1;
    } else if (definition.id === 'umbrael' && (trigger === 'phase' || boss.patternIndex % 2 === 1)) {
      boss.stealthTimer = Math.max(Number(boss.stealthTimer) || 0, 1.8 + (phase * 0.65));
      boss.markedTimer = 0;
      result.affected = 1;
    } else if (definition.id === 'pestifera' && (trigger === 'phase' || boss.patternIndex % 2 === 0)) {
      selectInvestedDefenses(Math.min(3, phase + 1)).forEach((defense, index) => {
        this.bossHazards.push({
          x: defense.x,
          y: defense.y,
          radius: 72 + (phase * 9),
          damage: 9 + (phase * 4),
          life: 5.5 + index,
          tickTimer: 0,
          color: boss.color,
          sourceType: boss.type,
          label: 'CORROSION'
        });
        result.affected++;
      });
    } else if (definition.id === 'vexara' && (trigger === 'phase' || boss.patternIndex % 2 === 0)) {
      const target = selectInvestedDefenses(1)[0];
      if (target) {
        const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
        this.enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * 230,
          vy: Math.sin(angle) * 230,
          damage: 22 + (phase * 6),
          radius: 11,
          splashRadius: 82 + (phase * 16),
          stunDuration: 0.6 + (phase * 0.25),
          color: boss.color,
          sourceType: boss.type,
          sourceEnemy: boss
        });
        result.affected = 1;
      }
    } else if (definition.id === 'kalix' && (trigger === 'phase' || boss.patternIndex % 2 === 1)) {
      selectInvestedDefenses(Math.min(3, phase)).forEach(defense => {
        defense.disabledTimer = Math.max(Number(defense.disabledTimer) || 0, 0.9 + (phase * 0.55));
        result.affected++;
      });
    } else if (definition.id === 'malika' && (trigger === 'phase' || boss.patternIndex % 2 === 0)) {
      const mirageCount = Math.min(4, phase + 1);
      for (let index = 0; index < mirageCount; index++) {
        const angle = (Math.PI * 2 * index) / mirageCount;
        const mirage = this.spawnEnemy(index % 2 === 0 ? 'runner' : 'swarmer', boss.routeIndex, {
          x: boss.x + Math.cos(angle) * (boss.radius + 48),
          y: boss.y + Math.sin(angle) * (boss.radius + 48),
          waypointIndex: boss.waypointIndex,
          hpMultiplier: 0.65 + (phase * 0.12),
          countForWave: false
        });
        if (mirage) {
          mirage.name = 'Mirage de Malika';
          mirage.color = boss.color;
          mirage.mirageSourceId = definition.id;
          result.affected++;
        }
      }
    } else if (definition.id === 'noctis' && (trigger === 'phase' || boss.patternIndex % 2 === 1)) {
      selectInvestedDefenses(Math.min(2, phase)).forEach(defense => {
        defense.mindControlledTimer = Math.max(
          Number(defense.mindControlledTimer) || 0,
          2.2 + (phase * 0.8)
        );
        defense.mindControlPulseTimer = 0;
        result.affected++;
      });
    }

    if (result.affected > 0) {
      const label = definition.signature?.name || definition.title || definition.name;
      this.showFeedback(`${definition.name} · ${label}`, definition.color || boss.color);
    }
    return result;
  }

  updateArtillerySiege(enemy, dt) {
    if (enemy.type !== 'artillery') return false;
    const definition = EXPANSION?.enemyDefinitions?.artillery;
    const maximumRange = Number(definition?.stats?.attackRange) || 330;
    const minimumRange = Number(definition?.siege?.minimumRange) || 115;
    const candidates = this.placedTowers
      .map(defense => ({
        defense,
        distance: Math.hypot(defense.x - enemy.x, defense.y - enemy.y)
      }))
      .filter(candidate => candidate.distance <= maximumRange && candidate.distance >= minimumRange)
      .sort((left, right) => {
        if (this.getActiveRunMutators().some(mutator => mutator.modifiers?.artilleryTargeting === 'highest_investment')) {
          return (right.defense.investedCost || 0) - (left.defense.investedCost || 0);
        }
        return left.distance - right.distance;
      });
    const target = candidates[0]?.defense;
    if (!target) {
      enemy.siegeTimer = 0;
      return false;
    }
    enemy.facingAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    enemy.siegeDeployTimer = Math.max(0, (enemy.siegeDeployTimer || 0) - dt);
    if (enemy.siegeDeployTimer > 0) return true;
    enemy.siegeTimer += dt;
    const cooldown = (Number(definition?.stats?.attackCooldownMs) || 2400) / 1000;
    if (enemy.siegeTimer >= cooldown) {
      enemy.siegeTimer = 0;
      const velocity = 230;
      this.enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(enemy.facingAngle) * velocity,
        vy: Math.sin(enemy.facingAngle) * velocity,
        damage: Math.round(enemy.damage),
        radius: 9,
        splashRadius: Number(definition?.siege?.splashRadius) || 62,
        stunDuration: (Number(definition?.siege?.stunDurationMs) || 0) / 1000,
        color: enemy.color,
        sourceType: 'artillery',
        sourceEnemy: enemy
      });
      enemy.attackAnimationTimer = 0.45;
    }
    return true;
  }

  updateEnemies(dt) {
    if (this.freezeTimer > 0) return;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) continue;
      if (e.attackAnimationTimer > 0) e.attackAnimationTimer = Math.max(0, e.attackAnimationTimer - dt);
      if (e.hitAnimationTimer > 0) e.hitAnimationTimer = Math.max(0, e.hitAnimationTimer - dt);
      if (e.markedTimer > 0) {
        e.markedTimer -= dt;
        if (e.markedTimer <= 0) e.markedDamageTakenMultiplier = 1;
      }
      if (e.armorBreakTimer > 0) {
        e.armorBreakTimer -= dt;
        if (e.armorBreakTimer <= 0) {
          e.armorBreakMultiplier = 1;
          e.rinEmberStacks = 0;
        }
      }
      if (e.damageDebuffTimer > 0) {
        e.damageDebuffTimer -= dt;
        if (e.damageDebuffTimer <= 0) e.damageDebuffMultiplier = 1;
      }
      if (e.stealthTimer > 0) {
        e.stealthTimer = Math.max(0, e.stealthTimer - dt);
      }
      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        continue;
      }
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        if (e.slowTimer <= 0) e.slowSpeedMultiplier = 1;
      }
      if (e.isBoss) {
        this.updateBossPhase(e);
        e.telegraphTimer = Math.max(0, (e.telegraphTimer || 0) - dt);
      }
      if (e.convertedTimer > 0) {
        e.convertedTimer -= dt;
        e.convertedAttackTimer = Math.max(0, (e.convertedAttackTimer || 0) - dt);
        const hostile = this.enemies
          .filter(candidate => candidate !== e && !candidate.dead && candidate.convertedTimer <= 0)
          .sort((left, right) => (
            Math.hypot(left.x - e.x, left.y - e.y) - Math.hypot(right.x - e.x, right.y - e.y)
          ))[0];
        if (hostile) {
          e.facingAngle = Math.atan2(hostile.y - e.y, hostile.x - e.x);
          if (e.convertedAttackTimer <= 0) {
            this.damageEnemy(hostile, Math.max(18, e.damage * (e.convertedDamageMultiplier || 1.4)));
            e.convertedAttackTimer = 0.65;
          }
        }
        continue;
      }
      if (this.updateArtillerySiege(e, dt)) continue;

      let targetPos = this.getEnemyRouteTarget(e);
      let followsRoute = true;
      let closestDecoyDist = Math.hypot(targetPos.x - e.x, targetPos.y - e.y);
      let targetDecoy = null;
      let targetBarrier = null;

      this.decoys.forEach(d => {
        const dist = Math.hypot(d.x - e.x, d.y - e.y);
        if (dist < closestDecoyDist) {
          closestDecoyDist = dist;
          targetPos = { x: d.x, y: d.y };
          targetDecoy = d;
          followsRoute = false;
        }
      });
      this.placedTowers.forEach(tower => {
        if (tower.type !== 'barrier' || this.isEnemyFlying(e)) return;
        const dist = Math.hypot(tower.x - e.x, tower.y - e.y);
        if (dist < closestDecoyDist) {
          closestDecoyDist = dist;
          targetBarrier = tower;
          targetDecoy = null;
          targetPos = { x: tower.x, y: tower.y };
          followsRoute = false;
        }
      });
      if (targetDecoy && this.selectedHero?.id === 'zahra' && !this.isEnemyFlying(e)) {
        const modifiers = this.getHeroKit('zahra')?.passive?.modifiers || {};
        e.slowTimer = Math.max(
          Number(e.slowTimer) || 0,
          (Number(modifiers.revealDurationMs) || 8000) / 1000
        );
        e.slowSpeedMultiplier = Math.min(
          Number(e.slowSpeedMultiplier) || 1,
          Number(modifiers.slowMultiplier) || 0.8
        );
        e.markedDamageTakenMultiplier = Math.max(
          Number(e.markedDamageTakenMultiplier) || 1,
          Number(modifiers.redirectedDamageTakenMultiplier) || 1.12
        );
        e.markedTimer = Math.max(
          Number(e.markedTimer) || 0,
          (Number(modifiers.revealDurationMs) || 8000) / 1000
        );
      }

      const angle = Math.atan2(targetPos.y - e.y, targetPos.x - e.x);
      e.facingAngle = angle;
      const movementSpeed = e.speed * (e.slowTimer > 0 ? (e.slowSpeedMultiplier || 0.45) : 1);
      e.x += Math.cos(angle) * movementSpeed * dt;
      e.y += Math.sin(angle) * movementSpeed * dt;
      if (followsRoute) this.advanceEnemyWaypoint(e, movementSpeed * dt);

      const bossInsideCombatArena = e.x >= 0 && e.x <= this.worldWidth
        && e.y >= 0 && e.y <= this.worldHeight;
      if (e.isBoss && bossInsideCombatArena && e.telegraphTimer <= 0) {
        e.bulletTimer += dt;
        const phaseRate = 1 - ((Math.max(1, e.bossPhase) - 1) * 0.18);
        const authoredCooldown = Number(
          this.getBossDefinition(e.type)?.phases?.[(e.bossPhase || 1) - 1]?.pattern?.cooldownMs
        ) / 1000;
        const attackInterval = Number.isFinite(authoredCooldown) && authoredCooldown > 0
          ? authoredCooldown
          : ((e.isLeviathan ? 0.8 : 1.2) * phaseRate);
        if (e.bulletTimer >= attackInterval) {
          e.bulletTimer = 0;
          this.fireBossPattern(e);
        }
      }

      if (targetBarrier && Math.hypot(targetBarrier.x - e.x, targetBarrier.y - e.y) < targetBarrier.radius + e.radius) {
        e.attackAnimationTimer = 0.28;
        e.contactTimer = Math.max(0, (e.contactTimer || 0) - dt);
        if (e.isBoss && e.contactTimer > 0) {
          e.x -= Math.cos(angle) * 18;
          e.y -= Math.sin(angle) * 18;
          continue;
        }
        const barrierDamage = targetBarrier.ultimateInvulnerableTimer > 0
          ? 0
          : Math.round(
            (e.isBoss ? 90 : Math.max(8, e.damage || (e.type === 'brute' ? 45 : 24)))
            * (e.damageDebuffTimer > 0 ? (e.damageDebuffMultiplier || 1) : 1)
          );
        targetBarrier.hp -= barrierDamage;
        this.addFloatingText(
          barrierDamage > 0 ? `-${barrierDamage}` : 'AEGIS',
          targetBarrier.x,
          targetBarrier.y - 24,
          '#67e8f9'
        );
        this.createExplosion(e.x, e.y, 22, 0);
        if (e.isBoss) {
          e.contactTimer = 0.8;
          e.x -= Math.cos(angle) * 70;
          e.y -= Math.sin(angle) * 70;
        } else {
          e.dead = true;
          this.enemies.splice(i, 1);
        }
        if (targetBarrier.hp <= 0) {
          const barrierIndex = this.placedTowers.indexOf(targetBarrier);
          if (barrierIndex >= 0) this.placedTowers.splice(barrierIndex, 1);
          this.showFeedback('Une barrière Aegis a cédé.', '#ef4444');
        }
        continue;
      }

      if (Math.hypot(this.citadel.x - e.x, this.citadel.y - e.y) < this.citadel.radius + e.radius) {
        e.attackAnimationTimer = 0.3;
        if (e.isBoss) {
          e.contactTimer = Math.max(0, (e.contactTimer || 0) - dt);
          if (e.contactTimer <= 0) {
            if (!this.isOverdriveActive && this.invincibleTimer <= 0) {
              const dmg = Math.round(
                (e.damage || (e.isLeviathan ? 80 : 40))
                * (e.damageDebuffTimer > 0 ? (e.damageDebuffMultiplier || 1) : 1)
              );
              this.citadel.hp -= dmg;
              audio.playHurtVoice();
              this.addFloatingText(`-${dmg}`, this.citadel.x, this.citadel.y - 30, '#ff2a5f');
              this.updateHUD();
            }
            e.contactTimer = e.isLeviathan ? 0.65 : 0.9;
          }
          e.x -= Math.cos(angle) * 28;
          e.y -= Math.sin(angle) * 28;
          continue;
        }
        if (!this.isOverdriveActive && this.invincibleTimer <= 0) {
          const dmg = Math.round(
            (e.damage || (e.type === 'brute' ? 20 : 8))
            * (e.damageDebuffTimer > 0 ? (e.damageDebuffMultiplier || 1) : 1)
          );
          this.citadel.hp -= dmg;
          audio.playHurtVoice();
          this.addFloatingText(`-${dmg}`, this.citadel.x, this.citadel.y - 30, '#ff2a5f');
          this.updateHUD();
        }
        this.createExplosion(e.x, e.y, 25, 0);
        e.dead = true;
        this.enemies.splice(i, 1);
      }
    }
  }

  fireBossBulletRing(boss, options = {}) {
    boss.attackAnimationTimer = 0.34;
    const bulletsCount = options.count || (boss.isLeviathan ? 16 : (boss.type === 'carmilla' ? 12 : 8));
    const speed = options.speed || 200;
    const offset = Number(options.offset) || 0;
    for (let i = 0; i < bulletsCount; i++) {
      const angle = ((Math.PI * 2 / bulletsCount) * i) + offset;
      this.enemyBullets.push({
        x: boss.x, y: boss.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        damage: (options.damage || 15)
          * (boss.damageDebuffTimer > 0 ? (boss.damageDebuffMultiplier || 1) : 1),
        radius: options.radius || 7, color: boss.color,
        sourceType: boss.type,
        bossPhase: boss.bossPhase
      });
    }
  }

  fireAimedBossVolley(boss, count = 3, spread = 0.18, speed = 245, damage = 18) {
    const centerAngle = Math.atan2(this.citadel.y - boss.y, this.citadel.x - boss.x);
    for (let index = 0; index < count; index++) {
      const offset = (index - ((count - 1) / 2)) * spread;
      const angle = centerAngle + offset;
      this.enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: damage * (boss.damageDebuffTimer > 0 ? (boss.damageDebuffMultiplier || 1) : 1),
        radius: 8,
        color: boss.color,
        sourceType: boss.type,
        bossPhase: boss.bossPhase,
        aimed: true
      });
    }
  }

  fireBossPattern(boss) {
    const phase = Math.max(1, boss.bossPhase || 1);
    boss.patternIndex = (boss.patternIndex || 0) + 1;
    const bossDefinition = this.getBossDefinition(boss.type);
    const authoredPattern = bossDefinition?.phases?.[phase - 1]?.pattern;
    if (authoredPattern) {
      const count = Math.max(4, Math.min(24, Number(authoredPattern.count) || 8));
      const speed = Math.max(140, Number(authoredPattern.speed) || 210);
      const damage = Math.max(8, Number(authoredPattern.damage) || 18);
      boss.attackAnimationTimer = 0.48;
      this.applyBossSignature(boss, bossDefinition, phase, 'pattern');
      if (authoredPattern.type === 'aimed') {
        this.fireAimedBossVolley(boss, Math.min(9, count), 0.12, speed, damage);
      } else if (authoredPattern.type === 'summon') {
        const summonCount = Math.max(2, Math.min(5, Math.round(count / 4)));
        for (let summonIndex = 0; summonIndex < summonCount; summonIndex++) {
          const angle = (Math.PI * 2 * summonIndex) / summonCount;
          this.spawnEnemy(summonIndex % 2 === 0 ? 'runner' : 'swarmer', boss.routeIndex, {
            x: boss.x + Math.cos(angle) * (boss.radius + 38),
            y: boss.y + Math.sin(angle) * (boss.radius + 38),
            waypointIndex: boss.waypointIndex,
            hpMultiplier: 1 + (phase * 0.25),
            countForWave: false
          });
        }
        this.fireAimedBossVolley(boss, 3, 0.16, speed, damage);
      } else if (authoredPattern.type === 'teleport') {
        const angle = (boss.patternIndex * 2.399) % (Math.PI * 2);
        const radius = 250 + ((boss.patternIndex % 3) * 55);
        boss.x = Math.max(40, Math.min(this.worldWidth - 40, this.citadel.x + Math.cos(angle) * radius));
        boss.y = Math.max(40, Math.min(this.worldHeight - 40, this.citadel.y + Math.sin(angle) * radius));
        boss.telegraphTimer = 0.45;
        this.fireAimedBossVolley(boss, Math.min(7, count), 0.1, speed + 30, damage);
      } else if (authoredPattern.type === 'hazard') {
        const hazardTarget = this.placedTowers
          .slice()
          .sort((left, right) => (right.investedCost || 0) - (left.investedCost || 0))[0];
        const fallbackAngle = boss.patternIndex * 1.73;
        this.bossHazards.push({
          x: hazardTarget?.x || this.citadel.x + Math.cos(fallbackAngle) * 170,
          y: hazardTarget?.y || this.citadel.y + Math.sin(fallbackAngle) * 170,
          radius: 78 + (phase * 12),
          damage: Math.max(8, Math.round(damage * 0.55)),
          life: 4.2,
          tickTimer: 0,
          color: boss.color,
          sourceType: boss.type
        });
        this.fireBossBulletRing(boss, {
          count,
          speed: Math.max(120, speed * 0.72),
          damage,
          radius: 11,
          offset: boss.patternIndex * 0.21
        });
        this.fireAimedBossVolley(boss, 3, 0.2, speed, damage + 3);
      } else {
        this.fireBossBulletRing(boss, {
          count,
          speed,
          damage,
          offset: authoredPattern.type === 'spiral' ? boss.patternIndex * 0.31 : 0
        });
      }
      return;
    }
    if (boss.type === 'vespera') {
      if (phase === 1) this.fireBossBulletRing(boss, { count: 8, speed: 190 });
      else if (phase === 2) {
        this.fireBossBulletRing(boss, { count: 10, speed: 220, offset: boss.patternIndex * 0.17 });
        this.fireAimedBossVolley(boss, 2, 0.22, 270, 20);
      } else {
        this.fireBossBulletRing(boss, { count: 14, speed: 250, offset: boss.patternIndex * 0.23, damage: 22 });
        this.fireAimedBossVolley(boss, 5, 0.13, 300, 24);
      }
    } else if (boss.type === 'carmilla') {
      if (phase === 1) this.fireAimedBossVolley(boss, 5, 0.16, 230, 16);
      else if (phase === 2) {
        this.fireBossBulletRing(boss, { count: 12, speed: 210, offset: (boss.patternIndex % 2) * 0.26 });
        this.fireAimedBossVolley(boss, 3, 0.1, 285, 22);
      } else {
        this.fireBossBulletRing(boss, { count: 18, speed: 265, offset: boss.patternIndex * 0.12, damage: 25 });
        this.fireAimedBossVolley(boss, 7, 0.11, 315, 26);
        this.citadel.hp = Math.max(1, this.citadel.hp - 4);
      }
    } else if (boss.type === 'leviathan') {
      const count = phase === 1 ? 16 : (phase === 2 ? 20 : 28);
      this.fireBossBulletRing(boss, {
        count,
        speed: 185 + (phase * 40),
        offset: boss.patternIndex * (phase === 3 ? 0.19 : 0.08),
        damage: 18 + (phase * 5),
        radius: 8 + phase
      });
      if (phase >= 2) this.fireAimedBossVolley(boss, phase === 2 ? 3 : 7, 0.09, 290 + phase * 25, 25);
    } else {
      this.fireBossBulletRing(boss);
    }
  }

  updateDecoys(dt) {
    for (let i = this.decoys.length - 1; i >= 0; i--) {
      const d = this.decoys[i];
      d.life -= dt;

      if (!d.pulseTimer) d.pulseTimer = 0;
      d.pulseTimer += dt;

      if (d.pulseTimer >= 0.5) {
        d.pulseTimer = 0;
        [...this.enemies].forEach(e => {
          if (Math.hypot(e.x - d.x, e.y - d.y) < d.radius + (d.pulseRadius ?? 70)) {
            this.damageEnemy(e, d.pulseDamage ?? 30);
            if (d.healOnPulse) {
              this.healCitadel(d.healOnPulse);
            }
          }
        });
      }

      if (d.life <= 0) {
        this.createExplosion(d.x, d.y, d.explosionRadius || 110, d.explosionDamage ?? 90);
        this.decoys.splice(i, 1);
      }
    }
  }

  updateHazards(dt) {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const hazard = this.hazards[i];
      hazard.life -= dt;
      hazard.tickTimer += dt;
      if (hazard.tickTimer >= 0.45) {
        hazard.tickTimer = 0;
        [...this.enemies].forEach(enemy => {
          if (this.isEnemyFlying(enemy) && hazard.ground !== false) return;
          if (Math.hypot(enemy.x - hazard.x, enemy.y - hazard.y) <= hazard.radius + enemy.radius) {
            if (Number(hazard.damage) > 0) {
              this.damageEnemyFromDefense(hazard.sourceDefense, enemy, hazard.damage);
            }
            if (Number(hazard.slowMultiplier) > 0) {
              enemy.slowTimer = Math.max(Number(enemy.slowTimer) || 0, 0.8);
              enemy.slowSpeedMultiplier = Math.min(
                Number(enemy.slowSpeedMultiplier) || 1,
                Number(hazard.slowMultiplier)
              );
            }
            if (Number(hazard.damageTakenMultiplier) > 1) {
              enemy.markedDamageTakenMultiplier = Math.max(
                Number(enemy.markedDamageTakenMultiplier) || 1,
                Number(hazard.damageTakenMultiplier)
              );
              enemy.markedTimer = Math.max(Number(enemy.markedTimer) || 0, 0.9);
            }
            if (Number(hazard.armorReduction) > 0) {
              enemy.armorBreakMultiplier = Math.max(
                Number(enemy.armorBreakMultiplier) || 1,
                1 + Number(hazard.armorReduction)
              );
              enemy.armorBreakTimer = Math.max(Number(enemy.armorBreakTimer) || 0, 1);
            }
            if (
              hazard.heroId === 'rin'
              || ['flame', 'napalm'].includes(hazard.sourceDefense?.type)
            ) {
              this.applyRinArmorBreak(enemy);
            }
          }
        });
        if (Number(hazard.defenseHealPerTick) > 0) {
          this.placedTowers.forEach(defense => {
            if (Math.hypot(defense.x - hazard.x, defense.y - hazard.y) > hazard.radius) return;
            defense.hp = Math.min(
              defense.maxHp,
              defense.hp + Number(hazard.defenseHealPerTick)
            );
          });
        }
        if (this.selectedHero?.id === 'amara') {
          const passive = this.getHeroKit('amara')?.passive?.modifiers || {};
          const healingRadius = Number(passive.radius) || 125;
          const healing = Number(passive.healPerTick) || 3;
          this.placedTowers.forEach(defense => {
            if (Math.hypot(defense.x - hazard.x, defense.y - hazard.y) > healingRadius) return;
            defense.hp = Math.min(defense.maxHp, defense.hp + healing);
          });
        }
      }
      if (hazard.life <= 0) this.hazards.splice(i, 1);
    }
  }

  updateBossHazards(dt) {
    for (let index = this.bossHazards.length - 1; index >= 0; index--) {
      const hazard = this.bossHazards[index];
      hazard.life -= dt;
      hazard.tickTimer += dt;
      if (hazard.tickTimer >= 0.6) {
        hazard.tickTimer = 0;
        this.placedTowers.slice().forEach(defense => {
          if (Math.hypot(defense.x - hazard.x, defense.y - hazard.y) > hazard.radius + defense.radius) return;
          if (defense.ultimateInvulnerableTimer > 0) return;
          defense.hp -= hazard.damage;
          this.addFloatingText(
            `${hazard.label || 'MIASME'} -${hazard.damage}`,
            defense.x,
            defense.y - 28,
            hazard.color
          );
          if (defense.hp <= 0) {
            const defenseIndex = this.placedTowers.indexOf(defense);
            if (defenseIndex >= 0) this.placedTowers.splice(defenseIndex, 1);
          }
        });
      }
      if (hazard.life <= 0) this.bossHazards.splice(index, 1);
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= dt;
      if (Number.isFinite(particle.vx)) particle.x += particle.vx * dt;
      if (Number.isFinite(particle.vy)) particle.y += particle.vy * dt;
      if (particle.life <= 0) this.particles.splice(i, 1);
    }
  }

  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i];
      text.y -= 45 * dt;
      text.life -= dt;
      if (text.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  healCitadel(amount) {
    if (!this.citadel || !Number.isFinite(amount) || amount <= 0) {
      return { healed: 0, overheal: 0, storedCharge: Number(this.carmillaStoredCharge) || 0 };
    }
    const before = Math.max(0, Number(this.citadel.hp) || 0);
    const maximum = Math.max(1, Number(this.citadel.maxHp) || 1);
    const healed = Math.min(amount, Math.max(0, maximum - before));
    const overheal = Math.max(0, amount - healed);
    this.citadel.hp = Math.min(maximum, before + healed);

    if (this.selectedHero?.id === 'carmilla' && overheal > 0) {
      const modifiers = this.getHeroKit('carmilla')?.passive?.modifiers || {};
      const maximumStoredCharge = Number(modifiers.maximumStoredCharge) || 35;
      this.carmillaStoredCharge = Math.min(
        maximumStoredCharge,
        (Number(this.carmillaStoredCharge) || 0)
          + (overheal * (Number(modifiers.overhealToChargeRatio) || 0.45))
      );
    }
    return {
      healed,
      overheal,
      storedCharge: Number(this.carmillaStoredCharge) || 0
    };
  }

  applyRinArmorBreak(enemy) {
    if (!enemy || enemy.dead || this.selectedHero?.id !== 'rin') return;
    const modifiers = this.getHeroKit('rin')?.passive?.modifiers || {};
    const reduction = Number(modifiers.armorReductionPerStack) || 0.035;
    const maximumStacks = Math.max(1, Math.floor(Number(modifiers.maxStacks) || 5));
    enemy.rinEmberStacks = Math.min(
      maximumStacks,
      Math.max(0, Math.floor(Number(enemy.rinEmberStacks) || 0)) + 1
    );
    enemy.armorBreakMultiplier = Math.max(
      Number(enemy.armorBreakMultiplier) || 1,
      1 + (enemy.rinEmberStacks * reduction)
    );
    enemy.armorBreakTimer = Math.max(
      Number(enemy.armorBreakTimer) || 0,
      (Number(modifiers.stackDurationMs) || 4500) / 1000
    );
  }

  damageEnemyFromDefense(defense, enemy, amount) {
    if (!defense) {
      this.damageEnemy(enemy, amount);
      return;
    }
    const specialization = this.getDefenseSpecializationOptions(defense)
      .find(option => option.id === defense.specializationId);
    const modifiers = specialization?.modifiers || {};
    let adjustedDamage = amount;
    if (this.isEnemyFlying(enemy)) adjustedDamage *= Number(modifiers.flyingDamageMultiplier) || 1;
    if (enemy.isBoss) adjustedDamage *= Number(modifiers.eliteDamageMultiplier) || 1;
    if (['brute', 'bulwark'].includes(enemy.type)) {
      adjustedDamage *= Number(modifiers.heavyDamageMultiplier) || 1;
    }
    let ignoreShield = false;
    if (enemy.shield > 0 && enemy.type === 'bulwark') {
      const shieldArc = Number(EXPANSION?.enemyDefinitions?.bulwark?.shield?.frontalArcDegrees) || 150;
      const incomingAngle = Math.atan2(defense.y - enemy.y, defense.x - enemy.x);
      const facingAngle = Number(enemy.facingAngle) || 0;
      const delta = Math.atan2(
        Math.sin(incomingAngle - facingAngle),
        Math.cos(incomingAngle - facingAngle)
      );
      ignoreShield = Math.abs(delta) > (shieldArc * Math.PI / 360);
    }
    if (enemy.shield > 0 && !ignoreShield) {
      adjustedDamage *= Number(modifiers.shieldDamageMultiplier) || 1;
    }
    if (
      Number(modifiers.executeHealthThreshold) > 0
      && enemy.hp / Math.max(1, enemy.maxHp) <= Number(modifiers.executeHealthThreshold)
    ) {
      adjustedDamage = Math.max(adjustedDamage, enemy.hp + enemy.shield);
    }
    if (
      this.selectedHero?.id === 'vega'
      && ['plasma', 'orbital'].includes(defense.type)
      && (
        enemy.type === 'umbrael'
        || this.getBossDefinition(enemy.type)?.traits?.includes('shadow')
        || enemy.markedTimer > 0
      )
    ) {
      adjustedDamage *= Number(
        this.getHeroKit('vega')?.passive?.modifiers?.plasmaDamageMultiplier
      ) || 1.18;
    }

    const markMultiplier = Number(modifiers.markedDamageTakenMultiplier) || 0;
    if (markMultiplier > 1) {
      enemy.markedDamageTakenMultiplier = Math.max(
        Number(enemy.markedDamageTakenMultiplier) || 1,
        markMultiplier
      );
      enemy.markedTimer = Math.max(
        Number(enemy.markedTimer) || 0,
        (Number(modifiers.markDurationMs) || 5000) / 1000
      );
    }
    const corrosionPower = Number(modifiers.armorReductionMultiplier) || 0;
    if (corrosionPower > 0) {
      enemy.armorBreakMultiplier = Math.min(
        1.8,
        (Number(enemy.armorBreakMultiplier) || 1) + (0.05 * corrosionPower)
      );
      enemy.armorBreakTimer = 4;
    }

    this.damageEnemy(enemy, adjustedDamage, { ignoreShield });

    const resonanceThreshold = Math.floor(Number(modifiers.resonanceThreshold) || 0);
    if (resonanceThreshold > 0 && !enemy.dead) {
      enemy.resonanceStacks = (Number(enemy.resonanceStacks) || 0) + 1;
      if (enemy.resonanceStacks >= resonanceThreshold) {
        enemy.resonanceStacks = 0;
        this.damageEnemy(enemy, Number(modifiers.resonanceBurstDamage) || 0);
      }
    }
  }

  damageEnemy(enemy, amount, options = {}) {
    if (!enemy || enemy.dead || !Number.isFinite(amount) || amount <= 0) return;
    if (this.selectedHero?.id === 'nyx' && enemy.routeId) {
      if (!(this.nyxExposedRoutes instanceof Set)) this.nyxExposedRoutes = new Set();
      if (!this.nyxExposedRoutes.has(enemy.routeId)) {
        const reduction = Number(
          this.getHeroKit('nyx')?.passive?.modifiers?.resistanceReduction
        ) || 0.18;
        enemy.markedDamageTakenMultiplier = Math.max(
          Number(enemy.markedDamageTakenMultiplier) || 1,
          1 + reduction
        );
        enemy.markedTimer = Math.max(
          Number(enemy.markedTimer) || 0,
          (Number(this.getHeroKit('nyx')?.passive?.modifiers?.durationMs) || 7000) / 1000
        );
        this.nyxExposedRoutes.add(enemy.routeId);
      }
    }
    if (this.selectedHero?.id === 'kira' && enemy.routeId) {
      if (!(this.kiraMarkedRoutes instanceof Set)) this.kiraMarkedRoutes = new Set();
      if (!this.kiraMarkedRoutes.has(enemy.routeId)) {
        const modifiers = this.getHeroKit('kira')?.passive?.modifiers || {};
        enemy.markedDamageTakenMultiplier = Math.max(
          Number(enemy.markedDamageTakenMultiplier) || 1,
          Number(modifiers.markedDamageTakenMultiplier) || 1.22
        );
        enemy.markedTimer = Math.max(
          Number(enemy.markedTimer) || 0,
          (Number(modifiers.markDurationMs) || 8000) / 1000
        );
        this.kiraMarkedRoutes.add(enemy.routeId);
      }
    }
    let effectiveAmount = amount;
    if (this.selectedHero?.id === 'hana' && this.hanaPassiveReady) {
      effectiveAmount *= Number(
        this.getHeroKit('hana')?.passive?.modifiers?.damageMultiplier
      ) || 1.45;
      this.hanaPassiveReady = false;
      this.hanaPassiveChargeTimer = 0;
    } else if (this.selectedHero?.id === 'hana') {
      this.hanaPassiveChargeTimer = 0;
    }
    if (
      this.selectedHero?.id === 'freyja'
      && enemy.slowTimer > 0
      && ['brute', 'bulwark'].includes(enemy.type)
    ) {
      const modifiers = this.getHeroKit('freyja')?.passive?.modifiers || {};
      const maximumStacks = Number(modifiers.maximumStacks) || 4;
      enemy.freyjaRimeStacks = Math.min(
        maximumStacks,
        (Number(enemy.freyjaRimeStacks) || 0) + 1
      );
      enemy.armorBreakMultiplier = Math.max(
        Number(enemy.armorBreakMultiplier) || 1,
        1 + (enemy.freyjaRimeStacks * (Number(modifiers.stackReduction) || 0.12))
      );
      enemy.armorBreakTimer = Math.max(
        Number(enemy.armorBreakTimer) || 0,
        (Number(modifiers.stackDurationMs) || 5000) / 1000
      );
    }
    effectiveAmount *= Number(enemy.markedDamageTakenMultiplier) || 1;
    effectiveAmount *= Number(enemy.armorBreakMultiplier) || 1;
    if (enemy.slowTimer > 0) {
      effectiveAmount /= this.getRunModifierProduct('frozenArmorMultiplier');
    }
    const protectingBulwark = this.enemies.find(candidate => (
      candidate !== enemy
      && !candidate.dead
      && candidate.type === 'bulwark'
      && Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y) <= candidate.auraRadius
    ));
    if (protectingBulwark) {
      effectiveAmount *= 1 - Math.max(0, Math.min(0.8, protectingBulwark.auraDamageReduction || 0.18));
    }
    if (enemy.shield > 0 && options.ignoreShield !== true) {
      const absorbed = Math.min(enemy.shield, effectiveAmount);
      enemy.shield -= absorbed;
      effectiveAmount -= absorbed;
      this.addFloatingText(`Bouclier -${Math.round(absorbed)}`, enemy.x, enemy.y - 24, '#67e8f9');
    }
    enemy.hp -= effectiveAmount;
    enemy.hitAnimationTimer = 0.16;
    if (effectiveAmount > 0) {
      this.addFloatingText(`${Math.round(effectiveAmount)}`, enemy.x, enemy.y - 15, enemy.color);
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  addBoundedLoot(kind, loot) {
    const isCrate = kind === 'crate';
    const collection = isCrate ? this.crates : this.powerups;
    const maxItems = isCrate ? LOOT_CONFIG.maxCrates : LOOT_CONFIG.maxPowerups;
    const item = { ...loot, life: LOOT_CONFIG.lifetime };
    collection.push(item);
    if (collection.length > maxItems) {
      collection.splice(0, collection.length - maxItems);
    }
    return item;
  }

  killEnemy(enemy) {
    if (!enemy || enemy.dead) return;
    enemy.dead = true;
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
    this.hazards.forEach(hazard => {
      if (
        !hazard.sourceDefense
        || Math.hypot(enemy.x - hazard.x, enemy.y - hazard.y) > hazard.radius + enemy.radius
      ) return;
      const specialization = this.getDefenseSpecializationOptions(hazard.sourceDefense)
        .find(option => option.id === hazard.sourceDefense.specializationId);
      const growth = Number(specialization?.modifiers?.growthPerKill) || 0;
      const maximumMultiplier = Number(specialization?.modifiers?.maximumRadiusMultiplier) || 1;
      if (growth <= 0) return;
      hazard.radius = Math.min(
        (Number(hazard.initialRadius) || hazard.radius) * maximumMultiplier,
        hazard.radius + growth
      );
    });
    if (enemy.type === 'splitter') {
      const split = EXPANSION?.enemyDefinitions?.splitter?.split || {
        childType: 'swarmer',
        childCount: 3,
        childHpMultiplier: 0.8,
        spreadRadius: 34
      };
      for (let childIndex = 0; childIndex < (Number(split.childCount) || 3); childIndex++) {
        const angle = (Math.PI * 2 * childIndex) / (Number(split.childCount) || 3);
        this.spawnEnemy(split.childType || 'swarmer', enemy.routeIndex, {
          x: enemy.x + Math.cos(angle) * (Number(split.spreadRadius) || 34),
          y: enemy.y + Math.sin(angle) * (Number(split.spreadRadius) || 34),
          waypointIndex: enemy.waypointIndex,
          hpMultiplier: Number(split.childHpMultiplier) || 0.8,
          countForWave: false
        });
      }
    }
    this.getActiveRunMutators().forEach(mutator => {
      const chance = Number(mutator.modifiers?.splitOnDeathChance) || 0;
      if (!enemy.isBoss && enemy.type !== 'splitter' && this.getRunRandom() < chance) {
        const childCount = Math.max(1, Math.floor(Number(mutator.modifiers?.splitChildCount) || 1));
        for (let childIndex = 0; childIndex < childCount; childIndex++) {
          this.spawnEnemy(mutator.modifiers?.splitChildType || 'swarmer', enemy.routeIndex, {
            x: enemy.x + ((childIndex - ((childCount - 1) / 2)) * 16),
            y: enemy.y,
            waypointIndex: enemy.waypointIndex,
            countForWave: false
          });
        }
      }
    });

    this.mutantsKilled++;
    const bossRewards = enemy.bossRewards || null;
    this.score += bossRewards?.score
      || (enemy.isLeviathan ? 2000 : (enemy.isBoss ? 600 : 50));

    if (this.mutantsKilled >= 1) this.unlockAchievement('first_blood');
    if (enemy.isLeviathan) this.unlockAchievement('wave_15');

    const isHeavy = ['brute', 'bulwark'].includes(enemy.type);
    const isElite = enemy.isBoss || isHeavy || SPECIALIST_ENEMY_TYPES.includes(enemy.type);
    const vesperaPassive = this.selectedHero?.id === 'vespera'
      ? this.getHeroKit('vespera')?.passive
      : null;
    const vesperaModifiers = vesperaPassive?.modifiers || {};
    const rewardMultiplier = this.getRunModifierProduct('coinRewardMultiplier')
      * (isHeavy ? this.getRunModifierProduct('heavyRewardMultiplier') : 1)
      * (isElite ? (Number(vesperaModifiers.eliteRewardMultiplier) || 1) : 1)
      * this.getCoinValueMultiplier();
    const coinValue = Math.round(
      (bossRewards?.coins
        || (enemy.isBoss ? 100 : (this.getRunRandom() < 0.45 ? 10 : 0)))
      * rewardMultiplier
    );
    if (coinValue > 0) {
      this.coins += coinValue;
      this.totalCoinsEarned += coinValue;
      this.addFloatingText(`+${coinValue} 🪙`, enemy.x, enemy.y, '#f59e0b');
    }
    if (this.selectedHero?.id === 'maris') {
      const modifiers = this.getHeroKit('maris')?.passive?.modifiers || {};
      const distance = Math.hypot(enemy.x - this.citadel.x, enemy.y - this.citadel.y);
      if (
        distance >= (Number(modifiers.minimumDistance) || 360)
        && this.getRunRandom() < (Number(modifiers.coinChance) || 0.28)
      ) {
        const corsairShare = Number(modifiers.coinReward) || 4;
        this.coins += corsairShare;
        this.totalCoinsEarned += corsairShare;
        this.addFloatingText(`PART +${corsairShare}`, enemy.x, enemy.y - 25, '#38bdf8');
      }
    }
    if (vesperaPassive && isElite) {
      const buffRadius = Number(vesperaModifiers.radius) || 180;
      const buffDuration = (Number(vesperaModifiers.buffDurationMs) || 6000) / 1000;
      const damageMultiplier = Number(vesperaModifiers.onEliteDeathDamageMultiplier) || 1.18;
      let buffedDefenses = 0;
      this.placedTowers.forEach(defense => {
        if (Math.hypot(defense.x - enemy.x, defense.y - enemy.y) > buffRadius) return;
        defense.imperialBuffTimer = Math.max(
          Number(defense.imperialBuffTimer) || 0,
          buffDuration
        );
        defense.imperialDamageMultiplier = Math.max(
          Number(defense.imperialDamageMultiplier) || 1,
          damageMultiplier
        );
        buffedDefenses++;
      });
      if (buffedDefenses > 0) {
        this.addFloatingText(
          `TRIBUT ×${buffedDefenses}`,
          enemy.x,
          enemy.y - 26,
          '#ec4899'
        );
      }
    }

    this.gainFrenzy(enemy.isBoss ? 24 : 7);
    this.gainAffinity(enemy.isBoss ? 14 : 2);

    if (this.getRunRandom() < 0.08) {
      const pType = POWERUP_TYPES[Math.floor(this.getRunRandom() * POWERUP_TYPES.length)];
      this.addBoundedLoot('powerup', { x: enemy.x, y: enemy.y, radius: 16, type: pType });
    }

    const guaranteedCrateInterval = Math.floor(
      this.getRunModifierMaximum('guaranteedCrateEveryKills')
    );
    const guaranteedCrate = guaranteedCrateInterval > 0
      && this.mutantsKilled % guaranteedCrateInterval === 0;
    if (enemy.isBoss || guaranteedCrate || this.getRunRandom() < 0.07) {
      const isRed = enemy.isBoss || this.getRunRandom() < 0.25;
      this.addBoundedLoot('crate', { x: enemy.x, y: enemy.y, type: isRed ? 'red' : 'blue', radius: 14 });
      audio.playPickup();
    }

    for (let i = 0; i < 8; i++) {
      this.particles.push({ x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, radius: 3 + Math.random() * 4, color: enemy.color, life: 0.4 });
    }

    this.addXp(bossRewards?.xp || (enemy.isBoss ? 160 : 20));

    if (enemy.bossDefinitionId) {
      const firstDefeat = !this.defeatedBossIds.includes(enemy.bossDefinitionId);
      if (firstDefeat) {
        this.defeatedBossIds.push(enemy.bossDefinitionId);
        const permanentReward = Math.max(0, Math.floor(Number(bossRewards?.metaCoins) || 0));
        this.metaCoins += permanentReward;
        this.runMetaCoinsEarned += permanentReward;
        Object.values(HERO_CLASSES).forEach(hero => {
          if (
            hero.unlocked === false
            && hero.unlockRule?.type === 'boss_defeated'
            && hero.unlockRule.bossId === enemy.bossDefinitionId
          ) {
            hero.unlocked = true;
            this.unlockGalleryItem(hero.id);
            this.showFeedback(`${hero.name} rejoint la Salle de Commandement.`, '#00f0ff');
          }
        });
      }
      const definition = this.getBossDefinition(enemy.bossDefinitionId);
      this.showFeedback(
        `${definition?.name || enemy.name} neutralisée${firstDefeat ? ' · nouveau Trône consigné' : ''}`,
        enemy.color
      );
      this.queueBossCinematic(enemy.bossDefinitionId, 'defeat');
      this.saveProgress();
    }

    if (enemy.recruitableBossId) {
      this.triggerBossRecruitModal(enemy.recruitableBossId);
    }

    this.checkGalleryUnlocks();
    this.updateHUD();
  }

  gainFrenzy(amount) {
    if (this.isOverdriveActive) return;
    const chargeMultiplier = this.placedTowers
      .filter(tower => tower.type === 'shrine')
      .reduce((multiplier, shrine) => {
        const specialization = this.getDefenseSpecializationOptions(shrine)
          .find(option => option.id === shrine.specializationId);
        return multiplier * (Number(specialization?.modifiers?.ultimateChargeMultiplier) || 1);
      }, 1);
    this.frenzyMeter = Math.min(this.maxFrenzyMeter, this.frenzyMeter + (amount * chargeMultiplier));
    if (this.frenzyMeter >= this.maxFrenzyMeter) {
      this.announce('Overdrive prêt. Appuyez sur F ou utilisez le bouton Overdrive.');
    }
  }

  updatePowerups(dt = 0) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.life = Number.isFinite(p.life) ? p.life - dt : LOOT_CONFIG.lifetime;
      if (p.life <= 0) {
        this.powerups.splice(i, 1);
        continue;
      }
      if (Math.hypot(this.citadel.x - p.x, this.citadel.y - p.y) < this.citadel.radius + p.radius + (this.shopUpgrades.magnetRange * 20) || this.isInsideMagnetField(p)) {
        this.activatePowerup(p.type);
        this.powerups.splice(i, 1);
      }
    }
  }

  activatePowerup(p) {
    audio.playPickup();
    this.addFloatingText(`✨ POWER-UP: ${p.name}!`, this.citadel.x, this.citadel.y - 60, p.color);

    if (p.id === 'nuke') {
      audio.playNuke();
      [...this.enemies].forEach(e => this.damageEnemy(e, 9999));
    } else if (p.id === 'freeze') {
      audio.playFreeze();
      this.freezeTimer = 5.0;
    } else if (p.id === 'quad') {
      this.quadDamageTimer = 8.0;
    } else if (p.id === 'magnet') {
      this.crates.forEach(c => { c.x = this.citadel.x; c.y = this.citadel.y; });
      this.powerups.forEach(powerup => { powerup.x = this.citadel.x; powerup.y = this.citadel.y; });
    } else if (p.id === 'invincible') {
      this.invincibleTimer = 6.0;
    } else if (p.id === 'frenzy') {
      this.frenzyMeter = this.maxFrenzyMeter;
    }
    this.updateHUD();
  }

  addXp(amount) {
    this.xp += amount;
    while (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.level++;
      this.nextLevelXp = Math.round(this.nextLevelXp * 1.3);
      this.pendingLevelChoices++;
    }
    if (this.pendingLevelChoices > 0 && !document.getElementById('level-up-modal')?.classList.contains('active')) {
      audio.playPickup();
      this.triggerLevelUpModal();
    }
  }

  updateCrates(dt = 0) {
    for (let i = this.crates.length - 1; i >= 0; i--) {
      const c = this.crates[i];
      c.life = Number.isFinite(c.life) ? c.life - dt : LOOT_CONFIG.lifetime;
      if (c.life <= 0) {
        this.crates.splice(i, 1);
        continue;
      }
      if (Math.hypot(this.citadel.x - c.x, this.citadel.y - c.y) < this.citadel.radius + c.radius + (this.shopUpgrades.magnetRange * 20) || this.isInsideMagnetField(c)) {
        audio.playPickup();
        if (c.type === 'red') this.triggerEvolutionModal();
        else this.triggerLevelUpModal();
        this.crates.splice(i, 1);
        break;
      }
    }
  }

  isInsideMagnetField(item) {
    return this.placedTowers.some(tower => tower.type === 'magnet' && Math.hypot(tower.x - item.x, tower.y - item.y) <= tower.range);
  }

  getCoinValueMultiplier() {
    return this.placedTowers
      .filter(tower => tower.type === 'magnet')
      .reduce((multiplier, magnet) => {
        const specialization = this.getDefenseSpecializationOptions(magnet)
          .find(option => option.id === magnet.specializationId);
        return multiplier * (Number(specialization?.modifiers?.coinValueMultiplier) || 1);
      }, 1);
  }

  triggerHeroAbility() {
    if (this.abilityCooldownTimer > 0 || this.isPaused) return;
    return this.armHeroAbilityTargeting();
  }

  armHeroAbilityTargeting() {
    if (this.abilityCooldownTimer > 0 || this.isPaused || this.isGameOver) {
      return { ok: false, reason: 'unavailable' };
    }
    const kit = this.getHeroKit(this.selectedHero.id);
    this.activeHeroTargeting = {
      heroId: this.selectedHero.id,
      targeting: kit?.active?.targeting || 'ground_point',
      ability: kit?.active || null
    };
    if (this.canvas?.dataset) this.canvas.dataset.abilityTargeting = this.activeHeroTargeting.targeting;
    const button = document.getElementById('btn-hero-skill');
    button?.setAttribute('aria-pressed', 'true');
    this.showFeedback(`${this.selectedHero.abilityName} · choisissez une cible`, '#00f0ff');
    return { ok: true, targeting: this.activeHeroTargeting };
  }

  cancelHeroAbilityTargeting() {
    if (!this.activeHeroTargeting) return false;
    this.activeHeroTargeting = null;
    if (this.canvas?.dataset) delete this.canvas.dataset.abilityTargeting;
    document.getElementById('btn-hero-skill')?.setAttribute('aria-pressed', 'false');
    this.announce('Ciblage du pouvoir annulé.');
    return true;
  }

  executeHeroAbilityAt(x, y) {
    const targeting = this.activeHeroTargeting;
    if (!targeting || targeting.heroId !== this.selectedHero.id) {
      return { ok: false, reason: 'not-armed' };
    }
    const metrics = this.getBattlefieldCameraMetrics();
    const targetX = Math.max(metrics.approachLeft, Math.min(metrics.approachRight, Number(x) || 0));
    const targetY = Math.max(metrics.approachTop, Math.min(metrics.approachBottom, Number(y) || 0));
    const heroId = this.selectedHero.id;
    const effect = targeting.ability?.effect || {};
    let affected = 0;
    let color = '#00f0ff';

    if (heroId === 'aria') {
      this.decoys.push({
        x: targetX,
        y: targetY,
        radius: Number(effect.radius) || 125,
        life: (Number(effect.durationMs) || 6000) / 1000,
        shieldHp: Number(effect.shieldHp) || 850,
        pulseDamage: 0,
        pulseRadius: 0,
        explosionDamage: 0,
        explosionRadius: 0,
        color: '#67e8f9',
        heroId
      });
      color = '#67e8f9';
    } else if (heroId === 'kira') {
      this.decoys.push({
        x: targetX,
        y: targetY,
        radius: 24,
        life: (Number(effect.durationMs) || 5200) / 1000,
        pulseDamage: 0,
        pulseRadius: Number(effect.tauntRadius) || 150,
        explosionDamage: Number(effect.explosionDamage) || 260,
        explosionRadius: Number(effect.explosionRadius) || 105,
        color: '#a855f7',
        heroId
      });
      color = '#a855f7';
    } else if (heroId === 'rin') {
      this.hazards.push({
        x: targetX,
        y: targetY,
        radius: Number(effect.radius) || 145,
        damage: (Number(effect.damagePerSecond) || 72) * 0.45,
        life: (Number(effect.durationMs) || 6500) / 1000,
        tickTimer: 0,
        color: '#f97316',
        ground: false,
        heroId: 'rin',
        pullStrength: Number(effect.pullStrength) || 0.5
      });
      color = '#f97316';
    } else if (heroId === 'selene') {
      const angle = Math.atan2(targetY - this.citadel.y, targetX - this.citadel.x);
      const end = {
        x: this.citadel.x + Math.cos(angle) * (Number(effect.length) || 560),
        y: this.citadel.y + Math.sin(angle) * (Number(effect.length) || 560)
      };
      this.enemies.forEach(enemy => {
        if (this.distToSegment(enemy, this.citadel, end) <= enemy.radius + ((Number(effect.width) || 52) / 2)) {
          this.damageEnemy(enemy, Number(effect.damage) || 310);
          enemy.slowTimer = Math.max(enemy.slowTimer || 0, (Number(effect.slowDurationMs) || 5000) / 1000);
          affected++;
        }
      });
      this.particles.push({
        type: 'rail_beam',
        x1: this.citadel.x,
        y1: this.citadel.y,
        x2: end.x,
        y2: end.y,
        life: 0.5,
        color: '#67e8f9'
      });
      color = '#67e8f9';
    } else if (heroId === 'vespera') {
      const enemy = this.enemies
        .filter(candidate => !candidate.isBoss && !candidate.dead)
        .sort((left, right) => (
          Math.hypot(left.x - targetX, left.y - targetY) - Math.hypot(right.x - targetX, right.y - targetY)
        ))[0];
      if (!enemy || Math.hypot(enemy.x - targetX, enemy.y - targetY) > 120) {
        return { ok: false, reason: 'invalid-target' };
      }
      enemy.convertedTimer = (Number(effect.durationMs) || 8500) / 1000;
      enemy.convertedDamageMultiplier = Number(effect.convertedDamageMultiplier) || 1.4;
      affected = 1;
      color = '#ec4899';
    } else if (heroId === 'carmilla') {
      const defense = this.placedTowers
        .slice()
        .sort((left, right) => (
          Math.hypot(left.x - targetX, left.y - targetY) - Math.hypot(right.x - targetX, right.y - targetY)
        ))[0];
      if (!defense || Math.hypot(defense.x - targetX, defense.y - targetY) > this.getDefenseHitRadius(defense) * 2) {
        return { ok: false, reason: 'invalid-target' };
      }
      const storedCharge = Math.max(0, Number(this.carmillaStoredCharge) || 0);
      const reserveDamageMultiplier = 1 + (storedCharge / 100);
      const reserveDurationMultiplier = 1 + (storedCharge / 200);
      defense.hp = Math.max(1, defense.hp * (1 - (Number(effect.defenseHpCostPercent) || 0.22)));
      defense.damage *= (Number(effect.damageMultiplier) || 1.75) * reserveDamageMultiplier;
      if (defense.fireRate > 0) defense.fireRate *= Number(effect.fireRateMultiplier) || 0.65;
      defense.abilityBuffTimer = (
        ((Number(effect.durationMs) || 7500) / 1000) * reserveDurationMultiplier
      );
      defense.abilityLifesteal = (Number(effect.lifesteal) || 0.18) + (storedCharge / 500);
      this.carmillaStoredCharge = 0;
      affected = 1;
      color = '#be123c';
    } else if (CHARACTER_EXPANSION?.heroKits?.[heroId]) {
      const mechanic = targeting.ability?.mechanic;
      if (mechanic === 'nyx_chromatic_breach') {
        this.hazards.push({
          x: targetX,
          y: targetY,
          radius: Number(effect.radius) || 135,
          damage: 1,
          life: (Number(effect.durationMs) || 6000) / 1000,
          tickTimer: 0,
          color: '#22d3ee',
          ground: false,
          heroId,
          slowMultiplier: Number(effect.slowMultiplier) || 0.62,
          damageTakenMultiplier: Number(effect.damageTakenMultiplier) || 1.2
        });
        affected = 1;
        color = '#22d3ee';
      } else if (mechanic === 'aurelia_chrono_valve') {
        this.placedTowers.forEach(defense => {
          if (Math.hypot(defense.x - targetX, defense.y - targetY) > Number(effect.radius || 170)) return;
          if (defense.fireRate > 0) {
            defense.fireRate *= Number(effect.fireRateMultiplier) || 0.72;
          }
          defense.timer += Number(effect.cooldownReductionMs) || 400;
          defense.abilityBuffTimer = Math.max(
            Number(defense.abilityBuffTimer) || 0,
            (Number(effect.durationMs) || 7000) / 1000
          );
          affected++;
        });
        color = '#f59e0b';
      } else if (mechanic === 'maris_blacktide_broadside') {
        const nearestEnemy = this.enemies
          .filter(enemy => !enemy.dead)
          .sort((left, right) => (
            Math.hypot(left.x - targetX, left.y - targetY)
            - Math.hypot(right.x - targetX, right.y - targetY)
          ))[0];
        const nearestRoute = this.spawnRoutes.find(route => route.id === nearestEnemy?.routeId)
          || this.spawnRoutes
          .map(route => ({
            route,
            distance: Math.min(
              ...(route.polyline || [route.spawn]).map(point => Math.hypot(point.x - targetX, point.y - targetY))
            )
          }))
          .sort((left, right) => left.distance - right.distance)[0]?.route;
        this.enemies
          .filter(enemy => !enemy.dead && enemy.routeId === nearestRoute?.id)
          .sort((left, right) => right.waypointIndex - left.waypointIndex)
          .slice(0, Number(effect.shellCount) || 7)
          .forEach(enemy => {
            this.createExplosion(
              enemy.x,
              enemy.y,
              Number(effect.blastRadius) || 72,
              Number(effect.damage) || 105
            );
            affected++;
          });
        color = '#38bdf8';
      } else if (mechanic === 'zahra_thousand_skies_mirage') {
        this.decoys.push({
          x: targetX,
          y: targetY,
          radius: Number(effect.radius) || 150,
          life: (Number(effect.durationMs) || 6500) / 1000,
          pulseDamage: (Number(effect.burnDamagePerSecond) || 38) * 0.5,
          pulseRadius: Number(effect.radius) || 150,
          explosionDamage: 0,
          color: '#fbbf24',
          heroId
        });
        affected = 1;
        color = '#fbbf24';
      } else if (mechanic === 'mircalla_porcelain_court') {
        this.decoys.push({
          x: targetX,
          y: targetY,
          radius: Number(effect.radius) || 145,
          life: (Number(effect.durationMs) || 7500) / 1000,
          pulseDamage: 0,
          pulseRadius: 0,
          explosionDamage: 0,
          projectileInterceptions: (Number(effect.sentinelCount) || 4)
            * (Number(effect.interceptsPerSentinel) || 3),
          color: '#f9a8d4',
          heroId
        });
        affected = 1;
        color = '#f9a8d4';
      } else if (mechanic === 'isolde_mourne_requiem') {
        this.enemies.forEach(enemy => {
          if (Math.hypot(enemy.x - targetX, enemy.y - targetY) > Number(effect.radius || 210)) return;
          enemy.damageDebuffMultiplier = Number(effect.enemyDamageMultiplier) || 0.72;
          enemy.damageDebuffTimer = (Number(effect.durationMs) || 6000) / 1000;
          affected++;
        });
        this.placedTowers
          .filter(defense => defense.type === 'barrier')
          .forEach(defense => {
            defense.hp = Math.min(
              defense.maxHp,
              defense.hp + (defense.maxHp * (Number(effect.barrierHealPercent) || 0.22))
            );
          });
        color = '#c084fc';
      } else if (['hana_kurogane_moon', 'vega_heliosphere_lance'].includes(mechanic)) {
        const angle = Math.atan2(targetY - this.citadel.y, targetX - this.citadel.x);
        const end = {
          x: this.citadel.x + Math.cos(angle) * (Number(effect.length) || 640),
          y: this.citadel.y + Math.sin(angle) * (Number(effect.length) || 640)
        };
        this.enemies.forEach(enemy => {
          if (this.distToSegment(enemy, this.citadel, end) > enemy.radius + ((Number(effect.width) || 46) / 2)) return;
          this.damageEnemy(enemy, Number(effect.damage) || 360, {
            ignoreShield: mechanic === 'vega_heliosphere_lance'
          });
          if (!enemy.dead && mechanic === 'hana_kurogane_moon') {
            enemy.markedDamageTakenMultiplier = Math.max(
              Number(enemy.markedDamageTakenMultiplier) || 1,
              1.2
            );
            enemy.markedTimer = (Number(effect.markDurationMs) || 5500) / 1000;
          }
          affected++;
        });
        this.particles.push({
          type: 'rail_beam',
          x1: this.citadel.x,
          y1: this.citadel.y,
          x2: end.x,
          y2: end.y,
          life: 0.5,
          color: mechanic === 'hana_kurogane_moon' ? '#fb7185' : '#fbbf24'
        });
        color = mechanic === 'hana_kurogane_moon' ? '#fb7185' : '#fbbf24';
      } else if (mechanic === 'freyja_blizzard_oath') {
        this.hazards.push({
          x: targetX,
          y: targetY,
          radius: Number(effect.radius) || 175,
          damage: 8,
          life: (Number(effect.durationMs) || 7000) / 1000,
          tickTimer: 0,
          color: '#67e8f9',
          ground: false,
          heroId,
          slowMultiplier: Number(effect.slowMultiplier) || 0.5
        });
        this.hostileProjectileFreezeTimer = Math.max(
          this.hostileProjectileFreezeTimer,
          (Number(effect.projectileFreezeMs) || 2500) / 1000
        );
        affected = 1;
        color = '#67e8f9';
      } else if (mechanic === 'amara_verdigris_bloom') {
        this.hazards.push({
          x: targetX,
          y: targetY,
          radius: Number(effect.radius) || 155,
          damage: (Number(effect.damagePerSecond) || 62) * 0.45,
          life: (Number(effect.durationMs) || 8500) / 1000,
          tickTimer: 0,
          color: '#34d399',
          ground: false,
          heroId,
          armorReduction: Number(effect.armorReduction) || 0.24,
          defenseHealPerTick: (Number(effect.defenseHealPerSecond) || 8) * 0.45
        });
        affected = 1;
        color = '#34d399';
      }
    }

    audio.playAbility();
    this.abilityCooldownTimer = (Number(targeting.ability?.cooldownMs)
      ? targeting.ability.cooldownMs / 1000
      : this.selectedHero.cooldown) * this.getHeroCooldownMultiplier();
    if (heroId === 'kira') this.decoysDeployedCount++;
    this.heroFacingAngle = Math.atan2(targetY - this.citadel.y, targetX - this.citadel.x);
    this.heroAnimationState = 'ability';
    this.heroAnimationTimer = 0.72;
    this.activeHeroTargeting = null;
    if (this.canvas?.dataset) delete this.canvas.dataset.abilityTargeting;
    document.getElementById('btn-hero-skill')?.setAttribute('aria-pressed', 'false');
    this.showFeedback(`${this.selectedHero.abilityName} déclenché${affected ? ` · ${affected}` : ''}`, color);
    this.checkGalleryUnlocks();
    return { ok: true, heroId, affected };
  }

  applySelectedHeroUltimate() {
    const heroId = this.selectedHero.id;
    const kit = this.getHeroKit(heroId);
    const effect = kit?.ultimate?.effect || {};

    if (heroId === 'aria') {
      this.healCitadel(
        this.citadel.maxHp * (Number(effect.citadelHealPercent) || 0.2)
      );
      const duration = (Number(effect.barrierInvulnerabilityMs) || 7000) / 1000;
      this.placedTowers
        .filter(defense => defense.type === 'barrier')
        .forEach(defense => {
          defense.ultimateInvulnerableTimer = Math.max(
            Number(defense.ultimateInvulnerableTimer) || 0,
            duration
          );
        });
      this.heroUltimateDefenseDamageTimer = duration;
    } else if (heroId === 'kira') {
      this.enemies
        .filter(enemy => !enemy.dead && !enemy.isBoss)
        .sort((left, right) => right.hp - left.hp)
        .slice(0, Number(effect.targetCount) || 6)
        .forEach(enemy => {
          this.damageEnemy(enemy, Number(effect.damage) || 620);
          if (!enemy.dead) {
            enemy.markedDamageTakenMultiplier = Math.max(
              Number(enemy.markedDamageTakenMultiplier) || 1,
              1.22
            );
            enemy.markedTimer = Math.max(Number(enemy.markedTimer) || 0, 8);
          }
        });
    } else if (heroId === 'rin') {
      this.spawnRoutes.forEach(route => {
        const points = route.polyline || [];
        const anchor = points[Math.max(0, Math.floor((points.length - 1) / 2))] || route.spawn;
        this.hazards.push({
          x: anchor.x,
          y: anchor.y,
          radius: 120,
          damage: (Number(effect.routeDamagePerSecond) || 95) * 0.45,
          life: (Number(effect.durationMs) || 5500) / 1000,
          tickTimer: 0,
          color: '#f97316',
          ground: false,
          heroId: 'rin'
        });
      });
    } else if (heroId === 'selene') {
      const duration = (Number(effect.enemyTimeStopMs) || 5000) / 1000;
      this.freezeTimer = Math.max(this.freezeTimer, duration);
      this.hostileProjectileFreezeTimer = Math.max(
        this.hostileProjectileFreezeTimer,
        (Number(effect.hostileProjectileTimeStopMs) || 5000) / 1000
      );
    } else if (heroId === 'vespera') {
      const fearDuration = (Number(effect.fearDurationMs) || 4200) / 1000;
      this.enemies
        .filter(enemy => !enemy.dead && !enemy.isBoss)
        .forEach(enemy => {
          enemy.stunTimer = Math.max(enemy.stunTimer || 0, fearDuration);
        });
      const threshold = Number(effect.permanentConvertHealthThreshold) || 0.2;
      const converted = this.enemies
        .filter(enemy => (
          !enemy.dead
          && !enemy.isBoss
          && SPECIALIST_ENEMY_TYPES.includes(enemy.type)
          && enemy.hp / Math.max(1, enemy.maxHp) <= threshold
        ))
        .sort((left, right) => right.damage - left.damage)[0];
      if (converted) {
        const index = this.enemies.indexOf(converted);
        if (index >= 0) this.enemies.splice(index, 1);
        this.mercenaries.push({
          x: converted.x,
          y: converted.y,
          angle: this.mercenaries.length * ((Math.PI * 2) / 3),
          damage: Math.max(30, converted.damage * 1.4),
          fireRate: 520,
          range: 330,
          timer: 0,
          name: `${converted.name} ralliée`
        });
      }
    } else if (heroId === 'carmilla') {
      [...this.enemies].forEach(enemy => {
        this.damageEnemy(enemy, Number(effect.globalDamage) || 360);
      });
      this.placedTowers.forEach(defense => {
        defense.hp = Math.min(
          defense.maxHp,
          defense.hp + (defense.maxHp * (Number(effect.defenseHealPercent) || 0.35))
        );
      });
      this.invincibleTimer = Math.max(
        this.invincibleTimer,
        (Number(effect.durationMs) || 6000) / 1000
      );
    } else if (CHARACTER_EXPANSION?.heroKits?.[heroId]) {
      const mechanic = kit?.ultimate?.mechanic;
      if (mechanic === 'nyx_city_blackout') {
        const duration = (Number(effect.stunDurationMs) || 4200) / 1000;
        this.enemies.forEach(enemy => {
          enemy.stunTimer = Math.max(Number(enemy.stunTimer) || 0, duration);
        });
        this.placedTowers
          .filter(defense => defense.id === 'railgun_pylon')
          .forEach(defense => {
            defense.damage *= Number(effect.railDamageMultiplier) || 1.35;
            defense.abilityBuffTimer = Math.max(
              Number(defense.abilityBuffTimer) || 0,
              (Number(effect.buffDurationMs) || 6500) / 1000
            );
          });
      } else if (mechanic === 'aurelia_golden_minute') {
        this.freezeTimer = Math.max(
          this.freezeTimer,
          (Number(effect.enemyFreezeMs) || 4500) / 1000
        );
        this.placedTowers.forEach(defense => {
          if (defense.fireRate > 0) {
            defense.fireRate *= Number(effect.defenseFireRateMultiplier) || 0.62;
          }
          defense.abilityBuffTimer = Math.max(
            Number(defense.abilityBuffTimer) || 0,
            (Number(effect.defenseBuffMs) || 6000) / 1000
          );
        });
      } else if (mechanic === 'maris_spectral_armada') {
        const totalDamage = (Number(effect.volleys) || 3) * (Number(effect.damage) || 150);
        [...this.enemies].forEach(enemy => {
          this.damageEnemy(enemy, enemy.isBoss ? totalDamage * 0.55 : totalDamage);
        });
      } else if (mechanic === 'zahra_palace_of_dawn') {
        this.spawnRoutes.forEach(route => {
          const points = route.polyline || [];
          const anchor = points[Math.max(0, Math.floor((points.length - 1) / 2))] || route.spawn;
          this.decoys.push({
            x: anchor.x,
            y: anchor.y,
            radius: 120,
            life: (Number(effect.durationMs) || 8000) / 1000,
            shieldHp: Number(effect.decoyHpPerRoute) || 700,
            projectileInterceptions: Number(effect.projectileAbsorptions) || 12,
            pulseDamage: 0,
            pulseRadius: 0,
            explosionDamage: 0,
            color: '#fbbf24',
            heroId
          });
        });
      } else if (mechanic === 'mircalla_black_dollhouse') {
        this.enemies
          .filter(enemy => SPECIALIST_ENEMY_TYPES.includes(enemy.type))
          .slice(0, Number(effect.targetLimit) || 8)
          .forEach(enemy => {
            enemy.stunTimer = Math.max(
              Number(enemy.stunTimer) || 0,
              (Number(effect.specialistStasisMs) || 5000) / 1000
            );
            this.damageEnemy(
              enemy,
              Math.max(80, enemy.damage * (Number(effect.reflectedDamageMultiplier) || 1.4))
            );
          });
      } else if (mechanic === 'isolde_choir_of_last') {
        const totalDamage = (Number(effect.pulseCount) || 5) * (Number(effect.pulseDamage) || 95);
        [...this.enemies].forEach(enemy => {
          this.damageEnemy(enemy, enemy.isBoss ? totalDamage * 0.45 : totalDamage);
          if (!enemy.dead && !enemy.isBoss) {
            enemy.stunTimer = Math.max(
              Number(enemy.stunTimer) || 0,
              (Number(effect.finalFearMs) || 3200) / 1000
            );
          }
        });
      } else if (mechanic === 'hana_seven_cuts') {
        const targets = this.enemies
          .filter(enemy => !enemy.dead)
          .sort((left, right) => (
            Math.hypot(left.x - this.citadel.x, left.y - this.citadel.y)
            - Math.hypot(right.x - this.citadel.x, right.y - this.citadel.y)
          ));
        const strikeCount = Math.max(1, Math.floor(Number(effect.strikeCount) || 7));
        for (let strikeIndex = 0; strikeIndex < strikeCount && targets.length > 0; strikeIndex++) {
          const enemy = targets[strikeIndex % targets.length];
          if (enemy.dead) {
            targets.splice(strikeIndex % targets.length, 1);
            strikeIndex--;
            continue;
          }
          const multiplier = enemy.isBoss ? (Number(effect.bossDamageMultiplier) || 0.3) : 1;
          this.damageEnemy(enemy, (Number(effect.strikeDamage) || 285) * multiplier);
        }
      } else if (mechanic === 'freyja_fimbul_countercharge') {
        [...this.enemies].forEach(enemy => {
          const angle = Math.atan2(enemy.y - this.citadel.y, enemy.x - this.citadel.x);
          const pushDistance = Number(effect.pushDistance) || 150;
          enemy.x += Math.cos(angle) * pushDistance;
          enemy.y += Math.sin(angle) * pushDistance;
          if (enemy.slowTimer > 0) {
            this.damageEnemy(enemy, Number(effect.frozenDamage) || 420);
            if (!enemy.dead) {
              enemy.armorBreakMultiplier = Math.max(
                Number(enemy.armorBreakMultiplier) || 1,
                1 + (Number(effect.armorBreak) || 0.3)
              );
              enemy.armorBreakTimer = (Number(effect.armorBreakMs) || 6500) / 1000;
            }
          }
        });
      } else if (mechanic === 'vega_solari_corona') {
        const totalDamage = (Number(effect.pulseCount) || 3) * (Number(effect.globalDamage) || 180);
        [...this.enemies].forEach(enemy => {
          this.damageEnemy(enemy, enemy.isBoss ? totalDamage * 0.6 : totalDamage);
        });
        this.enemyBullets = this.enemyBullets.filter(bullet => (
          Math.hypot(bullet.x - this.citadel.x, bullet.y - this.citadel.y)
          > (Number(effect.projectileClearRadius) || 1200)
        ));
      } else if (mechanic === 'amara_garden_after_ruin') {
        const anchors = this.enemies
          .filter(enemy => !enemy.dead)
          .slice(0, Number(effect.gardenCount) || 8)
          .map(enemy => ({ x: enemy.x, y: enemy.y }));
        while (anchors.length < Math.min(Number(effect.gardenCount) || 8, this.spawnRoutes.length)) {
          const route = this.spawnRoutes[anchors.length];
          const points = route.polyline || [];
          anchors.push(points[Math.max(0, Math.floor((points.length - 1) / 2))] || route.spawn);
        }
        anchors.forEach(anchor => {
          this.hazards.push({
            x: anchor.x,
            y: anchor.y,
            radius: Number(effect.radius) || 115,
            damage: (Number(effect.damagePerSecond) || 78) * 0.45,
            life: (Number(effect.durationMs) || 7000) / 1000,
            tickTimer: 0,
            color: '#34d399',
            ground: false,
            heroId
          });
        });
        this.healCitadel(this.citadel.maxHp * (Number(effect.citadelHealPercent) || 0.16));
      }
    }

    this.showFeedback(kit?.ultimate?.name || 'Ultime de Valkyrie', '#f59e0b');
    this.updateHUD();
  }

  triggerOverdrive() {
    if (this.isPaused || this.isGameOver || this.isOverdriveActive) return;
    if (this.frenzyMeter < this.maxFrenzyMeter) {
      this.announce(`Overdrive indisponible. Charge à ${Math.round(this.frenzyMeter)} pour cent.`);
      return;
    }

    audio.playOverdrive();
    this.isOverdriveActive = true;
    this.overdriveTimer = 6.0;
    this.overdriveCount++;
    this.heroAnimationState = 'ultimate';
    this.heroAnimationTimer = 0.95;
    this.applySelectedHeroUltimate();

    if (this.overdriveCount >= 3) this.unlockAchievement('frenzy_master');

    this.addFloatingText('🔥 OVERDRIVE FRÉNÉSIE ACTIVÉ !', this.citadel.x, this.citadel.y - 70, '#f59e0b');
    this.unlockGalleryItem('selene');
    this.updateHUD();
  }

  // --- Sub-Modals Handlers --- //

  openBiolabModal() {
    const modal = document.getElementById('biolab-modal');
    if (!modal) return;
    document.getElementById('biolab-coins-txt').textContent = `${this.coins} 🪙`;
    const buyButton = document.getElementById('btn-buy-pet-1');
    const upgradeButton = document.getElementById('btn-upgrade-pets');
    const petLevel = this.petDrones.length ? Math.max(...this.petDrones.map(drone => Math.max(1, Number(drone.level) || 1))) : 1;
    const activationCost = 150 + (this.petDrones.length * 50);
    const upgradeCost = 100 + (petLevel * 75);
    const status = document.getElementById('biolab-status-txt');
    if (status) status.textContent = `Escadrille : ${this.petDrones.length} / 3 · Niveau ${petLevel}`;
    buyButton.textContent = this.petDrones.length >= 3 ? 'ESCADRILLE COMPLÈTE' : `ACTIVER · ${activationCost} 🪙`;
    buyButton.disabled = this.petDrones.length >= 3 || this.coins < activationCost;
    upgradeButton.textContent = petLevel >= 3 ? 'NIVEAU MAXIMUM' : `AMÉLIORER · ${upgradeCost} 🪙`;
    upgradeButton.disabled = !this.petDrones.length || petLevel >= 3 || this.coins < upgradeCost;

    buyButton.onclick = () => {
      if (this.petDrones.length < 3 && this.coins >= activationCost) {
        this.coins -= activationCost;
        this.petDrones.push({
          angle: this.petDrones.length * ((Math.PI * 2) / 3),
          timer: 0,
          level: petLevel,
          damage: 25 * (1 + ((petLevel - 1) * 0.55)),
          fireRate: 400 * (1 - ((petLevel - 1) * 0.12)),
          name: 'Chiroptère IA'
        });
        audio.playPickup();
        this.showFeedback('Familier IA Chiroptère activé !', '#ec4899');
        this.openBiolabModal();
        this.updateHUD();
      }
    };
    upgradeButton.onclick = () => {
      if (!this.petDrones.length || petLevel >= 3 || this.coins < upgradeCost) return;
      this.coins -= upgradeCost;
      const nextLevel = petLevel + 1;
      this.petDrones.forEach(drone => {
        drone.level = nextLevel;
        drone.damage = 25 * (1 + ((nextLevel - 1) * 0.55));
        drone.fireRate = 400 * (1 - ((nextLevel - 1) * 0.12));
      });
      audio.playPickup();
      this.showFeedback(`Escadrille Chiroptère · niveau ${nextLevel}`, '#ec4899');
      this.openBiolabModal();
      this.updateHUD();
    };
    this.openModal(modal);
  }

  openTowerInfinitumModal() {
    if (this.isTowerMode) {
      this.showFeedback('Un étage de la Tour est déjà en cours.', '#a855f7');
      return;
    }
    const modal = document.getElementById('tower-infinitum-modal');
    if (!modal) return;
    document.getElementById('tower-floor-txt').textContent = this.towerCompleted
      ? 'Tour maîtrisée · Étage 100 rejouable'
      : `Étage ${this.towerFloor} / 100`;
    const mutators = (EXPANSION.infinitumMutators || []).length > 0
      ? EXPANSION.infinitumMutators
      : [
        { id: 'armored', name: 'Carapace abyssale', description: '+65 % de santé ennemie.' },
        { id: 'haste', name: 'Pulsation accélérée', description: '+35 % de vitesse ennemie.' },
        { id: 'swarm', name: 'Marée démoniaque', description: '+50 % d’ennemis, cadence accrue.' }
      ];
    if (!this.pendingTowerMutator || this.pendingTowerMutatorFloor !== this.towerFloor) {
      const available = mutators.filter(mutator => !this.towerMutators.some(active => active.id === mutator.id));
      const candidates = available.length > 0 ? available : mutators;
      this.pendingTowerMutator = candidates[Math.floor(this.getRunRandom() * candidates.length)];
      this.pendingTowerMutatorFloor = this.towerFloor;
    }
    document.getElementById('tower-mutator-txt').textContent = `${this.pendingTowerMutator.name} — ${this.pendingTowerMutator.description || this.pendingTowerMutator.desc}`;
    this.updateInfinitumProgress();

    const startButton = document.getElementById('btn-start-floor');
    startButton.textContent = this.towerCompleted ? 'Rejouer l’Étage 100' : `Gravir l’Étage ${this.towerFloor}`;
    startButton.onclick = () => {
      const floorMutator = this.pendingTowerMutator;
      if (!this.towerMutators.some(mutator => mutator.id === floorMutator.id)) {
        this.towerMutators.push(floorMutator);
      }
      this.campaignStateBeforeTower = {
        wave: this.wave,
        waveActive: this.waveActive,
        waveIntermissionTimer: this.waveIntermissionTimer,
        enemiesSpawnedThisWave: this.enemiesSpawnedThisWave,
        waveSpawnTarget: this.waveSpawnTarget,
        bossSpawnedThisWave: this.bossSpawnedThisWave,
        waveRewardClaimed: this.waveRewardClaimed,
        spawnTimer: this.spawnTimer,
        waveSpawnQueue: this.waveSpawnQueue,
        waveSpawnElapsedMs: this.waveSpawnElapsedMs,
        activeWaveDefinition: this.activeWaveDefinition,
        enemies: this.enemies,
        enemyBullets: this.enemyBullets,
        projectiles: this.projectiles,
        particles: this.particles,
        floatingTexts: this.floatingTexts,
        decoys: this.decoys,
        crates: this.crates,
        powerups: this.powerups,
        hazards: this.hazards,
        bossHazards: this.bossHazards
      };
      this.enemies = [];
      this.enemyBullets = [];
      this.projectiles = [];
      this.particles = [];
      this.floatingTexts = [];
      this.decoys = [];
      this.crates = [];
      this.powerups = [];
      this.hazards = [];
      this.bossHazards = [];
      this.infinitumCanReturn = false;
      this.configureWave(this.towerFloor, {
        towerMode: true,
        mutator: floorMutator,
        mutators: this.towerMutators
      });
      this.pendingTowerMutator = null;
      this.pendingTowerMutatorFloor = null;
      this.closeModal(modal, false);
      if (document.getElementById('hq-menu-modal')?.classList.contains('active')) {
        this.closeModal('hq-menu-modal', false);
      }
      this.showFeedback(`Étage ${this.towerFloor} : ${floorMutator.name}`, '#a855f7');
      this.updateInfinitumProgress();
      this.updateHUD();
      this.focusBattlefield();
    };
    this.openModal(modal);
  }

  canReturnFromInfinitum() {
    return !this.isTowerMode || this.infinitumCanReturn || this.wave % 10 === 0 || this.wave >= 100;
  }

  updateInfinitumProgress() {
    const segmentStart = Math.floor((Math.max(1, this.towerFloor) - 1) / 10) * 10 + 1;
    const segmentEnd = Math.min(100, segmentStart + 9);
    const completedInSegment = Math.max(0, Math.min(10, this.towerFloor - segmentStart));
    const progress = document.getElementById('infinitum-segment-progress');
    const text = document.getElementById('infinitum-segment-txt');
    const floorList = document.getElementById('infinitum-floor-list');
    const cumulative = document.getElementById('infinitum-cumulative-mutators');
    if (progress) {
      progress.max = 10;
      progress.value = completedInSegment;
      progress.setAttribute('aria-valuenow', String(completedInSegment));
    }
    if (text) text.textContent = `Segment ${segmentStart}–${segmentEnd} · ${completedInSegment}/10`;
    if (floorList) {
      floorList.textContent = Array.from(
        { length: segmentEnd - segmentStart + 1 },
        (_, index) => {
          const floor = segmentStart + index;
          return `${floor < this.towerFloor ? '✓' : (floor === this.towerFloor ? '●' : '○')} ${floor}`;
        }
      ).join(' · ');
    }
    if (cumulative) {
      cumulative.textContent = this.towerMutators.map(mutator => mutator.name).join(' · ') || 'Aucun mutateur cumulé';
    }
  }

  openMercenaryModal() {
    const modal = document.getElementById('mercenary-guild-modal');
    if (!modal) return;
    document.getElementById('mercs-coins-txt').textContent = `${this.coins} 🪙`;
    const hireButton = document.getElementById('btn-hire-ray');
    const hireCost = 120 + (this.mercenaries.length * 60);
    const status = document.getElementById('mercs-status-txt');
    if (status) status.textContent = `Escouade : ${this.mercenaries.length} / 3`;
    hireButton.textContent = this.mercenaries.length >= 3 ? 'ESCOUADE COMPLÈTE' : `ENGAGER · ${hireCost} 🪙`;
    hireButton.disabled = this.mercenaries.length >= 3 || this.coins < hireCost;

    hireButton.onclick = () => {
      if (this.mercenaries.length < 3 && this.coins >= hireCost) {
        this.coins -= hireCost;
        this.mercenaries.push({
          x: this.citadel.x + 130,
          y: this.citadel.y,
          angle: this.mercenaries.length * ((Math.PI * 2) / 3),
          damage: 20,
          fireRate: 430,
          range: 300,
          timer: 0,
          name: 'Ray'
        });
        audio.playPickup();
        this.addFloatingText('MERCENAIRE RAY ENGAGÉ !', this.citadel.x, this.citadel.y - 60, '#f59e0b');
        this.openMercenaryModal();
        this.updateHUD();
      }
    };
    this.openModal(modal);
  }

  openPhotoStudioModal() {
    const modal = document.getElementById('photo-studio-modal');
    if (!modal) return;

    const hero = this.selectedHero;
    this.syncVnExpansionConsent(hero.id, hero.romanceOptIn === true);
    const studioHeroine = this.getVnExpansion()?.studio?.heroines?.[hero.id];
    const poseSelect = document.getElementById('studio-pose-select');
    const ambienceSelect = document.getElementById('studio-ambience-select');
    const maturitySelect = document.getElementById('studio-maturity-select');
    const fillSelect = (select, options) => {
      if (!select) return;
      select.innerHTML = '';
      options.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.label;
        select.appendChild(option);
      });
    };
    fillSelect(poseSelect, this.getStudioPoseOptions(hero.id));
    fillSelect(ambienceSelect, studioHeroine?.ambiences || []);
    if (maturitySelect) maturitySelect.value = this.vnExpansionState?.maturity || 'suggestive';
    document.getElementById('studio-hero-title').textContent = hero.name;
    modal.dataset.heroId = hero.id;
    this.updatePhotoStudioPreview();
    this.renderStudioConclusionGallery();
    this.openModal(modal);
  }

  getBoudoirSceneForParticipant(participantId) {
    return (ADULT_SCENES?.bonusScenes || []).find(scene => (
      scene.kind === 'boudoir'
      && scene.participants?.length === 1
      && scene.participants[0] === participantId
    )) || null;
  }

  getStudioPoseOptions(heroId) {
    const studioHeroine = this.getVnExpansion()?.studio?.heroines?.[heroId];
    const poses = [...(studioHeroine?.poses || [])];
    const boudoirScene = this.getBoudoirSceneForParticipant(heroId);
    if (boudoirScene) {
      poses.push({
        id: 'boudoir-signature',
        label: 'Boudoir signature',
        previewSrc: boudoirScene.src
      });
    }
    return poses;
  }

  getStudioPreviewSource(heroId, poseId) {
    const expansion = this.getVnExpansion();
    const poses = this.getStudioPoseOptions(heroId);
    const poseIndex = Math.max(0, poses.findIndex(pose => pose.id === poseId));
    const pose = poses[poseIndex];
    const candidate = this.resolveVnExpansionAsset(pose?.previewSrc);
    if (candidate && !candidate.includes('/vn/studio/')) return candidate;
    const chapterId = expansion?.heroines?.[heroId]?.chapterIds?.[poseIndex];
    const chapterCg = this.resolveVnExpansionAsset(expansion?.getChapter?.(heroId, chapterId)?.cgSrc);
    const hero = HERO_CLASSES[heroId];
    return chapterCg || (hero?.activeSkin === 'alt' && hero.altAvatar ? hero.altAvatar : hero?.avatar);
  }

  updatePhotoStudioPreview() {
    const modal = document.getElementById('photo-studio-modal');
    const heroId = modal?.dataset.heroId || this.selectedHero?.id;
    const hero = HERO_CLASSES[heroId];
    const expansion = this.getVnExpansion();
    const studioHeroine = expansion?.studio?.heroines?.[heroId];
    const poseOptions = this.getStudioPoseOptions(heroId);
    const poseSelect = document.getElementById('studio-pose-select');
    const ambienceSelect = document.getElementById('studio-ambience-select');
    const preview = document.getElementById('studio-preview-img');
    if (!hero || !preview) return;
    const pose = poseOptions.find(item => item.id === poseSelect?.value)
      || poseOptions[0];
    const ambience = studioHeroine?.ambiences?.find(item => item.id === ambienceSelect?.value)
      || studioHeroine?.ambiences?.[0];
    const previewSrc = this.getStudioPreviewSource(heroId, pose?.id);
    preview.onerror = previewSrc
      ? () => {
        preview.onerror = null;
        preview.src = hero.activeSkin === 'alt' && hero.altAvatar ? hero.altAvatar : hero.avatar;
      }
      : null;
    preview.src = previewSrc;
    preview.alt = `${pose?.label || 'Portrait'} de ${hero.name}, adulte de ${hero.age} ans, mise en scène non nue et consentie`;
    const frame = preview.closest?.('.studio-preview-frame');
    if (frame) {
      const backdrop = this.resolveVnExpansionAsset(ambience?.backdropSrc);
      frame.style.backgroundImage = backdrop ? `url("${backdrop}")` : '';
      frame.dataset.ambience = ambience?.id || '';
    }
    const consent = this.getVnExpansionHeroineState(heroId)?.consent;
    const note = document.getElementById('studio-consent-note');
    if (note) {
      note.textContent = consent?.granted && !consent.revoked
        ? `Accord actif de ${hero.name}. Pose et ambiance restent modifiables ou révocables à tout moment.`
        : `Portrait public non nu de ${hero.name}. Le mode intimiste attend un accord actif et révocable.`;
    }
  }

  setStudioMaturity(mode) {
    const modal = document.getElementById('photo-studio-modal');
    const heroId = modal?.dataset.heroId || this.selectedHero?.id;
    const consent = this.getVnExpansionHeroineState(heroId)?.consent;
    const select = document.getElementById('studio-maturity-select');
    const note = document.getElementById('studio-consent-note');
    const requested = mode === 'intense' ? 'intense' : 'suggestive';
    if (requested === 'intense' && (!consent?.granted || consent.revoked)) {
      if (select) select.value = 'suggestive';
      if (note) note.textContent = 'Mode intimiste refusé : un accord adulte actif est requis. Aucun autre réglage ni progression n’est modifié.';
      return;
    }
    const expansion = this.getVnExpansion();
    if (expansion?.persistence?.setMaturity) {
      this.vnExpansionState = expansion.persistence.setMaturity(
        this.vnExpansionState,
        requested,
        localStorage
      );
    }
    if (note) {
      note.textContent = requested === 'intense'
        ? 'Mode intimiste actif : tension romantique et cadrage rapproché, sans contenu graphique, avec fondu au noir.'
        : 'Mode suggestif actif : portraits non nus et consentement révocable à tout moment.';
    }
    this.updatePhotoStudioPreview();
    this.renderStudioConclusionGallery();
  }

  getStudioConclusionUnlockState(conclusion) {
    const results = Object.values(this.vnSceneProgress.chapterResults || {});
    const completed = results.filter(result => String(result).startsWith('completed')).length;
    const heroineStates = Object.values(this.vnExpansionState?.heroines || {});
    const heroinesWithMemories = heroineStates.filter(state => (state.memories || []).length > 0).length;
    const expectedHeroineCount = Object.keys(this.getVnExpansion()?.heroines || {}).length;
    const expectedChapterCount = Object.keys(this.getVnExpansion()?.chapters || {}).length;
    const allConsenting = expectedHeroineCount > 0
      && heroineStates.length === expectedHeroineCount
      && heroineStates.every(state => (
      state.consent?.granted === true && state.consent?.revoked !== true
      ));
    if (conclusion.id === 'haven-lanterns') return completed >= 6;
    if (conclusion.id === 'six-free-voices') return heroinesWithMemories >= expectedHeroineCount;
    if (conclusion.id === 'chosen-night') {
      return completed >= expectedChapterCount
        && allConsenting
        && this.vnExpansionState?.maturity === 'intense';
    }
    return false;
  }

  renderStudioConclusionGallery() {
    const gallery = document.getElementById('studio-conclusion-gallery');
    const conclusions = this.getVnExpansion()?.studio?.conclusionCgs || [];
    if (!gallery) return;
    gallery.innerHTML = '';
    if (conclusions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Les conclusions illustrées ne sont pas encore disponibles.';
      gallery.appendChild(empty);
      return;
    }
    conclusions.forEach(conclusion => {
      const unlocked = this.getStudioConclusionUnlockState(conclusion);
      const figure = document.createElement('figure');
      figure.className = 'studio-conclusion-card';
      figure.dataset.unlocked = String(unlocked);
      if (unlocked) {
        const image = document.createElement('img');
        image.src = this.resolveVnExpansionAsset(conclusion.cgSrc);
        image.alt = `${conclusion.title}, conclusion adulte consentie et non graphique`;
        figure.appendChild(image);
      } else {
        const lock = document.createElement('span');
        lock.className = 'studio-conclusion-lock';
        lock.setAttribute('aria-hidden', 'true');
        lock.textContent = '◇';
        figure.appendChild(lock);
      }
      const caption = document.createElement('figcaption');
      const title = document.createElement('strong');
      title.textContent = conclusion.title;
      const requirement = document.createElement('span');
      requirement.textContent = unlocked ? 'Déverrouillée' : conclusion.requirement;
      caption.append(title, requirement);
      figure.appendChild(caption);
      gallery.appendChild(figure);
    });
  }

  openHaremModal(focusRequest = null) {
    const modal = document.getElementById('harem-lounge-modal');
    const container = document.getElementById('harem-grid-container');
    if (!modal || !container) return;
    const wasOpen = modal.classList.contains('active');
    container.innerHTML = '';
    document.getElementById('lounge-meta-coins-txt').textContent = `${this.metaCoins} ◆`;

    Object.values(HERO_CLASSES).forEach(hero => {
      if (hero.unlocked === false) return;
      const card = document.createElement('article');
      card.className = 'harem-card';
      card.dataset.heroId = hero.id;
      const avatarSrc = hero.activeSkin === 'alt' && hero.altAvatar ? hero.altAvatar : hero.avatar;
      const relationshipStatus = hero.romanceOptIn ? 'Accord relationnel actif' : 'Alliance militaire uniquement';
      const currentLine = hero.lastLoungeMessage || hero.loungeLines[Math.max(0, Math.min(4, hero.affinityLvl - 1))];
      card.innerHTML = `
        <img src="${avatarSrc}" alt="Portrait adulte de ${hero.name}">
        <h3 style="color:#ec4899;">${hero.name}</h3>
        <div class="adult-profile-meta">
          <span>${hero.age} ans</span>
          <span>Confiance ${hero.affinityLvl}/5</span>
          <span>${relationshipStatus}</span>
        </div>
        <p class="relationship-copy">${currentLine}</p>
        <p class="relationship-boundary">${hero.boundary}</p>
        <div class="relationship-actions"></div>`;
      const actions = card.querySelector('.relationship-actions');

      if (this.getVnHeroine(hero.id)) {
        const unlockedChapters = this.getUnlockedVnChapterCount(hero);
        const totalChapters = this.getVnHeroine(hero.id).chapters.length;
        const vnButton = document.createElement('button');
        vnButton.type = 'button';
        vnButton.className = 'btn-secondary';
        vnButton.dataset.action = 'vn';
        vnButton.textContent = `HISTOIRE VN · ${unlockedChapters}/${totalChapters}`;
        vnButton.onclick = () => this.openVisualNovel(hero.id);
        actions.appendChild(vnButton);
      }

      if (hero.romanceOptIn) {
        const talkButton = document.createElement('button');
        talkButton.type = 'button';
        talkButton.className = 'btn-secondary';
        talkButton.dataset.action = 'talk';
        talkButton.textContent = 'PARLER';
        talkButton.onclick = () => {
          hero.lastLoungeMessage = hero.loungeLines[Math.max(0, Math.min(4, hero.affinityLvl - 1))];
          this.announceLoungeResult(hero, 'talk');
        };

        const giftButton = document.createElement('button');
        giftButton.type = 'button';
        giftButton.className = 'btn-secondary';
        giftButton.dataset.action = 'gift';
        giftButton.textContent = 'PRÉSENT (25 ◆)';
        giftButton.disabled = this.metaCoins < 25;
        giftButton.onclick = () => this.offerRespectfulGift(hero);

        const inviteButton = document.createElement('button');
        inviteButton.type = 'button';
        inviteButton.className = 'btn-primary';
        inviteButton.dataset.action = 'invite';
        inviteButton.textContent = hero.privateMomentUnlocked ? 'MOMENT PRIVÉ' : 'PROPOSER UN RENDEZ-VOUS';
        inviteButton.onclick = () => this.handlePrivateInvitation(hero);

        const pauseButton = document.createElement('button');
        pauseButton.type = 'button';
        pauseButton.className = 'btn-secondary';
        pauseButton.dataset.action = 'pause';
        pauseButton.textContent = 'PAS MAINTENANT';
        pauseButton.onclick = () => {
          hero.lastLoungeMessage = 'Vous remettez la conversation à plus tard. La confiance et les performances au combat restent intactes.';
          this.announceLoungeResult(hero, 'pause');
        };

        const revokeButton = document.createElement('button');
        revokeButton.type = 'button';
        revokeButton.className = 'btn-secondary';
        revokeButton.dataset.action = 'revoke';
        revokeButton.textContent = 'RÉVOQUER L’ACCORD';
        revokeButton.onclick = () => {
          hero.romanceOptIn = false;
          this.syncVnExpansionConsent(hero.id, false);
          this.redirectSavedVnSessionAfterRevocation(hero.id);
          hero.lastLoungeMessage = 'L’accord relationnel est révoqué immédiatement, sans perte de confiance ni impact militaire.';
          this.saveProgress();
          this.announceLoungeResult(hero, 'opt-in');
        };
        actions.append(talkButton, giftButton, inviteButton, pauseButton, revokeButton);
      } else {
        const optInButton = document.createElement('button');
        optInButton.type = 'button';
        optInButton.className = 'btn-primary';
        optInButton.dataset.action = 'opt-in';
        optInButton.textContent = 'PROPOSER DE REJOINDRE LE SALON';
        optInButton.onclick = () => this.requestRomanceOptIn(hero);
        actions.appendChild(optInButton);
      }
      container.appendChild(card);
    });
    this.openModal(modal);
    if (wasOpen && focusRequest) {
      requestAnimationFrame(() => {
        modal.querySelector(`[data-hero-id="${focusRequest.heroId}"] [data-action="${focusRequest.action}"]`)?.focus();
      });
    }
  }

  announceLoungeResult(hero, action) {
    this.announce(`Salon, ${hero.name} : ${hero.lastLoungeMessage}`);
    this.openHaremModal({ heroId: hero.id, action });
  }

  offerRespectfulGift(hero) {
    if (this.metaCoins < 25) {
      hero.lastLoungeMessage = 'Crédits Haven insuffisants. Elle ne vous en tient évidemment pas rigueur.';
      this.announceLoungeResult(hero, 'gift');
      return;
    }
    this.metaCoins -= 25;
    hero.lastLoungeMessage = 'Elle accepte le présent comme un geste attentionné. La confiance ne change pas : elle se construit par vos choix et vos actions partagées.';
    audio.playPickup();
    this.saveProgress();
    this.updateHUD();
    this.announceLoungeResult(hero, 'gift');
  }

  requestRomanceOptIn(hero) {
    if (hero.unlocked === false) return;
    if (hero.allied && hero.affinityLvl < 2) {
      this.syncVnExpansionConsent(hero.id, false);
      hero.lastLoungeMessage = 'Elle décline calmement pour le moment. Aucun crédit ni point de confiance n’est perdu.';
    } else {
      hero.romanceOptIn = true;
      this.syncVnExpansionConsent(hero.id, true);
      hero.lastLoungeMessage = 'Elle accepte librement de rejoindre le Salon, en rappelant que cet accord reste révocable.';
      audio.playAbility();
      this.saveProgress();
    }
    this.announceLoungeResult(hero, hero.romanceOptIn ? 'talk' : 'opt-in');
  }

  handlePrivateInvitation(hero) {
    if (!hero.romanceOptIn) return;
    if (hero.affinityLvl < 2) {
      hero.lastLoungeMessage = 'Elle préfère apprendre à mieux vous connaître. Son refus est définitif pour cette invitation, sans pénalité.';
    } else if (hero.affinityLvl < 4) {
      hero.lastLoungeMessage = 'Elle accepte un rendez-vous hors service. La soirée reste proche et chargée de sous-entendus, mais sans présumer de la suite.';
      audio.playAbility();
    } else {
      hero.privateMomentUnlocked = true;
      hero.lastLoungeMessage = 'Vous confirmez vos limites et votre signal d’arrêt. La lumière néon baisse sur un accord mutuel, puis le récit se fond au noir.';
      this.unlockGalleryItem(hero.id);
      audio.playAbility();
      this.saveProgress();
    }
    this.announceLoungeResult(hero, 'invite');
  }

  getVnExpansion() {
    const data = typeof window !== 'undefined' ? window.INFERNAL_VN_EXPANSION : null;
    return data?.schema === 'infernal-city.vn-expansion/1' ? data : null;
  }

  loadVnExpansionState() {
    const expansion = this.getVnExpansion();
    try {
      return expansion?.persistence?.loadState
        ? expansion.persistence.loadState(typeof localStorage !== 'undefined' ? localStorage : null)
        : null;
    } catch (error) {
      console.warn('Progression narrative étendue indisponible :', error);
      return expansion?.persistence?.createDefaultState?.() || null;
    }
  }

  syncVnExpansionConsent(heroId, granted) {
    const expansion = this.getVnExpansion();
    const action = granted
      ? expansion?.persistence?.grantConsent
      : expansion?.persistence?.revokeConsent;
    if (!action) return;
    this.vnExpansionState = action(this.vnExpansionState, heroId, localStorage);
  }

  getVnExpansionChapter(heroId, chapterId) {
    return this.getVnExpansion()?.getChapter?.(heroId, chapterId) || null;
  }

  getVnExpansionHeroineState(heroId) {
    return this.vnExpansionState?.heroines?.[heroId] || null;
  }

  getVnPersistentCallbackSummary(heroId) {
    const state = this.getVnExpansionHeroineState(heroId);
    if (!state) return '';
    const traits = Object.entries(state.traits || {})
      .filter(([, count]) => Number(count) > 0)
      .map(([trait, count]) => `${trait} ${count}`);
    return traits.length > 0 ? `Mémoire persistante : ${traits.join(' · ')}` : '';
  }

  resolveVnExpansionAsset(src) {
    if (typeof src !== 'string') return '';
    // Runtime art is optimized as WebP. Accept the original manifest suffix so
    // older cached data modules remain compatible during the PWA transition.
    if (/^assets\/vn\/(?:cg\/chapters|cg\/conclusions|expressions)\/.+\.png$/u.test(src)) {
      return src.replace(/\.png$/u, '.webp');
    }
    return src;
  }

  applyVnMusicMood(mood = '') {
    const normalized = String(mood).toLowerCase();
    const station = /gothic|abyss|regal/u.test(normalized)
      ? 'gothic'
      : /industrial|flame|ritual/u.test(normalized)
        ? 'industrial'
        : /lunar|ambient|intimat|quiet/u.test(normalized)
          ? 'chillwave'
          : 'synthwave';
    if (this.vnPreviousRadioStation === null) {
      this.vnPreviousRadioStation = audio.currentStation || 'synthwave';
    }
    if (audio.currentStation === station) return;
    const wasPlaying = audio.isPlayingMusic === true;
    if (wasPlaying) audio.stopMusic?.();
    audio.setStation?.(station);
    if (wasPlaying) audio.startMusic?.();
  }

  restoreVnMusicMood() {
    if (this.vnPreviousRadioStation === null) return;
    const station = this.vnPreviousRadioStation;
    this.vnPreviousRadioStation = null;
    if (audio.currentStation === station) return;
    const wasPlaying = audio.isPlayingMusic === true;
    if (wasPlaying) audio.stopMusic?.();
    audio.setStation?.(station);
    if (wasPlaying) audio.startMusic?.();
  }

  setVnExpressionMood(heroId, mood = 'neutral', chapterId = '') {
    const portrait = document.getElementById('vn-expression-portrait');
    if (!portrait) return;
    const chapter = this.getVnExpansionChapter(heroId, chapterId);
    const sheet = this.resolveVnExpansionAsset(chapter?.expressionSheetSrc);
    if (!sheet) {
      portrait.hidden = true;
      return;
    }
    const normalizedMood = String(mood || 'neutral').toLowerCase();
    let cell = 0;
    if (/warm|soft|smil|relief|tender|playful|hope|joy/u.test(normalizedMood)) cell = 1;
    else if (/command|resolve|firm|regal|proud|focus/u.test(normalizedMood)) cell = 2;
    else if (/reflect|memory|sad|vulner|quiet|melanch/u.test(normalizedMood)) cell = 3;
    else if (/surpris|shock|alarm|tense|fear/u.test(normalizedMood)) cell = 4;
    else if (/ritual|ceremon|mystic|lunar|abyss/u.test(normalizedMood)) cell = 5;
    else if (/relax|calm|peace|safe/u.test(normalizedMood)) cell = 6;
    else if (/intimat|romantic|sensual|desire/u.test(normalizedMood)) cell = 7;
    else if (/teas|wink|amused|laugh/u.test(normalizedMood)) cell = 8;
    const column = cell % 3;
    const row = Math.floor(cell / 3);
    portrait.style.backgroundImage = `url("${sheet}")`;
    portrait.style.backgroundPosition = `${column * 50}% ${row * 50}%`;
    portrait.setAttribute('aria-label', `Expression ${normalizedMood} de ${HERO_CLASSES[heroId]?.name || 'l’héroïne'}`);
    portrait.hidden = false;
  }

  getVnData() {
    const data = typeof window !== 'undefined' ? window.INFERNAL_VN_SCENES : null;
    return data?.schema === 'infernal-city.vn-scenes/1' ? data : null;
  }

  getVnHeroine(heroId) {
    return this.getVnData()?.heroines?.[heroId] || null;
  }

  getVnChapter(heroId, chapterId) {
    return this.getVnHeroine(heroId)?.chapters?.find(chapter => chapter.id === chapterId) || null;
  }

  getVnChapterKey(heroId, chapterId) {
    return `${heroId}.${chapterId}`;
  }

  sanitizeLoadedVnProgress(savedProgress) {
    const data = this.getVnData();
    if (!data || !savedProgress || typeof savedProgress !== 'object') return null;
    if (savedProgress.dataVersion !== data.version) return null;

    const chapterKeys = new Set();
    const completionFlags = new Set();
    Object.values(data.heroines).forEach(heroine => {
      heroine.chapters.forEach(chapter => {
        chapterKeys.add(this.getVnChapterKey(heroine.id, chapter.id));
        chapter.beats.forEach(beat => {
          (beat.onEnterEffects?.setFlags || []).forEach(flag => completionFlags.add(flag));
        });
      });
    });

    const flags = Array.isArray(savedProgress.flags)
      ? [...new Set(savedProgress.flags.filter(flag => completionFlags.has(flag)))].slice(0, 64)
      : [];
    const chapterResults = {};
    if (savedProgress.chapterResults && typeof savedProgress.chapterResults === 'object') {
      Object.entries(savedProgress.chapterResults).forEach(([key, endState]) => {
        if (chapterKeys.has(key) && typeof endState === 'string') chapterResults[key] = endState;
      });
    }
    const appliedEffects = Array.isArray(savedProgress.appliedEffects)
      ? [...new Set(savedProgress.appliedEffects.filter(token => typeof token === 'string' && token.length <= 160))].slice(0, 256)
      : [];

    let active = null;
    const candidate = savedProgress.active;
    const chapter = candidate && this.getVnChapter(candidate.heroId, candidate.chapterId);
    const beat = chapter?.beats?.find(item => item.id === candidate.beatId);
    if (chapter && beat) {
      const lineIndex = Math.max(0, Math.floor(Number(candidate.lineIndex) || 0));
      const history = Array.isArray(candidate.history)
        ? candidate.history
          .filter(entry => entry && typeof entry.key === 'string' && typeof entry.text === 'string' && typeof entry.speaker === 'string')
          .slice(-80)
          .map(entry => ({ key: entry.key.slice(0, 180), speaker: entry.speaker.slice(0, 80), text: entry.text.slice(0, 1200) }))
        : [];
      active = {
        heroId: candidate.heroId,
        chapterId: candidate.chapterId,
        beatId: candidate.beatId,
        lineIndex: beat.kind === 'dialogue' ? Math.min(lineIndex, Math.max(0, beat.lines.length - 1)) : 0,
        history
      };
    }

    return {
      dataVersion: data.version,
      flags,
      chapterResults,
      appliedEffects,
      active
    };
  }

  getVnChapterLockReason(hero, chapter) {
    if (!hero || hero.unlocked === false) return 'Héroïne non disponible';
    const unlock = chapter.unlock || {};
    // Consent is checked before the replay exception: completing a romantic
    // chapter never turns a past agreement into permanent authorization.
    if (unlock.romanceOptIn === true && !hero.romanceOptIn) return 'Accord relationnel requis';
    const key = this.getVnChapterKey(hero.id, chapter.id);
    if (this.vnSceneProgress.chapterResults[key]?.startsWith('completed')) return '';
    if ((hero.affinityLvl || 1) < (unlock.affinityMin || 1)) {
      return `Confiance ${unlock.affinityMin}/5 requise`;
    }
    // A false value means "no prerequisite", never "must currently be false".
    if (unlock.alliedRequired === true && !hero.allied) return 'Alliance libre requise';
    if (unlock.privateMomentRequired === true && !hero.privateMomentUnlocked) return 'Moment privé requis';
    const missingFlag = (unlock.flags || []).find(flag => !this.vnSceneProgress.flags.includes(flag));
    if (missingFlag) return 'Chapitre précédent à terminer';
    return '';
  }

  canResumeVnChapter(hero, chapter) {
    const active = this.vnSceneProgress.active;
    if (!hero || !chapter || active?.heroId !== hero.id || active?.chapterId !== chapter.id) return false;
    const beat = chapter.beats.find(item => item.id === active.beatId);
    // A saved boundary acknowledgement must remain readable after revocation,
    // but no romantic dialogue can resume without current consent.
    if (beat?.end === true && ['revoked', 'paused'].includes(beat.endState)) return true;
    return !this.getVnChapterLockReason(hero, chapter);
  }

  redirectSavedVnSessionAfterRevocation(heroId) {
    const active = this.vnSceneProgress.active;
    if (active?.heroId !== heroId) return;
    const chapter = this.getVnChapter(heroId, active.chapterId);
    const revokeBeat = chapter?.beats?.find(beat => beat.id === 'revoke' && beat.end === true);
    this.vnSceneProgress.active = revokeBeat
      ? { ...active, beatId: revokeBeat.id, lineIndex: 0 }
      : null;
  }

  getUnlockedVnChapterCount(hero) {
    const heroine = this.getVnHeroine(hero?.id);
    if (!heroine) return 0;
    return heroine.chapters.filter(chapter => (
      this.canResumeVnChapter(hero, chapter) || !this.getVnChapterLockReason(hero, chapter)
    )).length;
  }

  setVnSceneImage(heroId, chapter = null) {
    const image = document.getElementById('vn-scene-img');
    const hero = HERO_CLASSES[heroId];
    if (!image || !hero) return;
    const expansionChapter = chapter?.id
      ? this.getVnExpansionChapter(heroId, chapter.id)
      : null;
    const fallback = VN_NARRATIVE_CGS[heroId] || chapter?.presentation?.portrait || hero.avatar;
    const narrativeCg = this.resolveVnExpansionAsset(expansionChapter?.cgSrc);
    image.onerror = narrativeCg
      ? () => {
        image.onerror = null;
        image.src = fallback;
      }
      : null;
    image.src = narrativeCg || fallback;
    image.alt = `${hero.name}, adulte de ${hero.age} ans, pendant une conversation privée à Haven`;
    image.dataset.musicMood = expansionChapter?.musicMood || 'haven-night';
    image.dataset.backdrop = expansionChapter?.backdropSrc || '';
    image.dataset.maturity = this.vnExpansionState?.maturity || 'suggestive';
    if (expansionChapter?.musicMood) this.applyVnMusicMood(expansionChapter.musicMood);
    else this.restoreVnMusicMood();
    const portrait = document.getElementById('vn-expression-portrait');
    if (portrait && !chapter) portrait.hidden = true;
  }

  openVisualNovel(heroId) {
    const modal = document.getElementById('visual-novel-modal');
    const data = this.getVnData();
    const hero = HERO_CLASSES[heroId];
    if (!modal || !data || !hero || hero.unlocked === false) {
      this.showFeedback('Scènes Visual Novel indisponibles.', '#ef4444');
      return;
    }
    this.vnSceneProgress.dataVersion = data.version;
    this.syncVnExpansionConsent(heroId, hero.romanceOptIn === true);
    this.activeVnSession = null;
    this.renderVnChapterBrowser(heroId);
    this.openModal(modal);
    requestAnimationFrame(() => {
      document.querySelector('#vn-chapter-list .vn-chapter-card:not([disabled])')?.focus();
    });
  }

  renderVnChapterBrowser(heroId, statusMessage = '') {
    const heroine = this.getVnHeroine(heroId);
    const hero = HERO_CLASSES[heroId];
    const browser = document.getElementById('vn-chapter-browser');
    const dialoguePanel = document.getElementById('vn-dialogue-panel');
    const list = document.getElementById('vn-chapter-list');
    if (!heroine || !hero || !browser || !dialoguePanel || !list) return;

    browser.hidden = false;
    dialoguePanel.hidden = true;
    document.getElementById('vn-hero-label').textContent = `${heroine.displayName} · ${heroine.age} ANS · VISUAL NOVEL`;
    document.getElementById('vn-modal-title').textContent = heroine.displayName;
    document.getElementById('vn-chapter-subtitle').textContent = `${heroine.title} · ${heroine.voice}`;
    document.getElementById('vn-boundary-copy').textContent = heroine.boundary;
    document.getElementById('vn-status').textContent = statusMessage
      || 'Choisissez un chapitre. Une relecture ne redonne jamais de progression.';
    this.setVnSceneImage(heroId);
    list.innerHTML = '';

    heroine.chapters.forEach(chapter => {
      const key = this.getVnChapterKey(heroId, chapter.id);
      const result = this.vnSceneProgress.chapterResults[key];
      const isResume = this.canResumeVnChapter(hero, chapter);
      const lockReason = isResume ? '' : this.getVnChapterLockReason(hero, chapter);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vn-chapter-card';
      button.dataset.chapterId = chapter.id;
      button.disabled = Boolean(lockReason);

      const title = document.createElement('strong');
      title.textContent = chapter.title;
      const subtitle = document.createElement('span');
      subtitle.textContent = `${chapter.subtitle} · ${chapter.estimatedMinutes} min`;
      const summary = document.createElement('span');
      summary.textContent = chapter.summary;
      const state = document.createElement('span');
      state.className = 'vn-chapter-state';
      state.textContent = isResume
        ? 'Reprendre la conversation'
        : result?.startsWith('completed')
          ? 'Terminé · relire sans gain'
          : lockReason
            ? `Verrouillé · ${lockReason}`
            : 'Commencer';
      button.append(title, subtitle, summary, state);
      const narrativeState = this.getVnExpansionHeroineState(heroId);
      if ((narrativeState?.memories || []).some(memory => memory.startsWith(`${heroId}.${chapter.id}.`))) {
        const memory = document.createElement('span');
        memory.className = 'vn-chapter-memory';
        memory.textContent = 'Souvenir de lore actif · rappelé dans les échanges suivants';
        button.appendChild(memory);
      }
      button.onclick = () => this.startVnChapter(heroId, chapter.id);
      list.appendChild(button);
    });
  }

  startVnChapter(heroId, chapterId) {
    const chapter = this.getVnChapter(heroId, chapterId);
    const hero = HERO_CLASSES[heroId];
    if (!chapter || !hero) return;
    const resume = this.vnSceneProgress.active;
    const isResume = this.canResumeVnChapter(hero, chapter);
    const chapterResult = this.vnSceneProgress.chapterResults[this.getVnChapterKey(heroId, chapterId)];
    const isReplay = chapterResult?.startsWith('completed') === true;
    const lockReason = isResume ? '' : this.getVnChapterLockReason(hero, chapter);
    if (lockReason) {
      document.getElementById('vn-status').textContent = lockReason;
      return;
    }

    this.activeVnSession = isResume
      ? {
        heroId,
        chapterId,
        beatId: resume.beatId,
        lineIndex: resume.lineIndex,
        history: [...(resume.history || [])],
        isReplay
      }
      : {
        heroId,
        chapterId,
        beatId: chapter.entryBeat,
        lineIndex: 0,
        history: [],
        isReplay
      };
    document.getElementById('vn-chapter-browser').hidden = true;
    const dialoguePanel = document.getElementById('vn-dialogue-panel');
    dialoguePanel.hidden = false;
    document.getElementById('vn-modal-title').textContent = chapter.title;
    document.getElementById('vn-chapter-subtitle').textContent = chapter.subtitle;
    const maturity = this.vnExpansionState?.maturity || 'suggestive';
    if (dialoguePanel.dataset) dialoguePanel.dataset.maturity = maturity;
    else dialoguePanel.setAttribute?.('data-maturity', maturity);
    this.setVnSceneImage(heroId, chapter);
    this.renderActiveVnBeat({ focus: true });
  }

  getActiveVnContext() {
    const session = this.activeVnSession;
    if (!session) return null;
    const hero = HERO_CLASSES[session.heroId];
    const heroine = this.getVnHeroine(session.heroId);
    const chapter = this.getVnChapter(session.heroId, session.chapterId);
    const beat = chapter?.beats?.find(item => item.id === session.beatId);
    return hero && heroine && chapter && beat ? { session, hero, heroine, chapter, beat } : null;
  }

  getVnSpeakerName(speaker, heroine) {
    if (speaker === 'hero') return heroine.displayName;
    if (speaker === 'player') return 'Vous';
    return 'Narration';
  }

  recordVnHistory(key, speaker, text) {
    const session = this.activeVnSession;
    if (!session || session.history.some(entry => entry.key === key)) return;
    session.history.push({ key, speaker, text });
    if (session.history.length > 80) session.history.splice(0, session.history.length - 80);
  }

  renderVnHistory() {
    const list = document.getElementById('vn-history-list');
    if (!list || !this.activeVnSession) return;
    list.innerHTML = '';
    this.activeVnSession.history.forEach(entry => {
      const item = document.createElement('li');
      item.textContent = `${entry.speaker} — ${entry.text}`;
      list.appendChild(item);
    });
    if (list.parentElement?.open) list.scrollTop = list.scrollHeight;
  }

  renderVnLoreChoices(context = this.getActiveVnContext()) {
    const container = document.getElementById('vn-lore-container');
    const prompt = document.getElementById('vn-lore-prompt');
    if (!container) return;
    container.querySelectorAll('button').forEach(button => button.remove());
    const expansionChapter = context
      ? this.getVnExpansionChapter(context.session.heroId, context.session.chapterId)
      : null;
    const heroineState = context
      ? this.getVnExpansionHeroineState(context.session.heroId)
      : null;
    const choices = expansionChapter?.loreChoices || [];
    const consentActive = heroineState?.consent?.granted === true
      && heroineState?.consent?.revoked !== true;
    if (!context || context.beat.kind !== 'dialogue' || choices.length === 0 || !consentActive) {
      container.hidden = true;
      return;
    }

    const memoryPrefix = `${context.session.heroId}.${context.session.chapterId}.`;
    const selectedMemory = (heroineState.memories || []).find(memory => memory.startsWith(memoryPrefix));
    if (prompt) {
      prompt.textContent = selectedMemory
        ? 'Souvenir narratif enregistré — sans bonus ni pénalité de combat'
        : 'Choisissez une seule question personnelle — choix non sexuel et purement narratif';
    }
    choices.forEach(choice => {
      const memoryId = `${memoryPrefix}${choice.id}`;
      const selected = selectedMemory === memoryId;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vn-lore-btn';
      button.dataset.loreChoiceId = choice.id;
      button.disabled = Boolean(selectedMemory);
      button.textContent = selected ? `✓ ${choice.label}` : choice.label;
      button.onclick = () => this.chooseVnLoreOption(choice);
      container.appendChild(button);
    });
    container.hidden = false;
  }

  chooseVnLoreOption(choice) {
    const context = this.getActiveVnContext();
    const expansion = this.getVnExpansion();
    if (!context || !choice || !expansion?.persistence?.recordLoreChoice) return;
    const result = expansion.persistence.recordLoreChoice(
      this.vnExpansionState,
      context.session.heroId,
      context.session.chapterId,
      choice.id,
      localStorage
    );
    const status = document.getElementById('vn-status');
    if (!result.applied) {
      if (status) {
        status.textContent = result.reason === 'consent-required'
          ? 'Ce choix attend un accord actif. Vous pouvez arrêter ou revenir aux chapitres.'
          : 'Ce souvenir narratif n’a pas pu être enregistré.';
      }
      return;
    }
    this.vnExpansionState = result.state;
    this.lastVnCallbackMessage = `Souvenir conservé : ${choice.persistentTrait}. Il sera rappelé dans les prochains échanges.`;
    this.recordVnHistory(
      `lore.${context.session.chapterId}.${choice.id}`,
      'Mémoire partagée',
      choice.label
    );
    this.renderVnHistory();
    this.renderVnLoreChoices(context);
    this.persistActiveVnSession();
    if (status) status.textContent = this.lastVnCallbackMessage;
    this.announce(this.lastVnCallbackMessage);
  }

  persistActiveVnSession() {
    const session = this.activeVnSession;
    if (!session) return;
    this.vnSceneProgress.active = {
      heroId: session.heroId,
      chapterId: session.chapterId,
      beatId: session.beatId,
      lineIndex: session.lineIndex,
      history: session.history.slice(-80).map(entry => ({ ...entry }))
    };
    this.saveProgress();
  }

  renderActiveVnBeat({ focus = false } = {}) {
    const context = this.getActiveVnContext();
    if (!context) return;
    const { session, heroine, chapter, beat } = context;
    const speakerName = document.getElementById('vn-speaker-name');
    const progress = document.getElementById('vn-line-progress');
    const dialogueText = document.getElementById('vn-dialogue-text');
    const choiceContainer = document.getElementById('vn-choice-container');
    const choicePrompt = document.getElementById('vn-choice-prompt');
    const continueButton = document.getElementById('btn-vn-continue');
    const panel = document.getElementById('vn-dialogue-panel');
    const status = document.getElementById('vn-status');
    if (!speakerName || !progress || !dialogueText || !choiceContainer || !continueButton || !panel || !status) return;

    document.getElementById('vn-modal-title').textContent = chapter.title;
    document.getElementById('vn-chapter-subtitle').textContent = chapter.subtitle;
    choiceContainer.querySelectorAll('button').forEach(button => button.remove());
    this.renderVnLoreChoices(context);

    if (beat.kind === 'dialogue') {
      session.lineIndex = Math.max(0, Math.min(session.lineIndex, beat.lines.length - 1));
      const line = beat.lines[session.lineIndex];
      const resolvedSpeaker = this.getVnSpeakerName(line.speaker, heroine);
      speakerName.textContent = resolvedSpeaker;
      progress.textContent = `${session.lineIndex + 1} / ${beat.lines.length}`;
      dialogueText.textContent = line.text;
      panel.dataset.mood = line.mood || 'neutral';
      this.setVnExpressionMood(session.heroId, line.mood || 'neutral', session.chapterId);
      choiceContainer.hidden = true;
      continueButton.hidden = false;
      continueButton.textContent = beat.end && session.lineIndex === beat.lines.length - 1
        ? 'TERMINER LE CHAPITRE'
        : 'CONTINUER';
      this.recordVnHistory(`${beat.id}.${session.lineIndex}`, resolvedSpeaker, line.text);
      this.renderVnHistory();
      const callback = this.getVnPersistentCallbackSummary(session.heroId);
      status.textContent = callback
        ? `${callback}. ${resolvedSpeaker} : ${line.text}`
        : `${resolvedSpeaker} : ${line.text}`;
      this.persistActiveVnSession();
      if (focus) requestAnimationFrame(() => continueButton.focus());
      return;
    }

    speakerName.textContent = 'Décision réciproque';
    progress.textContent = 'CHOIX DE CONSENTEMENT';
    dialogueText.textContent = 'Aucune option n’est présélectionnée et aucun choix n’est chronométré.';
    this.setVnExpressionMood(session.heroId, 'reflective', session.chapterId);
    choicePrompt.textContent = beat.prompt;
    choiceContainer.hidden = false;
    continueButton.hidden = true;
    beat.options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vn-choice-btn';
      button.dataset.consentAction = option.consentAction;
      button.textContent = option.label;
      button.onclick = () => this.chooseVnOption(option);
      choiceContainer.appendChild(button);
    });
    status.textContent = beat.prompt;
    this.persistActiveVnSession();
    if (focus) requestAnimationFrame(() => choiceContainer.querySelector('button')?.focus());
  }

  transitionVnBeat(nextBeatId, { focus = true } = {}) {
    const context = this.getActiveVnContext();
    const nextBeat = context?.chapter.beats.find(beat => beat.id === nextBeatId);
    if (!context || !nextBeat) {
      this.pauseVnToChapterBrowser('La scène a été interrompue sans modifier votre progression.');
      return;
    }
    context.session.beatId = nextBeatId;
    context.session.lineIndex = 0;
    this.renderActiveVnBeat({ focus });
  }

  advanceVnDialogue() {
    const context = this.getActiveVnContext();
    if (!context || context.beat.kind !== 'dialogue') return;
    const { session, beat } = context;
    if (session.lineIndex < beat.lines.length - 1) {
      session.lineIndex++;
      this.renderActiveVnBeat();
      return;
    }
    if (beat.end) {
      this.finishVnChapter(beat);
      return;
    }
    this.transitionVnBeat(beat.nextBeat);
  }

  chooseVnOption(option) {
    const context = this.getActiveVnContext();
    if (!context || context.beat.kind !== 'choice') return;
    const token = `${context.session.heroId}.${context.session.chapterId}.${context.beat.id}.option.${option.id}`;
    this.recordVnHistory(
      `choice.${context.beat.id}.${option.id}`,
      'Vous',
      option.label
    );
    this.applyVnEffects(option.effects, token, context.hero);
    this.transitionVnBeat(option.nextBeat);
  }

  applyVnEffects(effects, token, hero) {
    if (!effects || !hero) return;
    // Revocation remains immediate even during a replay of an already-seen path.
    if (typeof effects.romanceOptIn === 'boolean') {
      hero.romanceOptIn = effects.romanceOptIn;
      this.syncVnExpansionConsent(hero.id, effects.romanceOptIn);
    }
    // `onceEffects` applies to the whole completed chapter, not only to the
    // exact branch previously read. Alternate replays therefore cannot grant
    // fresh XP through a different option.
    if (this.activeVnSession?.isReplay) {
      this.saveProgress();
      return;
    }
    if (this.vnSceneProgress.appliedEffects.includes(token)) {
      this.saveProgress();
      return;
    }
    const relationshipXp = Math.max(0, Math.floor(Number(effects.relationshipXp) || 0));
    if (relationshipXp > 0) this.gainHeroAffinity(hero, relationshipXp);
    (effects.setFlags || []).forEach(flag => {
      if (!this.vnSceneProgress.flags.includes(flag)) this.vnSceneProgress.flags.push(flag);
    });
    this.vnSceneProgress.appliedEffects.push(token);
    this.saveProgress();
  }

  finishVnChapter(endBeat) {
    const context = this.getActiveVnContext();
    if (!context) return;
    const { session, hero, chapter } = context;
    const endToken = `${session.heroId}.${session.chapterId}.${endBeat.id}.end`;
    this.applyVnEffects(endBeat.onEnterEffects, endToken, hero);
    const key = this.getVnChapterKey(session.heroId, session.chapterId);
    const endState = endBeat.endState || 'completed';
    const previousResult = this.vnSceneProgress.chapterResults[key];
    // Completion is monotonic. A later replay may pause or revoke consent, but
    // it must not erase the fact that this chapter already granted its rewards.
    this.vnSceneProgress.chapterResults[key] = previousResult?.startsWith('completed')
      ? previousResult
      : endState;
    this.vnSceneProgress.active = null;
    this.activeVnSession = null;
    hero.lastLoungeMessage = endState === 'revoked'
      ? 'Votre accord romantique est retiré sans altérer votre confiance ni votre alliance.'
      : endState === 'paused'
        ? 'La conversation est mise en pause sans perte de confiance.'
        : `Vous avez terminé « ${chapter.title} ». Cette scène peut être relue sans nouveau gain.`;
    this.saveProgress();
    const message = endState.startsWith('completed')
      ? `Chapitre terminé : ${chapter.title}`
      : endState === 'revoked'
        ? 'Accord révoqué. Alliance et confiance préservées.'
        : 'Conversation terminée sans pénalité.';
    this.renderVnChapterBrowser(session.heroId, message);
    this.announce(message);
    requestAnimationFrame(() => {
      document.querySelector(`#vn-chapter-list [data-chapter-id="${session.chapterId}"]`)?.focus();
    });
  }

  pauseVnToChapterBrowser(statusMessage = 'Conversation mise en pause. Votre ligne actuelle est sauvegardée.') {
    const context = this.getActiveVnContext();
    if (!context) return;
    this.persistActiveVnSession();
    const heroId = context.session.heroId;
    this.activeVnSession = null;
    this.renderVnChapterBrowser(heroId, statusMessage);
    requestAnimationFrame(() => {
      document.querySelector(`#vn-chapter-list [data-chapter-id="${context.session.chapterId}"]`)?.focus();
    });
  }

  revokeActiveVnConsent() {
    const context = this.getActiveVnContext();
    if (!context) return;
    context.hero.romanceOptIn = false;
    this.syncVnExpansionConsent(context.hero.id, false);
    context.hero.lastLoungeMessage = 'L’accord relationnel est révoqué immédiatement. Confiance et alliance restent intactes.';
    this.saveProgress();
    if (context.chapter.beats.some(beat => beat.id === 'revoke')) {
      this.transitionVnBeat('revoke');
    } else {
      this.pauseVnToChapterBrowser('Accord révoqué sans pénalité.');
    }
  }

  openSlotMachineModal() {
    const modal = document.getElementById('slot-machine-modal');
    if (!modal) return;
    document.getElementById('slot-coins-txt').textContent = `${this.coins} 🪙`;
    const slotResult = document.getElementById('slot-res-txt');
    slotResult?.setAttribute('role', 'status');
    slotResult?.setAttribute('aria-live', 'polite');
    slotResult?.setAttribute('aria-atomic', 'true');

    const spinButton = document.getElementById('btn-spin-slot');
    spinButton.disabled = this.coins < 25;
    spinButton.onclick = () => {
      if (this.coins < 25) {
        audio.playHurtVoice();
        if (slotResult) slotResult.textContent = 'Bio-Coins insuffisants pour cette mise.';
        return;
      }
      this.coins -= 25;
      audio.playSlotSpin();
      const symbols = ['💣', '⚡', '🪙', '🔞', '🏆'];
      const s1 = symbols[Math.floor(Math.random() * symbols.length)];
      const s2 = symbols[Math.floor(Math.random() * symbols.length)];
      const s3 = symbols[Math.floor(Math.random() * symbols.length)];

      document.getElementById('wheel-1').textContent = s1;
      document.getElementById('wheel-2').textContent = s2;
      document.getElementById('wheel-3').textContent = s3;

      if (s1 === s2 && s2 === s3) {
        this.coins += 350;
        audio.playPickup();
        if (slotResult) slotResult.textContent = `JACKPOT ! +350 Bio-Coins · solde ${this.coins}.`;
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        this.coins += 15;
        if (slotResult) slotResult.textContent = `Une paire · +15 Bio-Coins · solde ${this.coins}.`;
      } else {
        if (slotResult) slotResult.textContent = `Aucun gain · solde ${this.coins} Bio-Coins.`;
      }
      document.getElementById('slot-coins-txt').textContent = `${this.coins} 🪙`;
      spinButton.disabled = this.coins < 25;
      this.updateHUD();
    };
    this.openModal(modal);
  }

  openAchievementsModal() {
    const modal = document.getElementById('achievements-modal');
    const container = document.getElementById('achievements-list-container');
    if (!modal || !container) return;
    container.innerHTML = '';

    ACHIEVEMENTS.forEach(a => {
      const card = document.createElement('div');
      card.className = `achieve-card ${a.unlocked ? 'unlocked' : ''}`;
      card.innerHTML = `<div><h3 style="color: ${a.unlocked ? '#f59e0b' : '#fff'};">${a.name} ${a.unlocked ? '🏆' : '🔒'}</h3><p style="font-size:0.8rem; color:#94a3b8;">${a.desc}</p></div><div class="meta-currency">+${a.reward} ◆</div>`;
      container.appendChild(card);
    });
    this.openModal(modal);
  }

  unlockAchievement(id) {
    const a = ACHIEVEMENTS.find(item => item.id === id);
    if (a && !a.unlocked) {
      a.unlocked = true;
      this.metaCoins += a.reward;
      this.runMetaCoinsEarned += a.reward;
      audio.playPickup();
      this.showFeedback(`Succès : ${a.name} (+${a.reward} ◆)`, '#f59e0b');
      this.saveProgress();
      this.updateHUD();
    }
  }

  triggerBossRecruitModal(bossId) {
    const modal = document.getElementById('boss-recruit-modal');
    if (!modal) return;
    const hero = HERO_CLASSES[bossId]; if (!hero) return;

    document.getElementById('recruit-boss-name').textContent = hero.name;
    document.getElementById('recruit-boss-img').src = hero.avatar;
    document.getElementById('recruit-boss-img').alt = `${hero.name}, adulte de ${hero.age} ans`;
    document.getElementById('recruit-boss-response').textContent = 'Cette proposition ne crée aucun droit romantique et peut être refusée.';

    document.getElementById('btn-recruit-yes').onclick = () => {
      hero.unlocked = true;
      hero.allied = true;
      hero.romanceOptIn = false;
      this.unlockGalleryItem(bossId);
      this.unlockAchievement('recruiter');
      this.saveProgress();
      audio.playAbility();
      this.showFeedback(hero.allianceResponse, '#ec4899');
      this.closeModal(modal, false);
      this.renderClassCards();
      this.focusBattlefield();
    };
    this.openModal(modal);
  }

  openWardrobeModal(focusHeroId = null, focusSkin = null) {
    const modal = document.getElementById('wardrobe-modal');
    const container = document.getElementById('skin-options-container');
    if (!modal || !container) return;
    const wasOpen = modal.classList.contains('active');
    container.innerHTML = '';

    Object.values(HERO_CLASSES).forEach(hero => {
      if (hero.unlocked === false) return;
      const cardDefault = document.createElement('button');
      cardDefault.type = 'button';
      cardDefault.className = `skin-card ${hero.activeSkin !== 'alt' ? 'active' : ''}`;
      cardDefault.dataset.heroId = hero.id;
      cardDefault.dataset.skin = 'default';
      cardDefault.setAttribute('aria-pressed', String(hero.activeSkin !== 'alt'));
      cardDefault.innerHTML = `<img src="${hero.avatar}" alt="${hero.name}, ${hero.age} ans"><h3>${hero.name} — Armure classique</h3>`;
      cardDefault.onclick = () => this.applyHeroSkin(hero, 'default');
      container.appendChild(cardDefault);

      if (hero.altAvatar) {
        const cardAlt = document.createElement('button');
        cardAlt.type = 'button';
        cardAlt.className = `skin-card ${hero.activeSkin === 'alt' ? 'active' : ''}`;
        cardAlt.dataset.heroId = hero.id;
        cardAlt.dataset.skin = 'alt';
        cardAlt.setAttribute('aria-pressed', String(hero.activeSkin === 'alt'));
        cardAlt.innerHTML = `<img src="${hero.altAvatar}" alt="${hero.name}, portrait nocturne adulte"><h3 style="color: #ec4899;">${hero.name} — Portrait nocturne 18+</h3>`;
        cardAlt.onclick = () => this.applyHeroSkin(hero, 'alt');
        container.appendChild(cardAlt);
      }
    });
    this.openModal(modal);
    if (wasOpen && focusHeroId && focusSkin) {
      requestAnimationFrame(() => {
        container.querySelector(`[data-hero-id="${focusHeroId}"][data-skin="${focusSkin}"]`)?.focus();
      });
    }
  }

  applyHeroSkin(hero, skin) {
    hero.activeSkin = skin === 'alt' ? 'alt' : 'default';
    this.saveProgress();
    this.updateHeroPresentation();
    this.renderGallery();
    this.openWardrobeModal(hero.id, hero.activeSkin);
    this.announce(`Présentation de ${hero.name} mise à jour sans relancer la partie.`);
  }

  openAntagonistCodex() {
    const grid = document.getElementById('antagonist-codex-grid');
    if (!grid) return;
    grid.replaceChildren();
    const bossDefinitions = Object.values(
      CHARACTER_EXPANSION?.bossDefinitions || CHARACTER_EXPANSION?.bosses || {}
    );
    bossDefinitions.forEach(definition => {
      const card = document.createElement('article');
      card.className = 'antagonist-card';
      card.style.setProperty('--boss-color', definition.color || '#ec4899');

      const preview = document.createElement('div');
      preview.className = 'antagonist-preview';
      const portraitSource = definition.portrait;
      const atlasSource = definition.atlas
        || definition.sprite?.src
        || definition.spriteAtlas?.src;
      const previewSource = portraitSource || atlasSource;
      if (previewSource) preview.style.backgroundImage = `url("${previewSource}")`;
      if (portraitSource) {
        preview.classList.add('uses-portrait');
      }
      preview.setAttribute('role', 'img');
      preview.setAttribute(
        'aria-label',
        `Aperçu de ${definition.name || definition.title || definition.id}`
      );

      const body = document.createElement('div');
      body.className = 'antagonist-card-body';
      const name = document.createElement('h3');
      name.textContent = definition.name || definition.title || definition.id;
      const title = document.createElement('p');
      title.className = 'antagonist-title';
      title.textContent = definition.title || definition.archetype || 'Souveraine hostile';
      const signature = document.createElement('p');
      signature.className = 'antagonist-signature';
      signature.textContent = definition.signature
        ? `${definition.signature.name} — ${definition.signature.description}`
        : 'Mécanique signature non consignée.';

      const phases = document.createElement('ol');
      phases.className = 'antagonist-phases';
      const phaseDefinitions = Array.isArray(definition.phases)
        ? definition.phases
        : Object.values(definition.phases || {});
      phaseDefinitions.forEach((phase, index) => {
        const item = document.createElement('li');
        const pattern = phase.pattern?.name
          || phase.pattern?.type
          || phase.pattern
          || phase.mechanic
          || 'motif évolutif';
        item.textContent = `${phase.name || `Phase ${index + 1}`} · ${pattern}`;
        phases.appendChild(item);
      });

      const counter = document.createElement('p');
      counter.className = 'antagonist-counter';
      const counterplay = Array.isArray(definition.counterplay)
        ? definition.counterplay
          .map(entry => typeof entry === 'string' ? entry : entry?.text || entry?.label)
          .filter(Boolean)
          .join(' · ')
        : definition.counterplay;
      counter.textContent = `Contre : ${counterplay || 'Lisez les télégraphes et gardez une voie de repli.'}`;

      const status = document.createElement('p');
      status.className = 'antagonist-status';
      const defeated = this.defeatedBossIds.includes(definition.id);
      status.textContent = defeated ? 'TRÔNE NEUTRALISÉ' : 'TRÔNE ACTIF';

      const cinematicActions = document.createElement('div');
      cinematicActions.className = 'antagonist-cinematic-actions';
      [
        ['intro', 'VOIR L’ENTRÉE'],
        ['defeat', 'VOIR LE RETRAIT']
      ].forEach(([moment, label]) => {
        const button = document.createElement('button');
        button.className = 'btn-secondary';
        button.type = 'button';
        button.disabled = !defeated;
        button.textContent = defeated ? label : 'CG VERROUILLÉE';
        button.addEventListener('click', () => {
          this.openBossCinematicArchive(definition.id, moment);
        });
        cinematicActions.appendChild(button);
      });

      const huntButton = document.createElement('button');
      huntButton.className = 'btn-secondary antagonist-hunt-btn';
      huntButton.type = 'button';
      huntButton.disabled = !defeated;
      huntButton.textContent = defeated ? 'REJOUER LA CHASSE' : 'CHASSE VERROUILLÉE';
      if (!defeated) {
        huntButton.title = 'Neutralisez d’abord ce Trône dans la campagne Les Dix Trônes.';
      }
      huntButton.addEventListener('click', () => this.startVillainHunt(definition.id));

      body.append(
        name,
        title,
        signature,
        phases,
        counter,
        status,
        cinematicActions,
        huntButton
      );
      card.append(preview, body);
      grid.appendChild(card);
    });
    this.closeModal('hq-menu-modal', false);
    this.openModal('antagonist-codex-modal');
  }

  startVillainHunt(bossId) {
    const definition = this.getBossDefinition(bossId);
    const campaign = CHARACTER_EXPANSION?.campaigns?.ten_thrones;
    if (
      !definition
      || !campaign
      || !this.defeatedBossIds.includes(bossId)
    ) {
      this.announce('Cette chasse reste verrouillée jusqu’à la première neutralisation du Trône en campagne.');
      return false;
    }
    const scheduleEntry = Array.isArray(campaign.bossSchedule)
      ? campaign.bossSchedule.find(entry => entry.bossId === bossId)
      : Object.entries(campaign.bossSchedule || {})
        .map(([wave, scheduledBossId]) => ({ wave: Number(wave), bossId: scheduledBossId }))
        .find(entry => entry.bossId === bossId);
    const huntWave = Math.max(2, Number(scheduleEntry?.wave) || 2);
    this.closeModal('antagonist-codex-modal', false);
    this.closeModal('hq-menu-modal', false);
    this.startNewGame({
      campaignId: 'ten_thrones',
      difficulty: this.difficulty,
      layoutId: this.selectedLayoutId
    });
    this.activeBossHuntId = bossId;
    // The hunt is a compact practice sortie: keep the starter defenses, discard
    // the wave-one demonstration horde, then load the authored throne wave.
    this.enemies = [];
    this.enemyBullets = [];
    this.projectiles = [];
    this.configureWave(huntWave);
    this.clearRunCheckpoint();
    this.showFeedback(`Chasse lancée · ${definition.name}`, definition.color || '#ec4899');
    this.announce(
      `Chasse de boss lancée contre ${definition.name}, vague ${huntWave}. `
      + 'Chaque changement de phase est annoncé.'
    );
    this.focusBattlefield();
    return true;
  }

  openRosterModal() {
    this.renderClassCards();
    this.openModal('roster-modal');
  }

  renderClassCards() {
    const grid = document.getElementById('hero-select-grid'); if (!grid) return;
    grid.innerHTML = '';

    Object.values(HERO_CLASSES).forEach(hero => {
      if (hero.unlocked === false) return;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `class-card ${hero.id === this.selectedHero.id ? 'selected' : ''}`;
      card.dataset.hero = hero.id;
      card.setAttribute('aria-pressed', String(hero.id === this.selectedHero.id));
      const avatarSrc = hero.activeSkin === 'alt' && hero.altAvatar ? hero.altAvatar : hero.avatar;
      card.innerHTML = `<img src="${avatarSrc}" alt="${hero.name}, adulte de ${hero.age} ans"><h3>${hero.name}</h3><p>${hero.title} · ${hero.age} ans</p><p>${hero.abilityDesc}</p>`;
      card.addEventListener('click', () => {
        this.selectedHero = hero;
        this.syncSelectedHeroAffinity();
        this.updateWeaponsHUD();
        this.updateHeroPresentation();
        this.saveProgress();
        this.renderClassCards();
        requestAnimationFrame(() => grid.querySelector(`[data-hero="${hero.id}"]`)?.focus());
        this.announce(`${hero.name} prend le commandement. L’arsenal actif est conservé.`);
      });
      grid.appendChild(card);
    });
  }

  updateHeroPresentation() {
    if (this.hasEnteredAdultExperience) this.ensureHeroSprite(this.selectedHero?.id);
    const avatarImg = document.getElementById('hero-avatar-img');
    if (avatarImg) {
      avatarImg.src = this.selectedHero.activeSkin === 'alt' && this.selectedHero.altAvatar ? this.selectedHero.altAvatar : this.selectedHero.avatar;
      avatarImg.alt = `${this.selectedHero.name}, ${this.selectedHero.age} ans`;
    }
    const heroName = document.getElementById('hero-name-txt');
    if (heroName) heroName.textContent = this.selectedHero.name;
    const btnSkill = document.getElementById('btn-hero-skill');
    if (btnSkill) btnSkill.textContent = `⚡ ${this.selectedHero.abilityName}`;
    this.updateHUD();
  }

  triggerLevelUpModal() {
    const modal = document.getElementById('level-up-modal');
    const container = document.getElementById('upgrade-options-container');
    if (!modal || !container) return;
    const wasOpen = modal.classList.contains('active');
    container.innerHTML = '';

    const available = [];
    Object.values(this.weapons).forEach(wp => {
      if (wp.level < wp.maxLevel) {
        available.push({ type: 'weapon', wp, title: wp.level === 0 ? `Débloquer ${wp.name}` : `Améliorer ${wp.name} (Niveau ${wp.level + 1})`, desc: wp.desc, icon: wp.icon });
      }
    });
    available.push({ type: 'heal', title: 'Réparation d\'Urgence', desc: 'Restaure 200 HP à la Citadelle.', icon: '🛠️' });

    const options = available
      .map(option => ({ option, order: this.getRunRandom() }))
      .sort((left, right) => left.order - right.order)
      .slice(0, 3)
      .map(entry => entry.option);
    options.forEach(opt => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'upgrade-card';
      card.innerHTML = `<div class="upgrade-info"><div class="upgrade-icon">${opt.icon}</div><div class="upgrade-text"><h3>${opt.title}</h3><p>${opt.desc}</p></div></div>`;
      card.addEventListener('click', () => {
        if (opt.type === 'weapon') { opt.wp.level++; this.updateWeaponsHUD(); }
        else if (opt.type === 'heal') { this.healCitadel(200); }
        if (this.pendingLevelChoices > 0) this.pendingLevelChoices--;
        if (this.pendingLevelChoices > 0) {
          this.triggerLevelUpModal();
        } else {
          this.closeModal(modal, false);
          this.focusBattlefield();
        }
        this.updateHUD();
      });
      container.appendChild(card);
    });
    this.openModal(modal);
    if (wasOpen) requestAnimationFrame(() => container.querySelector('button')?.focus());
  }

  triggerEvolutionModal() {
    const modal = document.getElementById('level-up-modal');
    const container = document.getElementById('upgrade-options-container');
    if (!modal || !container) return;
    container.innerHTML = '';

    const evolvable = Object.values(this.weapons).filter(w => w.level >= w.maxLevel && !w.isEvolved);
    if (evolvable.length === 0) { this.triggerLevelUpModal(); return; }

    const targetWp = evolvable[0];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'upgrade-card evolution';
    card.innerHTML = `<div class="upgrade-info"><div class="upgrade-icon">🔥</div><div class="upgrade-text"><h3 style="color: #f59e0b;">ÉVOLUTION SUPER-ARME : ${targetWp.evolutionName}</h3><p>${targetWp.evolutionDesc}</p></div></div>`;
    card.addEventListener('click', () => {
      targetWp.isEvolved = true; targetWp.name = targetWp.evolutionName; targetWp.damage *= 2.5;
      this.evolvedWeaponsCount++; this.unlockAchievement('super_weapon'); this.updateWeaponsHUD(); this.checkGalleryUnlocks();
      this.closeModal(modal, false);
      this.focusBattlefield();
    });

    container.appendChild(card);
    this.openModal(modal);
  }

  openShopModal() {
    const modal = document.getElementById('shop-modal'); if (!modal) return;
    document.getElementById('shop-coins-txt').textContent = `${this.metaCoins} ◆`;
    const hpCost = 75 + (this.shopUpgrades.hpBonus * 50);
    const rateCost = 100 + (this.shopUpgrades.fireRateBonus * 75);
    const magnetCost = 75 + (this.shopUpgrades.magnetRange * 60);
    const hpButton = document.getElementById('buy-hp-btn');
    const rateButton = document.getElementById('buy-rate-btn');
    const magnetButton = document.getElementById('buy-magnet-btn');
    hpButton.textContent = this.shopUpgrades.hpBonus >= 100 ? 'MAX' : `${hpCost} ◆`;
    rateButton.textContent = this.shopUpgrades.fireRateBonus >= 10 ? 'MAX' : `${rateCost} ◆`;
    magnetButton.textContent = this.shopUpgrades.magnetRange >= 10 ? 'MAX' : `${magnetCost} ◆`;
    hpButton.disabled = this.metaCoins < hpCost || this.shopUpgrades.hpBonus >= 100;
    rateButton.disabled = this.metaCoins < rateCost || this.shopUpgrades.fireRateBonus >= 10;
    magnetButton.disabled = this.metaCoins < magnetCost || this.shopUpgrades.magnetRange >= 10;

    hpButton.onclick = () => {
      if (this.metaCoins >= hpCost && this.shopUpgrades.hpBonus < 100) {
        this.metaCoins -= hpCost;
        this.shopUpgrades.hpBonus++;
        this.citadel.maxHp += 50;
        this.citadel.hp += 50;
        this.saveProgress();
        this.updateHUD();
        this.openShopModal();
      }
    };
    rateButton.onclick = () => {
      if (this.metaCoins >= rateCost && this.shopUpgrades.fireRateBonus < 10) {
        this.metaCoins -= rateCost;
        this.shopUpgrades.fireRateBonus++;
        this.saveProgress();
        this.updateHUD();
        this.openShopModal();
      }
    };
    magnetButton.onclick = () => {
      if (this.metaCoins >= magnetCost && this.shopUpgrades.magnetRange < 10) {
        this.metaCoins -= magnetCost;
        this.shopUpgrades.magnetRange++;
        this.saveProgress();
        this.updateHUD();
        this.openShopModal();
      }
    };
    this.openModal(modal);
  }

  getBossCinematic(bossId, moment = 'intro') {
    const definition = ADULT_SCENES?.villainCinematics?.[bossId];
    if (!definition) return null;
    const isDefeat = moment === 'defeat';
    return {
      id: `${bossId}_${isDefeat ? 'defeat' : 'intro'}`,
      bossId,
      moment: isDefeat ? 'defeat' : 'intro',
      name: definition.name,
      eyebrow: isDefeat ? 'TRÔNE NEUTRALISÉ' : 'TRÔNE EN APPROCHE',
      title: isDefeat
        ? `${definition.name} · Retrait tactique`
        : `${definition.name} · ${definition.title}`,
      src: isDefeat ? definition.defeatSrc : definition.introSrc,
      alt: isDefeat ? definition.defeatAlt : definition.introAlt,
      description: isDefeat ? definition.defeatCopy : definition.introCopy
    };
  }

  openBossCinematicArchive(bossId, moment = 'intro') {
    if (!this.defeatedBossIds.includes(bossId)) return false;
    const cinematic = this.getBossCinematic(bossId, moment);
    if (!cinematic) return false;
    const definition = ADULT_SCENES.villainCinematics[bossId];
    this.openCgStoryViewer({
      id: cinematic.id,
      name: cinematic.title,
      subtitle: cinematic.eyebrow,
      img: cinematic.src,
      alt: cinematic.alt,
      ageLabel: `${definition.age} ans`,
      quote: moment === 'defeat'
        ? '« Mon Trône est tombé. Je retiens ton nom. »'
        : '« Haven verra venir chaque phase de mon règne. »',
      story: cinematic.description,
      stats: {
        Type: 'Cinématique de Trône',
        Adulte: `${definition.age} ans`,
        État: moment === 'defeat' ? 'Neutralisée' : 'Approche'
      }
    });
    return true;
  }

  queueBossCinematic(bossId, moment = 'intro') {
    if (!this.hasEnteredAdultExperience) return false;
    const cinematic = this.getBossCinematic(bossId, moment);
    if (!cinematic) return false;
    const seenSet = moment === 'defeat' ? this.seenBossDefeatIds : this.seenBossIntroIds;
    if (seenSet.has(bossId)) return false;
    seenSet.add(bossId);
    return this.queueCinematic(cinematic);
  }

  queueCinematic(cinematic) {
    if (!cinematic?.id || !cinematic?.src) return false;
    if (
      this.activeCinematic?.id === cinematic.id
      || this.pendingCinematics.some(item => item.id === cinematic.id)
    ) return false;
    this.pendingCinematics.push(cinematic);
    this.processCinematicQueue();
    return true;
  }

  processCinematicQueue() {
    if (
      this.activeCinematic
      || this.isGameOver
      || !this.hasEnteredAdultExperience
      || this.pendingCinematics.length === 0
    ) return false;
    const adultGate = document.getElementById('adult-gate-modal');
    if (adultGate?.classList.contains('active')) return false;
    const topModal = this.getTopOpenModal();
    if (topModal && topModal.id !== 'cinematic-modal') return false;

    const modal = document.getElementById('cinematic-modal');
    const image = document.getElementById('cinematic-img');
    const title = document.getElementById('cinematic-title');
    const eyebrow = document.getElementById('cinematic-eyebrow');
    const description = document.getElementById('cinematic-description');
    if (!modal || !image || !title || !eyebrow || !description) return false;

    const cinematic = this.pendingCinematics.shift();
    this.activeCinematic = cinematic;
    image.src = cinematic.src;
    image.alt = cinematic.alt || '';
    title.textContent = cinematic.title;
    eyebrow.textContent = cinematic.eyebrow;
    description.textContent = cinematic.description;
    this.openModal(modal);
    this.announce(`${cinematic.eyebrow}. ${cinematic.title}.`);
    return true;
  }

  getBodyRoute(routeId) {
    return (ADULT_SCENES?.bodyRoutes || []).find(route => route.id === routeId) || null;
  }

  getBodyRouteForScene(scene) {
    return scene?.bodyRouteId ? this.getBodyRoute(scene.bodyRouteId) : null;
  }

  getBodyRouteNode(route, nodeId) {
    return route?.nodes?.find(node => node.id === nodeId) || null;
  }

  createBodyRouteState(route) {
    return {
      status: 'new',
      nodeId: route?.initialNode || 'opening',
      lineIndex: 0,
      choicePath: [],
      completed: false
    };
  }

  sanitizeLoadedBodyRouteProgress(savedProgress) {
    const routeDataVersion = ADULT_SCENES.bodyRouteDataVersion || ADULT_SCENES.contentVersion;
    const clean = {
      dataVersion: routeDataVersion,
      routes: {}
    };
    if (
      !savedProgress
      || typeof savedProgress !== 'object'
      || savedProgress.dataVersion !== routeDataVersion
      || !savedProgress.routes
      || typeof savedProgress.routes !== 'object'
    ) return clean;

    const knownRoutes = new Map((ADULT_SCENES.bodyRoutes || []).map(route => [route.id, route]));
    Object.entries(savedProgress.routes)
      .filter(([routeId]) => knownRoutes.has(routeId))
      .slice(0, 60)
      .forEach(([routeId, candidate]) => {
      const route = knownRoutes.get(routeId);
      if (!route || !candidate || typeof candidate !== 'object') return;
      const fallback = this.createBodyRouteState(route);
      const node = this.getBodyRouteNode(route, candidate.nodeId) || this.getBodyRouteNode(route, fallback.nodeId);
      const knownChoiceIds = new Set(route.nodes
        .filter(item => item.kind === 'choice')
        .flatMap(item => item.options.map(option => option.id)));
      const choicePath = Array.isArray(candidate.choicePath)
        ? candidate.choicePath
          .filter(choiceId => typeof choiceId === 'string' && knownChoiceIds.has(choiceId))
          .slice(0, route.choicesRequired || 2)
        : [];
      const maxLineIndex = node?.kind === 'dialogue'
        ? Math.max(0, node.lines.length - 1)
        : 0;
      const completed = Boolean(
        candidate.completed === true
        && node?.end === true
        && choicePath.length >= (route.choicesRequired || 2)
      );
      clean.routes[routeId] = {
        status: completed
          ? 'completed'
          : candidate.status === 'in_progress'
            ? 'in_progress'
            : 'new',
        nodeId: node?.id || fallback.nodeId,
        lineIndex: Math.max(0, Math.min(maxLineIndex, Math.floor(Number(candidate.lineIndex) || 0))),
        choicePath,
        completed
      };
      });
    return clean;
  }

  getOrCreateBodyRouteState(route) {
    if (!route) return null;
    const routeDataVersion = ADULT_SCENES.bodyRouteDataVersion || ADULT_SCENES.contentVersion;
    if (!this.bodyRouteProgress || this.bodyRouteProgress.dataVersion !== routeDataVersion) {
      this.bodyRouteProgress = {
        dataVersion: routeDataVersion,
        routes: {}
      };
    }
    if (!this.bodyRouteProgress.routes[route.id]) {
      this.bodyRouteProgress.routes[route.id] = this.createBodyRouteState(route);
    }
    return this.bodyRouteProgress.routes[route.id];
  }

  isAdultUnlockRuleSatisfied(rule) {
    if (!rule) return false;
    if (rule.type === 'first_game_over') {
      return this.isGameOver || this.runHistory.some(entry => entry?.victory === false);
    }
    if (rule.type === 'heroes_unlocked') {
      return (rule.heroIds || []).every(heroId => {
        const hero = HERO_CLASSES[heroId];
        return Boolean(hero && hero.unlocked !== false);
      });
    }
    if (rule.type === 'boss_defeated') {
      return Boolean(rule.bossId && this.defeatedBossIds.includes(rule.bossId));
    }
    if (rule.type === 'body_route_completed') {
      return Boolean(rule.routeId && this.bodyRouteProgress?.routes?.[rule.routeId]?.completed === true);
    }
    return false;
  }

  isAdultBonusSceneUnlocked(scene) {
    return this.isAdultUnlockRuleSatisfied(scene?.unlockRule);
  }

  isBodyRouteAvailable(route) {
    return Boolean(route && this.isAdultUnlockRuleSatisfied(route.unlockRule));
  }

  getAdultBonusUnlockLabel(scene) {
    if (scene?.unlockRule?.type === 'body_route_completed') {
      const route = this.getBodyRoute(scene.unlockRule.routeId);
      return route ? `Terminer la route VN « ${route.title} ».` : 'Terminer cette route VN.';
    }
    if (scene?.unlockRule?.type === 'first_game_over') {
      return 'Subir un premier Game Over.';
    }
    if (scene?.unlockRule?.type === 'boss_defeated') {
      const bossName = this.getBossDefinition(scene.unlockRule.bossId)?.name;
      return `Neutraliser ${bossName || 'ce Trône'}.`;
    }
    const heroNames = (scene?.unlockRule?.heroIds || [])
      .map(heroId => HERO_CLASSES[heroId]?.name)
      .filter(Boolean);
    return heroNames.length > 1
      ? `Débloquer ${heroNames.join(' et ')}.`
      : `Débloquer ${heroNames[0] || 'cette héroïne'}.`;
  }

  getAdultSceneKindLabel(kind) {
    return ADULT_SCENES?.categories?.[kind] || kind || 'Archive adulte';
  }

  formatAdultSceneParticipants(scene) {
    return (scene?.participants || []).map(participantId => (
      HERO_CLASSES[participantId]?.name
      || this.getBossDefinition(participantId)?.name
      || participantId
    )).join(' · ');
  }

  openAdultScenesModal() {
    const select = document.getElementById('adult-scenes-filter-select');
    if (select) {
      select.innerHTML = '';
      Object.entries(ADULT_SCENES?.categories || {}).forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      });
      if ([...select.options].some(option => option.value === this.activeAdultSceneFilter)) {
        select.value = this.activeAdultSceneFilter;
      }
    }
    const participantSelect = document.getElementById('body-route-participant-select');
    if (participantSelect) {
      participantSelect.innerHTML = '';
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'Tous les personnages · 60 routes / 20 séquences Éros';
      participantSelect.appendChild(allOption);
      [
        ['heroines', 'Héroïnes'],
        ['villains', 'Trônes antagonistes']
      ].forEach(([groupId, groupLabel]) => {
        const group = document.createElement('optgroup');
        group.label = groupLabel;
        (ADULT_SCENES.bodyRoutes || [])
          .filter(route => route.participantGroup === groupId)
          .filter((route, index, routes) => routes.findIndex(item => item.participantId === route.participantId) === index)
          .forEach(route => {
            const option = document.createElement('option');
            option.value = route.participantId;
            option.textContent = `${route.participantName} · 3 routes / 1 séquence Éros`;
            group.appendChild(option);
          });
        participantSelect.appendChild(group);
      });
      const validParticipantFilter = [...participantSelect.options]
        .some(option => option.value === this.activeBodyRouteParticipantFilter)
        ? this.activeBodyRouteParticipantFilter
        : 'all';
      this.activeBodyRouteParticipantFilter = validParticipantFilter;
      participantSelect.value = validParticipantFilter;
    }
    this.renderAdultScenes();
    this.openModal('adult-scenes-modal');
  }

  syncBodyRouteParticipantControls(filter = this.activeAdultSceneFilter) {
    const controls = document.getElementById('body-route-participant-filter');
    const summary = document.getElementById('body-route-progress-summary');
    const visible = filter === 'body_variants' || filter === 'eros_time';
    if (controls) controls.hidden = !visible;
    if (summary) summary.hidden = !visible;
  }

  renderBodyRouteProgressSummary(filter = this.activeAdultSceneFilter) {
    this.syncBodyRouteParticipantControls(filter);
    const summary = document.getElementById('body-route-progress-summary');
    if (!summary) return;
    if (filter === 'eros_time') {
      const entries = (ADULT_SCENES.bonusScenes || [])
        .filter(scene => scene.kind === 'eros_time' && scene.listedInArchive === true)
        .filter(scene => (
          this.activeBodyRouteParticipantFilter === 'all'
          || scene.participants?.includes(this.activeBodyRouteParticipantFilter)
        ));
      const totalCg = entries.reduce((total, scene) => total + (scene.sequenceLength || 1), 0);
      const unlocked = entries.filter(scene => this.isAdultBonusSceneUnlocked(scene)).length;
      const selected = entries[0];
      summary.textContent = selected && this.activeBodyRouteParticipantFilter !== 'all'
        ? `${this.formatAdultSceneParticipants(selected)} · 1 séquence / ${totalCg} CG · ${selected.partnerGroup.count} hommes adultes de 28 ans et plus · consentement révocable · intimité hors champ.`
        : `${entries.length} séquences / ${totalCg} CG · 2 à 6 hommes adultes de 28 ans et plus · ${unlocked}/${entries.length} séquences accessibles · toute intimité reste hors champ.`;
      return;
    }
    if (filter !== 'body_variants') return;
    const routes = (ADULT_SCENES.bodyRoutes || [])
      .filter(route => (
        this.activeBodyRouteParticipantFilter === 'all'
        || route.participantId === this.activeBodyRouteParticipantFilter
      ));
    const completed = routes.filter(route => this.bodyRouteProgress?.routes?.[route.id]?.completed === true).length;
    const inProgress = routes.filter(route => (
      this.bodyRouteProgress?.routes?.[route.id]?.status === 'in_progress'
      && this.bodyRouteProgress?.routes?.[route.id]?.completed !== true
    )).length;
    const participantName = routes[0]?.participantName;
    summary.textContent = `${participantName && this.activeBodyRouteParticipantFilter !== 'all' ? `${participantName} · ` : ''}${completed}/${routes.length} routes terminées${inProgress ? ` · ${inProgress} à reprendre` : ''}. Chaque route est indépendante et sans effet gameplay.`;
  }

  renderAdultScenes(filter = this.activeAdultSceneFilter) {
    const grid = document.getElementById('adult-scenes-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const scenes = (ADULT_SCENES?.bonusScenes || [])
      .filter(scene => filter === 'all' || scene.kind === filter)
      .filter(scene => scene.kind !== 'eros_time' || scene.listedInArchive === true)
      .filter(scene => (
        (filter !== 'body_variants' && filter !== 'eros_time')
        || this.activeBodyRouteParticipantFilter === 'all'
        || scene.participants?.includes(this.activeBodyRouteParticipantFilter)
      ));
    this.renderBodyRouteProgressSummary(filter);

    scenes.forEach(scene => {
      const unlocked = this.isAdultBonusSceneUnlocked(scene);
      const bodyRoute = this.getBodyRouteForScene(scene);
      const routeAvailable = !unlocked && this.isBodyRouteAvailable(bodyRoute);
      const routeState = bodyRoute ? this.getOrCreateBodyRouteState(bodyRoute) : null;
      const actionable = unlocked || routeAvailable;
      const card = document.createElement(actionable ? 'button' : 'div');
      if (actionable) card.type = 'button';
      card.dataset.adultSceneId = scene.id;
      if (bodyRoute) card.dataset.bodyRouteId = bodyRoute.id;
      if (scene.sequenceId) card.dataset.sequenceId = scene.sequenceId;
      card.className = `adult-scene-card ${scene.kind === 'eros_time' ? 'eros-time-card' : ''} ${unlocked ? 'unlocked' : 'locked'} ${routeAvailable ? 'route-available' : ''}`;
      const image = document.createElement('img');
      image.src = unlocked
        ? scene.src
        : routeAvailable
          ? bodyRoute.portraitSrc
          : 'assets/cover.jpg';
      image.alt = unlocked
        ? scene.alt
        : routeAvailable
          ? `${bodyRoute.participantName}, adulte de ${bodyRoute.participantAge} ans, avant la route VN`
          : '';
      image.loading = 'lazy';
      image.decoding = 'async';
      card.appendChild(image);

      const body = document.createElement('div');
      body.className = 'adult-scene-card-body';
      const kind = document.createElement('span');
      kind.className = 'adult-scene-kind';
      kind.textContent = this.getAdultSceneKindLabel(scene.kind);
      const title = document.createElement('h3');
      title.textContent = scene.title;
      const subtitle = document.createElement('p');
      subtitle.textContent = scene.subtitle;
      body.append(kind, title, subtitle);
      if (scene.kind === 'eros_time') {
        const sequenceStatus = document.createElement('span');
        sequenceStatus.className = 'adult-scene-route-status';
        sequenceStatus.textContent = `SÉQUENCE · ${scene.sequenceLength} CG · ${scene.partnerGroup.count} HOMMES ADULTES · HORS CHAMP`;
        body.appendChild(sequenceStatus);
      }
      if (routeAvailable && routeState) {
        const routeStatus = document.createElement('span');
        routeStatus.className = 'adult-scene-route-status';
        routeStatus.textContent = routeState.status === 'in_progress'
          ? `REPRENDRE LA ROUTE VN · ${routeState.choicePath.length}/2 CHOIX`
          : 'JOUER LA ROUTE VN · 29 RÉPLIQUES · 2 CHOIX';
        body.appendChild(routeStatus);
      }
      card.appendChild(body);

      if (unlocked) {
        card.setAttribute('aria-label', `Ouvrir ${scene.title}. ${scene.subtitle}`);
        card.addEventListener('click', () => this.openAdultSceneViewer(scene));
      } else if (routeAvailable) {
        card.setAttribute(
          'aria-label',
          `${routeState?.status === 'in_progress' ? 'Reprendre' : 'Commencer'} la route VN ${bodyRoute.title} de ${bodyRoute.participantName}. La CG ${scene.title} sera révélée à la fin.`
        );
        card.addEventListener('click', () => this.openBodyRouteVn(bodyRoute.id));
        const routeBadge = document.createElement('span');
        routeBadge.className = 'adult-scene-route-badge';
        routeBadge.textContent = routeState?.status === 'in_progress' ? 'VN · REPRISE' : 'VN · NOUVELLE ROUTE';
        card.appendChild(routeBadge);
      } else {
        const prerequisiteScene = scene.routeUnlockRule
          ? { unlockRule: scene.routeUnlockRule }
          : scene;
        const prerequisiteLabel = this.getAdultBonusUnlockLabel(prerequisiteScene);
        card.setAttribute('role', 'img');
        card.setAttribute('aria-label', `${scene.title}, route verrouillée. ${prerequisiteLabel}`);
        const lock = document.createElement('span');
        lock.className = 'adult-scene-lock';
        lock.textContent = `🔒 ${prerequisiteLabel}`;
        card.appendChild(lock);
      }
      grid.appendChild(card);
    });
  }

  openBodyRouteVn(routeId) {
    const route = this.getBodyRoute(routeId);
    const modal = document.getElementById('body-route-vn-modal');
    if (!route || !modal || !this.isBodyRouteAvailable(route)) {
      this.showFeedback('Cette route VN n’est pas encore disponible.', '#ef4444');
      return false;
    }
    const state = this.getOrCreateBodyRouteState(route);
    if (state.completed) {
      const scene = (ADULT_SCENES.bonusScenes || []).find(item => item.id === route.sceneId);
      return this.openAdultSceneViewer(scene);
    }
    state.status = 'in_progress';
    this.activeBodyRouteId = route.id;
    document.getElementById('body-route-vn-eyebrow').textContent = `${route.participantName} · ${route.participantAge} ANS`;
    document.getElementById('body-route-vn-title').textContent = route.title;
    document.getElementById('body-route-vn-subtitle').textContent = route.subtitle;
    document.getElementById('body-route-vn-summary').textContent = route.summary;
    const image = document.getElementById('body-route-vn-img');
    image.src = route.portraitSrc;
    image.alt = `${route.participantName}, adulte de ${route.participantAge} ans, dans la route VN ${route.title}`;
    document.getElementById('btn-body-route-pause').onclick = () => this.pauseBodyRouteToArchives();
    this.openModal(modal);
    this.renderActiveBodyRouteNode({ focus: true });
    return true;
  }

  getActiveBodyRouteContext() {
    const route = this.getBodyRoute(this.activeBodyRouteId);
    const state = route && this.getOrCreateBodyRouteState(route);
    const node = route && state && this.getBodyRouteNode(route, state.nodeId);
    return route && state && node ? { route, state, node } : null;
  }

  renderActiveBodyRouteNode({ focus = false } = {}) {
    const context = this.getActiveBodyRouteContext();
    if (!context) return;
    const { route, state, node } = context;
    const speaker = document.getElementById('body-route-vn-speaker');
    const progress = document.getElementById('body-route-vn-progress');
    const dialogue = document.getElementById('body-route-vn-dialogue');
    const choices = document.getElementById('body-route-vn-choices');
    const prompt = document.getElementById('body-route-vn-choice-prompt');
    const continueButton = document.getElementById('btn-body-route-continue');
    const status = document.getElementById('body-route-vn-status');
    if (!speaker || !progress || !dialogue || !choices || !prompt || !continueButton || !status) return;

    choices.querySelectorAll('button').forEach(button => button.remove());
    progress.textContent = `DÉCISIONS ${state.choicePath.length} / ${route.choicesRequired}`;
    status.textContent = `Route sauvegardée · ${state.choicePath.length}/${route.choicesRequired} choix · aucun effet gameplay`;

    if (node.kind === 'dialogue') {
      state.lineIndex = Math.max(0, Math.min(state.lineIndex, node.lines.length - 1));
      const line = node.lines[state.lineIndex];
      speaker.textContent = line.speaker === 'hero'
        ? route.participantName
        : line.speaker === 'player'
          ? 'Vous'
          : 'Narration';
      progress.textContent += ` · RÉPLIQUE ${state.lineIndex + 1} / ${node.lines.length}`;
      dialogue.textContent = line.text;
      dialogue.dataset.mood = line.mood || 'neutral';
      choices.hidden = true;
      continueButton.hidden = false;
      continueButton.textContent = node.end && state.lineIndex === node.lines.length - 1
        ? 'RÉVÉLER LA CG'
        : 'CONTINUER';
      continueButton.onclick = () => this.advanceBodyRouteDialogue();
      this.saveProgress();
      if (focus) requestAnimationFrame(() => continueButton.focus());
      return;
    }

    speaker.textContent = 'Décision de route';
    dialogue.textContent = 'Aucune option n’est présélectionnée. Vous pouvez interrompre et reprendre cette route sans pénalité.';
    prompt.textContent = node.prompt;
    choices.hidden = false;
    continueButton.hidden = true;
    node.options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'body-route-vn-choice';
      button.textContent = option.label;
      button.onclick = () => this.chooseBodyRouteOption(option);
      choices.appendChild(button);
    });
    this.saveProgress();
    if (focus) requestAnimationFrame(() => choices.querySelector('button')?.focus());
  }

  transitionBodyRouteNode(nextNodeId) {
    const context = this.getActiveBodyRouteContext();
    const nextNode = context && this.getBodyRouteNode(context.route, nextNodeId);
    if (!context || !nextNode) {
      this.pauseBodyRouteToArchives('Route interrompue sans perte de progression.');
      return;
    }
    context.state.nodeId = nextNode.id;
    context.state.lineIndex = 0;
    this.renderActiveBodyRouteNode({ focus: true });
  }

  advanceBodyRouteDialogue() {
    const context = this.getActiveBodyRouteContext();
    if (!context || context.node.kind !== 'dialogue') return;
    if (context.state.lineIndex < context.node.lines.length - 1) {
      context.state.lineIndex++;
      this.renderActiveBodyRouteNode();
      return;
    }
    if (context.node.end) {
      this.finishBodyRoute();
      return;
    }
    this.transitionBodyRouteNode(context.node.nextNode);
  }

  chooseBodyRouteOption(option) {
    const context = this.getActiveBodyRouteContext();
    if (!context || context.node.kind !== 'choice' || !context.node.options.includes(option)) return;
    if (!context.state.choicePath.includes(option.id)) {
      context.state.choicePath.push(option.id);
      context.state.choicePath = context.state.choicePath.slice(0, context.route.choicesRequired);
    }
    this.transitionBodyRouteNode(option.nextNode);
  }

  pauseBodyRouteToArchives(message = 'Route VN mise en pause. La réplique actuelle et les choix sont sauvegardés.') {
    const routeId = this.activeBodyRouteId;
    this.saveProgress();
    this.activeBodyRouteId = null;
    this.closeModal('body-route-vn-modal', false);
    this.renderAdultScenes(this.activeAdultSceneFilter);
    this.announce(message);
    requestAnimationFrame(() => {
      document.querySelector(`[data-body-route-id="${routeId}"]`)?.focus();
    });
  }

  finishBodyRoute() {
    const context = this.getActiveBodyRouteContext();
    if (
      !context
      || !context.node.end
      || context.state.choicePath.length < context.route.choicesRequired
    ) return false;
    const routeId = context.route.id;
    context.state.status = 'completed';
    context.state.completed = true;
    context.state.lineIndex = context.node.lines.length - 1;
    const scene = (ADULT_SCENES.bonusScenes || []).find(item => item.id === context.route.sceneId);
    const message = `Route VN terminée : ${context.route.participantName} · ${context.route.title}. CG déverrouillée.`;
    this.saveProgress();
    this.activeBodyRouteId = null;
    this.closeModal('body-route-vn-modal', false);
    this.renderAdultScenes(this.activeAdultSceneFilter);
    this.announce(message);
    if (scene) {
      requestAnimationFrame(() => {
        const returnTarget = document.querySelector(`[data-body-route-id="${routeId}"]`);
        returnTarget?.focus();
        this.openAdultSceneViewer(scene);
      });
    }
    return true;
  }

  openAdultSceneViewer(scene) {
    if (!scene || !this.isAdultBonusSceneUnlocked(scene)) return false;
    const participants = this.formatAdultSceneParticipants(scene);
    this.openCgStoryViewer({
      id: scene.id,
      adultSceneId: scene.id,
      name: scene.title,
      subtitle: scene.subtitle,
      img: scene.src,
      alt: scene.alt,
      ageLabel: scene.ageLabel,
      quote: scene.quote,
      story: scene.story,
      stats: {
        Type: this.getAdultSceneKindLabel(scene.kind),
        Adultes: scene.ageLabel,
        Personnages: participants,
        ...(scene.partnerGroup ? {
          Partenaires: `${scene.partnerGroup.count} hommes adultes indépendants`,
          'Âge minimum': `${scene.partnerGroup.minimumAge} ans`,
          Consentement: 'affirmé, révocable · sortie libre',
          Intimité: 'hors champ · aucun acte montré'
        } : {}),
        ...(scene.bodyRouteId ? { 'Route VN': 'Terminée · archive révélée' } : {}),
        ...(scene.sequenceId ? { Étape: `${scene.sequenceIndex + 1} / ${scene.sequenceLength} · ${scene.sequenceStageLabel}` } : {})
      }
    });
    return true;
  }

  selectGameOverTease() {
    const scenes = (ADULT_SCENES?.bonusScenes || [])
      .filter(scene => scene.kind === 'game_over');
    if (!scenes.length) return null;
    const selectedMatch = scenes.find(scene => scene.heroId === this.selectedHero?.id);
    if (selectedMatch) return selectedMatch;
    const seed = Math.max(0, this.wave + this.mutantsKilled + this.score);
    return scenes[seed % scenes.length];
  }

  applyGameOverTease() {
    const image = document.getElementById('game-over-tease-img');
    const caption = document.getElementById('game-over-tease-caption');
    if (!image || !caption) return null;
    const scene = this.selectGameOverTease();
    const figure = image.closest('.game-over-tease');
    if (!scene) {
      if (figure) figure.hidden = true;
      image.removeAttribute('src');
      image.alt = '';
      return null;
    }
    if (figure) figure.hidden = false;
    image.src = scene.src;
    image.alt = scene.alt;
    caption.textContent = scene.story;
    return scene;
  }

  openGalleryModal() {
    this.checkGalleryUnlocks();
    this.renderGallery();
    this.openModal('gallery-modal');
  }

  checkGalleryUnlocks() {
    if (!this.isTowerMode && this.wave >= 3) this.unlockGalleryItem('aria');
    if (this.decoysDeployedCount >= 3) this.unlockGalleryItem('kira');
    if (this.evolvedWeaponsCount >= 1) this.unlockGalleryItem('rin');
    if (this.totalCoinsEarned >= 500) this.unlockGalleryItem('nova');
  }

  unlockGalleryItem(id) {
    const item = GALLERY_ITEMS.find(i => i.id === id);
    if (item && !item.unlocked) {
      item.unlocked = true;
      audio.playPickup();
      this.showFeedback(`Archive débloquée : ${item.name}`, '#f59e0b');
      this.saveProgress();
    }
  }

  renderGallery() {
    const grid = document.getElementById('gallery-grid-container'); if (!grid) return;
    grid.innerHTML = '';

    GALLERY_ITEMS.forEach(item => {
      const card = document.createElement(item.unlocked ? 'button' : 'div');
      if (item.unlocked) card.type = 'button';
      card.className = `gallery-card ${item.unlocked ? 'unlocked' : ''}`;
      const imgSrc = (HERO_CLASSES[item.id] && HERO_CLASSES[item.id].activeSkin === 'alt' && item.altImg) ? item.altImg : item.img;
      const displaySrc = item.unlocked ? imgSrc : 'assets/cover.jpg';
      const imageAlt = item.unlocked ? `${item.name}, ${item.age} ans` : '';
      card.innerHTML = `<img src="${displaySrc}" alt="${imageAlt}" loading="lazy" decoding="async"><div class="gallery-lock-overlay"><div style="font-size: 2rem;">🔒</div><div style="font-weight:700;">${item.name}</div><div style="font-size:0.75rem;">Déblocage : ${item.unlockReq}</div></div><div class="gallery-title-tag">${item.name} · ${item.age} ans</div>`;
      card.setAttribute('aria-label', item.unlocked ? `Ouvrir l’archive adulte de ${item.name}, ${item.age} ans` : `${item.name}, archive verrouillée. ${item.unlockReq}`);
      if (!item.unlocked) {
        card.setAttribute('role', 'img');
      }
      if (item.unlocked) { card.addEventListener('click', () => this.openCgStoryViewer(item)); }
      grid.appendChild(card);
    });
  }

  configureCgSequenceNavigation(item) {
    const navigation = document.getElementById('cg-sequence-nav');
    const previousButton = document.getElementById('btn-cg-sequence-prev');
    const nextButton = document.getElementById('btn-cg-sequence-next');
    const status = document.getElementById('cg-sequence-status');
    if (!navigation || !previousButton || !nextButton || !status) return;

    const currentScene = item?.adultSceneId
      ? (ADULT_SCENES?.bonusScenes || []).find(scene => scene.id === item.adultSceneId)
      : null;
    const sequence = currentScene?.sequenceId
      ? (ADULT_SCENES?.bonusScenes || [])
        .filter(scene => (
          scene.sequenceId === currentScene.sequenceId
          && this.isAdultBonusSceneUnlocked(scene)
        ))
        .sort((left, right) => left.sequenceIndex - right.sequenceIndex)
      : [];

    if (!currentScene || sequence.length < 2) {
      navigation.hidden = true;
      previousButton.onclick = null;
      nextButton.onclick = null;
      previousButton.setAttribute('aria-label', 'Aucune CG précédente');
      nextButton.setAttribute('aria-label', 'Aucune CG suivante');
      status.textContent = '';
      return;
    }

    const currentIndex = sequence.findIndex(scene => scene.id === currentScene.id);
    navigation.hidden = false;
    status.textContent = `CG ${currentIndex + 1} sur ${sequence.length} · ${currentScene.sequenceStageLabel}`;
    previousButton.disabled = currentIndex <= 0;
    nextButton.disabled = currentIndex < 0 || currentIndex >= sequence.length - 1;
    previousButton.setAttribute(
      'aria-label',
      currentIndex > 0
        ? `Afficher la CG ${currentIndex} sur ${sequence.length} · ${sequence[currentIndex - 1].sequenceStageLabel}`
        : 'Aucune CG précédente'
    );
    nextButton.setAttribute(
      'aria-label',
      currentIndex >= 0 && currentIndex < sequence.length - 1
        ? `Afficher la CG ${currentIndex + 2} sur ${sequence.length} · ${sequence[currentIndex + 1].sequenceStageLabel}`
        : 'Aucune CG suivante'
    );
    previousButton.onclick = currentIndex > 0
      ? () => this.openAdultSceneViewer(sequence[currentIndex - 1])
      : null;
    nextButton.onclick = currentIndex >= 0 && currentIndex < sequence.length - 1
      ? () => this.openAdultSceneViewer(sequence[currentIndex + 1])
      : null;
  }

  openCgStoryViewer(item) {
    const modal = document.getElementById('cg-viewer-modal'); if (!modal) return;

    const imgSrc = (HERO_CLASSES[item.id] && HERO_CLASSES[item.id].activeSkin === 'alt' && item.altImg) ? item.altImg : item.img;
    document.getElementById('cg-viewer-img').src = imgSrc;
    document.getElementById('cg-viewer-img').alt = item.alt
      || `Archive illustrée de ${item.name}, adulte de ${item.ageLabel || `${item.age} ans`}`;
    document.getElementById('cg-story-title-txt').textContent = item.name;
    document.getElementById('cg-story-sub-txt').textContent = item.subtitle;
    document.getElementById('cg-story-quote-txt').textContent = item.quote || '';
    document.getElementById('cg-story-desc-txt').textContent = item.story || '';

    const statsGrid = document.getElementById('cg-stats-grid-container');
    if (statsGrid) {
      statsGrid.innerHTML = '';
      if (item.stats) {
        Object.entries(item.stats).forEach(([k, v]) => {
          const div = document.createElement('div');
          div.className = 'cg-stat-item';
          div.innerHTML = `${k}: <strong>${v}</strong>`;
          statsGrid.appendChild(div);
        });
      }
    }
    this.configureCgSequenceNavigation(item);
    this.openModal(modal);
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.pendingCinematics = [];
    this.activeCinematic = null;
    this.closeAllGameplayModals();
    this.bestScore = Math.max(this.bestScore, this.score);
    this.bestWave = Math.max(this.bestWave, this.wave);
    this.clearRunCheckpoint();
    document.getElementById('go-wave-txt').textContent = this.wave;
    document.getElementById('go-kills-txt').textContent = this.mutantsKilled;
    document.getElementById('go-coins-txt').textContent = this.coins;
    document.getElementById('go-score-txt').textContent = this.score;
    document.getElementById('go-time-txt').textContent = this.formatRunTime();
    document.getElementById('go-meta-txt').textContent = `${this.runMetaCoinsEarned} ◆`;
    document.getElementById('go-record-txt').textContent = `Records · score ${this.bestScore} · vague ${this.bestWave}`;
    this.applyGameOverTease();
    this.recordRunHistory({ victory: false });
    this.saveProgress();
    this.openModal('game-over-modal');
    this.announce(`La Citadelle est tombée à la vague ${this.wave}. Score ${this.score}.`);
  }

  // --- Rendering Canvas Engine --- //

  isSpriteReady(image) {
    return Boolean(image && image.complete && (image.naturalWidth || image.width));
  }

  drawAtlasFrame(image, spriteData, frame, x, y, size, options = {}) {
    if (!this.isSpriteReady(image)) return false;
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const frameWidth = sourceWidth / SPRITE_ATLAS_COLUMNS;
    const frameHeight = sourceHeight / SPRITE_ATLAS_ROWS;
    const requestedRow = Number.isFinite(options.row) ? options.row : (spriteData.row || 0);
    const row = Math.max(0, Math.min(SPRITE_ATLAS_ROWS - 1, requestedRow));
    const column = Math.max(0, Math.min(SPRITE_ATLAS_COLUMNS - 1, frame || 0));

    this.ctx.save();
    this.ctx.translate(x, y);
    if (Number.isFinite(options.rotation)) this.ctx.rotate(options.rotation);
    if (options.flipX) this.ctx.scale(-1, 1);
    if (Number.isFinite(options.alpha)) this.ctx.globalAlpha = options.alpha;
    if (options.shadowColor) {
      this.ctx.shadowColor = options.shadowColor;
      this.ctx.shadowBlur = options.shadowBlur || 0;
    }
    this.ctx.drawImage(
      image,
      column * frameWidth,
      row * frameHeight,
      frameWidth,
      frameHeight,
      -size / 2,
      -size / 2,
      size,
      size
    );
    this.ctx.restore();
    return true;
  }

  getTowerAnimationFrame(tower, spriteData) {
    if (tower.animationTimer > 0) {
      const progress = 1 - (tower.animationTimer / 0.34);
      if (progress < 0.28) return 1;
      if (progress < 0.68) return 2;
      return 3;
    }
    if (spriteData.ambient) {
      return Math.floor((this.animationClock * 3) + (tower.animationPhase || 0)) % SPRITE_ATLAS_COLUMNS;
    }
    return 0;
  }

  getEnemyAnimationFrame(enemy, spriteData) {
    if (spriteData.layout === 'state_rows') {
      return Math.floor(
        (this.animationClock * (spriteData.fps || 6)) + (enemy.animationPhase || 0)
      ) % SPRITE_ATLAS_COLUMNS;
    }
    if (enemy.hitAnimationTimer > 0) return 3;
    if (enemy.attackAnimationTimer > 0) return 2;
    return Math.floor((this.animationClock * (spriteData.fps || 6)) + (enemy.animationPhase || 0)) % 2;
  }

  getHeroAnimationFrame() {
    if (this.heroAnimationState === 'ability') return 3;
    if (this.heroAnimationState === 'attack') return 2;
    // A brief command pose keeps an otherwise idle defender alive on screen.
    return Math.floor(this.animationClock * 1.4) % 7 === 6 ? 1 : 0;
  }

  drawInfernalFloor(w, h, x = 0, y = 0) {
    this.ctx.fillStyle = '#070b14';
    this.ctx.fillRect(x, y, w, h);
    if (!this.isSpriteReady(this.floorImage)) return;

    if (!this.floorPattern && typeof this.ctx.createPattern === 'function') {
      this.floorPattern = this.ctx.createPattern(this.floorImage, 'repeat');
    }
    this.ctx.save();
    this.ctx.globalAlpha = 0.9;
    if (this.floorPattern) {
      this.ctx.fillStyle = this.floorPattern;
      this.ctx.fillRect(x, y, w, h);
    } else {
      this.ctx.drawImage(this.floorImage, x, y, w, h);
    }
    this.ctx.restore();

    // Maintain contrast for bullets, hazard telegraphs and small enemies.
    this.ctx.fillStyle = 'rgba(3, 7, 16, 0.38)';
    this.ctx.fillRect(x, y, w, h);
  }

  drawBattlefieldFloor(w, h, view) {
    if (!view) {
      this.drawInfernalFloor(w, h);
      return;
    }
    const viewWidth = view.right - view.left;
    const viewHeight = view.bottom - view.top;
    this.ctx.fillStyle = '#030710';
    this.ctx.fillRect(view.left, view.top, viewWidth, viewHeight);

    const bounds = this.worldLayout?.approachBounds;
    const approachLeft = Number.isFinite(bounds?.minX) ? bounds.minX : -BATTLEFIELD_APPROACH_MARGIN;
    const approachTop = Number.isFinite(bounds?.minY) ? bounds.minY : -BATTLEFIELD_APPROACH_MARGIN;
    const approachRight = Number.isFinite(bounds?.maxX) ? bounds.maxX : w + BATTLEFIELD_APPROACH_MARGIN;
    const approachBottom = Number.isFinite(bounds?.maxY) ? bounds.maxY : h + BATTLEFIELD_APPROACH_MARGIN;
    const approachWidth = approachRight - approachLeft;
    const approachHeight = approachBottom - approachTop;

    if (this.isSpriteReady(this.approachTerrainImage)) {
      // Anchor the OpenAI-authored tactical plate to logical world bounds.
      // Its four roads therefore stay aligned on every device and resize.
      this.ctx.drawImage(
        this.approachTerrainImage,
        0,
        0,
        this.approachTerrainImage.naturalWidth || this.approachTerrainImage.width,
        this.approachTerrainImage.naturalHeight || this.approachTerrainImage.height,
        approachLeft,
        approachTop,
        approachWidth,
        approachHeight
      );
      this.ctx.fillStyle = 'rgba(1, 4, 12, 0.34)';
      this.ctx.fillRect(approachLeft, approachTop, approachWidth, approachHeight);
    } else if (this.isSpriteReady(this.coastlineImage)) {
      const sourceWidth = this.coastlineImage.naturalWidth || this.coastlineImage.width;
      const sourceHeight = this.coastlineImage.naturalHeight || this.coastlineImage.height;
      const coverScale = Math.max(viewWidth / sourceWidth, viewHeight / sourceHeight);
      const cropWidth = viewWidth / coverScale;
      const cropHeight = viewHeight / coverScale;
      const sourceX = (sourceWidth - cropWidth) / 2;
      const sourceY = (sourceHeight - cropHeight) / 2;
      this.ctx.drawImage(
        this.coastlineImage,
        sourceX,
        sourceY,
        cropWidth,
        cropHeight,
        view.left,
        view.top,
        viewWidth,
        viewHeight
      );
      this.ctx.fillStyle = 'rgba(1, 4, 12, 0.44)';
      this.ctx.fillRect(view.left, view.top, viewWidth, viewHeight);
    }

    // Keep the authored layout visible inside the build rectangle. The former
    // opaque tile pass hid the Western Wall city and the asymmetric roads.
    // A restrained blend still differentiates the playable area without
    // replacing the generated tactical plate.
    if (this.isSpriteReady(this.approachTerrainImage)) {
      if (!this.floorPattern && this.isSpriteReady(this.floorImage) && typeof this.ctx.createPattern === 'function') {
        this.floorPattern = this.ctx.createPattern(this.floorImage, 'repeat');
      }
      this.ctx.save();
      this.ctx.globalAlpha = 0.16;
      if (this.floorPattern) {
        this.ctx.fillStyle = this.floorPattern;
        this.ctx.fillRect(0, 0, w, h);
      }
      this.ctx.fillStyle = '#020711';
      this.ctx.globalAlpha = 0.2;
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.restore();
    } else {
      this.drawInfernalFloor(w, h);
    }
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.42)';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 12;
    this.ctx.strokeRect(0, 0, w, h);
    this.ctx.restore();
  }

  drawSpawnGates(w, h) {
    if (!this.isSpriteReady(this.spawnGateAtlasImage)) return;
    const warningRouteIndex = this.waveActive && this.enemiesSpawnedThisWave < this.waveSpawnTarget
      ? (this.waveSpawnQueue[0]?.routeIndex ?? this.nextSpawnGateIndex)
      : -1;
    const rotations = {
      north: 0,
      east: Math.PI / 2,
      south: Math.PI,
      west: -Math.PI / 2
    };
    const gateSize = this.getReadableWorldSize(SPAWN_GATE_WORLD_SIZE, 38);

    this.spawnRoutes.forEach((route, routeIndex) => {
      const side = route.side;
      const row = Math.max(0, SPAWN_GATE_SECTORS.indexOf(side));
      const pulse = this.spawnGatePulses[side] || 0;
      const frame = pulse > 0.5 ? 2 : (pulse > 0 ? 3 : (routeIndex === warningRouteIndex ? 1 : 0));
      const position = route.polyline[0] || route.spawn || this.getSpawnGatePosition(side, w, h);
      this.drawAtlasFrame(
        this.spawnGateAtlasImage,
        { row },
        frame,
        position.x,
        position.y,
        gateSize,
        {
          rotation: rotations[side],
          shadowColor: frame === 2 ? '#ff2aaf' : '#00f0ff',
          shadowBlur: frame === 2 ? 22 : 8
        }
      );
    });
  }

  drawTower(tower, options = {}) {
    const spriteData = TOWER_SPRITE_DATA[tower.id];
    const sprite = this.towerSpriteImages[tower.id];
    const frame = spriteData ? this.getTowerAnimationFrame(tower, spriteData) : 0;
    const rotation = spriteData?.rotate ? (tower.facingAngle || 0) : undefined;
    const visualSize = this.getReadableWorldSize(spriteData?.size || tower.radius * 2, MIN_TOWER_SCREEN_SIZE);
    const drawn = spriteData && this.drawAtlasFrame(
      sprite,
      spriteData,
      frame,
      tower.x,
      tower.y,
      visualSize,
      { rotation, shadowColor: '#00f0ff', shadowBlur: 8 }
    );

    if (!drawn) {
      this.ctx.beginPath();
      this.ctx.arc(tower.x, tower.y, Math.max(tower.radius, visualSize * 0.32), 0, Math.PI * 2);
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fill();
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.font = `${this.getReadableWorldSize(16, 14)}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(tower.icon, tower.x, tower.y);
    }

    if (!options.suppressLevel) {
      this.ctx.font = `bold ${this.getReadableWorldSize(9, 9)}px Rajdhani`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = '#67e8f9';
      this.ctx.fillText(`L${tower.level}`, tower.x + (visualSize * 0.3), tower.y + (visualSize * 0.3));
    }
  }

  drawHero(x, y, options = {}) {
    const heroId = options.heroId || this.selectedHero.id;
    const spriteData = HERO_SPRITE_DATA[heroId];
    const sprite = this.heroSpriteImages[heroId];
    if (!spriteData) return false;
    const usesStateRows = spriteData.layout === 'state_rows';
    const stateRow = ['ability', 'ultimate'].includes(this.heroAnimationState)
      ? 3
      : (this.heroAnimationState === 'attack' ? 2 : 0);
    const frame = Number.isFinite(options.frame)
      ? options.frame
      : (usesStateRows
        ? Math.floor(this.animationClock * (spriteData.fps || 7)) % SPRITE_ATLAS_COLUMNS
        : this.getHeroAnimationFrame());
    const facingAngle = Number.isFinite(options.facingAngle) ? options.facingAngle : this.heroFacingAngle;
    return this.drawAtlasFrame(
      sprite,
      spriteData,
      frame,
      x,
      y,
      this.getReadableWorldSize(options.size || spriteData.size, MIN_HERO_SCREEN_SIZE),
      {
        row: usesStateRows ? stateRow : undefined,
        flipX: Math.cos(facingAngle || 0) < 0,
        alpha: options.alpha,
        shadowColor: options.shadowColor || '#00f0ff',
        shadowBlur: options.shadowBlur || 12
      }
    );
  }

  drawEnemy(enemy) {
    const spriteData = ENEMY_SPRITE_DATA[enemy.type];
    const sprite = this.enemySpriteImages[enemy.type];
    const spriteReady = this.isSpriteReady(sprite);
    const visualSize = this.getReadableWorldSize(
      spriteData?.size || enemy.radius * 2,
      enemy.isBoss ? MIN_BOSS_SCREEN_SIZE : MIN_ENEMY_SCREEN_SIZE
    );
    const visualRadius = spriteReady ? visualSize / 2 : enemy.radius;

    if (spriteReady) {
      // Low-profile creatures follow their target; upright bosses stay billboarded
      // so their readable combat pose never appears to tumble around the canvas.
      const facingAngle = Number.isFinite(enemy.facingAngle) ? enemy.facingAngle : 0;
      const usesStateRows = spriteData.layout === 'state_rows';
      const stateRow = enemy.attackAnimationTimer > 0
        ? (enemy.isBoss && enemy.bossPhase >= 3 ? 3 : 2)
        : 1;
      this.drawAtlasFrame(
        sprite,
        spriteData,
        this.getEnemyAnimationFrame(enemy, spriteData),
        enemy.x,
        enemy.y,
        visualSize,
        {
          row: usesStateRows ? stateRow : undefined,
          rotation: spriteData.rotate ? facingAngle + (spriteData.rotationOffset || 0) : undefined,
          flipX: !spriteData.rotate && Math.cos(facingAngle) < 0,
          alpha: enemy.stealthTimer > 0 ? 0.2 : 1,
          shadowColor: enemy.color,
          shadowBlur: enemy.isBoss ? 30 : 8
        }
      );
    } else {
      // Safe visual fallback while assets load or if an individual file fails.
      this.ctx.save();
      this.ctx.globalAlpha = enemy.stealthTimer > 0 ? 0.2 : 1;
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = enemy.color;
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.save();
    if (enemy.stunTimer > 0 || enemy.slowTimer > 0) {
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, Math.max(enemy.radius + 3, visualSize * 0.4), 0, Math.PI * 2);
      this.ctx.strokeStyle = enemy.stunTimer > 0 ? '#fef08a' : '#67e8f9';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    if (enemy.hp < enemy.maxHp) {
      const healthWidth = this.getReadableWorldSize(
        enemy.isBoss ? Math.min(96, visualSize * 0.68) : 40,
        enemy.isBoss ? 72 : 34
      );
      const healthHeight = this.getReadableWorldSize(5, 4);
      const healthY = enemy.y - visualRadius - this.getReadableWorldSize(12, 8);
      this.ctx.fillStyle = 'rgba(0,0,0,0.72)';
      this.ctx.fillRect(enemy.x - healthWidth / 2, healthY, healthWidth, healthHeight);
      this.ctx.fillStyle = enemy.color;
      this.ctx.fillRect(enemy.x - healthWidth / 2, healthY, healthWidth * Math.max(0, enemy.hp / enemy.maxHp), healthHeight);
    }

    if (enemy.isBoss) {
      this.ctx.font = `bold ${this.getReadableWorldSize(11, 11)}px Rajdhani, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(enemy.name, enemy.x, enemy.y - visualRadius - this.getReadableWorldSize(18, 15));
    }
    this.ctx.restore();
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    const viewportWidth = this.canvas.width || window.innerWidth || 1200;
    const viewportHeight = this.canvas.height || window.innerHeight || 800;
    const w = this.worldWidth || BATTLEFIELD_WORLD_WIDTH;
    const h = this.worldHeight || BATTLEFIELD_WORLD_HEIGHT;
    const view = this.getBattlefieldView(viewportWidth, viewportHeight);
    this.battlefieldViewScale = view.scale;
    const viewWidth = view.right - view.left;
    const viewHeight = view.bottom - view.top;

    this.ctx.save();
    this.applyBattlefieldView(view);

    // OpenAI-authored tileable street floor, with a dark fallback while loading.
    this.drawBattlefieldFloor(w, h, view);

    // Retain a restrained tactical grid above the authored floor.
    this.gridOffset = (this.gridOffset + 0.4) % 40;
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.055)';
    this.ctx.lineWidth = 1;

    for (let x = this.gridOffset; x < w; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = this.gridOffset; y < h; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // Four OpenAI-authored gates expose the next sector and pulse as each
    // round-robin horde enters the five-times-deeper causeways.
    this.drawSpawnGates(w, h);

    if (this.isOverdriveActive) {
      this.ctx.fillStyle = `rgba(245, 158, 11, ${0.08 + Math.sin(Date.now() * 0.01) * 0.04})`;
      this.ctx.fillRect(view.left, view.top, viewWidth, viewHeight);
    }

    // Render Mercenaries
    this.mercenaries.forEach(m => {
      const mercRadius = this.getReadableWorldSize(14, 9);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(m.x, m.y, mercRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.shadowColor = '#f59e0b';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.restore();
    });

    // Render Pet Drones
    this.petDrones.forEach(d => {
      const droneRadius = this.getReadableWorldSize(10, 8);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, droneRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ec4899';
      this.ctx.shadowColor = '#ec4899';
      this.ctx.shadowBlur = 12;
      this.ctx.fill();
      this.ctx.restore();
    });

    // Render Placed Towers
    this.placedTowers.forEach(t => {
      this.ctx.save();
      if (['gravity', 'magnet', 'shrine', 'barrier'].includes(t.type)) {
        this.ctx.beginPath();
        this.ctx.arc(t.x, t.y, Math.min(t.range, 85), 0, Math.PI * 2);
        this.ctx.fillStyle = t.type === 'shrine' ? 'rgba(236,72,153,0.07)' : 'rgba(0,240,255,0.05)';
        this.ctx.fill();
        this.ctx.strokeStyle = t.type === 'shrine' ? 'rgba(236,72,153,0.28)' : 'rgba(0,240,255,0.2)';
        this.ctx.setLineDash([4, 6]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
      this.drawTower(t);
      if (t.type === 'barrier') {
        const hpRatio = Math.max(0, t.hp / t.maxHp);
        const hpWidth = this.getReadableWorldSize(40, 32);
        const hpHeight = this.getReadableWorldSize(4, 3);
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(t.x - hpWidth / 2, t.y + 24, hpWidth, hpHeight);
        this.ctx.fillStyle = '#67e8f9';
        this.ctx.fillRect(t.x - hpWidth / 2, t.y + 24, hpWidth * hpRatio, hpHeight);
      }
      this.ctx.restore();
    });
    this.bossHazards.forEach(hazard => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${hazard.color}30`;
      this.ctx.fill();
      this.ctx.setLineDash([12, 8]);
      this.ctx.strokeStyle = `${hazard.color}dd`;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.restore();
    });

    // Contact traps keep their authored detonation frames briefly after their
    // gameplay entity has been consumed.
    this.towerAnimationGhosts.forEach(ghost => {
      this.ctx.save();
      this.drawTower(ghost, { suppressLevel: true });
      this.ctx.restore();
    });

    // Render Decoys
    this.decoys.forEach(d => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.radius + Math.sin(Date.now() * 0.01) * 4, 0, Math.PI * 2);
      this.ctx.fillStyle = `${d.color || '#00f0ff'}33`;
      this.ctx.fill();
      this.ctx.strokeStyle = d.color || '#00f0ff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();
      this.drawHero(d.x, d.y - 3, {
        heroId: d.heroId,
        frame: 3,
        size: d.radius * 3.1,
        alpha: 0.74,
        shadowColor: d.color || '#00f0ff',
        shadowBlur: 16
      });
    });

    // Render Citadel
    const citX = this.citadel.x || (w / 2);
    const citY = this.citadel.y || (h / 2);
    const citadelVisualRadius = this.getReadableWorldSize(this.citadel.radius, 24);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(citX, citY, citadelVisualRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#121829';
    this.ctx.fill();
    this.ctx.strokeStyle = this.isOverdriveActive ? '#f59e0b' : '#ff2a5f';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = this.isOverdriveActive ? '#f59e0b' : '#ff2a5f';
    this.ctx.shadowBlur = 20;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(citX, citY, this.getReadableWorldSize(18, 9), 0, Math.PI * 2);
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 15;
    this.ctx.fill();
    this.ctx.restore();
    this.drawHero(citX, citY - 7);

    // Render Crates
    this.crates.forEach(c => {
      const crateRadius = this.getReadableWorldSize(c.radius, 7);
      this.ctx.save();
      this.ctx.fillStyle = c.type === 'red' ? '#ff2a5f' : '#00f0ff';
      this.ctx.shadowColor = c.type === 'red' ? '#ff2a5f' : '#00f0ff';
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(c.x - crateRadius, c.y - crateRadius, crateRadius * 2, crateRadius * 2);
      this.ctx.restore();
    });

    // Render Powerups
    this.powerups.forEach(p => {
      const powerupRadius = this.getReadableWorldSize(p.radius, 9);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, powerupRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.type.color;
      this.ctx.shadowColor = p.type.color;
      this.ctx.shadowBlur = 15;
      this.ctx.fill();

      this.ctx.font = `${this.getReadableWorldSize(14, 12)}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(p.type.icon, p.x, p.y);
      this.ctx.restore();
    });

    // Render persistent acid and napalm zones.
    this.hazards.forEach(hazard => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${hazard.color}22`;
      this.ctx.fill();
      this.ctx.strokeStyle = `${hazard.color}99`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();
    });

    // Render Enemies
    this.enemies.forEach(enemy => this.drawEnemy(enemy));

    // Render Boss Bullets
    this.enemyBullets.forEach(b => {
      const bulletRadius = this.getReadableWorldSize(b.radius, 4);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, bulletRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.restore();
    });

    // Render Projectiles
    this.projectiles.forEach(p => {
      const projectileRadius = this.getReadableWorldSize(p.radius, 2.5);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, projectileRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 12;
      this.ctx.fill();
      this.ctx.restore();
    });

    // Render Particles
    this.particles.forEach(p => {
      if (p.type === 'rail_beam') {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(p.x1, p.y1);
        this.ctx.lineTo(p.x2, p.y2);
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = p.life * 20;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 20;
        this.ctx.stroke();
        this.ctx.restore();
      } else if (p.type === 'gravity_ring') {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, Math.max(8, p.radius * (1 - Math.min(0.9, p.life))), 0, Math.PI * 2);
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = Math.min(1, p.life * 4);
        this.ctx.stroke();
        this.ctx.restore();
      } else {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        this.ctx.restore();
      }
    });

    // Render Floating Text
    this.floatingTexts.forEach(t => {
      this.ctx.save();
      this.ctx.font = `bold ${this.getReadableWorldSize(15, 12)}px Rajdhani`;
      this.ctx.fillStyle = t.color;
      this.ctx.fillText(t.text, t.x, t.y);
      this.ctx.restore();
    });

    if (this.buildCursor.visible && !this.isPaused) {
      this.ctx.save();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(this.buildCursor.x, this.buildCursor.y, 16, 0, Math.PI * 2);
      this.ctx.moveTo(this.buildCursor.x - 24, this.buildCursor.y);
      this.ctx.lineTo(this.buildCursor.x + 24, this.buildCursor.y);
      this.ctx.moveTo(this.buildCursor.x, this.buildCursor.y - 24);
      this.ctx.lineTo(this.buildCursor.x, this.buildCursor.y + 24);
      this.ctx.stroke();
      this.ctx.restore();
    }
    this.ctx.restore();
  }

  createExplosion(x, y, radius, damage, options = {}) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      this.particles.push({ x, y, vx: Math.cos(angle) * radius * 3, vy: Math.sin(angle) * radius * 3, radius: 4, color: '#a855f7', life: 0.3 });
    }
    if (damage > 0) {
      [...this.enemies].forEach(e => {
        if (options.groundOnly && this.isEnemyFlying(e)) return;
        if (Math.hypot(e.x - x, e.y - y) <= radius + e.radius) {
          this.damageEnemyFromDefense(options.sourceDefense, e, damage);
        }
      });
    }
  }

  addFloatingText(text, x, y, color) { this.floatingTexts.push({ text, x, y, color, life: 0.8 }); }

  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  updateHUD() {
    const wave = document.getElementById('hud-wave-txt'); if (wave) wave.textContent = this.wave;
    const coins = document.getElementById('hud-coins-txt'); if (coins) coins.textContent = `${this.coins} 🪙`;
    const metaCoins = document.getElementById('hud-meta-coins-txt'); if (metaCoins) metaCoins.textContent = `${this.metaCoins} ◆`;
    const score = document.getElementById('hud-score-txt'); if (score) score.textContent = this.score;
    const waveProgress = document.getElementById('hud-wave-progress-txt');
    if (waveProgress) {
      waveProgress.textContent = this.waveActive
        ? `${Math.min(this.enemiesSpawnedThisWave, this.waveSpawnTarget)} / ${this.waveSpawnTarget}`
        : `sécurisée · ${Math.max(0, Math.ceil(this.waveIntermissionTimer))} s`;
    }
    const missionObjective = document.getElementById('mission-objective-txt');
    if (missionObjective) {
      missionObjective.textContent = this.endlessMode
        ? `Mode infini · survivre à la vague ${this.wave}`
        : `Objectif · atteindre la vague ${this.getCampaignFinalWave()}`;
    }
    const missionLevel = document.getElementById('mission-level-txt');
    if (missionLevel) missionLevel.textContent = `Niveau ${this.level} · XP ${this.xp} / ${this.nextLevelXp}`;
    const missionDifficulty = document.getElementById('mission-difficulty-txt');
    if (missionDifficulty) missionDifficulty.textContent = DIFFICULTY_DATA[this.difficulty]?.name || DIFFICULTY_DATA.standard.name;

    const hpPct = Math.max(0, (this.citadel.hp / this.citadel.maxHp) * 100);
    const hpFill = document.getElementById('citadel-hp-fill');
    if (hpFill) {
      hpFill.style.width = `${hpPct}%`;
      hpFill.setAttribute('role', 'progressbar');
      hpFill.setAttribute('aria-label', 'Santé de la Citadelle');
      hpFill.setAttribute('aria-valuemin', '0');
      hpFill.setAttribute('aria-valuemax', String(this.citadel.maxHp));
      hpFill.setAttribute('aria-valuenow', String(Math.max(0, Math.round(this.citadel.hp))));
    }
    const hpTxt = document.getElementById('citadel-hp-txt'); if (hpTxt) hpTxt.textContent = `${Math.round(this.citadel.hp)} / ${this.citadel.maxHp}`;

    const affinityPct = this.selectedHero.affinityLvl >= 5 ? 100 : Math.min(100, (this.affinityXp / Math.max(1, this.nextAffinityXp)) * 100);
    const affFill = document.getElementById('affinity-meter-fill');
    if (affFill) {
      affFill.style.width = `${affinityPct}%`;
      affFill.setAttribute('role', 'progressbar');
      affFill.setAttribute('aria-label', `Confiance avec ${this.selectedHero.name}`);
      affFill.setAttribute('aria-valuemin', '0');
      affFill.setAttribute('aria-valuemax', String(Math.max(1, this.nextAffinityXp)));
      affFill.setAttribute('aria-valuenow', String(Math.max(0, Math.round(this.affinityXp))));
    }
    const affLvl = document.getElementById('affinity-lvl-txt'); if (affLvl) affLvl.textContent = `Rang ${this.selectedHero.affinityLvl || 1}`;
    const heroSkillButton = document.getElementById('btn-hero-skill');
    if (heroSkillButton) {
      const reserve = this.selectedHero.id === 'carmilla'
        ? Math.round(Number(this.carmillaStoredCharge) || 0)
        : 0;
      heroSkillButton.textContent = `⚡ ${this.selectedHero.abilityName}${reserve > 0 ? ` · RÉSERVE ${reserve}` : ''}`;
      heroSkillButton.dataset.storedCharge = String(reserve);
      if (reserve > 0 && this.abilityCooldownTimer <= 0) {
        heroSkillButton.setAttribute(
          'aria-label',
          `${this.selectedHero.abilityName}, réserve écarlate ${reserve}, prêt`
        );
      }
    }
    const frenzyFill = document.getElementById('frenzy-meter-fill');
    if (frenzyFill) {
      frenzyFill.style.width = `${Math.min(100, (this.frenzyMeter / this.maxFrenzyMeter) * 100)}%`;
      frenzyFill.setAttribute('role', 'progressbar');
      frenzyFill.setAttribute('aria-label', 'Charge Overdrive');
      frenzyFill.setAttribute('aria-valuemin', '0');
      frenzyFill.setAttribute('aria-valuemax', String(this.maxFrenzyMeter));
      frenzyFill.setAttribute('aria-valuenow', String(Math.round(this.frenzyMeter)));
    }
    const overdriveButton = document.getElementById('btn-overdrive');
    if (overdriveButton) {
      const ready = this.frenzyMeter >= this.maxFrenzyMeter && !this.isOverdriveActive;
      overdriveButton.disabled = !ready;
      overdriveButton.setAttribute('aria-label', this.isOverdriveActive ? 'Overdrive actif' : ready ? 'Overdrive prêt, raccourci F' : `Overdrive chargé à ${Math.round(this.frenzyMeter)} pour cent`);
    }
    this.updateThreatReadout();
    this.updateBuildBarAffordability();
  }

  updateWeaponsHUD() {
    const container = document.getElementById('hud-weapons-container'); if (!container) return;
    container.innerHTML = '';
    container.setAttribute('role', 'list');
    container.setAttribute('aria-label', 'Arsenal actif');
    Object.values(this.weapons).forEach(wp => {
      if (wp.level > 0) {
        const card = document.createElement('div');
        card.className = `weapon-card active ${wp.isEvolved ? 'evolved' : ''}`;
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `${wp.name}, ${wp.isEvolved ? 'évolution maximale' : `niveau ${wp.level}`}`);
        card.innerHTML = `<div class="icon">${wp.icon}</div><div class="lvl">${wp.isEvolved ? 'MAX' : `L${wp.level}`}</div>`;
        container.appendChild(card);
      }
    });
  }
}

let game;

function activateBootErrorModal(errorModal) {
  if (!errorModal) return;
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
    modal.inert = true;
    modal.setAttribute('aria-hidden', 'true');
  });
  errorModal.classList.add('active');
  errorModal.inert = false;
  errorModal.setAttribute('aria-hidden', 'false');

  const app = document.getElementById('app-container');
  if (app) {
    [...app.children].forEach(child => {
      if (child === errorModal || child.id === 'game-announcer') return;
      child.inert = true;
    });
  }

  const focusable = () => [...errorModal.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
  const trapFocus = event => {
    if (!errorModal.classList.contains('active') || event.key !== 'Tab') return;
    const controls = focusable();
    if (!controls.length) {
      errorModal.tabIndex = -1;
      errorModal.focus();
      event.preventDefault();
      return;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !errorModal.contains(document.activeElement))) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && (document.activeElement === last || !errorModal.contains(document.activeElement))) {
      first.focus();
      event.preventDefault();
    }
  };
  document.addEventListener('keydown', trapFocus);

  document.getElementById('btn-dismiss-error')?.addEventListener('click', () => {
    document.removeEventListener('keydown', trapFocus);
    if (game && typeof game.returnToMissionBriefing === 'function') {
      game.returnToMissionBriefing();
    } else {
      window.location.reload();
    }
  }, { once: true });

  requestAnimationFrame(() => {
    const firstControl = focusable()[0];
    if (firstControl) firstControl.focus();
    else {
      errorModal.tabIndex = -1;
      errorModal.focus();
    }
  });
}

function bootGame() {
  try {
    if (!game) {
      game = new GameEngine();
      window.game = game;
      game.init();
    }
  } catch (error) {
    console.error('Impossible de démarrer Infernal City.', error);
    window.__infernalBootError = error?.stack || String(error);
    const announcer = document.getElementById('game-announcer');
    if (announcer) announcer.textContent = 'Le moteur du jeu n’a pas pu démarrer. Rechargez la page ou consultez la console.';
    const errorModal = document.getElementById('runtime-error-modal');
    const errorMessage = document.getElementById('runtime-error-message');
    if (errorMessage) errorMessage.textContent = `Le moteur n’a pas pu démarrer : ${error?.message || String(error)}`;
    activateBootErrorModal(errorModal);
    document.getElementById('btn-reload-game')?.addEventListener('click', () => window.location.reload(), { once: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
