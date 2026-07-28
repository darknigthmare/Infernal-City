/* Valkyrie Sweeper: Dark Siege - Comprehensive Game Engine */

const CAMPAIGN_FINAL_WAVE = 15;
const SAVE_VERSION = 4;
const RUN_CHECKPOINT_VERSION = 1;

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
  vespera: { src: 'assets/animations/enemies/enemy-atlas-02.png', row: 0, size: 110, rotate: false, fps: 6 },
  carmilla: { src: 'assets/animations/enemies/enemy-atlas-02.png', row: 1, size: 124, rotate: false, fps: 6 },
  leviathan: { src: 'assets/animations/enemies/enemy-atlas-02.png', row: 2, size: 188, rotate: true, rotationOffset: 0, fps: 4 }
};

// The selected adult hero is now a physical defender at the Citadel rather
// than a HUD portrait only. Columns: idle, command, attack, signature ability.
const HERO_SPRITE_DATA = {
  aria: { src: 'assets/animations/heroes/hero-atlas-01.png', row: 0, size: 94 },
  kira: { src: 'assets/animations/heroes/hero-atlas-01.png', row: 1, size: 92 },
  rin: { src: 'assets/animations/heroes/hero-atlas-01.png', row: 2, size: 94 },
  selene: { src: 'assets/animations/heroes/hero-atlas-01.png', row: 3, size: 96 },
  vespera: { src: 'assets/animations/heroes/hero-atlas-02.png', row: 0, size: 104 },
  carmilla: { src: 'assets/animations/heroes/hero-atlas-02.png', row: 1, size: 98 }
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
  }
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
  { id: 'nova', age: 27, name: 'Nova', subtitle: 'Ingénieure adulte de l’Armurerie', img: 'assets/cg_nova.jpg', unlockReq: 'Récolter 500 Bio-Coins', unlocked: false, quote: '"Systèmes au maximum de puissance !"', story: 'Ingénieure de 27 ans, Nova dirige l’armurerie et garde le plein contrôle de son image dans les archives.', stats: { Âge: '27 ans', Puissance: 'A', Agilité: 'S', Armure: 'A+' } }
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
    this.lastWaveStatusSecond = null;
    this.difficulty = 'standard';
    this.endlessMode = false;
    this.campaignVictory = false;
    this.campaignVictoryClaimed = false;
    this.runtimeError = null;
    this.lastPausedRenderTime = 0;
    this.accessibilityStatusTimer = 0;
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
    this.score = 0;
    this.coins = 400;
    this.metaCoins = 0;
    this.totalCoinsEarned = 0;
    this.decoysDeployedCount = 0;
    this.towersBuiltThisRun = 0;
    this.evolvedWeaponsCount = 0;
    this.mutantsKilled = 0;
    this.overdriveCount = 0;

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
    this.enemyBullets = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.decoys = [];
    this.crates = [];
    this.powerups = [];
    this.hazards = [];

    this.abilityCooldownTimer = 0;
    this.shopUpgrades = { hpBonus: 0, fireRateBonus: 0, magnetRange: 0 };
    this.buildCursor = { x: 720, y: 400, visible: false };

    this.isPaused = false;
    this.isGameOver = false;
    this.lastTime = 0;

    this.gridOffset = 0;
    this.animationClock = 0;
    this.heroAnimationState = 'idle';
    this.heroAnimationTimer = 0;
    this.heroFacingAngle = 0;

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

  resizeCanvas() {
    if (!this.canvas) return;
    const newWidth = window.innerWidth || 1200;
    const newHeight = window.innerHeight || 800;
    const oldWidth = this.worldWidth || newWidth;
    const oldHeight = this.worldHeight || newHeight;
    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;

    if (this.worldWidth && (scaleX !== 1 || scaleY !== 1)) {
      [this.placedTowers, this.towerAnimationGhosts, this.mercenaries, this.petDrones, this.enemies, this.enemyBullets, this.projectiles, this.particles, this.floatingTexts, this.decoys, this.crates, this.powerups, this.hazards]
        .forEach(collection => collection.forEach(entity => {
          if (Number.isFinite(entity.x)) entity.x *= scaleX;
          if (Number.isFinite(entity.y)) entity.y *= scaleY;
          if (Number.isFinite(entity.x1)) entity.x1 *= scaleX;
          if (Number.isFinite(entity.y1)) entity.y1 *= scaleY;
          if (Number.isFinite(entity.x2)) entity.x2 *= scaleX;
          if (Number.isFinite(entity.y2)) entity.y2 *= scaleY;
        }));
    }

    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.worldWidth = newWidth;
    this.worldHeight = newHeight;
    this.citadel.x = this.canvas.width / 2;
    this.citadel.y = this.canvas.height / 2;
    if (!this.buildCursor.visible) {
      this.buildCursor.x = this.citadel.x + 120;
      this.buildCursor.y = this.citadel.y;
    }
    requestAnimationFrame(() => this.syncMissionStatusPosition());
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

  preloadEnemySprites() {
    Object.entries(ENEMY_SPRITE_DATA).forEach(([type, spriteData]) => {
      this.enemySpriteImages[type] = this.preloadSpriteAsset(spriteData.src, 'Planche ennemie');
    });
  }

  preloadBattleSprites() {
    this.preloadEnemySprites();
    Object.entries(TOWER_SPRITE_DATA).forEach(([id, spriteData]) => {
      this.towerSpriteImages[id] = this.preloadSpriteAsset(spriteData.src, 'Planche de défense');
    });
    Object.entries(HERO_SPRITE_DATA).forEach(([id, spriteData]) => {
      this.heroSpriteImages[id] = this.preloadSpriteAsset(spriteData.src, 'Planche de héros');
    });

    this.floorImage = this.preloadSpriteAsset(FLOOR_TEXTURE_SRC, 'Texture de sol');
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
    if (!Number.isFinite(nextWave) || nextWave < 2 || nextWave > CAMPAIGN_FINAL_WAVE) return false;
    if (!Array.isArray(checkpoint.placedTowers) || !checkpoint.weapons || typeof checkpoint.weapons !== 'object') return false;
    return Number.isFinite(checkpoint.citadelHp)
      && Number.isFinite(checkpoint.coins)
      && Number.isFinite(checkpoint.score);
  }

  createRunCheckpoint() {
    if (this.isTowerMode || this.endlessMode || this.campaignVictory || this.wave >= CAMPAIGN_FINAL_WAVE) return null;
    return {
      version: RUN_CHECKPOINT_VERSION,
      nextWave: this.wave + 1,
      difficulty: this.difficulty,
      selectedHeroId: this.selectedHero.id,
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
    this.startNewGame({
      difficulty: checkpoint.difficulty,
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
        this.bestScore = Math.max(0, Math.floor(Number(data.bestScore) || 0));
        this.bestWave = Math.max(0, Math.floor(Number(data.bestWave) || 0));
        this.campaignCompletions = Math.max(0, Math.floor(Number(data.campaignCompletions) || 0));
        this.preferredMusicEnabled = data.musicEnabled === true;
        this.preferredCrtEnabled = data.crtEnabled !== false;
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
        if (data.selectedHeroId && HERO_CLASSES[data.selectedHeroId] && HERO_CLASSES[data.selectedHeroId].unlocked !== false) {
          this.selectedHero = HERO_CLASSES[data.selectedHeroId];
        }
        if (['synthwave', 'gothic', 'industrial', 'chillwave', 'heavy'].includes(data.radioStation)) {
          this.preferredRadioStation = data.radioStation;
        }
        audio.isMuted = data.sfxMuted === true;
      }
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
        bestScore: this.bestScore,
        bestWave: this.bestWave,
        campaignCompletions: this.campaignCompletions,
        activeRun: this.activeRunCheckpoint,
        selectedHeroId: this.selectedHero.id,
        radioStation: audio.currentStation,
        musicEnabled: audio.isPlayingMusic === true,
        sfxMuted: audio.isMuted,
        crtEnabled: !document.querySelector?.('.crt-overlay')?.classList.contains('disabled'),
        unlockedGallery: unlockedIds,
        recruitedBosses,
        achievements,
        characterProgress
      };
      localStorage.setItem('valkyrie_sweeper_save', JSON.stringify(data));
    } catch (e) {
      this.saveLoadError = e;
      console.warn('Failed to save data:', e);
    }
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
      button.setAttribute('aria-label', 'Fermer cette fenêtre');
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
        if (child.classList?.contains('modal-overlay') || child.id === 'game-announcer') return;
        child.inert = Boolean(topModal);
      });
    }
  }

  getFocusableControls(modal) {
    if (!modal) return [];
    return [...modal.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter(element => {
        if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
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
    modal.classList.remove('active');
    this.syncModalAccessibility();
    this.isPaused = Boolean(this.getTopOpenModal());
    const returnTo = focusEntry?.returnTo || this.lastFocusedElement;
    if (restoreFocus && returnTo && typeof returnTo.focus === 'function') {
      requestAnimationFrame(() => returnTo.focus());
    }
  }

  closeAllGameplayModals(excludedIds = []) {
    const excluded = new Set(['adult-gate-modal', ...excludedIds]);
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

  openMissionBriefing() {
    const modal = document.getElementById('mission-briefing-modal');
    if (!modal) return;
    const checkpoint = this.isValidRunCheckpoint(this.savedRunCheckpoint) ? this.savedRunCheckpoint : null;
    const checkpointCard = document.getElementById('checkpoint-card');
    const continueButton = document.getElementById('btn-continue-run');
    const difficultySelect = document.getElementById('difficulty-select');
    const saveWarning = document.getElementById('save-warning');
    const selectedDifficulty = checkpoint?.difficulty || this.difficulty || 'standard';
    if (difficultySelect) difficultySelect.value = selectedDifficulty;
    if (saveWarning) saveWarning.hidden = !this.saveLoadError;
    this.updateDifficultyDescription(selectedDifficulty);

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

  beginNewCampaign() {
    const difficultyId = document.getElementById('difficulty-select')?.value || 'standard';
    this.closeModal('mission-briefing-modal', false);
    this.startNewGame({ difficulty: difficultyId });
    this.focusBattlefield();
    this.announce(`Nouvelle campagne en difficulté ${DIFFICULTY_DATA[this.difficulty].name}. Objectif : tenir quinze vagues.`);
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
    if (!Object.keys(this.spriteAtlasImages).length) this.preloadBattleSprites();
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
      this.canvas.setAttribute('aria-label', 'Champ de bataille. Cliquez ou touchez une défense existante pour la gérer. Au clavier, utilisez les flèches pour déplacer le curseur, puis Entrée pour gérer la défense visée ou construire. Appuyez sur B pour choisir une défense.');
      this.canvas.setAttribute('aria-keyshortcuts', 'B');
      this.canvas.addEventListener('click', (e) => {
        if (this.isPaused || this.isGameOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / Math.max(1, rect.width));
        const y = (e.clientY - rect.top) * (this.canvas.height / Math.max(1, rect.height));
        this.buildCursor.x = x;
        this.buildCursor.y = y;
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

    document.getElementById('btn-enter-adult')?.addEventListener('click', () => this.enterAdultExperience());
    document.getElementById('btn-decline-adult')?.addEventListener('click', () => this.declineAdultExperience());
    document.getElementById('difficulty-select')?.addEventListener('change', event => {
      this.updateDifficultyDescription(event.target.value);
    });
    document.getElementById('btn-start-campaign')?.addEventListener('click', () => this.beginNewCampaign());
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

    const btnOverdrive = document.getElementById('btn-overdrive');
    if (btnOverdrive) btnOverdrive.addEventListener('click', () => this.triggerOverdrive());

    window.addEventListener('keydown', (e) => {
      const activeModal = this.getTopOpenModal();
      if (activeModal && this.trapModalFocus(e, activeModal)) return;
      if (e.key === 'Escape' && activeModal?.id !== 'adult-gate-modal' && activeModal?.querySelector('.btn-close')) {
        e.preventDefault();
        this.closeModal(activeModal);
        return;
      }

      if (document.getElementById('adult-gate-modal')?.classList.contains('active')) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      if (!activeModal && (e.key === 'b' || e.key === 'B')) {
        if (this.focusSelectedBuildCard()) e.preventDefault();
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.triggerOverdrive();
        return;
      }

      if (document.activeElement === this.canvas) {
        const step = e.shiftKey ? 50 : 20;
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
        e.preventDefault();
        this.buildCursor.x = Math.max(25, Math.min(this.canvas.width - 25, this.buildCursor.x));
        this.buildCursor.y = Math.max(80, Math.min(this.canvas.height - 125, this.buildCursor.y));
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
        else if (targetId === 'btn-wardrobe-toggle') this.openWardrobeModal();
        else if (targetId === 'btn-biolab-toggle') this.openBiolabModal();
        else if (targetId === 'btn-mercs-toggle') this.openMercenaryModal();
        else if (targetId === 'btn-tower-toggle') this.openTowerInfinitumModal();
        else if (targetId === 'btn-studio-toggle') this.openPhotoStudioModal();
        else if (targetId === 'btn-slot-toggle') this.openSlotMachineModal();
        else if (targetId === 'btn-shop-toggle') this.openShopModal();
        else if (targetId === 'btn-gallery-toggle') this.openGalleryModal();
        else if (targetId === 'btn-achieve-toggle') this.openAchievementsModal();
      });
    });

    document.getElementById('btn-resume-combat')?.addEventListener('click', () => this.closeModal('hq-menu-modal'));

    document.querySelectorAll('[data-studio-color]').forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        const color = button.dataset.studioColor;
        document.getElementById('studio-preview-img').style.filter = `drop-shadow(0 0 18px ${color})`;
        document.querySelectorAll('[data-studio-color]').forEach(filterButton => filterButton.setAttribute('aria-pressed', String(filterButton === button)));
      });
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
        if (modal) this.closeModal(modal);
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
    const baseHp = towerType.hp || 180;
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

    return {
      level,
      damage: Math.round(baseDamage * levelStats.damage * 100) / 100,
      fireRate: baseFireRate > 0 ? Math.max(70, Math.round(baseFireRate * levelStats.fireRate)) : 0,
      range: Math.round(baseRange * levelStats.range),
      maxHp: Math.round(baseMaxHp * levelStats.hp),
      effectPower: levelStats.effect
    };
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
    defense.level = stats.level;
    defense.damage = stats.damage;
    defense.fireRate = stats.fireRate;
    defense.range = stats.range;
    defense.maxHp = stats.maxHp;
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
    return { ok: true, cost, level: defense.level };
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
    this.placedTowers.forEach(defense => {
      const distance = Math.hypot(defense.x - x, defense.y - y);
      const hitRadius = Math.max(26, Number(defense.radius) + 8);
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
    const headerBottom = document.getElementById('hud-header')?.getBoundingClientRect().bottom || 76;
    const buildBarTop = document.getElementById('hud-build-bar')?.getBoundingClientRect().top || (this.canvas.height - 170);
    if (x < 24 || x > this.canvas.width - 24 || y < headerBottom + 8 || y > buildBarTop - 8) {
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
    if (!options.preserveCheckpoint) this.clearRunCheckpoint();
    this.resizeCanvas();
    this.citadel.maxHp = Math.round((500 + (this.shopUpgrades.hpBonus * 50)) * DIFFICULTY_DATA[this.difficulty].citadelHp);
    this.citadel.hp = this.citadel.maxHp;

    this.endlessMode = false;
    this.campaignVictory = false;
    this.campaignVictoryClaimed = false;
    this.runtimeError = null;
    this.accessibilityStatusTimer = 0;
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
    this.spawnTimer = 0;
    this.weaponTimers = {};
    this.decoysDeployedCount = 0;
    this.towersBuiltThisRun = 0;
    this.evolvedWeaponsCount = 0;
    this.mutantsKilled = 0;
    this.overdriveCount = 0;
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
    this.enemyBullets = [];
    this.projectiles = [];
    this.particles = [];
    this.decoys = [];
    this.crates = [];
    this.powerups = [];
    this.hazards = [];
    this.floatingTexts = [];

    this.configureWave(1);

    // Pre-spawn starter defenses and enemies so the arena immediately communicates
    // the core loop after the adult-content notice is accepted.
    const cx = this.citadel.x || (window.innerWidth / 2);
    const cy = this.citadel.y || (window.innerHeight / 2);

    this.placedTowers.push(this.createPlacedDefense(TOWER_TYPES.vulcan_turret, cx - 90, cy - 90, { starter: true }));
    this.placedTowers.push(this.createPlacedDefense(TOWER_TYPES.flame_trap, cx + 90, cy + 90, { starter: true }));

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

  configureWave(number, options = {}) {
    this.wave = Math.max(1, Math.floor(number));
    this.waveActive = true;
    this.waveIntermissionTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.bossSpawnedThisWave = false;
    this.waveRewardClaimed = false;
    this.spawnTimer = 0;
    this.lastWaveStatusSecond = null;
    this.isTowerMode = options.towerMode === true;
    this.towerMutator = options.mutator || null;
    const baseTarget = 8 + (this.wave * 2);
    this.waveSpawnTarget = Math.min(48, Math.round(baseTarget * (this.towerMutator?.id === 'swarm' ? 1.5 : 1)));
    this.updateHUD();
  }

  completeWave() {
    if (this.waveRewardClaimed || !this.waveActive) return;
    this.waveRewardClaimed = true;
    this.waveActive = false;
    this.waveIntermissionTimer = 3.5;
    const rewardMultiplier = DIFFICULTY_DATA[this.difficulty]?.reward || 1;
    const runReward = Math.round((25 + (this.wave * 5)) * rewardMultiplier);
    const metaReward = Math.round((8 + (this.wave * 2)) * rewardMultiplier);
    this.coins += runReward;
    this.metaCoins += metaReward;
    this.runMetaCoinsEarned += metaReward;
    this.totalCoinsEarned += runReward;
    this.score += this.wave * 100;
    if (!this.isTowerMode) {
      this.bestWave = Math.max(this.bestWave, this.wave);
      this.bestScore = Math.max(this.bestScore, this.score);
    }
    this.showFeedback(`Vague ${this.wave} sécurisée : +${runReward} 🪙 et +${metaReward} ◆`, '#10b981');
    if (!this.isTowerMode && this.wave >= 5) this.unlockAchievement('wave_5');
    if (!this.isTowerMode && this.wave >= 10) this.unlockAchievement('wave_10');
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
    if (!this.isTowerMode && !this.endlessMode && this.wave >= CAMPAIGN_FINAL_WAVE) {
      this.triggerCampaignVictory();
      return;
    }
    if (!this.isTowerMode && !this.endlessMode) this.saveRunCheckpoint();
    this.saveProgress();
    this.updateHUD();
  }

  advanceWave() {
    if (this.isTowerMode) {
      const completedFloor = this.wave;
      const state = this.campaignStateBeforeTower;
      const returnWave = Math.max(1, state?.wave || 1);
      if (state) {
        this.wave = state.wave;
        this.waveActive = state.waveActive;
        this.waveIntermissionTimer = state.waveIntermissionTimer;
        this.enemiesSpawnedThisWave = state.enemiesSpawnedThisWave;
        this.waveSpawnTarget = state.waveSpawnTarget;
        this.bossSpawnedThisWave = state.bossSpawnedThisWave;
        this.waveRewardClaimed = state.waveRewardClaimed;
        this.spawnTimer = state.spawnTimer;
        this.enemies = state.enemies;
        this.enemyBullets = state.enemyBullets;
        this.projectiles = state.projectiles;
        this.particles = state.particles;
        this.floatingTexts = state.floatingTexts;
        this.decoys = state.decoys;
        this.crates = state.crates;
        this.powerups = state.powerups;
        this.hazards = state.hazards;
        this.isTowerMode = false;
        this.towerMutator = null;
        this.lastWaveStatusSecond = null;
        this.updateHUD();
      } else {
        this.configureWave(returnWave);
      }
      this.campaignStateBeforeTower = null;
      this.showFeedback(`Étage ${completedFloor} terminé. Retour à la campagne, vague ${returnWave}.`, '#a855f7');
      if (this.towerCompletionPending) {
        this.towerCompletionPending = false;
        this.triggerTowerCompletion();
      }
      return;
    }
    const nextWave = this.wave + 1;
    this.configureWave(nextWave);
    this.showFeedback(`Vague ${nextWave} engagée`, '#00f0ff');
  }

  triggerCampaignVictory() {
    if (this.campaignVictoryClaimed) return;
    this.campaignVictoryClaimed = true;
    this.campaignVictory = true;
    this.waveIntermissionTimer = 0;
    this.clearRunCheckpoint();
    this.bestScore = Math.max(this.bestScore, this.score);
    this.bestWave = Math.max(this.bestWave, CAMPAIGN_FINAL_WAVE);
    this.campaignCompletions++;
    this.unlockAchievement('campaign_clear');

    const difficulty = DIFFICULTY_DATA[this.difficulty] || DIFFICULTY_DATA.standard;
    const setSummaryText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };
    setSummaryText('victory-wave-txt', `${CAMPAIGN_FINAL_WAVE} / ${CAMPAIGN_FINAL_WAVE}`);
    setSummaryText('victory-kills-txt', this.mutantsKilled);
    setSummaryText('victory-score-txt', this.score);
    setSummaryText('victory-time-txt', this.formatRunTime());
    setSummaryText('victory-meta-txt', `${this.runMetaCoinsEarned} ◆`);
    setSummaryText('victory-difficulty-txt', difficulty.name);
    const ending = document.getElementById('victory-ending-copy');
    if (ending) {
      ending.textContent = this.selectedHero.romanceOptIn && this.selectedHero.privateMomentUnlocked
        ? `${this.selectedHero.name} vous retrouve au sommet de Haven. Vos limites et votre signal d’arrêt sont confirmés une dernière fois ; la porte se referme sur un baiser choisi, puis l’épilogue se fond au noir.`
        : `${this.selectedHero.name} vous rejoint au sommet de Haven. Votre victoire scelle une confiance entre égales, sans transformer le pacte militaire en promesse romantique.`;
    }
    this.saveProgress();
    this.openModal('victory-modal');
    this.announce('Campagne terminée. Haven est sauvée et le Léviathan neutralisé.');
  }

  continueEndlessMode() {
    if (!this.campaignVictory) return;
    this.endlessMode = true;
    this.campaignVictory = false;
    this.closeModal('victory-modal', false);
    this.configureWave(CAMPAIGN_FINAL_WAVE + 1);
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

      const timeScale = this.isOverdriveActive ? 0.7 : 1.0;

      if (!this.isPaused && !this.isGameOver && !this.campaignVictory) {
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
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateCrates(dt);
    this.updatePowerups(dt);
    this.accessibilityStatusTimer -= dt;
    if (this.accessibilityStatusTimer <= 0) {
      this.updateAccessibleBattlefieldStatus();
      this.accessibilityStatusTimer = 4;
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
    status.textContent = `Vague ${this.wave}. ${this.enemies.length} menaces.${bossWarning} Plus proche à ${Math.round(nearest.distance)} pixels, secteur ${sectors[sectorIndex]}. Citadelle ${Math.max(0, Math.round(this.citadel.hp))} points de vie.`;
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
      if (t.animationTimer > 0) t.animationTimer = Math.max(0, t.animationTimer - dt);
      if (t.type === 'mine' || t.type === 'napalm') {
        const trigger = this.findTarget(t.x, t.y, t.range);
        if (trigger) {
          audio.playExplosion();
          if (t.type === 'napalm') {
            this.hazards.push({ x: t.x, y: t.y, radius: 90, damage: 18 * (t.effectPower || 1), life: 5, tickTimer: 0, color: '#f97316' });
          }
          // Gameplay resolves immediately; this short visual clone lets the
          // authored trigger and cooldown frames complete without double damage.
          this.towerAnimationGhosts.push({ ...t, animationTimer: 0.34, visualLife: 0.34 });
          this.createExplosion(t.x, t.y, t.type === 'napalm' ? 90 : 65, t.damage);
          this.placedTowers.splice(i, 1);
        }
        continue;
      }
      if (t.type === 'barrier' || t.type === 'magnet' || t.type === 'shrine') continue;

      t.timer += dt * 1000 * (this.quadDamageTimer > 0 ? 1.5 : 1);
      const rateBonus = Math.min(0.65, this.shopUpgrades.fireRateBonus * 0.05);
      const effectiveRate = Math.max(70, t.fireRate * (1 - rateBonus));
      if (t.timer >= effectiveRate) {
        const target = this.findTarget(t.x, t.y, t.range);
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
    const mult = this.quadDamageTimer > 0 ? 4 : 1;
    t.facingAngle = angle;
    t.animationTimer = 0.34;

    if (t.type === 'bullet' || t.type === 'saw') {
      audio.playShoot();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 700, vy: Math.sin(angle) * 700, damage: t.damage * mult, color: '#00f0ff', radius: t.type === 'saw' ? 7 : 4, type: 'bullet', pierce: t.type === 'saw' ? 1 : 0 });
    } else if (t.type === 'plasma' || t.type === 'missile') {
      audio.playPlasma();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 450, vy: Math.sin(angle) * 450, damage: t.damage * mult, color: '#a855f7', radius: 9, type: 'plasma_mortar', aoe: 70 });
    } else if (t.type === 'rail' || t.type === 'orbital') {
      audio.playRailgun();
      const endX = t.x + Math.cos(angle) * t.range;
      const endY = t.y + Math.sin(angle) * t.range;
      this.particles.push({ type: 'rail_beam', x1: t.x, y1: t.y, x2: endX, y2: endY, life: 0.2, color: '#f59e0b' });
      [...this.enemies].forEach(e => {
        if (this.distToSegment({ x: e.x, y: e.y }, { x: t.x, y: t.y }, { x: endX, y: endY }) < e.radius + 12) {
          this.damageEnemy(e, t.damage * mult);
        }
      });
    } else if (t.type === 'fire') {
      audio.playFlame();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 330, vy: Math.sin(angle) * 330, damage: t.damage * mult, color: '#ff2a5f', radius: 7, life: 0.65, type: 'flame' });
    } else if (t.type === 'tesla') {
      audio.playRailgun();
      const chainTargets = this.getEnemiesInRange(t.x, t.y, t.range)
        .sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))
        .slice(0, 4);
      let previous = { x: t.x, y: t.y };
      chainTargets.forEach((enemy, index) => {
        this.particles.push({ type: 'rail_beam', x1: previous.x, y1: previous.y, x2: enemy.x, y2: enemy.y, life: 0.14, color: '#38bdf8' });
        this.damageEnemy(enemy, t.damage * mult * (1 - index * 0.14));
        previous = enemy;
      });
    } else if (t.type === 'cryo') {
      audio.playFreeze();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 470, vy: Math.sin(angle) * 470, damage: t.damage * mult, color: '#67e8f9', radius: 7, type: 'bullet', slow: 2.8 });
    } else if (t.type === 'acid') {
      audio.playPlasma();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 390, vy: Math.sin(angle) * 390, damage: t.damage * mult, color: '#84cc16', radius: 7, type: 'acid', aoe: 62 });
    } else if (t.type === 'drone') {
      audio.playShoot();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 820, vy: Math.sin(angle) * 820, damage: t.damage * mult, color: '#f0abfc', radius: 4, type: 'bullet', pierce: 1 });
    } else if (t.type === 'gravity') {
      audio.playAbility();
      this.getEnemiesInRange(t.x, t.y, t.range).forEach(enemy => {
        const pullAngle = Math.atan2(t.y - enemy.y, t.x - enemy.x);
        enemy.x += Math.cos(pullAngle) * 32;
        enemy.y += Math.sin(pullAngle) * 32;
        this.damageEnemy(enemy, t.damage * mult);
      });
      this.particles.push({ type: 'gravity_ring', x: t.x, y: t.y, radius: t.range, life: 0.35, color: '#a855f7' });
    } else if (t.type === 'siphon') {
      audio.playPlasma();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 500, vy: Math.sin(angle) * 500, damage: t.damage * mult, color: '#10b981', radius: 6, type: 'bullet', heal: 6 * (t.effectPower || 1) });
    } else if (t.type === 'emp') {
      audio.playAbility();
      this.getEnemiesInRange(t.x, t.y, t.range).forEach(enemy => {
        enemy.stunTimer = Math.max(enemy.stunTimer || 0, 2);
        this.damageEnemy(enemy, t.damage * mult);
      });
      this.particles.push({ type: 'gravity_ring', x: t.x, y: t.y, radius: t.range, life: 0.28, color: '#00f0ff' });
    } else if (t.type === 'sonic') {
      audio.playAbility();
      this.getEnemiesInRange(t.x, t.y, t.range).forEach(enemy => {
        const pushAngle = Math.atan2(enemy.y - t.y, enemy.x - t.x);
        enemy.x += Math.cos(pushAngle) * 38;
        enemy.y += Math.sin(pushAngle) * 38;
        this.damageEnemy(enemy, t.damage * mult);
      });
      this.particles.push({ type: 'gravity_ring', x: t.x, y: t.y, radius: t.range, life: 0.25, color: '#f59e0b' });
    }
  }

  getEnemiesInRange(x, y, range) {
    return this.enemies.filter(enemy => !enemy.dead && Math.hypot(enemy.x - x, enemy.y - y) <= range + enemy.radius);
  }

  getShrineDamageMultiplier() {
    const shrinePower = this.placedTowers
      .filter(tower => tower.type === 'shrine')
      .reduce((total, tower) => total + (tower.effectPower || 1), 0);
    return 1 + Math.min(0.8, shrinePower * 0.12);
  }

  findTarget(x, y, range) {
    let nearest = null;
    let minDist = range;
    this.enemies.forEach(e => {
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist < minDist) { minDist = dist; nearest = e; }
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
        const spread = (Math.random() - 0.5) * 0.4;
        this.projectiles.push({ x: this.citadel.x, y: this.citadel.y, vx: Math.cos(angle + spread) * 320, vy: Math.sin(angle + spread) * 320, damage: wp.damage * wp.level * damageMult, color: wp.isEvolved ? '#38bdf8' : '#ff2a5f', radius: 6, life: 0.5, type: 'flame' });
      }
    }
  }

  updateSpawns(dt) {
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

    this.spawnTimer += dt;
    const mutatorRate = this.towerMutator?.id === 'swarm' ? 0.68 : 1;
    const spawnInterval = Math.max(0.32, (2.0 - (this.wave * 0.09)) * mutatorRate);

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnMutant();
    }
  }

  spawnMutant() {
    let x, y;
    const w = this.canvas.width || window.innerWidth;
    const h = this.canvas.height || window.innerHeight;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -30 : w + 30;
      y = Math.random() * h;
    } else {
      x = Math.random() * w;
      y = Math.random() < 0.5 ? -30 : h + 30;
    }

    const bossDue = this.wave % 5 === 0
      && !this.bossSpawnedThisWave
      && this.enemiesSpawnedThisWave >= this.waveSpawnTarget - 1;
    let recruitableBossId = null;
    let type;
    if (bossDue && this.isTowerMode) {
      type = 'hellwarden';
    } else if (bossDue && this.wave % 15 === 0) {
      type = 'leviathan';
    } else if (bossDue) {
      const bossId = this.wave % 10 === 0 ? 'carmilla' : 'vespera';
      if (HERO_CLASSES[bossId].allied) {
        type = 'hellwarden';
      } else {
        type = bossId;
        recruitableBossId = bossId;
      }
    } else {
      type = Math.random() < 0.3 ? 'runner' : (Math.random() < 0.2 ? 'brute' : 'swarmer');
    }
    const isLeviathan = type === 'leviathan';
    const isBoss = bossDue;
    if (bossDue) this.bossSpawnedThisWave = true;

    let hp = 30 + (this.wave * 15);
    let speed = 90 + Math.random() * 30;
    let radius = 14;
    let color = '#ff2a5f';
    let name = 'Démon Swarmer';

    if (type === 'leviathan') {
      audio.playDragonRoar();
      hp = 4500 + (this.wave * 800); speed = 35; radius = 75; color = '#ec4899'; name = 'MEGA-BOSS TITAN LÉVIATHAN';
    } else if (type === 'runner') {
      hp = 20 + (this.wave * 10); speed = 160; radius = 11; color = '#00f0ff'; name = 'Acid Runner';
    } else if (type === 'brute') {
      hp = 130 + (this.wave * 45); speed = 55; radius = 22; color = '#a855f7'; name = 'Cyber Behemoth';
    } else if (type === 'vespera') {
      hp = 900 + (this.wave * 350); speed = 45; radius = 42; color = '#f59e0b'; name = 'Boss Vespera';
    } else if (type === 'carmilla') {
      hp = 1600 + (this.wave * 500); speed = 50; radius = 48; color = '#ff2a5f'; name = 'Reine Carmilla';
    } else if (type === 'hellwarden') {
      hp = 1100 + (this.wave * 420); speed = 52; radius = 44; color = '#f97316'; name = 'Gardienne Infernale';
    }

    const difficulty = DIFFICULTY_DATA[this.difficulty] || DIFFICULTY_DATA.standard;
    hp *= difficulty.enemyHp;
    speed *= difficulty.enemySpeed;
    if (this.towerMutator?.id === 'armored') hp *= 1.65;
    if (this.towerMutator?.id === 'haste') speed *= 1.35;
    this.enemiesSpawnedThisWave++;
    this.enemies.push({
      x, y, hp, maxHp: hp, speed, baseSpeed: speed, radius, color, name,
      isBoss: isBoss || isLeviathan, isLeviathan, type, recruitableBossId,
      facingAngle: Math.atan2(this.citadel.y - y, this.citadel.x - x),
      animationPhase: Math.random() * 8, attackAnimationTimer: 0, hitAnimationTimer: 0,
      bulletTimer: 0, contactTimer: 0, stunTimer: 0, slowTimer: 0, dead: false
    });
    this.updateHUD();
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'flame') {
        p.life -= dt;
        if (!(p.hitEnemies instanceof Set)) p.hitEnemies = new Set();
        if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }
      }

      if (p.x < -100 || p.x > this.canvas.width + 100 || p.y < -100 || p.y > this.canvas.height + 100) {
        this.projectiles.splice(i, 1);
        continue;
      }

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (e.dead) continue;
        if (p.type === 'flame' && p.hitEnemies.has(e)) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
          if (p.type === 'flame') p.hitEnemies.add(e);
          this.damageEnemy(e, p.damage);
          if (p.slow) e.slowTimer = Math.max(e.slowTimer || 0, p.slow);
          if (p.heal) {
            this.citadel.hp = Math.min(this.citadel.maxHp, this.citadel.hp + p.heal);
            this.updateHUD();
          }

          if (p.type === 'plasma_mortar') {
            audio.playExplosion();
            this.createExplosion(p.x, p.y, p.aoe, p.damage * 0.7);
            this.projectiles.splice(i, 1);
            break;
          } else if (p.type === 'acid') {
            this.hazards.push({ x: p.x, y: p.y, radius: p.aoe, damage: Math.max(2, p.damage * 0.22), life: 3.2, tickTimer: 0, color: '#84cc16' });
            this.createExplosion(p.x, p.y, p.aoe, p.damage * 0.35);
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
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const impactedDefense = this.placedTowers.find(defense => (
        Math.hypot(defense.x - b.x, defense.y - b.y) < defense.radius + b.radius
      ));
      if (impactedDefense) {
        impactedDefense.hp -= b.damage;
        this.addFloatingText(`-${b.damage}`, impactedDefense.x, impactedDefense.y - 24, '#fca5a5');
        if (impactedDefense.hp <= 0) {
          const defenseIndex = this.placedTowers.indexOf(impactedDefense);
          if (defenseIndex >= 0) this.placedTowers.splice(defenseIndex, 1);
          this.showFeedback(`${impactedDefense.name} détruite par le tir du boss.`, '#ef4444');
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

      if (b.x < -50 || b.x > this.canvas.width + 50 || b.y < -50 || b.y > this.canvas.height + 50) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  updateEnemies(dt) {
    if (this.freezeTimer > 0) return;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) continue;
      if (e.attackAnimationTimer > 0) e.attackAnimationTimer = Math.max(0, e.attackAnimationTimer - dt);
      if (e.hitAnimationTimer > 0) e.hitAnimationTimer = Math.max(0, e.hitAnimationTimer - dt);
      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        continue;
      }
      if (e.slowTimer > 0) e.slowTimer -= dt;

      let targetPos = { x: this.citadel.x, y: this.citadel.y };
      let closestDecoyDist = Math.hypot(this.citadel.x - e.x, this.citadel.y - e.y);
      let targetBarrier = null;

      this.decoys.forEach(d => {
        const dist = Math.hypot(d.x - e.x, d.y - e.y);
        if (dist < closestDecoyDist) { closestDecoyDist = dist; targetPos = { x: d.x, y: d.y }; }
      });
      this.placedTowers.forEach(tower => {
        if (tower.type !== 'barrier') return;
        const dist = Math.hypot(tower.x - e.x, tower.y - e.y);
        if (dist < closestDecoyDist) {
          closestDecoyDist = dist;
          targetBarrier = tower;
          targetPos = { x: tower.x, y: tower.y };
        }
      });

      const angle = Math.atan2(targetPos.y - e.y, targetPos.x - e.x);
      e.facingAngle = angle;
      const movementSpeed = e.speed * (e.slowTimer > 0 ? 0.45 : 1);
      e.x += Math.cos(angle) * movementSpeed * dt;
      e.y += Math.sin(angle) * movementSpeed * dt;

      if (e.isBoss) {
        e.bulletTimer += dt;
        if (e.bulletTimer >= (e.isLeviathan ? 0.8 : 1.2)) {
          e.bulletTimer = 0;
          this.fireBossBulletRing(e);
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
        const barrierDamage = e.isBoss ? 90 : (e.type === 'brute' ? 45 : 24);
        targetBarrier.hp -= barrierDamage;
        this.addFloatingText(`-${barrierDamage}`, targetBarrier.x, targetBarrier.y - 24, '#67e8f9');
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
              const dmg = e.isLeviathan ? 80 : 40;
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
          const dmg = e.type === 'brute' ? 20 : 8;
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

  fireBossBulletRing(boss) {
    boss.attackAnimationTimer = 0.34;
    const bulletsCount = boss.isLeviathan ? 16 : (boss.type === 'carmilla' ? 12 : 8);
    for (let i = 0; i < bulletsCount; i++) {
      const angle = (Math.PI * 2 / bulletsCount) * i;
      this.enemyBullets.push({
        x: boss.x, y: boss.y,
        vx: Math.cos(angle) * 200, vy: Math.sin(angle) * 200,
        damage: 15, radius: 7, color: boss.color
      });
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
          if (Math.hypot(e.x - d.x, e.y - d.y) < d.radius + (d.pulseRadius || 70)) {
            this.damageEnemy(e, d.pulseDamage || 30);
            if (d.healOnPulse) {
              this.citadel.hp = Math.min(this.citadel.maxHp, this.citadel.hp + d.healOnPulse);
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
          if (Math.hypot(enemy.x - hazard.x, enemy.y - hazard.y) <= hazard.radius + enemy.radius) {
            this.damageEnemy(enemy, hazard.damage);
          }
        });
      }
      if (hazard.life <= 0) this.hazards.splice(i, 1);
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

  damageEnemy(enemy, amount) {
    if (!enemy || enemy.dead || !Number.isFinite(amount) || amount <= 0) return;
    enemy.hp -= amount;
    enemy.hitAnimationTimer = 0.16;
    this.addFloatingText(`${Math.round(amount)}`, enemy.x, enemy.y - 15, enemy.color);

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

    this.mutantsKilled++;
    this.score += enemy.isLeviathan ? 2000 : (enemy.isBoss ? 600 : 50);

    if (this.mutantsKilled >= 1) this.unlockAchievement('first_blood');
    if (enemy.isLeviathan) this.unlockAchievement('wave_15');

    const coinValue = enemy.isBoss ? 100 : (Math.random() < 0.45 ? 10 : 0);
    if (coinValue > 0) {
      this.coins += coinValue;
      this.totalCoinsEarned += coinValue;
      this.addFloatingText(`+${coinValue} 🪙`, enemy.x, enemy.y, '#f59e0b');
    }

    this.gainFrenzy(enemy.isBoss ? 24 : 7);
    this.gainAffinity(enemy.isBoss ? 14 : 2);

    if (Math.random() < 0.08) {
      const pType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      this.addBoundedLoot('powerup', { x: enemy.x, y: enemy.y, radius: 16, type: pType });
    }

    if (enemy.isBoss || Math.random() < 0.07) {
      const isRed = enemy.isBoss || Math.random() < 0.25;
      this.addBoundedLoot('crate', { x: enemy.x, y: enemy.y, type: isRed ? 'red' : 'blue', radius: 14 });
      audio.playPickup();
    }

    for (let i = 0; i < 8; i++) {
      this.particles.push({ x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, radius: 3 + Math.random() * 4, color: enemy.color, life: 0.4 });
    }

    this.addXp(enemy.isBoss ? 160 : 20);

    if (enemy.recruitableBossId) {
      this.triggerBossRecruitModal(enemy.recruitableBossId);
    }

    this.checkGalleryUnlocks();
    this.updateHUD();
  }

  gainFrenzy(amount) {
    if (this.isOverdriveActive) return;
    this.frenzyMeter = Math.min(this.maxFrenzyMeter, this.frenzyMeter + amount);
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

  triggerHeroAbility() {
    if (this.abilityCooldownTimer > 0 || this.isPaused) return;

    audio.playAbility();
    this.abilityCooldownTimer = this.selectedHero.cooldown;
    this.decoysDeployedCount++;

    const angle = Math.random() * Math.PI * 2;
    this.heroFacingAngle = angle;
    this.heroAnimationState = 'ability';
    this.heroAnimationTimer = 0.72;
    const decoy = {
      x: this.citadel.x + Math.cos(angle) * 120,
      y: this.citadel.y + Math.sin(angle) * 120,
      radius: 22,
      life: 8,
      pulseDamage: 30,
      pulseRadius: 70,
      explosionDamage: 90,
      explosionRadius: 110,
      color: '#00f0ff',
      heroId: this.selectedHero.id
    };
    if (this.selectedHero.id === 'aria') {
      decoy.life = 11;
      decoy.radius = 30;
      decoy.explosionDamage = 60;
    } else if (this.selectedHero.id === 'kira') {
      decoy.life = 6;
      decoy.pulseDamage = 45;
      decoy.explosionDamage = 150;
      decoy.color = '#a855f7';
    } else if (this.selectedHero.id === 'rin') {
      decoy.pulseDamage = 52;
      decoy.pulseRadius = 90;
      decoy.color = '#f97316';
      this.hazards.push({ x: decoy.x, y: decoy.y, radius: 95, damage: 18, life: 8, tickTimer: 0, color: '#f97316' });
    } else if (this.selectedHero.id === 'selene') {
      decoy.pulseDamage = 58;
      decoy.pulseRadius = 115;
      decoy.color = '#67e8f9';
    } else if (this.selectedHero.id === 'vespera') {
      decoy.pulseDamage = 68;
      decoy.pulseRadius = 120;
      decoy.color = '#ec4899';
    } else if (this.selectedHero.id === 'carmilla') {
      decoy.pulseDamage = 40;
      decoy.healOnPulse = 4;
      decoy.color = '#be123c';
    }
    this.decoys.push(decoy);
    this.showFeedback(`${this.selectedHero.abilityName} déployé`, decoy.color);

    this.checkGalleryUnlocks();
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
    const mutators = [
      { id: 'armored', name: 'Carapace abyssale', desc: '+65 % de santé ennemie.' },
      { id: 'haste', name: 'Pulsation accélérée', desc: '+35 % de vitesse ennemie.' },
      { id: 'swarm', name: 'Marée démoniaque', desc: '+50 % d’ennemis, cadence accrue.' }
    ];
    if (!this.pendingTowerMutator || this.pendingTowerMutatorFloor !== this.towerFloor) {
      this.pendingTowerMutator = mutators[Math.floor(Math.random() * mutators.length)];
      this.pendingTowerMutatorFloor = this.towerFloor;
    }
    document.getElementById('tower-mutator-txt').textContent = `${this.pendingTowerMutator.name} — ${this.pendingTowerMutator.desc}`;

    const startButton = document.getElementById('btn-start-floor');
    startButton.textContent = this.towerCompleted ? 'Rejouer l’Étage 100' : `Gravir l’Étage ${this.towerFloor}`;
    startButton.onclick = () => {
      const floorMutator = this.pendingTowerMutator;
      this.campaignStateBeforeTower = {
        wave: this.wave,
        waveActive: this.waveActive,
        waveIntermissionTimer: this.waveIntermissionTimer,
        enemiesSpawnedThisWave: this.enemiesSpawnedThisWave,
        waveSpawnTarget: this.waveSpawnTarget,
        bossSpawnedThisWave: this.bossSpawnedThisWave,
        waveRewardClaimed: this.waveRewardClaimed,
        spawnTimer: this.spawnTimer,
        enemies: this.enemies,
        enemyBullets: this.enemyBullets,
        projectiles: this.projectiles,
        particles: this.particles,
        floatingTexts: this.floatingTexts,
        decoys: this.decoys,
        crates: this.crates,
        powerups: this.powerups,
        hazards: this.hazards
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
      this.configureWave(this.towerFloor, { towerMode: true, mutator: floorMutator });
      this.pendingTowerMutator = null;
      this.pendingTowerMutatorFloor = null;
      this.closeModal(modal, false);
      if (document.getElementById('hq-menu-modal')?.classList.contains('active')) {
        this.closeModal('hq-menu-modal', false);
      }
      this.showFeedback(`Étage ${this.towerFloor} : ${floorMutator.name}`, '#a855f7');
      this.updateHUD();
      this.focusBattlefield();
    };
    this.openModal(modal);
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
    const imgSrc = hero.activeSkin === 'alt' && hero.altAvatar ? hero.altAvatar : hero.avatar;
    document.getElementById('studio-preview-img').src = imgSrc;
    document.getElementById('studio-preview-img').alt = `Portrait boudoir non nu de ${hero.name}, ${hero.age} ans`;
    document.getElementById('studio-hero-title').textContent = hero.name;

    this.openModal(modal);
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
        <h4 style="color:#ec4899;">${hero.name}</h4>
        <div class="adult-profile-meta">
          <span>${hero.age} ans</span>
          <span>Confiance ${hero.affinityLvl}/5</span>
          <span>${relationshipStatus}</span>
        </div>
        <p class="relationship-copy">${currentLine}</p>
        <p class="relationship-boundary">${hero.boundary}</p>
        <div class="relationship-actions"></div>`;
      const actions = card.querySelector('.relationship-actions');

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
      hero.lastLoungeMessage = 'Elle décline calmement pour le moment. Aucun crédit ni point de confiance n’est perdu.';
    } else {
      hero.romanceOptIn = true;
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
      card.innerHTML = `<div><h4 style="color: ${a.unlocked ? '#f59e0b' : '#fff'};">${a.name} ${a.unlocked ? '🏆' : '🔒'}</h4><p style="font-size:0.8rem; color:#94a3b8;">${a.desc}</p></div><div class="meta-currency">+${a.reward} ◆</div>`;
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
      cardDefault.innerHTML = `<img src="${hero.avatar}" alt="${hero.name}, ${hero.age} ans"><h4>${hero.name} — Armure classique</h4>`;
      cardDefault.onclick = () => this.applyHeroSkin(hero, 'default');
      container.appendChild(cardDefault);

      if (hero.altAvatar) {
        const cardAlt = document.createElement('button');
        cardAlt.type = 'button';
        cardAlt.className = `skin-card ${hero.activeSkin === 'alt' ? 'active' : ''}`;
        cardAlt.dataset.heroId = hero.id;
        cardAlt.dataset.skin = 'alt';
        cardAlt.setAttribute('aria-pressed', String(hero.activeSkin === 'alt'));
        cardAlt.innerHTML = `<img src="${hero.altAvatar}" alt="${hero.name}, tenue suggestive adulte"><h4 style="color: #ec4899;">${hero.name} — Tenue nocturne 18+</h4>`;
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
    this.announce(`Tenue de ${hero.name} mise à jour sans relancer la partie.`);
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

    const options = available.sort(() => 0.5 - Math.random()).slice(0, 3);
    options.forEach(opt => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'upgrade-card';
      card.innerHTML = `<div class="upgrade-info"><div class="upgrade-icon">${opt.icon}</div><div class="upgrade-text"><h4>${opt.title}</h4><p>${opt.desc}</p></div></div>`;
      card.addEventListener('click', () => {
        if (opt.type === 'weapon') { opt.wp.level++; this.updateWeaponsHUD(); }
        else if (opt.type === 'heal') { this.citadel.hp = Math.min(this.citadel.maxHp, this.citadel.hp + 200); }
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
    card.innerHTML = `<div class="upgrade-info"><div class="upgrade-icon">🔥</div><div class="upgrade-text"><h4 style="color: #f59e0b;">ÉVOLUTION SUPER-ARME : ${targetWp.evolutionName}</h4><p>${targetWp.evolutionDesc}</p></div></div>`;
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

  openCgStoryViewer(item) {
    const modal = document.getElementById('cg-viewer-modal'); if (!modal) return;

    const imgSrc = (HERO_CLASSES[item.id] && HERO_CLASSES[item.id].activeSkin === 'alt' && item.altImg) ? item.altImg : item.img;
    document.getElementById('cg-viewer-img').src = imgSrc;
    document.getElementById('cg-viewer-img').alt = `Archive illustrée de ${item.name}, adulte de ${item.age} ans`;
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
    this.openModal(modal);
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
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
    const row = Math.max(0, Math.min(SPRITE_ATLAS_ROWS - 1, spriteData.row || 0));
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

  drawInfernalFloor(w, h) {
    this.ctx.fillStyle = '#070b14';
    this.ctx.fillRect(0, 0, w, h);
    if (!this.isSpriteReady(this.floorImage)) return;

    if (!this.floorPattern && typeof this.ctx.createPattern === 'function') {
      this.floorPattern = this.ctx.createPattern(this.floorImage, 'repeat');
    }
    this.ctx.save();
    this.ctx.globalAlpha = 0.9;
    if (this.floorPattern) {
      this.ctx.fillStyle = this.floorPattern;
      this.ctx.fillRect(0, 0, w, h);
    } else {
      this.ctx.drawImage(this.floorImage, 0, 0, w, h);
    }
    this.ctx.restore();

    // Maintain contrast for bullets, hazard telegraphs and small enemies.
    this.ctx.fillStyle = 'rgba(3, 7, 16, 0.38)';
    this.ctx.fillRect(0, 0, w, h);
  }

  drawTower(tower, options = {}) {
    const spriteData = TOWER_SPRITE_DATA[tower.id];
    const sprite = this.towerSpriteImages[tower.id];
    const frame = spriteData ? this.getTowerAnimationFrame(tower, spriteData) : 0;
    const rotation = spriteData?.rotate ? (tower.facingAngle || 0) : undefined;
    const drawn = spriteData && this.drawAtlasFrame(
      sprite,
      spriteData,
      frame,
      tower.x,
      tower.y,
      spriteData.size,
      { rotation, shadowColor: '#00f0ff', shadowBlur: 8 }
    );

    if (!drawn) {
      this.ctx.beginPath();
      this.ctx.arc(tower.x, tower.y, tower.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fill();
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.font = '16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(tower.icon, tower.x, tower.y);
    }

    if (!options.suppressLevel) {
      this.ctx.font = 'bold 9px Rajdhani';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = '#67e8f9';
      this.ctx.fillText(`L${tower.level}`, tower.x + 17, tower.y + 17);
    }
  }

  drawHero(x, y, options = {}) {
    const heroId = options.heroId || this.selectedHero.id;
    const spriteData = HERO_SPRITE_DATA[heroId];
    const sprite = this.heroSpriteImages[heroId];
    if (!spriteData) return false;
    const frame = Number.isFinite(options.frame) ? options.frame : this.getHeroAnimationFrame();
    const facingAngle = Number.isFinite(options.facingAngle) ? options.facingAngle : this.heroFacingAngle;
    return this.drawAtlasFrame(
      sprite,
      spriteData,
      frame,
      x,
      y,
      options.size || spriteData.size,
      {
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
    const visualSize = spriteData?.size || enemy.radius * 2;
    const visualRadius = spriteReady ? visualSize / 2 : enemy.radius;

    if (spriteReady) {
      // Low-profile creatures follow their target; upright bosses stay billboarded
      // so their readable combat pose never appears to tumble around the canvas.
      const facingAngle = Number.isFinite(enemy.facingAngle) ? enemy.facingAngle : 0;
      this.drawAtlasFrame(
        sprite,
        spriteData,
        this.getEnemyAnimationFrame(enemy, spriteData),
        enemy.x,
        enemy.y,
        visualSize,
        {
          rotation: spriteData.rotate ? facingAngle + (spriteData.rotationOffset || 0) : undefined,
          flipX: !spriteData.rotate && Math.cos(facingAngle) < 0,
          shadowColor: enemy.color,
          shadowBlur: enemy.isBoss ? 30 : 8
        }
      );
    } else {
      // Safe visual fallback while assets load or if an individual file fails.
      this.ctx.save();
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
      const healthWidth = enemy.isBoss ? Math.min(96, visualSize * 0.68) : 40;
      const healthY = enemy.y - visualRadius - 12;
      this.ctx.fillStyle = 'rgba(0,0,0,0.72)';
      this.ctx.fillRect(enemy.x - healthWidth / 2, healthY, healthWidth, 5);
      this.ctx.fillStyle = enemy.color;
      this.ctx.fillRect(enemy.x - healthWidth / 2, healthY, healthWidth * Math.max(0, enemy.hp / enemy.maxHp), 5);
    }

    if (enemy.isBoss) {
      this.ctx.font = 'bold 11px Rajdhani, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(enemy.name, enemy.x, enemy.y - visualRadius - 18);
    }
    this.ctx.restore();
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width || window.innerWidth || 1200;
    const h = this.canvas.height || window.innerHeight || 800;

    // OpenAI-authored tileable street floor, with a dark fallback while loading.
    this.drawInfernalFloor(w, h);

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

    if (this.isOverdriveActive) {
      this.ctx.fillStyle = `rgba(245, 158, 11, ${0.08 + Math.sin(Date.now() * 0.01) * 0.04})`;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Render Mercenaries
    this.mercenaries.forEach(m => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.shadowColor = '#f59e0b';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.restore();
    });

    // Render Pet Drones
    this.petDrones.forEach(d => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
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
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(t.x - 20, t.y + 24, 40, 4);
        this.ctx.fillStyle = '#67e8f9';
        this.ctx.fillRect(t.x - 20, t.y + 24, 40 * hpRatio, 4);
      }
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

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(citX, citY, this.citadel.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#121829';
    this.ctx.fill();
    this.ctx.strokeStyle = this.isOverdriveActive ? '#f59e0b' : '#ff2a5f';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = this.isOverdriveActive ? '#f59e0b' : '#ff2a5f';
    this.ctx.shadowBlur = 20;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(citX, citY, 18, 0, Math.PI * 2);
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 15;
    this.ctx.fill();
    this.ctx.restore();
    this.drawHero(citX, citY - 7);

    // Render Crates
    this.crates.forEach(c => {
      this.ctx.save();
      this.ctx.fillStyle = c.type === 'red' ? '#ff2a5f' : '#00f0ff';
      this.ctx.shadowColor = c.type === 'red' ? '#ff2a5f' : '#00f0ff';
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(c.x - c.radius, c.y - c.radius, c.radius * 2, c.radius * 2);
      this.ctx.restore();
    });

    // Render Powerups
    this.powerups.forEach(p => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.type.color;
      this.ctx.shadowColor = p.type.color;
      this.ctx.shadowBlur = 15;
      this.ctx.fill();

      this.ctx.font = '14px sans-serif';
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
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.restore();
    });

    // Render Projectiles
    this.projectiles.forEach(p => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
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
      this.ctx.font = 'bold 15px Rajdhani';
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
  }

  createExplosion(x, y, radius, damage) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      this.particles.push({ x, y, vx: Math.cos(angle) * radius * 3, vy: Math.sin(angle) * radius * 3, radius: 4, color: '#a855f7', life: 0.3 });
    }
    if (damage > 0) {
      [...this.enemies].forEach(e => {
        if (Math.hypot(e.x - x, e.y - y) <= radius + e.radius) this.damageEnemy(e, damage);
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
        : `Objectif · atteindre la vague ${CAMPAIGN_FINAL_WAVE}`;
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
