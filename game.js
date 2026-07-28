/* Valkyrie Sweeper: Dark Siege - Comprehensive Game Engine */

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
  missile_pod: { id: 'missile_pod', name: 'Pod de Missiles', icon: '🚀', cost: 110, damage: 85, fireRate: 1200, range: 380, type: 'missile', desc: 'Salves de roquettes téléguidées.' },
  bio_siphon: { id: 'bio_siphon', name: 'Pique Siphon', icon: '💉', cost: 65, damage: 18, fireRate: 400, range: 200, type: 'siphon', desc: 'Vole la vie des monstres pour soigner la Citadelle.' },
  magnet_drone: { id: 'magnet_drone', name: 'Drone Aimant', icon: '🧲', cost: 50, damage: 0, fireRate: 0, range: 400, type: 'magnet', desc: 'Attire automatiquement tous les Bio-Coins.' },
  sawblade_turret: { id: 'sawblade_turret', name: 'Lance-Lames', icon: '⚙️', cost: 70, damage: 45, fireRate: 600, range: 260, type: 'saw', desc: 'Projette des scies dentées rebondissantes.' },
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

// Weapon Base Definitions
const WEAPONS_DATA = {
  vulcan: { id: 'vulcan', name: 'Vulcan Minigun', icon: '🔫', level: 1, maxLevel: 5, damage: 18, fireRate: 200, range: 280, type: 'ballistic', desc: 'Tirs cinétiques à haute cadence.' },
  plasma: { id: 'plasma', name: 'Mortier Plasma', icon: '🔮', level: 0, maxLevel: 5, damage: 45, fireRate: 800, range: 350, type: 'plasma', desc: 'Projectiles de plasma thermonucléaire de zone.' },
  railgun: { id: 'railgun', name: 'Railgun à Particules', icon: '⚡', level: 0, maxLevel: 5, damage: 120, fireRate: 1500, range: 450, type: 'rail', desc: 'Faisceaux transperçant les rangs ennemis.' },
  flamethrower: { id: 'flamethrower', name: 'Lance-Flammes Inferno', icon: '🔥', level: 0, maxLevel: 5, damage: 8, fireRate: 80, range: 200, type: 'fire', desc: 'Cône continu de flammes rugissantes.' }
};

// Heroine Classes
const HERO_CLASSES = {
  aria: { id: 'aria', name: 'Commander Aria', title: 'Valkyrie Aegis', avatar: 'assets/cg_aria.jpg', altAvatar: 'assets/cg_aria_swimsuit.jpg', activeSkin: 'default', abilityName: 'Leurre Bouclier Aegis', abilityDesc: 'Déploie un leurre renforcé.', cooldown: 12, startingWeapon: 'vulcan', affinityLvl: 1, affection: 0 },
  kira: { id: 'kira', name: 'Shadow Kira', title: 'Infiltratrice Phantôme', avatar: 'assets/cg_kira.jpg', altAvatar: 'assets/cg_kira_lingerie.jpg', activeSkin: 'default', abilityName: 'Hologramme d\'Ombre', abilityDesc: 'Déploie une illusion qui explose en plasma.', cooldown: 10, startingWeapon: 'railgun', affinityLvl: 1, affection: 0 },
  rin: { id: 'rin', name: 'Pyromancer Rin', title: 'Prêtresse du Feu', avatar: 'assets/cg_rin.jpg', altAvatar: 'assets/cg_rin_silk.jpg', activeSkin: 'default', abilityName: 'Leurre Vortex Enflammé', abilityDesc: 'Déploie un leurre qui enflamme les monstres.', cooldown: 14, startingWeapon: 'flamethrower', affinityLvl: 1, affection: 0 },
  selene: { id: 'selene', name: 'Cyber Selene', title: 'Prêtresse Lunaire', avatar: 'assets/cg_selene.jpg', altAvatar: 'assets/cg_selene_translucent.jpg', activeSkin: 'default', abilityName: 'Faisceau Lunaire', abilityDesc: 'Déploie un leurre émettant un rayon laser orbital.', cooldown: 11, startingWeapon: 'plasma', affinityLvl: 1, affection: 0 },
  vespera: { id: 'vespera', name: 'Imperatrice Vespera', title: 'Succube Purifiée', avatar: 'assets/cg_vespera.jpg', altAvatar: 'assets/cg_vespera.jpg', activeSkin: 'default', abilityName: 'Orbes Abyssales', abilityDesc: 'Tire un anneau de projectiles en spirale.', cooldown: 10, startingWeapon: 'plasma', affinityLvl: 1, affection: 0, unlocked: false },
  carmilla: { id: 'carmilla', name: 'Reine Carmilla', title: 'Impératrice de Sang', avatar: 'assets/cg_carmilla.jpg', altAvatar: 'assets/cg_carmilla.jpg', activeSkin: 'default', abilityName: 'Vortex de Sang', abilityDesc: 'Déploie un leurre vampire absorbant la vie.', cooldown: 9, startingWeapon: 'railgun', affinityLvl: 1, affection: 0, unlocked: false }
};

// 25+ Achievements Definitions
const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'Premier Sang', desc: 'Éliminer votre premier démon.', unlocked: false, reward: 50 },
  { id: 'wave_5', name: 'Vanguard Defender', desc: 'Survivre jusqu\'à la Vague 5.', unlocked: false, reward: 100 },
  { id: 'wave_10', name: 'Master Sweeper', desc: 'Survivre jusqu\'à la Vague 10.', unlocked: false, reward: 200 },
  { id: 'wave_15', name: 'Titan Slayer', desc: 'Survivre au Mega-Boss Léviathan à la Vague 15.', unlocked: false, reward: 500 },
  { id: 'frenzy_master', name: 'Frénésie Totale', desc: 'Activer le Mode Overdrive 3 fois.', unlocked: false, reward: 150 },
  { id: 'super_weapon', name: 'Arsenal Suprême', desc: 'Faire évoluer une arme en Super-Arme.', unlocked: false, reward: 250 },
  { id: 'builder', name: 'Architecte de Citadelle', desc: 'Construire 10 tourelles de défense.', unlocked: false, reward: 150 },
  { id: 'recruiter', name: 'Séducteur d\'Impératrice', desc: 'Purifier et recruter un Boss.', unlocked: false, reward: 300 },
  { id: 'harem_lover', name: 'Maître du Salon', desc: 'Offrir un cadeau dans le Salon Harem.', unlocked: false, reward: 200 }
];

// Secret Archives Gallery Items
const GALLERY_ITEMS = [
  { id: 'aria', name: 'Valkyrie Commander Aria', subtitle: 'Gardienne de la Citadelle Haven', img: 'assets/cg_aria.jpg', altImg: 'assets/cg_aria_swimsuit.jpg', unlockReq: 'Survivre à la Vague 3', unlocked: false, quote: '"Tant que mon épée brillera, aucun démon ne franchira cette citadelle !"', story: 'Commandante en chef des forces Aegis, Aria est dévouée à votre protection.', stats: { Puissance: 'S', Agilité: 'A', Armure: 'EX' } },
  { id: 'kira', name: 'Shadow Assassin Kira', subtitle: 'Infiltratrice des Forces Spéciales', img: 'assets/cg_kira.jpg', altImg: 'assets/cg_kira_lingerie.jpg', unlockReq: 'Déployer 3 Leurres au cours d\'un combat', unlocked: false, quote: '"Ils ne voient que mon ombre... juste avant le coup mortel."', story: 'Infiltratrice agile maniant les illusions d\'ombre.', stats: { Puissance: 'A', Agilité: 'EX', Armure: 'B' } },
  { id: 'rin', name: 'Pyromancer Rin', subtitle: 'Haute Prêtresse de Flamme', img: 'assets/cg_rin.jpg', altImg: 'assets/cg_rin_silk.jpg', unlockReq: 'Évoluer n\'importe quelle arme', unlocked: false, quote: '"Le feu sacré purifie tout jusqu\'aux cendres !"', story: 'Haute prêtresse consumant les armées démoniaques dans l\'incendie.', stats: { Puissance: 'EX', Agilité: 'B', Armure: 'A' } },
  { id: 'vespera', name: 'Succubus Empress Vespera', subtitle: 'Souveraine Purifiée', img: 'assets/cg_vespera.jpg', unlockReq: 'Recruter Boss Vespera (Vague 5)', unlocked: false, quote: '"Tes désirs sont désormais mes ordres."', story: 'Souveraine succube ralliée à la Citadelle.', stats: { Puissance: 'EX+', Agilité: 'S', Armure: 'S' } },
  { id: 'carmilla', name: 'Vampire Queen Carmilla', subtitle: 'Impératrice Gothic', img: 'assets/cg_carmilla.jpg', unlockReq: 'Recruter Boss Carmilla (Vague 10)', unlocked: false, quote: '"Le sang de nos ennemis scellera notre pacte."', story: 'Seigneur suprême de la nuit gothic.', stats: { Puissance: 'EX+', Agilité: 'S+', Armure: 'S' } },
  { id: 'selene', name: 'Cyber Priestess Selene', subtitle: 'Oracle du Rayon Lunaire', img: 'assets/cg_selene.jpg', altImg: 'assets/cg_selene_translucent.jpg', unlockReq: 'Activer le Mode Overdrive', unlocked: false, quote: '"La lumière stellar guidera notre victoire."', story: 'Canalise l\'énergie lunaire orbitale.', stats: { Puissance: 'S+', Agilité: 'A+', Armure: 'A' } },
  { id: 'nova', name: 'Tech Specialist Nova', subtitle: 'Cerveau de l\'Armurerie', img: 'assets/cg_nova.jpg', unlockReq: 'Récolter 500 Bio-Coins', unlocked: false, quote: '"Systèmes au maximum de puissance !"', story: 'Ingénieure de génie de la citadelle.', stats: { Puissance: 'A', Agilité: 'S', Armure: 'A+' } }
];

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.selectedHero = HERO_CLASSES.aria;
    this.selectedTowerToBuild = TOWER_TYPES.vulcan_turret;
    
    this.citadel = { x: 600, y: 400, radius: 45, hp: 500, maxHp: 500 };
    
    this.wave = 1;
    this.towerFloor = 1;
    this.score = 0;
    this.coins = 400;
    this.totalCoinsEarned = 400;
    this.decoysDeployedCount = 0;
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
    this.affinityXp = 0;
    this.nextAffinityXp = 200;
    
    this.weapons = JSON.parse(JSON.stringify(WEAPONS_DATA));
    this.weaponTimers = {};
    this.placedTowers = [];
    
    this.mercenaries = [];
    this.petDrones = [];

    this.enemies = [];
    this.enemyBullets = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.decoys = [];
    this.crates = [];
    this.powerups = [];

    this.abilityCooldownTimer = 0;
    this.shopUpgrades = { hpBonus: 0, fireRateBonus: 0, magnetRange: 0 };

    this.isPaused = false;
    this.isGameOver = false;
    this.lastTime = 0;

    this.gridOffset = 0;

    this.loadProgress();
  }

  init() {
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindEvents();
    this.initWeapons();
    this.renderBuildBar();
    this.updateHUD();
    this.renderGallery();

    // Start with initial game state ready immediately!
    this.startNewGame();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth || 1200;
    this.canvas.height = window.innerHeight || 800;
    this.citadel.x = this.canvas.width / 2;
    this.citadel.y = this.canvas.height / 2;
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('valkyrie_sweeper_save');
      if (saved) {
        const data = JSON.parse(saved);
        this.coins = data.coins || 400;
        this.totalCoinsEarned = data.totalCoinsEarned || 400;
        this.shopUpgrades = data.shopUpgrades || this.shopUpgrades;
        if (data.unlockedGallery) {
          GALLERY_ITEMS.forEach(item => {
            if (data.unlockedGallery.includes(item.id)) item.unlocked = true;
          });
        }
        if (data.recruitedBosses) {
          data.recruitedBosses.forEach(bossId => {
            if (HERO_CLASSES[bossId]) HERO_CLASSES[bossId].unlocked = true;
          });
        }
        if (data.achievements) {
          ACHIEVEMENTS.forEach(a => {
            if (data.achievements.includes(a.id)) a.unlocked = true;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
  }

  saveProgress() {
    try {
      const unlockedIds = GALLERY_ITEMS.filter(i => i.unlocked).map(i => i.id);
      const recruitedBosses = Object.values(HERO_CLASSES).filter(h => h.unlocked).map(h => h.id);
      const achievements = ACHIEVEMENTS.filter(a => a.unlocked).map(a => a.id);
      const data = {
        coins: this.coins,
        totalCoinsEarned: this.totalCoinsEarned,
        shopUpgrades: this.shopUpgrades,
        unlockedGallery: unlockedIds,
        recruitedBosses,
        achievements
      };
      localStorage.setItem('valkyrie_sweeper_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  bindEvents() {
    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.buildSelectedTowerAt(x, y);
      });
    }

    const btnSkill = document.getElementById('btn-hero-skill');
    if (btnSkill) btnSkill.addEventListener('click', () => this.triggerHeroAbility());

    const btnOverdrive = document.getElementById('btn-overdrive');
    if (btnOverdrive) btnOverdrive.addEventListener('click', () => this.triggerOverdrive());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') this.triggerOverdrive();
    });

    const radioSel = document.getElementById('radio-station-select');
    if (radioSel) {
      radioSel.addEventListener('change', (e) => {
        audio.setStation(e.target.value);
        if (audio.isPlayingMusic) {
          audio.stopMusic();
          audio.startMusic();
        }
      });
    }

    // HQ Central Hub Opener Button in HUD
    const btnOpenHQ = document.getElementById('btn-open-hq');
    if (btnOpenHQ) {
      btnOpenHQ.addEventListener('click', () => {
        this.isPaused = true;
        document.getElementById('hq-menu-modal').classList.add('active');
      });
    }

    // Sub-modal triggers from HQ Hub Menu
    document.querySelectorAll('.hq-card').forEach(card => {
      card.addEventListener('click', () => {
        document.getElementById('hq-menu-modal').classList.remove('active');
        const targetId = card.id;
        if (targetId === 'btn-harem-toggle') this.openHaremModal();
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

    const btnCrt = document.getElementById('btn-crt-toggle');
    if (btnCrt) {
      btnCrt.addEventListener('click', () => {
        const crt = document.querySelector('.crt-overlay');
        if (crt) crt.classList.toggle('disabled');
      });
    }

    const btnMusic = document.getElementById('btn-music-toggle');
    if (btnMusic) btnMusic.addEventListener('click', () => audio.toggleMusic());

    document.querySelectorAll('.btn-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
        this.isPaused = false;
      });
    });

    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');
        this.startNewGame();
      });
    }
  }

  renderBuildBar() {
    const bar = document.getElementById('hud-build-bar');
    if (!bar) return;
    bar.innerHTML = '';

    Object.values(TOWER_TYPES).forEach(t => {
      const card = document.createElement('div');
      card.className = `build-tower-card ${this.selectedTowerToBuild.id === t.id ? 'selected' : ''}`;
      card.title = `${t.name} (${t.cost} 🪙) - ${t.desc}`;
      card.innerHTML = `<div class="icon">${t.icon}</div><div class="cost">${t.cost}🪙</div>`;
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.build-tower-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedTowerToBuild = t;
      });
      bar.appendChild(card);
    });
  }

  buildSelectedTowerAt(x, y) {
    if (Math.hypot(this.citadel.x - x, this.citadel.y - y) < this.citadel.radius + 20) {
      this.addFloatingText('Zone de Citadelle Protégée !', x, y, '#ef4444');
      return;
    }

    const towerType = this.selectedTowerToBuild;
    if (this.coins < towerType.cost) {
      audio.playHurtVoice();
      this.addFloatingText('Pas assez de Bio-Coins !', x, y, '#ef4444');
      return;
    }

    this.coins -= towerType.cost;
    audio.playPickup();

    this.placedTowers.push({
      id: towerType.id,
      x, y,
      level: 1,
      type: towerType.type,
      icon: towerType.icon,
      name: towerType.name,
      damage: towerType.damage,
      fireRate: towerType.fireRate,
      range: towerType.range,
      radius: 18,
      timer: 0
    });

    if (this.placedTowers.length >= 10) this.unlockAchievement('builder');
    this.addFloatingText(`+1 ${towerType.name}`, x, y - 20, '#00f0ff');
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

  startNewGame() {
    this.resizeCanvas();
    this.citadel.maxHp = 500 + (this.shopUpgrades.hpBonus * 50);
    this.citadel.hp = this.citadel.maxHp;
    
    this.wave = 1;
    this.score = 0;
    this.coins = 400;
    this.xp = 0;
    this.level = 1;
    this.nextLevelXp = 100;
    this.frenzyMeter = 0;
    this.isOverdriveActive = false;
    this.freezeTimer = 0;
    this.quadDamageTimer = 0;
    this.invincibleTimer = 0;

    this.placedTowers = [];
    this.mercenaries = [];
    this.petDrones = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.projectiles = [];
    this.particles = [];
    this.decoys = [];
    this.crates = [];
    this.powerups = [];
    this.floatingTexts = [];

    // Pre-spawn initial starter towers and enemies so screen is immediately active!
    const cx = this.citadel.x || (window.innerWidth / 2);
    const cy = this.citadel.y || (window.innerHeight / 2);

    this.placedTowers.push({
      id: 'vulcan_turret', x: cx - 90, y: cy - 90, level: 1, type: 'bullet', icon: '🔫', name: 'Tourelle Minigun', damage: 15, fireRate: 300, range: 240, radius: 18, timer: 0
    });
    this.placedTowers.push({
      id: 'flame_trap', x: cx + 90, y: cy + 90, level: 1, type: 'fire', icon: '🔥', name: 'Piège Inferno', damage: 6, fireRate: 100, range: 180, radius: 18, timer: 0
    });

    for (let i = 0; i < 4; i++) {
      this.spawnMutant();
    }

    this.initWeapons();
    this.updateHUD();

    const avatarImg = document.getElementById('hero-avatar-img');
    if (avatarImg) avatarImg.src = this.selectedHero.activeSkin === 'alt' && this.selectedHero.altAvatar ? this.selectedHero.altAvatar : this.selectedHero.avatar;

    const heroName = document.getElementById('hero-name-txt');
    if (heroName) heroName.textContent = this.selectedHero.name;

    const btnSkill = document.getElementById('btn-hero-skill');
    if (btnSkill) btnSkill.textContent = `⚡ ${this.selectedHero.abilityName}`;

    this.isGameOver = false;
    this.isPaused = false;

    this.checkGalleryUnlocks();
  }

  gameLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    const timeScale = this.isOverdriveActive ? 0.7 : 1.0;

    if (!this.isPaused && !this.isGameOver) {
      this.update(dt * timeScale);
    }
    
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.quadDamageTimer > 0) this.quadDamageTimer -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

    if (this.abilityCooldownTimer > 0) {
      this.abilityCooldownTimer -= dt;
      if (this.abilityCooldownTimer <= 0) {
        this.abilityCooldownTimer = 0;
        const btn = document.getElementById('btn-hero-skill');
        if (btn) btn.disabled = false;
      } else {
        const btn = document.getElementById('btn-hero-skill');
        if (btn) btn.disabled = true;
      }
    }

    if (this.isOverdriveActive) {
      this.overdriveTimer -= dt;
      if (this.overdriveTimer <= 0) {
        this.isOverdriveActive = false;
        this.frenzyMeter = 0;
      }
    }

    this.updateTurrets(dt);
    this.updatePlacedTowers(dt);
    this.updateMercenaries(dt);
    this.updatePetDrones(dt);
    this.updateSpawns(dt);
    this.updateProjectiles(dt);
    this.updateEnemyBullets(dt);
    this.updateEnemies(dt);
    this.updateDecoys(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateCrates();
    this.updatePowerups();

    if (this.citadel.hp <= 0 && this.invincibleTimer <= 0) {
      this.triggerGameOver();
    }
  }

  updateMercenaries(dt) {
    this.mercenaries.forEach(m => {
      m.timer += dt * 1000;
      if (m.timer >= m.fireRate) {
        const target = this.findTarget(m.x, m.y, m.range);
        if (target) {
          audio.playShoot();
          const angle = Math.atan2(target.y - m.y, target.x - m.x);
          this.projectiles.push({
            x: m.x, y: m.y,
            vx: Math.cos(angle) * 700, vy: Math.sin(angle) * 700,
            damage: m.damage, color: '#f59e0b', radius: 4, type: 'bullet'
          });
          m.timer = 0;
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
      if (d.timer >= 400) {
        const target = this.findTarget(d.x, d.y, 250);
        if (target) {
          audio.playPlasma();
          const angle = Math.atan2(target.y - d.y, target.x - d.x);
          this.projectiles.push({
            x: d.x, y: d.y,
            vx: Math.cos(angle) * 550, vy: Math.sin(angle) * 550,
            damage: 25, color: '#ec4899', radius: 5, type: 'bullet'
          });
          d.timer = 0;
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

      const rate = wp.fireRate * (1 - this.shopUpgrades.fireRateBonus * 0.05);

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
    this.placedTowers.forEach(t => {
      if (t.fireRate === 0) return;
      t.timer += dt * 1000;
      if (t.timer >= t.fireRate) {
        const target = this.findTarget(t.x, t.y, t.range);
        if (target) {
          this.fireTower(t, target);
          t.timer = 0;
        }
      }
    });
  }

  fireTower(t, target) {
    const angle = Math.atan2(target.y - t.y, target.x - t.x);
    const mult = (this.quadDamageTimer > 0 ? 4 : 1) * t.level;

    if (t.type === 'bullet' || t.type === 'saw') {
      audio.playShoot();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 700, vy: Math.sin(angle) * 700, damage: t.damage * mult, color: '#00f0ff', radius: 4, type: 'bullet' });
    } else if (t.type === 'plasma' || t.type === 'missile') {
      audio.playPlasma();
      this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 450, vy: Math.sin(angle) * 450, damage: t.damage * mult, color: '#a855f7', radius: 9, type: 'plasma_mortar', aoe: 70 });
    } else if (t.type === 'rail' || t.type === 'orbital') {
      audio.playRailgun();
      const endX = t.x + Math.cos(angle) * t.range;
      const endY = t.y + Math.sin(angle) * t.range;
      this.particles.push({ type: 'rail_beam', x1: t.x, y1: t.y, x2: endX, y2: endY, life: 0.2, color: '#f59e0b' });
      this.enemies.forEach(e => {
        if (this.distToSegment({ x: e.x, y: e.y }, { x: t.x, y: t.y }, { x: endX, y: endY }) < e.radius + 12) {
          this.damageEnemy(e, t.damage * mult);
        }
      });
    }
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
    const damageMult = (this.quadDamageTimer > 0 ? 4 : 1);

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
      this.enemies.forEach(e => {
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
    if (!this.spawnTimer) this.spawnTimer = 0;
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.35, 2.2 - (this.wave * 0.15));

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

    const isLeviathan = (this.wave >= 15) && (this.enemies.filter(e => e.isLeviathan).length === 0);
    const isBoss = (this.wave % 5 === 0) && (this.enemies.filter(e => e.isBoss).length === 0);
    const type = isLeviathan ? 'leviathan' : (isBoss ? (this.wave >= 10 ? 'carmilla' : 'vespera') : (Math.random() < 0.3 ? 'runner' : (Math.random() < 0.2 ? 'brute' : 'swarmer')));

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
    }

    this.enemies.push({ x, y, hp, maxHp: hp, speed, radius, color, name, isBoss: isBoss || isLeviathan, isLeviathan: type === 'leviathan', type, bulletTimer: 0 });
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'flame') {
        p.life -= dt;
        if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }
      }

      if (p.x < -100 || p.x > this.canvas.width + 100 || p.y < -100 || p.y > this.canvas.height + 100) {
        this.projectiles.splice(i, 1);
        continue;
      }

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
          this.damageEnemy(e, p.damage);

          if (p.type === 'plasma_mortar') {
            audio.playExplosion();
            this.createExplosion(p.x, p.y, p.aoe, p.damage * 0.7);
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

      let targetPos = { x: this.citadel.x, y: this.citadel.y };
      let closestDecoyDist = 9999;

      this.decoys.forEach(d => {
        const dist = Math.hypot(d.x - e.x, d.y - e.y);
        if (dist < closestDecoyDist) { closestDecoyDist = dist; targetPos = { x: d.x, y: d.y }; }
      });

      const angle = Math.atan2(targetPos.y - e.y, targetPos.x - e.x);
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;

      if (e.isBoss) {
        e.bulletTimer += dt;
        if (e.bulletTimer >= (e.isLeviathan ? 0.8 : 1.2)) {
          e.bulletTimer = 0;
          this.fireBossBulletRing(e);
        }
      }

      if (Math.hypot(this.citadel.x - e.x, this.citadel.y - e.y) < this.citadel.radius + e.radius) {
        if (!this.isOverdriveActive && this.invincibleTimer <= 0) {
          const dmg = e.isLeviathan ? 80 : (e.isBoss ? 40 : (e.type === 'brute' ? 20 : 8));
          this.citadel.hp -= dmg;
          audio.playHurtVoice();
          this.addFloatingText(`-${dmg}`, this.citadel.x, this.citadel.y - 30, '#ff2a5f');
          this.updateHUD();
        }
        this.createExplosion(e.x, e.y, 25, 0);
        this.enemies.splice(i, 1);
      }
    }
  }

  fireBossBulletRing(boss) {
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
        this.enemies.forEach(e => {
          if (Math.hypot(e.x - d.x, e.y - d.y) < d.radius + 70) {
            this.damageEnemy(e, 30);
          }
        });
      }

      if (d.life <= 0) {
        this.createExplosion(d.x, d.y, 110, 90);
        this.decoys.splice(i, 1);
      }
    }
  }

  damageEnemy(enemy, amount) {
    enemy.hp -= amount;
    this.addFloatingText(`${Math.round(amount)}`, enemy.x, enemy.y - 15, enemy.color);

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    this.mutantsKilled++;
    this.score += enemy.isLeviathan ? 2000 : (enemy.isBoss ? 600 : 50);

    if (this.mutantsKilled >= 1) this.unlockAchievement('first_blood');
    if (this.wave >= 5) this.unlockAchievement('wave_5');
    if (this.wave >= 10) this.unlockAchievement('wave_10');
    if (enemy.isLeviathan) this.unlockAchievement('wave_15');

    const coinValue = enemy.isBoss ? 100 : (Math.random() < 0.45 ? 10 : 0);
    if (coinValue > 0) {
      this.coins += coinValue;
      this.totalCoinsEarned += coinValue;
      this.addFloatingText(`+${coinValue} 🪙`, enemy.x, enemy.y, '#f59e0b');
    }

    if (Math.random() < 0.08) {
      const pType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      this.powerups.push({ x: enemy.x, y: enemy.y, radius: 16, type: pType });
    }

    if (enemy.isBoss || Math.random() < 0.07) {
      const isRed = enemy.isBoss || Math.random() < 0.25;
      this.crates.push({ x: enemy.x, y: enemy.y, type: isRed ? 'red' : 'blue', radius: 14 });
      audio.playPickup();
    }

    for (let i = 0; i < 8; i++) {
      this.particles.push({ x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, radius: 3 + Math.random() * 4, color: enemy.color, life: 0.4 });
    }

    this.addXp(enemy.isBoss ? 160 : 20);

    if (enemy.isBoss) {
      if (enemy.type === 'vespera') this.triggerBossRecruitModal('vespera');
      if (enemy.type === 'carmilla') this.triggerBossRecruitModal('carmilla');
    }

    this.checkGalleryUnlocks();
    this.updateHUD();
  }

  updatePowerups() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (Math.hypot(this.citadel.x - p.x, this.citadel.y - p.y) < this.citadel.radius + p.radius + (this.shopUpgrades.magnetRange * 20)) {
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
      this.enemies.forEach(e => this.damageEnemy(e, 9999));
    } else if (p.id === 'freeze') {
      audio.playFreeze();
      this.freezeTimer = 5.0;
    } else if (p.id === 'quad') {
      this.quadDamageTimer = 8.0;
    } else if (p.id === 'magnet') {
      this.crates.forEach(c => { c.x = this.citadel.x; c.y = this.citadel.y; });
    } else if (p.id === 'invincible') {
      this.invincibleTimer = 6.0;
    } else if (p.id === 'frenzy') {
      this.frenzyMeter = this.maxFrenzyMeter;
      document.getElementById('frenzy-meter-fill').style.width = '100%';
    }
  }

  addXp(amount) {
    this.xp += amount;
    if (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.level++;
      this.nextLevelXp = Math.round(this.nextLevelXp * 1.3);
      audio.playPickup();
      this.triggerLevelUpModal();
    }
  }

  updateCrates() {
    for (let i = this.crates.length - 1; i >= 0; i--) {
      const c = this.crates[i];
      if (Math.hypot(this.citadel.x - c.x, this.citadel.y - c.y) < this.citadel.radius + c.radius + (this.shopUpgrades.magnetRange * 20)) {
        audio.playPickup();
        if (c.type === 'red') this.triggerEvolutionModal();
        else this.triggerLevelUpModal();
        this.crates.splice(i, 1);
      }
    }
  }

  triggerHeroAbility() {
    if (this.abilityCooldownTimer > 0 || this.isPaused) return;

    audio.playAbility();
    audio.playSensualMoan();
    this.abilityCooldownTimer = this.selectedHero.cooldown;
    this.decoysDeployedCount++;

    const angle = Math.random() * Math.PI * 2;
    this.decoys.push({ x: this.citadel.x + Math.cos(angle) * 120, y: this.citadel.y + Math.sin(angle) * 120, radius: 22, life: 9, heroId: this.selectedHero.id });

    this.checkGalleryUnlocks();
  }

  triggerOverdrive() {
    if (this.frenzyMeter < this.maxFrenzyMeter || this.isOverdriveActive) return;

    audio.playOverdrive();
    audio.playSensualMoan();
    this.isOverdriveActive = true;
    this.overdriveTimer = 6.0;
    this.overdriveCount++;

    if (this.overdriveCount >= 3) this.unlockAchievement('frenzy_master');

    this.addFloatingText('🔥 OVERDRIVE FRÉNÉSIE ACTIVÉ !', this.citadel.x, this.citadel.y - 70, '#f59e0b');
    this.unlockGalleryItem('selene');
  }

  // --- Sub-Modals Handlers --- //

  openBiolabModal() {
    this.isPaused = true;
    const modal = document.getElementById('biolab-modal');
    if (!modal) return;
    document.getElementById('biolab-coins-txt').textContent = `${this.coins} 🪙`;

    document.getElementById('btn-buy-pet-1').onclick = () => {
      if (this.coins >= 150) {
        this.coins -= 150;
        this.petDrones.push({ angle: 0, timer: 0, name: 'Mini-Succube' });
        audio.playPickup();
        audio.playSensualMoan();
        this.addFloatingText('🧪 PET DRONE MINI-SUCCUBE ADOPTÉ !', this.citadel.x, this.citadel.y - 60, '#ec4899');
        this.openBiolabModal();
        this.updateHUD();
      }
    };
    modal.classList.add('active');
  }

  openTowerInfinitumModal() {
    this.isPaused = true;
    const modal = document.getElementById('tower-infinitum-modal');
    if (!modal) return;
    document.getElementById('tower-floor-txt').textContent = `Étage ${this.towerFloor} / 100`;

    document.getElementById('btn-start-floor').onclick = () => {
      this.towerFloor++;
      this.wave = this.towerFloor;
      modal.classList.remove('active');
      this.isPaused = false;
      this.addFloatingText(`🌀 ÉTAGE ${this.towerFloor} DE LA TOUR INFINITUM !`, this.citadel.x, this.citadel.y - 60, '#a855f7');
      this.updateHUD();
    };
    modal.classList.add('active');
  }

  openMercenaryModal() {
    this.isPaused = true;
    const modal = document.getElementById('mercenary-guild-modal');
    if (!modal) return;
    document.getElementById('mercs-coins-txt').textContent = `${this.coins} 🪙`;

    document.getElementById('btn-hire-ray').onclick = () => {
      if (this.coins >= 120) {
        this.coins -= 120;
        this.mercenaries.push({ x: 100, y: 100, damage: 25, fireRate: 400, range: 300, timer: 0, name: 'Ray' });
        audio.playPickup();
        this.addFloatingText('💥 MERCENAIRE RAY ENGAGÉ !', this.citadel.x, this.citadel.y - 60, '#f59e0b');
        this.openMercenaryModal();
        this.updateHUD();
      }
    };
    modal.classList.add('active');
  }

  openPhotoStudioModal() {
    this.isPaused = true;
    const modal = document.getElementById('photo-studio-modal');
    if (!modal) return;

    const hero = this.selectedHero;
    const imgSrc = hero.activeSkin === 'alt' && hero.altAvatar ? hero.altAvatar : hero.avatar;
    document.getElementById('studio-preview-img').src = imgSrc;
    document.getElementById('studio-hero-title').textContent = hero.name;

    modal.classList.add('active');
  }

  openHaremModal() {
    this.isPaused = true;
    const modal = document.getElementById('harem-lounge-modal');
    const container = document.getElementById('harem-grid-container');
    if (!modal || !container) return;
    container.innerHTML = '';

    Object.values(HERO_CLASSES).forEach(hero => {
      if (hero.unlocked === false) return;
      const card = document.createElement('div');
      card.className = 'harem-card';
      card.innerHTML = `<img src="${hero.avatar}" alt="${hero.name}"><h4 style="color:#ec4899;">${hero.name}</h4><p style="font-size:0.75rem; color:#94a3b8;">Affinité: Rang ${hero.affinityLvl || 1}</p><button class="btn-primary" style="margin-top:8px; padding:4px 10px; font-size:0.75rem;">Offrir un Cadeau (50 🪙)</button>`;
      card.querySelector('button').onclick = () => {
        if (this.coins >= 50) {
          this.coins -= 50; hero.affection = (hero.affection || 0) + 1; hero.affinityLvl = Math.min(5, (hero.affinityLvl || 1) + 1);
          audio.playSensualMoan(); this.unlockAchievement('harem_lover'); this.saveProgress(); this.openHaremModal(); this.updateHUD();
        }
      };
      container.appendChild(card);
    });
    modal.classList.add('active');
  }

  openSlotMachineModal() {
    this.isPaused = true;
    const modal = document.getElementById('slot-machine-modal');
    if (!modal) return;
    document.getElementById('slot-coins-txt').textContent = `${this.coins} 🪙`;

    document.getElementById('btn-spin-slot').onclick = () => {
      if (this.coins < 25) { audio.playHurtVoice(); return; }
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
        this.coins += 200; audio.playPickup(); document.getElementById('slot-res-txt').textContent = '🎉 JACKPOT ! +200 BIO-COINS !';
      } else {
        document.getElementById('slot-res-txt').textContent = 'Réessayez votre chance !';
      }
      document.getElementById('slot-coins-txt').textContent = `${this.coins} 🪙`;
      this.updateHUD();
    };
    modal.classList.add('active');
  }

  openAchievementsModal() {
    this.isPaused = true;
    const modal = document.getElementById('achievements-modal');
    const container = document.getElementById('achievements-list-container');
    if (!modal || !container) return;
    container.innerHTML = '';

    ACHIEVEMENTS.forEach(a => {
      const card = document.createElement('div');
      card.className = `achieve-card ${a.unlocked ? 'unlocked' : ''}`;
      card.innerHTML = `<div><h4 style="color: ${a.unlocked ? '#f59e0b' : '#fff'};">${a.name} ${a.unlocked ? '🏆' : '🔒'}</h4><p style="font-size:0.8rem; color:#94a3b8;">${a.desc}</p></div><div style="font-weight:bold; color:#f59e0b;">+${a.reward} 🪙</div>`;
      container.appendChild(card);
    });
    modal.classList.add('active');
  }

  unlockAchievement(id) {
    const a = ACHIEVEMENTS.find(item => item.id === id);
    if (a && !a.unlocked) {
      a.unlocked = true; this.coins += a.reward; audio.playPickup();
      this.addFloatingText(`🏆 SUCCÈS DÉBLOQUÉ: ${a.name} (+${a.reward} 🪙)!`, this.citadel.x, this.citadel.y - 80, '#f59e0b');
      this.saveProgress();
    }
  }

  triggerBossRecruitModal(bossId) {
    this.isPaused = true;
    const modal = document.getElementById('boss-recruit-modal');
    if (!modal) return;
    const hero = HERO_CLASSES[bossId]; if (!hero) return;

    document.getElementById('recruit-boss-name').textContent = hero.name;
    document.getElementById('recruit-boss-img').src = hero.avatar;

    document.getElementById('btn-recruit-yes').onclick = () => {
      hero.unlocked = true; this.unlockGalleryItem(bossId); this.unlockAchievement('recruiter'); this.saveProgress();
      audio.playSensualMoan(); modal.classList.remove('active'); this.isPaused = false; this.renderClassCards();
    };
    modal.classList.add('active');
  }

  openWardrobeModal() {
    this.isPaused = true;
    const modal = document.getElementById('wardrobe-modal');
    const container = document.getElementById('skin-options-container');
    if (!modal || !container) return;
    container.innerHTML = '';

    Object.values(HERO_CLASSES).forEach(hero => {
      if (hero.unlocked === false) return;
      const cardDefault = document.createElement('div');
      cardDefault.className = `skin-card ${hero.activeSkin !== 'alt' ? 'active' : ''}`;
      cardDefault.innerHTML = `<img src="${hero.avatar}" alt="${hero.name}"><h4>${hero.name} (Armure Classique)</h4>`;
      cardDefault.onclick = () => { hero.activeSkin = 'default'; this.saveProgress(); this.openWardrobeModal(); this.startNewGame(); };
      container.appendChild(cardDefault);

      if (hero.altAvatar) {
        const cardAlt = document.createElement('div');
        cardAlt.className = `skin-card ${hero.activeSkin === 'alt' ? 'active' : ''}`;
        cardAlt.innerHTML = `<img src="${hero.altAvatar}" alt="${hero.name} Alt"><h4 style="color: #ec4899;">${hero.name} (Tenue Alt +18)</h4>`;
        cardAlt.onclick = () => { hero.activeSkin = 'alt'; this.saveProgress(); this.openWardrobeModal(); this.startNewGame(); };
        container.appendChild(cardAlt);
      }
    });
    modal.classList.add('active');
  }

  renderClassCards() {
    const grid = document.querySelector('.hero-select-grid'); if (!grid) return;
    grid.innerHTML = '';

    Object.values(HERO_CLASSES).forEach(hero => {
      if (hero.unlocked === false) return;
      const card = document.createElement('div');
      card.className = `class-card ${hero.id === this.selectedHero.id ? 'selected' : ''}`;
      card.dataset.hero = hero.id;
      const avatarSrc = hero.activeSkin === 'alt' && hero.altAvatar ? hero.altAvatar : hero.avatar;
      card.innerHTML = `<img src="${avatarSrc}" alt="${hero.name}"><h3>${hero.name}</h3><p>${hero.abilityDesc}</p>`;
      card.addEventListener('click', () => {
        document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected'); this.selectedHero = hero;
      });
      grid.appendChild(card);
    });
  }

  triggerLevelUpModal() {
    this.isPaused = true;
    const modal = document.getElementById('level-up-modal');
    const container = document.getElementById('upgrade-options-container');
    if (!modal || !container) return;
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
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `<div class="upgrade-info"><div class="upgrade-icon">${opt.icon}</div><div class="upgrade-text"><h4>${opt.title}</h4><p>${opt.desc}</p></div></div>`;
      card.addEventListener('click', () => {
        if (opt.type === 'weapon') { opt.wp.level++; this.updateWeaponsHUD(); }
        else if (opt.type === 'heal') { this.citadel.hp = Math.min(this.citadel.maxHp, this.citadel.hp + 200); }
        modal.classList.remove('active'); this.isPaused = false; this.updateHUD();
      });
      container.appendChild(card);
    });
    modal.classList.add('active');
  }

  triggerEvolutionModal() {
    this.isPaused = true;
    const modal = document.getElementById('level-up-modal');
    const container = document.getElementById('upgrade-options-container');
    if (!modal || !container) return;
    container.innerHTML = '';

    const evolvable = Object.values(this.weapons).filter(w => w.level >= w.maxLevel && !w.isEvolved);
    if (evolvable.length === 0) { this.triggerLevelUpModal(); return; }

    const targetWp = evolvable[0];
    const card = document.createElement('div');
    card.className = 'upgrade-card evolution';
    card.innerHTML = `<div class="upgrade-info"><div class="upgrade-icon">🔥</div><div class="upgrade-text"><h4 style="color: #f59e0b;">ÉVOLUTION SUPER-ARME : ${targetWp.evolutionName}</h4><p>${targetWp.evolutionDesc}</p></div></div>`;
    card.addEventListener('click', () => {
      targetWp.isEvolved = true; targetWp.name = targetWp.evolutionName; targetWp.damage *= 2.5;
      this.evolvedWeaponsCount++; this.unlockAchievement('super_weapon'); this.updateWeaponsHUD(); this.checkGalleryUnlocks();
      modal.classList.remove('active'); this.isPaused = false;
    });

    container.appendChild(card);
    modal.classList.add('active');
  }

  openShopModal() {
    this.isPaused = true;
    const modal = document.getElementById('shop-modal'); if (!modal) return;
    document.getElementById('shop-coins-txt').textContent = `${this.coins} 🪙`;

    document.getElementById('buy-hp-btn').onclick = () => {
      if (this.coins >= 50) {
        this.coins -= 50; this.shopUpgrades.hpBonus++; this.citadel.maxHp += 50; this.citadel.hp += 50;
        this.saveProgress(); this.openShopModal();
      }
    };
    document.getElementById('buy-rate-btn').onclick = () => {
      if (this.coins >= 50) {
        this.coins -= 50; this.shopUpgrades.fireRateBonus++;
        this.saveProgress(); this.openShopModal();
      }
    };
    modal.classList.add('active');
  }

  openGalleryModal() {
    this.isPaused = true; this.checkGalleryUnlocks(); this.renderGallery();
    const modal = document.getElementById('gallery-modal'); if (modal) modal.classList.add('active');
  }

  checkGalleryUnlocks() {
    if (this.wave >= 3) this.unlockGalleryItem('aria');
    if (this.decoysDeployedCount >= 3) this.unlockGalleryItem('kira');
    if (this.evolvedWeaponsCount >= 1) this.unlockGalleryItem('rin');
    if (this.totalCoinsEarned >= 500) this.unlockGalleryItem('nova');
    this.saveProgress();
  }

  unlockGalleryItem(id) {
    const item = GALLERY_ITEMS.find(i => i.id === id);
    if (item && !item.unlocked) {
      item.unlocked = true; audio.playPickup(); audio.playSensualMoan();
      this.addFloatingText(`🌟 ARCHIVE DÉBLOQUÉE: ${item.name}!`, this.citadel.x, this.citadel.y - 60, '#f59e0b');
    }
  }

  renderGallery() {
    const grid = document.getElementById('gallery-grid-container'); if (!grid) return;
    grid.innerHTML = '';

    GALLERY_ITEMS.forEach(item => {
      const card = document.createElement('div');
      card.className = `gallery-card ${item.unlocked ? 'unlocked' : ''}`;
      const imgSrc = (HERO_CLASSES[item.id] && HERO_CLASSES[item.id].activeSkin === 'alt' && item.altImg) ? item.altImg : item.img;
      card.innerHTML = `<img src="${imgSrc}" alt="${item.name}"><div class="gallery-lock-overlay"><div style="font-size: 2rem;">🔒</div><div style="font-weight:700;">${item.name}</div><div style="font-size:0.75rem;">Unlock: ${item.unlockReq}</div></div><div class="gallery-title-tag">${item.name}</div>`;
      if (item.unlocked) { card.addEventListener('click', () => this.openCgStoryViewer(item)); }
      grid.appendChild(card);
    });
  }

  openCgStoryViewer(item) {
    const modal = document.getElementById('cg-viewer-modal'); if (!modal) return;

    const imgSrc = (HERO_CLASSES[item.id] && HERO_CLASSES[item.id].activeSkin === 'alt' && item.altImg) ? item.altImg : item.img;
    document.getElementById('cg-viewer-img').src = imgSrc;
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
    modal.classList.add('active');
  }

  triggerGameOver() {
    this.isGameOver = true;
    document.getElementById('go-wave-txt').textContent = this.wave;
    document.getElementById('go-kills-txt').textContent = this.mutantsKilled;
    document.getElementById('go-coins-txt').textContent = this.coins;
    const modal = document.getElementById('game-over-modal'); if (modal) modal.classList.add('active');
  }

  // --- Rendering Canvas Engine --- //

  render() {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width || window.innerWidth || 1200;
    const h = this.canvas.height || window.innerHeight || 800;

    // Fill Canvas background with deep space dark blue radial theme
    this.ctx.fillStyle = '#0a0f1d';
    this.ctx.fillRect(0, 0, w, h);

    // Draw Cyberpunk Animated Grid
    this.gridOffset = (this.gridOffset + 0.4) % 40;
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
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
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fill();
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.font = '16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(t.icon, t.x, t.y);

      this.ctx.font = 'bold 9px Rajdhani';
      this.ctx.fillStyle = '#00f0ff';
      this.ctx.fillText(`L${t.level}`, t.x + 12, t.y + 12);
      this.ctx.restore();
    });

    // Render Decoys
    this.decoys.forEach(d => {
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.radius + Math.sin(Date.now() * 0.01) * 4, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      this.ctx.fill();
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
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

    // Render Enemies
    this.enemies.forEach(e => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = e.color;
      this.ctx.shadowColor = e.color;
      this.ctx.shadowBlur = e.isBoss ? 30 : 8;
      this.ctx.fill();

      if (e.hp < e.maxHp) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(e.x - 20, e.y - e.radius - 12, 40, 5);
        this.ctx.fillStyle = e.color;
        this.ctx.fillRect(e.x - 20, e.y - e.radius - 12, 40 * (e.hp / e.maxHp), 5);
      }
      this.ctx.restore();
    });

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
    this.particles.forEach((p, idx) => {
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
        p.life -= 0.02;
        if (p.life <= 0) this.particles.splice(idx, 1);
      } else {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        this.ctx.restore();
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.life -= 0.016;
        if (p.life <= 0) this.particles.splice(idx, 1);
      }
    });

    // Render Floating Text
    this.floatingTexts.forEach((t, idx) => {
      this.ctx.save();
      this.ctx.font = 'bold 15px Rajdhani';
      this.ctx.fillStyle = t.color;
      this.ctx.fillText(t.text, t.x, t.y);
      this.ctx.restore();
      t.y -= 1;
      t.life -= 0.016;
      if (t.life <= 0) this.floatingTexts.splice(idx, 1);
    });
  }

  createExplosion(x, y, radius, damage) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      this.particles.push({ x, y, vx: Math.cos(angle) * radius * 3, vy: Math.sin(angle) * radius * 3, radius: 4, color: '#a855f7', life: 0.3 });
    }
    if (damage > 0) {
      this.enemies.forEach(e => {
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
    const score = document.getElementById('hud-score-txt'); if (score) score.textContent = this.score;

    const hpPct = Math.max(0, (this.citadel.hp / this.citadel.maxHp) * 100);
    const hpFill = document.getElementById('citadel-hp-fill'); if (hpFill) hpFill.style.width = `${hpPct}%`;
    const hpTxt = document.getElementById('citadel-hp-txt'); if (hpTxt) hpTxt.textContent = `${Math.round(this.citadel.hp)} / ${this.citadel.maxHp}`;

    const affFill = document.getElementById('affinity-meter-fill'); if (affFill) affFill.style.width = `${((this.affinityXp / this.nextAffinityXp) * 100)}%`;
    const affLvl = document.getElementById('affinity-lvl-txt'); if (affLvl) affLvl.textContent = `Rang ${this.selectedHero.affinityLvl || 1}`;
  }

  updateWeaponsHUD() {
    const container = document.getElementById('hud-weapons-container'); if (!container) return;
    container.innerHTML = '';
    Object.values(this.weapons).forEach(wp => {
      if (wp.level > 0) {
        const card = document.createElement('div');
        card.className = `weapon-card active ${wp.isEvolved ? 'evolved' : ''}`;
        card.innerHTML = `<div class="icon">${wp.icon}</div><div class="lvl">${wp.isEvolved ? 'MAX' : `L${wp.level}`}</div>`;
        container.appendChild(card);
      }
    });
  }
}

let game;
function bootGame() {
  if (!game) {
    game = new GameEngine();
    window.game = game;
    game.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
