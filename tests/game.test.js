'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const GAME_SOURCE = fs.readFileSync(path.join(ROOT, 'game.v9.js'), 'utf8');
const VN_SOURCE = fs.readFileSync(path.join(ROOT, 'vn-scenes.v1.js'), 'utf8');
const CHARACTER_SOURCE = fs.readFileSync(path.join(ROOT, 'characters.v1.js'), 'utf8');
const VN_EXPANSION_SOURCE = fs.readFileSync(path.join(ROOT, 'vn-expansion.v1.js'), 'utf8');
const ADULT_SCENES_SOURCE = fs.readFileSync(path.join(ROOT, 'adult-scenes.v1.js'), 'utf8');
const EXPANSION_SOURCE = fs.readFileSync(path.join(ROOT, 'expansion.v1.js'), 'utf8');

function createClassList() {
  const values = new Set();
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) {
      if (force === true) values.add(name);
      else if (force === false) values.delete(name);
      else if (values.has(name)) values.delete(name);
      else values.add(name);
      return values.has(name);
    }
  };
}

function createElement(tagName = 'div') {
  const style = {
    setProperty(name, value) { this[name] = String(value); },
    removeProperty(name) { delete this[name]; }
  };
  return {
    tagName: String(tagName).toUpperCase(),
    classList: createClassList(),
    dataset: {},
    style,
    children: [],
    textContent: '',
    innerHTML: '',
    disabled: false,
    inert: false,
    appendChild(child) { this.children.push(child); return child; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = [...children]; },
    addEventListener() {},
    setAttribute(name, value) { this[name] = String(value); },
    getAttribute(name) { return this[name] ?? null; },
    hasAttribute(name) { return Object.hasOwn(this, name); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    focus() {},
    closest() { return null; }
  };
}

function loadGameModule(seed = {}) {
  const stored = new Map(Object.entries(seed));
  const localStorage = {
    getItem(key) { return stored.has(key) ? stored.get(key) : null; },
    setItem(key, value) { stored.set(key, String(value)); },
    removeItem(key) { stored.delete(key); },
    clear() { stored.clear(); }
  };

  const document = {
    readyState: 'loading',
    activeElement: null,
    body: createElement('body'),
    addEventListener() {},
    createElement,
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };

  const window = {
    innerWidth: 1200,
    innerHeight: 800,
    addEventListener() {},
    removeEventListener() {}
  };
  const navigator = {
    getGamepads() { return []; }
  };

  const audio = new Proxy(
    { currentStation: 'synthwave' },
    {
      get(target, property) {
        if (property in target) return target[property];
        return () => {};
      }
    }
  );

  const sandbox = {
    console,
    document,
    window,
    navigator,
    localStorage,
    audio,
    requestAnimationFrame() {},
    cancelAnimationFrame() {},
    setTimeout,
    clearTimeout,
    HTMLInputElement: class HTMLInputElement {},
    HTMLSelectElement: class HTMLSelectElement {}
  };
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);
  const exportHook = `
    ;globalThis.__INFERNAL_CITY_TEST__ = {
      GameEngine,
      EXPANSION,
      CHARACTER_EXPANSION,
      ADULT_SCENES,
      SAVE_VERSION,
      CAMPAIGN_FINAL_WAVE,
      BATTLEFIELD_APPROACH_MARGIN,
      DEFENSE_MIN_SCREEN_HIT_DIAMETER,
      DIFFICULTY_DATA,
      TOWER_TYPES,
      POWERUP_TYPES,
      DEFENSE_MAX_LEVEL,
      DEFENSE_SELL_RATIO,
      LOOT_CONFIG,
      TOWER_SPRITE_DATA,
      ENEMY_SPRITE_DATA,
      HERO_SPRITE_DATA,
      FLOOR_TEXTURE_SRC,
      COASTLINE_IMAGE_SRC,
      VN_NARRATIVE_CGS,
      WEAPONS_DATA,
      HERO_CLASSES,
      ACHIEVEMENTS,
      GALLERY_ITEMS
    };
  `;
  vm.runInContext(EXPANSION_SOURCE, context, { filename: 'expansion.v1.js' });
  vm.runInContext(VN_SOURCE, context, { filename: 'vn-scenes.v1.js' });
  vm.runInContext(CHARACTER_SOURCE, context, { filename: 'characters.v1.js' });
  vm.runInContext(VN_EXPANSION_SOURCE, context, { filename: 'vn-expansion.v1.js' });
  vm.runInContext(ADULT_SCENES_SOURCE, context, { filename: 'adult-scenes.v1.js' });
  vm.runInContext(`${GAME_SOURCE}\n${exportHook}`, context, { filename: 'game.v9.js' });

  return {
    ...context.__INFERNAL_CITY_TEST__,
    localStorage,
    stored,
    audio,
    document,
    window,
    navigator
  };
}

function createEngine(GameEngine) {
  const engine = new GameEngine();
  engine.canvas = {
    width: 1200,
    height: 800,
    getContext() { return null; },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 1200, height: 800 };
    }
  };
  engine.worldWidth = 1200;
  engine.worldHeight = 800;
  engine.citadel = { x: 600, y: 400, radius: 45, hp: 500, maxHp: 500 };
  engine.updateHUD = () => {};
  engine.updateWeaponsHUD = () => {};
  engine.showFeedback = () => {};
  engine.announce = () => {};
  engine.addFloatingText = () => {};
  return engine;
}

function installCameraInputHarness(engine, document, options = {}) {
  const width = options.width || 1200;
  const height = options.height || 800;
  const listeners = new Map();
  const capturedPointers = new Set();
  const canvas = {
    width,
    height,
    tabIndex: 0,
    classList: createClassList(),
    dataset: {},
    setAttribute() {},
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width, height };
    },
    setPointerCapture(pointerId) {
      capturedPointers.add(pointerId);
    },
    hasPointerCapture(pointerId) {
      return capturedPointers.has(pointerId);
    },
    releasePointerCapture(pointerId) {
      capturedPointers.delete(pointerId);
    },
    focus() {}
  };

  engine.canvas = canvas;
  engine.isPaused = false;
  engine.isGameOver = false;
  document.getElementById = () => null;
  engine.bindEvents();

  return {
    canvas,
    dispatch(type, overrides = {}) {
      const callback = listeners.get(type);
      assert.ok(callback, `Ecouteur camera absent: ${type}`);
      const event = {
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        clientX: width / 2,
        clientY: height / 2,
        preventDefault() {},
        ...overrides
      };
      callback(event);
      return event;
    }
  };
}

test('toutes les methodes this.* appelees existent sur GameEngine', () => {
  const declarations = new Set(
    [...GAME_SOURCE.matchAll(/^  ([A-Za-z_$][A-Za-z0-9_$]*)\([^;\n]*\) \{/gm)]
      .map(match => match[1])
  );
  const calls = new Set(
    [...GAME_SOURCE.matchAll(/\bthis\.([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)]
      .map(match => match[1])
  );
  const missing = [...calls].filter(name => !declarations.has(name)).sort();

  assert.deepEqual(missing, [], `Methodes manquantes: ${missing.join(', ')}`);
});

test('chaque arme possede des donnees completes pour son evolution', () => {
  const { WEAPONS_DATA } = loadGameModule();
  const weapons = Object.values(WEAPONS_DATA);

  assert.equal(weapons.length, 4);
  weapons.forEach(weapon => {
    assert.match(weapon.evolutionName, /\S/, `${weapon.id}: nom d'evolution absent`);
    assert.match(weapon.evolutionDesc, /\S/, `${weapon.id}: description d'evolution absente`);
    assert.ok(weapon.maxLevel >= weapon.level, `${weapon.id}: niveaux incoherents`);
  });
});

test('les archetypes ennemis et les dix Trones possedent un sprite OpenAI local', () => {
  const { ENEMY_SPRITE_DATA, CHARACTER_EXPANSION } = loadGameModule();
  const expectedTypes = [
    'swarmer', 'runner', 'brute', 'flying', 'bulwark', 'artillery',
    'splitter', 'vespera', 'carmilla', 'hellwarden', 'leviathan',
    ...CHARACTER_EXPANSION.bossIds
  ];

  assert.deepEqual(Object.keys(ENEMY_SPRITE_DATA).sort(), expectedTypes.sort());
  Object.values(ENEMY_SPRITE_DATA).forEach(sprite => {
    assert.match(
      sprite.src,
      /^(?:assets\/animations\/enemies\/enemy-(?:atlas-\d+|specialist-atlas)|assets\/characters\/villains\/[a-z-]+-atlas-v1)\.png$/
    );
    assert.ok(Number.isInteger(sprite.row) && sprite.row >= 0 && sprite.row < 4);
    assert.ok(sprite.size >= 34);
    const assetPath = path.join(ROOT, sprite.src);
    assert.ok(fs.existsSync(assetPath), `${sprite.src} doit exister`);
    assert.ok(fs.statSync(assetPath).size > 10_000, `${sprite.src} doit contenir un vrai bitmap`);
  });
});

test('les 20 tours sont couvertes par un comportement actif, declenche ou passif', () => {
  const { GameEngine, TOWER_TYPES } = loadGameModule();
  const towers = Object.values(TOWER_TYPES);
  const directTypes = new Set([
    'bullet', 'saw', 'plasma', 'missile', 'rail', 'orbital', 'fire',
    'tesla', 'cryo', 'acid', 'drone', 'gravity', 'siphon', 'emp', 'sonic'
  ]);
  const triggerTypes = new Set(['mine', 'napalm']);
  const passiveTypes = new Set(['barrier', 'magnet', 'shrine']);
  const supportedTypes = new Set([...directTypes, ...triggerTypes, ...passiveTypes]);

  assert.equal(towers.length, 20);
  assert.deepEqual(
    [...new Set(towers.map(tower => tower.type))].sort(),
    [...supportedTypes].sort(),
    'Un type de tour n’est rattache a aucun comportement'
  );

  towers.filter(tower => directTypes.has(tower.type)).forEach(towerData => {
    const engine = createEngine(GameEngine);
    const target = {
      x: 100, y: 0, radius: 12, hp: 1000, dead: false,
      stunTimer: 0, slowTimer: 0
    };
    const damageEvents = [];
    engine.enemies = [target];
    engine.projectiles = [];
    engine.particles = [];
    engine.damageEnemy = (enemy, amount) => damageEvents.push({ enemy, amount });

    engine.fireTower(
      { ...towerData, x: 0, y: 0, level: 1, timer: 0, radius: 18 },
      target
    );

    const hasEffect = engine.projectiles.length > 0
      || engine.particles.length > 0
      || damageEvents.length > 0
      || target.stunTimer > 0
      || target.slowTimer > 0;
    assert.ok(hasEffect, `${towerData.id}: aucun effet actif observable`);
  });

  towers.filter(tower => triggerTypes.has(tower.type)).forEach(towerData => {
    const engine = createEngine(GameEngine);
    const target = { x: 0, y: 0, radius: 12, dead: false };
    let explosions = 0;
    engine.enemies = [target];
    engine.placedTowers = [
      { ...towerData, x: 0, y: 0, level: 1, timer: 0, radius: 18 }
    ];
    engine.findTarget = () => target;
    engine.createExplosion = () => { explosions++; };

    engine.updatePlacedTowers(0.1);

    assert.equal(engine.placedTowers.length, 0, `${towerData.id}: le piege ne se consume pas`);
    assert.equal(explosions, 1, `${towerData.id}: la detonation est absente`);
    if (towerData.type === 'napalm') {
      assert.equal(engine.hazards.length, 1, 'La mine napalm ne laisse pas de zone persistante');
    }
  });

  const passiveEngine = createEngine(GameEngine);
  let passiveShots = 0;
  passiveEngine.fireTower = () => { passiveShots++; };
  passiveEngine.placedTowers = towers
    .filter(tower => passiveTypes.has(tower.type))
    .map(tower => ({
      ...tower, x: 0, y: 0, level: 1, timer: 9999, radius: 18,
      hp: tower.hp || 180, maxHp: tower.hp || 180
    }));
  passiveEngine.updatePlacedTowers(10);
  assert.equal(passiveShots, 0, 'Une tour passive tente de tirer');
  assert.equal(passiveEngine.placedTowers.length, 3);

  assert.ok(
    passiveEngine.isInsideMagnetField({ x: 100, y: 0 }),
    'Le drone magnetique n’attire pas les collectables dans sa portee'
  );
  assert.ok(
    passiveEngine.getShrineDamageMultiplier() > 1,
    'L’autel ne fournit aucun bonus'
  );

  const barrier = passiveEngine.placedTowers.find(tower => tower.type === 'barrier');
  barrier.x = 50;
  barrier.y = 50;
  barrier.hp = 100;
  passiveEngine.citadel = { x: 600, y: 400, radius: 45, hp: 500, maxHp: 500 };
  passiveEngine.enemies = [{
    x: 50, y: 50, hp: 100, speed: 0, radius: 12, type: 'swarmer',
    isBoss: false, isLeviathan: false, dead: false,
    stunTimer: 0, slowTimer: 0, bulletTimer: 0
  }];
  passiveEngine.createExplosion = () => {};
  passiveEngine.updateEnemies(0.016);
  assert.equal(passiveEngine.enemies.length, 1, 'La barriere ne doit plus supprimer gratuitement un ennemi');
  assert.ok(passiveEngine.enemies[0].contactTimer > 0, 'L’ennemi doit marquer une pause avant sa prochaine attaque');
  assert.equal(barrier.hp, 76, 'La barriere n’absorbe pas les degats attendus');
});

test('la bombe nucleaire traite tous les ennemis meme si chaque impact retire une cible', () => {
  const { GameEngine, POWERUP_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);
  const hitIds = [];
  engine.enemies = Array.from({ length: 11 }, (_, index) => ({
    id: index,
    hp: 1,
    dead: false
  }));
  engine.damageEnemy = enemy => {
    hitIds.push(enemy.id);
    const index = engine.enemies.indexOf(enemy);
    if (index >= 0) engine.enemies.splice(index, 1);
  };

  const nuke = POWERUP_TYPES.find(powerup => powerup.id === 'nuke');
  engine.activatePowerup(nuke);

  assert.deepEqual(hitIds.sort((a, b) => a - b), [...Array(11).keys()]);
  assert.equal(engine.enemies.length, 0);
});

test('une flamme ne frappe chaque cible qu’une fois et un boss reste au contact', () => {
  const { GameEngine } = loadGameModule();
  const flameEngine = createEngine(GameEngine);
  const target = { x: 100, y: 100, radius: 20, hp: 100, dead: false };
  flameEngine.enemies = [target];
  flameEngine.projectiles = [{
    x: 100, y: 100, vx: 0, vy: 0, radius: 8, damage: 10,
    life: 1, type: 'flame'
  }];
  flameEngine.damageEnemy = (enemy, amount) => { enemy.hp -= amount; };

  flameEngine.updateProjectiles(0.01);
  flameEngine.updateProjectiles(0.01);
  assert.equal(target.hp, 90, 'Une flamme persistante ne doit pas redommager la meme cible');

  const bossEngine = createEngine(GameEngine);
  bossEngine.enemies = [{
    x: 600, y: 400, hp: 1000, speed: 0, radius: 42, type: 'hellwarden',
    isBoss: true, isLeviathan: false, dead: false,
    stunTimer: 0, slowTimer: 0, bulletTimer: 0, contactTimer: 0
  }];
  bossEngine.createExplosion = () => {};
  bossEngine.fireBossBulletRing = () => {};
  bossEngine.updateEnemies(0.1);

  assert.equal(bossEngine.enemies.length, 1, 'Un boss ne doit pas disparaitre apres un impact');
  assert.equal(bossEngine.citadel.hp, 460);
});

test('les niveaux gagnes en rafale sont conserves dans une file de choix', () => {
  const { GameEngine } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.xp = 90;
  engine.nextLevelXp = 100;
  engine.level = 1;
  engine.pendingLevelChoices = 0;
  engine.triggerLevelUpModal = () => {};

  engine.addXp(400);

  assert.equal(engine.level, 4);
  assert.equal(engine.pendingLevelChoices, 3);
  assert.equal(engine.xp, 91);
});

test('la sauvegarde restaure metaprogression, heroine choisie et relation', () => {
  const module = loadGameModule();
  const {
    GameEngine, HERO_CLASSES, localStorage
  } = module;
  const first = createEngine(GameEngine);
  const kira = HERO_CLASSES.kira;
  const maris = HERO_CLASSES.maris;

  first.metaCoins = 777;
  first.totalCoinsEarned = 3210;
  first.towerFloor = 42;
  first.shopUpgrades = { hpBonus: 3, fireRateBonus: 4, magnetRange: 2 };
  first.selectedHero = kira;
  kira.activeSkin = 'alt';
  kira.affinityLvl = 4;
  kira.relationshipXp = 23;
  kira.romanceOptIn = true;
  kira.privateMomentUnlocked = true;
  maris.unlocked = true;
  maris.activeSkin = 'alt';
  maris.affinityLvl = 3;
  maris.relationshipXp = 17;
  maris.romanceOptIn = true;
  maris.privateMomentUnlocked = true;
  first.saveProgress();

  const rawSave = JSON.parse(localStorage.getItem('valkyrie_sweeper_save'));
  assert.equal(rawSave.version, 8);
  assert.equal(rawSave.metaCoins, 777);
  assert.equal(rawSave.characterProgress.kira.affinityLvl, 4);
  assert.ok(rawSave.unlockedHeroIds.includes('maris'));
  assert.equal(rawSave.characterProgress.maris.romanceOptIn, true);

  kira.activeSkin = 'default';
  kira.affinityLvl = 1;
  kira.relationshipXp = 0;
  kira.romanceOptIn = false;
  kira.privateMomentUnlocked = false;
  maris.unlocked = false;
  maris.activeSkin = 'default';
  maris.affinityLvl = 1;
  maris.relationshipXp = 0;
  maris.romanceOptIn = false;
  maris.privateMomentUnlocked = false;

  const restored = createEngine(GameEngine);
  assert.equal(restored.metaCoins, 777);
  assert.equal(restored.totalCoinsEarned, 3210);
  assert.equal(restored.towerFloor, 42);
  assert.equal(HERO_CLASSES.maris.unlocked, true);
  assert.equal(HERO_CLASSES.maris.activeSkin, 'alt');
  assert.equal(HERO_CLASSES.maris.affinityLvl, 3);
  assert.equal(HERO_CLASSES.maris.relationshipXp, 17);
  assert.equal(HERO_CLASSES.maris.romanceOptIn, true);
  assert.equal(HERO_CLASSES.maris.privateMomentUnlocked, true);
  assert.deepEqual(
    { ...restored.shopUpgrades },
    { hpBonus: 3, fireRateBonus: 4, magnetRange: 2 }
  );
  assert.equal(restored.selectedHero.id, 'kira');
  assert.equal(HERO_CLASSES.kira.activeSkin, 'alt');
  assert.equal(HERO_CLASSES.kira.affinityLvl, 4);
  assert.equal(HERO_CLASSES.kira.relationshipXp, 23);
  assert.equal(HERO_CLASSES.kira.romanceOptIn, true);
  assert.equal(HERO_CLASSES.kira.privateMomentUnlocked, true);
});

test('quotas, recompenses de vague et boss restent deterministes et uniques', () => {
  const {
    GameEngine, HERO_CLASSES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.saveProgress = () => {};
  engine.unlockAchievement = () => {};

  engine.configureWave(1);
  assert.equal(engine.waveSpawnTarget, 12);
  engine.configureWave(5);
  assert.equal(engine.waveSpawnTarget, 33);
  engine.configureWave(5, { towerMode: true, mutator: { id: 'swarm' } });
  assert.equal(engine.waveSpawnTarget, 27);
  engine.configureWave(100, { towerMode: true });
  assert.equal(engine.waveSpawnTarget, 96, 'Le quota maximal doit etre borne');

  engine.configureWave(5, { towerMode: true });
  HERO_CLASSES.vespera.allied = false;
  engine.enemiesSpawnedThisWave = engine.waveSpawnTarget - 1;
  engine.spawnMutant();
  engine.enemiesSpawnedThisWave = engine.waveSpawnTarget - 1;
  engine.spawnMutant();
  assert.equal(
    engine.enemies.filter(enemy => enemy.isBoss).length,
    1,
    'Une vague ne doit jamais produire deux boss'
  );
  assert.equal(engine.enemies[0].type, 'hellwarden');

  const rewardEngine = createEngine(GameEngine);
  rewardEngine.saveProgress = () => {};
  rewardEngine.unlockAchievement = () => {};
  rewardEngine.configureWave(5);
  const initialCoins = rewardEngine.coins;
  const initialMetaCoins = rewardEngine.metaCoins;
  rewardEngine.completeWave();
  rewardEngine.completeWave();
  assert.equal(rewardEngine.coins, initialCoins + 74, 'La récompense authored de la vague 5 doit être appliquée');
  assert.equal(rewardEngine.metaCoins, initialMetaCoins + 18);
  assert.equal(rewardEngine.waveActive, false);
  rewardEngine.updateSpawns(rewardEngine.waveIntermissionTimer + 0.1);
  assert.equal(rewardEngine.wave, 6);
  assert.equal(rewardEngine.waveSpawnTarget, 23);

  const leviathanEngine = createEngine(GameEngine);
  leviathanEngine.configureWave(15);
  const leviathanSpec = leviathanEngine.waveSpawnQueue.find(entry => entry.type === 'leviathan');
  leviathanEngine.spawnMutant(leviathanSpec);
  const bosses = leviathanEngine.enemies.filter(enemy => enemy.isBoss);
  assert.equal(bosses.length, 1);
  assert.equal(bosses[0].type, 'leviathan');
});

test('la Tour monte sans retour avant le palier 10 puis restaure la vague suspendue', () => {
  const { GameEngine } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.saveProgress = () => {};
  engine.unlockAchievement = () => {};
  const campaignEnemy = { id: 'campaign' };
  const empty = () => [];

  engine.campaignStateBeforeTower = {
    wave: 7,
    waveActive: true,
    waveIntermissionTimer: 0,
    enemiesSpawnedThisWave: 9,
    waveSpawnTarget: 22,
    bossSpawnedThisWave: false,
    waveRewardClaimed: false,
    spawnTimer: 0.5,
    enemies: [campaignEnemy],
    enemyBullets: empty(),
    projectiles: empty(),
    particles: empty(),
    floatingTexts: empty(),
    decoys: empty(),
    crates: empty(),
    powerups: empty(),
    hazards: empty()
  };
  engine.towerFloor = 5;
  engine.configureWave(5, { towerMode: true, mutator: { id: 'armored' } });
  engine.enemiesSpawnedThisWave = engine.waveSpawnTarget - 1;
  engine.spawnMutant();
  assert.equal(engine.enemies[0].type, 'hellwarden');
  assert.equal(engine.enemies[0].recruitableBossId, null);

  engine.enemies = [];
  engine.enemiesSpawnedThisWave = engine.waveSpawnTarget;
  engine.completeWave();
  engine.updateSpawns(4);

  assert.equal(engine.wave, 6);
  assert.equal(engine.isTowerMode, true);
  assert.equal(engine.campaignStateBeforeTower.wave, 7);

  engine.towerFloor = 10;
  engine.configureWave(10, { towerMode: true, mutators: engine.towerMutators });
  engine.enemies = [];
  engine.enemiesSpawnedThisWave = engine.waveSpawnTarget;
  engine.completeWave();
  engine.updateSpawns(4);

  assert.equal(engine.wave, 7);
  assert.equal(engine.waveActive, true);
  assert.equal(engine.enemies[0], campaignEnemy);
  assert.equal(engine.isTowerMode, false);
  assert.equal(engine.towerFloor, 11);
  assert.equal(engine.campaignStateBeforeTower, null);
});

test('les defenses evoluent jusqu au niveau 3 sans double multiplication des degats', () => {
  const {
    GameEngine, TOWER_TYPES, DEFENSE_MAX_LEVEL
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const defense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 200, 200);
  engine.placedTowers = [defense];
  engine.coins = 500;

  assert.equal(defense.baseCost, 30);
  assert.equal(defense.investedCost, 30);
  assert.equal(engine.getDefenseUpgradeCost(defense), 38);
  assert.equal(engine.findPlacedDefenseAt(210, 205), defense);
  assert.equal(engine.findPlacedDefenseAt(260, 260), null);

  const levelTwo = engine.upgradeDefense(defense);
  assert.equal(levelTwo.ok, true);
  assert.equal(levelTwo.requiresSpecialization, true);
  assert.equal(levelTwo.specializationOptions.length, 2);
  assert.equal(defense.damage, 23.25);
  assert.equal(defense.range, 264);
  assert.equal(defense.fireRate, 264);
  assert.equal(engine.getDefenseUpgradeCost(defense), 53);

  const choice = engine.chooseDefenseSpecialization(defense, levelTwo.specializationOptions[0].id);
  assert.equal(choice.ok, true);
  assert.equal(defense.specializationId, 'vulcan_cerberus');
  assert.ok(defense.damage > 23.25);

  engine.projectiles = [];
  engine.fireTower(defense, { x: 300, y: 200, radius: 12, dead: false });
  assert.equal(engine.projectiles[0].damage, defense.damage, 'le niveau ne doit pas remultiplier les degats deja calcules');

  const levelThree = engine.upgradeDefense(defense);
  assert.equal(levelThree.ok, true);
  assert.equal(defense.level, DEFENSE_MAX_LEVEL);
  assert.equal(defense.damage, 43.2);
  assert.equal(defense.range, 276);
  assert.equal(defense.fireRate, 164);
  assert.equal(engine.getDefenseUpgradeCost(defense), null);
});

test('la revente rembourse 60 pour cent de toute la valeur investie', () => {
  const {
    GameEngine, TOWER_TYPES, DEFENSE_SELL_RATIO
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const defense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 200, 200);
  engine.placedTowers = [defense];
  engine.coins = 500;
  engine.upgradeDefense(defense);
  engine.upgradeDefense(defense);

  assert.equal(defense.investedCost, 121);
  assert.equal(engine.getDefenseSellValue(defense), Math.floor(121 * DEFENSE_SELL_RATIO));
  const coinsBeforeSale = engine.coins;
  const sale = engine.sellDefense(defense);

  assert.deepEqual({ ...sale }, { ok: true, refund: 72 });
  assert.equal(engine.coins, coinsBeforeSale + 72);
  assert.equal(engine.placedTowers.length, 0);
});

test('les defenses initiales ont un cout et une valeur de revente coherents', () => {
  const {
    GameEngine, TOWER_TYPES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const minigun = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 510, 310, { starter: true });
  const inferno = engine.createPlacedDefense(TOWER_TYPES.flame_trap, 690, 490, { starter: true });

  assert.equal(minigun.isStarter, true);
  assert.equal(minigun.baseCost, TOWER_TYPES.vulcan_turret.cost);
  assert.equal(minigun.investedCost, TOWER_TYPES.vulcan_turret.cost);
  assert.equal(engine.getDefenseSellValue(minigun), 18);
  assert.equal(inferno.baseCost, TOWER_TYPES.flame_trap.cost);
  assert.equal(engine.getDefenseSellValue(inferno), 27);
});

test('caisses et power ups sont bornes et expirent hors portee', () => {
  const {
    GameEngine, POWERUP_TYPES, LOOT_CONFIG
  } = loadGameModule();
  const engine = createEngine(GameEngine);

  for (let index = 0; index < LOOT_CONFIG.maxCrates + 8; index++) {
    engine.addBoundedLoot('crate', { x: -500, y: -500, radius: 14, type: 'blue', marker: index });
  }
  for (let index = 0; index < LOOT_CONFIG.maxPowerups + 8; index++) {
    engine.addBoundedLoot('powerup', { x: -500, y: -500, radius: 16, type: POWERUP_TYPES[0], marker: index });
  }

  assert.equal(engine.crates.length, LOOT_CONFIG.maxCrates);
  assert.equal(engine.powerups.length, LOOT_CONFIG.maxPowerups);
  assert.equal(engine.crates[0].marker, 8, 'les plus vieux butins doivent etre retires en premier');
  assert.equal(engine.powerups[0].marker, 8);

  engine.crates.forEach(crate => { crate.life = 0.01; });
  engine.powerups.forEach(powerup => { powerup.life = 0.01; });
  engine.updateCrates(0.02);
  engine.updatePowerups(0.02);

  assert.equal(engine.crates.length, 0);
  assert.equal(engine.powerups.length, 0);
});

test('la modale de gestion des defenses possede ses controles accessibles', () => {
  const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  [
    'defense-management-modal',
    'defense-management-title',
    'defense-management-stats',
    'btn-defense-upgrade',
    'btn-defense-sell',
    'defense-management-status'
  ].forEach(id => {
    assert.match(indexSource, new RegExp(`id="${id}"`), `${id}: controle absent`);
  });
  assert.match(indexSource, /id="defense-management-status"[^>]*role="status"[^>]*aria-live="polite"/);

  const { GameEngine } = loadGameModule();
  const engine = createEngine(GameEngine);
  const hiddenPanel = {};
  const hiddenNestedControl = {
    hidden: false,
    getAttribute: () => null,
    closest: () => hiddenPanel,
    getClientRects: () => [{ width: 100, height: 44 }]
  };
  const visibleControl = {
    hidden: false,
    getAttribute: () => null,
    closest: () => null,
    getClientRects: () => [{ width: 100, height: 44 }]
  };
  const modal = {
    querySelectorAll: () => [hiddenNestedControl, visibleControl]
  };
  const focusableControls = engine.getFocusableControls(modal);
  assert.equal(
    focusableControls.length,
    1,
    'le piege de focus doit ignorer les boutons places dans un panneau cache'
  );
  assert.equal(focusableControls[0], visibleControl);
});

test('la barre des defenses est une toolbar a tabindex roving avec retour canvas', () => {
  const start = GAME_SOURCE.indexOf('  renderBuildBar() {');
  const end = GAME_SOURCE.indexOf('  updateBuildBarAffordability()', start);
  const buildBarSource = GAME_SOURCE.slice(start, end);

  assert.match(buildBarSource, /bar\.setAttribute\('role', 'toolbar'\)/);
  assert.match(buildBarSource, /card\.tabIndex = isSelected \? 0 : -1/);
  ['ArrowLeft', 'ArrowRight', 'Home', 'End'].forEach(key => {
    assert.match(buildBarSource, new RegExp(`e\\.key === '${key}'`), `${key}: navigation absente`);
  });
  assert.match(buildBarSource, /e\.key === 'Escape'[\s\S]*this\.focusBattlefield\(\)/);

  const bindStart = GAME_SOURCE.indexOf('  bindEvents() {');
  const bindEnd = GAME_SOURCE.indexOf('  renderBuildBar() {', bindStart);
  const bindSource = GAME_SOURCE.slice(bindStart, bindEnd);
  assert.match(bindSource, /e\.key === 'b' \|\| e\.key === 'B'/);
  assert.match(bindSource, /this\.focusSelectedBuildCard\(\)/);
});

test('les resultats du Salon et de la machine a sous sont annonces', () => {
  const loungeStart = GAME_SOURCE.indexOf('  announceLoungeResult(');
  const loungeEnd = GAME_SOURCE.indexOf('  openAchievementsModal()', loungeStart);
  const resultSource = GAME_SOURCE.slice(loungeStart, loungeEnd);

  assert.match(resultSource, /this\.announce\(`Salon,/);
  assert.match(resultSource, /slotResult\?\.setAttribute\('role', 'status'\)/);
  assert.match(resultSource, /slotResult\?\.setAttribute\('aria-live', 'polite'\)/);
  assert.match(resultSource, /slotResult\?\.setAttribute\('aria-atomic', 'true'\)/);
});

test('niveau evolution et alliance rendent le focus au champ de bataille', () => {
  const allianceStart = GAME_SOURCE.indexOf('  triggerBossRecruitModal(');
  const allianceEnd = GAME_SOURCE.indexOf('  openWardrobeModal(', allianceStart);
  const allianceSource = GAME_SOURCE.slice(allianceStart, allianceEnd);
  assert.match(allianceSource, /this\.renderClassCards\(\);\s*this\.focusBattlefield\(\)/);

  const levelStart = GAME_SOURCE.indexOf('  triggerLevelUpModal() {');
  const levelEnd = GAME_SOURCE.indexOf('  openShopModal() {', levelStart);
  const levelSource = GAME_SOURCE.slice(levelStart, levelEnd);
  assert.match(levelSource, /this\.closeModal\(modal, false\);\s*this\.focusBattlefield\(\)/);
  assert.ok(
    (levelSource.match(/this\.focusBattlefield\(\)/g) || []).length >= 2,
    'niveau et evolution doivent tous deux restituer le focus'
  );
});

test('la vague 15 conclut la campagne sans lancer automatiquement une vague 16', () => {
  const {
    GameEngine, CAMPAIGN_FINAL_WAVE
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.openModal = () => {};
  engine.saveProgress = () => {};
  engine.configureWave(CAMPAIGN_FINAL_WAVE);
  engine.enemies = [];
  engine.enemiesSpawnedThisWave = engine.waveSpawnTarget;
  const coinsBeforeVictory = engine.coins;

  engine.completeWave();
  const coinsAfterVictory = engine.coins;
  engine.completeWave();
  engine.updateSpawns(30);

  assert.equal(engine.wave, CAMPAIGN_FINAL_WAVE);
  assert.equal(engine.campaignVictory, true);
  assert.equal(engine.campaignVictoryClaimed, true);
  assert.equal(engine.waveActive, false);
  assert.ok(coinsAfterVictory > coinsBeforeVictory);
  assert.equal(engine.coins, coinsAfterVictory, 'la recompense finale ne doit etre accordee qu une fois');
});

test('un point de controle reprend au debut de la vague suivante sans dupliquer la recompense', () => {
  const {
    GameEngine
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.saveProgress = () => {};
  engine.configureWave(5);
  engine.score = 840;
  engine.coins = 275;
  engine.citadel.hp = 321;
  engine.runElapsedSeconds = 95;
  engine.mercenaries = [
    { name: 'Ray', damage: 999999, fireRate: 1, range: 999999 },
    { name: '<img src=x onerror=alert(1)>', damage: 999999, fireRate: 1, range: 999999 }
  ];
  engine.petDrones = [
    { name: '<script>', level: 3, damage: 999999, fireRate: 1 },
    { level: 99, damage: 999999, fireRate: 1 }
  ];
  engine.enemies = [];
  engine.enemiesSpawnedThisWave = engine.waveSpawnTarget;

  engine.completeWave();
  const checkpoint = engine.activeRunCheckpoint;
  assert.equal(checkpoint.nextWave, 6);
  assert.equal(checkpoint.score, engine.score);
  assert.equal(checkpoint.coins, engine.coins);

  const resumed = createEngine(GameEngine);
  resumed.savedRunCheckpoint = checkpoint;
  resumed.activeRunCheckpoint = checkpoint;
  resumed.showFeedback = () => {};
  assert.equal(resumed.restoreRunCheckpoint(), true);
  assert.equal(resumed.wave, 6);
  assert.equal(resumed.score, checkpoint.score);
  assert.equal(resumed.coins, checkpoint.coins);
  assert.equal(Math.round(resumed.citadel.hp), checkpoint.citadelHp);
  assert.equal(resumed.enemies.length, 0);
  assert.deepEqual(Array.from(resumed.mercenaries, mercenary => mercenary.name), ['Ray', 'Spécialiste ralliée']);
  assert.deepEqual(Array.from(resumed.mercenaries, mercenary => mercenary.damage), [20, 30]);
  assert.deepEqual(Array.from(resumed.petDrones, drone => drone.name), ['Chiroptère IA', 'Chiroptère IA']);
  assert.deepEqual(Array.from(resumed.petDrones, drone => drone.level), [3, 3]);
  assert.deepEqual(Array.from(resumed.petDrones, drone => drone.damage), [52.5, 52.5]);
});

test('les difficultes modifient reellement la citadelle et les recompenses', () => {
  const {
    GameEngine, DIFFICULTY_DATA
  } = loadGameModule();
  const story = createEngine(GameEngine);
  story.saveProgress = () => {};
  story.startNewGame({ difficulty: 'story' });

  const nightmare = createEngine(GameEngine);
  nightmare.saveProgress = () => {};
  nightmare.startNewGame({ difficulty: 'nightmare' });

  assert.equal(story.difficulty, 'story');
  assert.equal(nightmare.difficulty, 'nightmare');
  assert.equal(story.citadel.maxHp, Math.round(500 * DIFFICULTY_DATA.story.citadelHp));
  assert.equal(nightmare.citadel.maxHp, Math.round(500 * DIFFICULTY_DATA.nightmare.citadelHp));

  story.configureWave(1);
  nightmare.configureWave(1);
  const storyCoins = story.coins;
  const nightmareCoins = nightmare.coins;
  story.completeWave();
  nightmare.completeWave();
  assert.ok((nightmare.coins - nightmareCoins) > (story.coins - storyCoins));
});

test('une sauvegarde V2 migre ses anciens credits vers la V5', () => {
  const legacy = {
    version: 2,
    coins: 640,
    totalCoinsEarned: 900,
    selectedHeroId: 'aria'
  };
  const {
    GameEngine
  } = loadGameModule({ valkyrie_sweeper_save: JSON.stringify(legacy) });
  const engine = createEngine(GameEngine);

  assert.equal(engine.metaCoins, 640);
  assert.equal(engine.totalCoinsEarned, 500);
  engine.saveProgress();
});

test('le game over retire les choix obsoletes avant d ouvrir sa synthese', () => {
  const start = GAME_SOURCE.indexOf('  triggerGameOver() {');
  const end = GAME_SOURCE.indexOf('  // --- Rendering Canvas Engine', start);
  const source = GAME_SOURCE.slice(start, end);
  const sanitizeIndex = source.indexOf('this.closeAllGameplayModals()');
  const openIndex = source.indexOf("this.openModal('game-over-modal')");

  assert.ok(sanitizeIndex >= 0, 'les modales actives doivent etre retirees');
  assert.ok(openIndex > sanitizeIndex, 'la synthese doit etre ouverte apres le nettoyage');
  assert.match(GAME_SOURCE, /btnRestart[\s\S]*this\.closeAllGameplayModals\(\)[\s\S]*this\.startNewGame/);
});

test('la recompense de la Tour 100 distingue premiere maitrise et replay', () => {
  const completionStart = GAME_SOURCE.indexOf('  triggerTowerCompletion() {');
  const completionEnd = GAME_SOURCE.indexOf('  getAffinityThreshold(', completionStart);
  const source = GAME_SOURCE.slice(completionStart, completionEnd);

  assert.match(GAME_SOURCE, /towerAchievement && !towerAchievement\.unlocked/);
  assert.match(source, /this\.towerCompletionEarnedReward > 0/);
  assert.match(source, /'D.j. obtenue'/);
  assert.match(source, /La prime de ma.trise est unique/);
});

test('le HUD mobile suit la hauteur reelle et le bouton musique reste synchronise', () => {
  assert.match(GAME_SOURCE, /new ResizeObserver\(\(\) => this\.syncMissionStatusPosition\(\)\)/);
  assert.match(GAME_SOURCE, /header\.getBoundingClientRect\(\)\.bottom/);
  assert.match(GAME_SOURCE, /if \(this\.preferredMusicEnabled && !audio\.isPlayingMusic\) audio\.startMusic\(\);\s*this\.syncMusicButtonState\(\)/);
});

test('les atlas suivent les etats de tir, impact et competence', () => {
  const {
    GameEngine, TOWER_SPRITE_DATA, ENEMY_SPRITE_DATA, HERO_SPRITE_DATA
  } = loadGameModule();
  const engine = createEngine(GameEngine);

  assert.equal(Object.keys(TOWER_SPRITE_DATA).length, 20);
  assert.equal(Object.keys(ENEMY_SPRITE_DATA).length, 21);
  assert.equal(Object.keys(HERO_SPRITE_DATA).length, 16);

  const tower = { animationTimer: 0.2, animationPhase: 0 };
  assert.equal(engine.getTowerAnimationFrame(tower, {}), 2);
  tower.animationTimer = 0;
  assert.equal(engine.getTowerAnimationFrame(tower, {}), 0);

  const enemy = { hitAnimationTimer: 0.1, attackAnimationTimer: 0, animationPhase: 0 };
  assert.equal(engine.getEnemyAnimationFrame(enemy, { fps: 6 }), 3);
  enemy.hitAnimationTimer = 0;
  enemy.attackAnimationTimer = 0.2;
  assert.equal(engine.getEnemyAnimationFrame(enemy, { fps: 6 }), 2);

  engine.heroAnimationState = 'ability';
  assert.equal(engine.getHeroAnimationFrame(), 3);
  engine.heroAnimationState = 'attack';
  assert.equal(engine.getHeroAnimationFrame(), 2);
  assert.match(GAME_SOURCE, /towerAnimationGhosts\.push\(\{ \.\.\.t, animationTimer: 0\.34/);
});

test('le rendu decoupe exactement la cellule 4x4 demandee', () => {
  const { GameEngine } = loadGameModule();
  const engine = createEngine(GameEngine);
  const drawCalls = [];
  engine.ctx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage(...args) { drawCalls.push(args); }
  };
  const image = {
    complete: true,
    naturalWidth: 1024,
    naturalHeight: 1024
  };

  assert.equal(engine.drawAtlasFrame(image, { row: 2 }, 3, 100, 80, 64, { flipX: true }), true);
  assert.deepEqual(drawCalls[0].slice(1, 5), [768, 512, 256, 256]);
  assert.deepEqual(drawCalls[0].slice(5), [-32, -32, 64, 64]);
});

test('la camera couvre toute la largeur puis cadre les quatre approches sur demande', () => {
  const { GameEngine, document } = loadGameModule();
  const engine = createEngine(GameEngine);
  let hudRects = {
    'hud-header': { bottom: 88 },
    'mission-status-panel': { bottom: 127 },
    'hud-build-bar': { top: 650 }
  };
  document.getElementById = id => (
    hudRects[id]
      ? { getBoundingClientRect: () => ({ ...hudRects[id] }) }
      : null
  );
  const view = engine.getBattlefieldView(1200, 800);
  const projectX = worldX => view.screenCenterX + ((worldX - view.worldCenterX) * view.scale);

  assert.equal(view.zoom, 1);
  assert.ok(view.scale > 0, `Zoom inattendu: ${view.scale}`);
  assert.ok(projectX(-320) <= 0.001, 'Le bord ouest doit atteindre le bord de la fenetre');
  assert.ok(projectX(1520) >= 1199.999, 'Le bord est doit atteindre le bord de la fenetre');

  const restoredCenter = engine.screenToBattlefieldPoint(view.screenCenterX, view.screenCenterY, view);
  assert.equal(restoredCenter.x, 600);
  assert.equal(restoredCenter.y, 400);
  engine.fitBattlefieldCamera(1200, 800);
  const fittedView = engine.getBattlefieldView(1200, 800);
  const fittedProjectX = worldX => fittedView.screenCenterX
    + ((worldX - fittedView.worldCenterX) * fittedView.scale);
  const fittedProjectY = worldY => fittedView.screenCenterY
    + ((worldY - fittedView.worldCenterY) * fittedView.scale);
  assert.ok(fittedView.zoom < 1, 'Cadrer doit dezoomer depuis la vue pleine largeur');
  assert.ok(fittedProjectX(-320) >= -0.001);
  assert.ok(fittedProjectX(1520) <= 1200.001);
  assert.ok(fittedProjectY(-320) >= fittedView.safeTop - 0.001);
  assert.ok(fittedProjectY(1120) <= fittedView.safeBottom + 0.001);
  assert.match(GAME_SOURCE, /const BATTLEFIELD_APPROACH_MARGIN = 64 \* 5;/);
  assert.match(GAME_SOURCE, /this\.applyBattlefieldView\(view\);/);
  assert.match(GAME_SOURCE, /this\.screenToBattlefieldPoint\(screenX, screenY\)/);

  hudRects = {
    'hud-header': { bottom: 155 },
    'mission-status-panel': { bottom: 207 },
    'hud-build-bar': { top: 432 }
  };
  engine.canvas = {
    width: 360,
    height: 640,
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 360, height: 640 };
    }
  };
  engine.fitBattlefieldCamera(360, 640);
  const mobileView = engine.getBattlefieldView(360, 640);
  const mobileNorthSpawn = mobileView.screenCenterY + ((-30 - mobileView.worldCenterY) * mobileView.scale);
  const mobileSouthSpawn = mobileView.screenCenterY + ((670 - mobileView.worldCenterY) * mobileView.scale);
  assert.ok(mobileView.scale < 0.32, 'un écran court doit pouvoir reculer sous le zoom minimal historique');
  assert.ok(mobileNorthSpawn > mobileView.safeTop, 'Le spawn nord mobile doit rester visible');
  assert.ok(mobileSouthSpawn < mobileView.safeBottom, 'Le spawn sud mobile doit rester visible');

  hudRects = {
    'hud-header': { bottom: 112 },
    'mission-status-panel': { bottom: 141 },
    'hud-build-bar': { top: 230 }
  };
  engine.canvas = {
    width: 844,
    height: 390,
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 844, height: 390 };
    }
  };
  engine.fitBattlefieldCamera(844, 390);
  const landscapeView = engine.getBattlefieldView(844, 390);
  const landscapeNorthSpawn = landscapeView.screenCenterY + ((-30 - landscapeView.worldCenterY) * landscapeView.scale);
  const landscapeSouthSpawn = landscapeView.screenCenterY + ((420 - landscapeView.worldCenterY) * landscapeView.scale);
  assert.ok(landscapeNorthSpawn > landscapeView.safeTop, 'Le spawn nord paysage doit rester visible');
  assert.ok(landscapeSouthSpawn < landscapeView.safeBottom, 'Le spawn sud paysage doit rester visible');
  const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(indexSource, /id="short-landscape-notice"/);
  assert.match(GAME_SOURCE, /this\.requiresPortraitOrientation = false/);
  assert.match(GAME_SOURCE, /!this\.requiresPortraitOrientation/);
});

test('zoom ancre et pan borne preservent les coordonnees logiques', () => {
  const { GameEngine } = loadGameModule();
  const engine = createEngine(GameEngine);
  const anchor = { x: 540, y: 360 };
  const before = engine.screenToBattlefieldPoint(anchor.x, anchor.y);
  engine.setBattlefieldCameraZoom(1.8, anchor.x, anchor.y);
  const after = engine.screenToBattlefieldPoint(anchor.x, anchor.y);

  assert.ok(Math.abs(before.x - after.x) < 1e-9, 'le zoom doit rester ancre sous le pointeur');
  assert.ok(Math.abs(before.y - after.y) < 1e-9, 'le zoom doit rester ancre sous le pointeur');

  engine.panBattlefieldCameraBy(1e6, 1e6);
  let view = engine.getBattlefieldView();
  const safeLeft = engine.screenToBattlefieldPoint(0, view.safeTop, view);
  assert.ok(Math.abs(safeLeft.x - (-320)) < 1e-6, 'le pan ouest doit etre borne');
  assert.ok(Math.abs(safeLeft.y - (-320)) < 1e-6, 'le pan nord doit etre borne');

  engine.panBattlefieldCameraBy(-1e6, -1e6);
  view = engine.getBattlefieldView();
  const safeRight = engine.screenToBattlefieldPoint(1200, view.safeBottom, view);
  assert.ok(Math.abs(safeRight.x - 1520) < 1e-6, 'le pan est doit etre borne');
  assert.ok(Math.abs(safeRight.y - 1120) < 1e-6, 'le pan sud doit etre borne');

  engine.setBattlefieldCameraZoom(999, view.screenCenterX, view.screenCenterY);
  assert.equal(engine.camera.zoom, 3.5);
  engine.setBattlefieldCameraZoom(0.001, view.screenCenterX, view.screenCenterY);
  assert.equal(engine.camera.zoom, engine.getBattlefieldCameraMetrics().minZoom);
});

test('redimensionner la fenetre ne deplace aucune entite du monde', () => {
  const { GameEngine, document, window } = loadGameModule();
  const engine = createEngine(GameEngine);
  const orientationNotice = createElement('div');
  orientationNotice.hidden = true;
  document.getElementById = id => (id === 'short-landscape-notice' ? orientationNotice : null);
  engine.enemies = [{ x: -245, y: 377, hp: 10 }];
  engine.projectiles = [{ x: 1315, y: 401, vx: 0, vy: 0 }];
  const before = JSON.parse(JSON.stringify({
    enemies: engine.enemies,
    projectiles: engine.projectiles
  }));

  window.innerWidth = 390;
  window.innerHeight = 844;
  engine.resizeCanvas();

  assert.deepEqual(JSON.parse(JSON.stringify(engine.enemies)), before.enemies);
  assert.deepEqual(JSON.parse(JSON.stringify(engine.projectiles)), before.projectiles);
  assert.equal(engine.worldWidth, 1200);
  assert.equal(engine.worldHeight, 800);
});

test('les controles camera couvrent souris tactile pincement boutons et clavier', () => {
  const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const stylesSource = fs.readFileSync(path.join(ROOT, 'styles.v8.css'), 'utf8');

  ['btn-camera-zoom-out', 'btn-camera-fit', 'btn-camera-zoom-in', 'camera-zoom-txt']
    .forEach(id => assert.match(indexSource, new RegExp(`id="${id}"`)));
  assert.match(GAME_SOURCE, /addEventListener\('pointerdown'/);
  assert.match(GAME_SOURCE, /addEventListener\('pointermove'/);
  assert.match(GAME_SOURCE, /addEventListener\('pointerup'/);
  assert.match(GAME_SOURCE, /addEventListener\('pointercancel'/);
  assert.match(GAME_SOURCE, /addEventListener\('wheel'[\s\S]*\{ passive: false \}/);
  assert.match(GAME_SOURCE, /cameraGesture\?\.type !== 'pinch'/);
  assert.match(GAME_SOURCE, />= 6;/);
  assert.match(GAME_SOURCE, /suppressNextBattlefieldClick/);
  assert.match(GAME_SOURCE, /e\.key === '0'[\s\S]*fitBattlefieldCamera/);
  assert.match(GAME_SOURCE, /cameraKey === 'w'[\s\S]*cameraKey === 's'/);
  assert.match(GAME_SOURCE, /aria-keyshortcuts', 'B W A S D \+ - 0'/);
  assert.match(indexSource, /id="camera-zoom-txt"[^>]*aria-live="off"/);
  assert.match(indexSource, /camera-controls-help">[^<]*W A S D/);
  assert.match(stylesSource, /#game-canvas[\s\S]*touch-action: none/);
  assert.match(stylesSource, /\.camera-control-btn[\s\S]*min-height: 44px/);
  assert.match(stylesSource, /max-height: 592px[\s\S]*grid-template-columns: repeat\(3, 44px\)/);
});

test('un drag supprime seulement son clic synthetique puis laisse passer le clic suivant', () => {
  const { GameEngine, document } = loadGameModule();
  const engine = createEngine(GameEngine);
  let buildCount = 0;
  engine.findPlacedDefenseAt = () => null;
  engine.buildSelectedTowerAt = () => { buildCount += 1; };
  const camera = installCameraInputHarness(engine, document);

  engine.setBattlefieldCameraZoom(1.5, 600, 400);
  const cameraXBeforeDrag = engine.camera.x;
  camera.dispatch('pointerdown', { clientX: 600 });
  camera.dispatch('pointermove', { clientX: 630 });
  camera.dispatch('pointerup', { clientX: 630 });
  camera.dispatch('click', { clientX: 630 });

  assert.notEqual(engine.camera.x, cameraXBeforeDrag, 'le drag doit deplacer la camera');
  assert.equal(buildCount, 0, 'le clic synthetique du drag ne doit pas construire');

  camera.dispatch('click', { clientX: 600 });
  assert.equal(buildCount, 1, 'le clic bref suivant doit construire normalement');
});

test('un navigateur sans clic synthetique ne peut pas laisser la suppression armee', async () => {
  const { GameEngine, document } = loadGameModule();
  const engine = createEngine(GameEngine);
  let buildCount = 0;
  engine.findPlacedDefenseAt = () => null;
  engine.buildSelectedTowerAt = () => { buildCount += 1; };
  const camera = installCameraInputHarness(engine, document);

  engine.setBattlefieldCameraZoom(1.5, 600, 400);
  camera.dispatch('pointerdown', { clientX: 600 });
  camera.dispatch('pointermove', { clientX: 630 });
  camera.dispatch('pointerup', { clientX: 630 });
  await new Promise(resolve => setTimeout(resolve, 140));
  camera.dispatch('click', { clientX: 600 });

  assert.equal(buildCount, 1, 'le prochain clic volontaire ne doit jamais etre perdu');
});

test('pointercancel ne supprime pas le prochain clic volontaire', () => {
  const { GameEngine, document } = loadGameModule();
  const engine = createEngine(GameEngine);
  let buildCount = 0;
  engine.findPlacedDefenseAt = () => null;
  engine.buildSelectedTowerAt = () => { buildCount += 1; };
  const camera = installCameraInputHarness(engine, document);

  engine.setBattlefieldCameraZoom(1.5, 600, 400);
  camera.dispatch('pointerdown', { clientX: 600 });
  camera.dispatch('pointermove', { clientX: 630 });
  camera.dispatch('pointercancel', { clientX: 630 });
  camera.dispatch('click', { clientX: 600 });

  assert.equal(buildCount, 1, 'une annulation ne doit pas avaler le clic suivant');
});

test('un pincement qui translate et zoome conserve son point monde sous le milieu', () => {
  const { GameEngine, document } = loadGameModule();
  const engine = createEngine(GameEngine);
  const camera = installCameraInputHarness(engine, document);

  engine.setBattlefieldCameraZoom(1.5, 600, 400);
  const previousMidpoint = { x: 500, y: 400 };
  const anchoredWorldPoint = engine.screenToBattlefieldPoint(
    previousMidpoint.x,
    previousMidpoint.y
  );

  camera.dispatch('pointerdown', {
    pointerId: 11,
    pointerType: 'touch',
    clientX: 400
  });
  camera.dispatch('pointerdown', {
    pointerId: 12,
    pointerType: 'touch',
    clientX: 600
  });
  camera.dispatch('pointermove', {
    pointerId: 11,
    pointerType: 'touch',
    clientX: 400
  });
  camera.dispatch('pointermove', {
    pointerId: 12,
    pointerType: 'touch',
    clientX: 720
  });

  const translatedMidpoint = { x: 560, y: 400 };
  const worldPointAfterPinch = engine.screenToBattlefieldPoint(
    translatedMidpoint.x,
    translatedMidpoint.y
  );
  assert.ok(
    Math.abs(anchoredWorldPoint.x - worldPointAfterPinch.x) < 1e-9,
    'le pincement ne doit pas deriver horizontalement'
  );
  assert.ok(
    Math.abs(anchoredWorldPoint.y - worldPointAfterPinch.y) < 1e-9,
    'le pincement ne doit pas deriver verticalement'
  );
  assert.ok(Math.abs(engine.camera.zoom - 2.4) < 1e-9, 'le rapport de pincement doit zoomer');
});

test('resize synchronise le zoom affiche et l etat du bouton de dezoom', () => {
  const { GameEngine, document, window } = loadGameModule();
  const engine = createEngine(GameEngine);
  let viewportMode = 'landscape';
  const zoomOutput = createElement('output');
  const zoomOutButton = createElement('button');
  const zoomInButton = createElement('button');
  const orientationNotice = createElement('div');
  const hudRects = {
    landscape: {
      'hud-header': { bottom: 112 },
      'mission-status-panel': { bottom: 141 },
      'hud-build-bar': { top: 230 }
    },
    portrait: {
      'hud-header': { bottom: 155 },
      'mission-status-panel': { bottom: 207 },
      'hud-build-bar': { top: 700 }
    }
  };

  document.getElementById = id => {
    if (id === 'camera-zoom-txt') return zoomOutput;
    if (id === 'btn-camera-zoom-out') return zoomOutButton;
    if (id === 'btn-camera-zoom-in') return zoomInButton;
    if (id === 'short-landscape-notice') return orientationNotice;
    const rect = hudRects[viewportMode][id];
    return rect ? { getBoundingClientRect: () => ({ ...rect }) } : null;
  };
  engine.canvas = {
    width: 844,
    height: 390,
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
  };

  window.innerWidth = 844;
  window.innerHeight = 390;
  engine.setBattlefieldCameraZoom(0.2, 422, 195, 844, 390);
  assert.equal(zoomOutput.textContent, '20 %');
  assert.equal(zoomOutButton.disabled, false);

  viewportMode = 'portrait';
  window.innerWidth = 390;
  window.innerHeight = 844;
  engine.resizeCanvas();

  assert.equal(zoomOutput.textContent, `${Math.round(engine.camera.zoom * 100)} %`);
  assert.equal(zoomOutput.textContent, '64 %');
  assert.equal(zoomOutButton.disabled, true, 'le nouveau minimum doit desactiver le bouton');
});

test('le corridor approche x5 garde les quatre portes de horde visibles et loin du terrain central', () => {
  const {
    GameEngine,
    BATTLEFIELD_APPROACH_MARGIN
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const width = engine.canvas.width;
  const height = engine.canvas.height;
  engine.fitBattlefieldCamera(width, height);
  const view = engine.getBattlefieldView(width, height);

  assert.equal(BATTLEFIELD_APPROACH_MARGIN, 320);

  const spawns = Object.fromEntries(
    ['north', 'east', 'south', 'west'].map(side => [
      side,
      engine.getSpawnPosition(side, 'swarmer', width, height)
    ])
  );

  Object.entries(spawns).forEach(([side, spawn]) => {
    assert.ok(Number.isFinite(spawn.x) && Number.isFinite(spawn.y), `${side}: spawn invalide`);
    assert.ok(
      spawn.x >= view.left && spawn.x <= view.right
        && spawn.y >= view.top && spawn.y <= view.bottom,
      `${side}: la porte doit rester dans l'enveloppe visible`
    );
  });

  assert.ok(spawns.west.x <= -200, 'La horde ouest doit parcourir au moins 200 unites avant le terrain');
  assert.ok(spawns.east.x >= width + 200, 'La horde est doit parcourir au moins 200 unites avant le terrain');
  assert.ok(spawns.north.y <= -200, 'La horde nord doit parcourir au moins 200 unites avant le terrain');
  assert.ok(spawns.south.y >= height + 200, 'La horde sud doit parcourir au moins 200 unites avant le terrain');
  assert.ok(spawns.west.y >= 0 && spawns.west.y <= height);
  assert.ok(spawns.east.y >= 0 && spawns.east.y <= height);
  assert.ok(spawns.north.x >= 0 && spawns.north.x <= width);
  assert.ok(spawns.south.x >= 0 && spawns.south.x <= width);
});

test('projectiles allies et tirs de boss vivent dans le corridor puis sont elimines au-dela', () => {
  const { GameEngine, BATTLEFIELD_APPROACH_MARGIN } = loadGameModule();
  const engine = createEngine(GameEngine);
  const width = engine.canvas.width;
  const height = engine.canvas.height;
  const margin = BATTLEFIELD_APPROACH_MARGIN;
  const inside = [
    { id: 'west', x: -margin + 10, y: height / 2 },
    { id: 'east', x: width + margin - 10, y: height / 2 },
    { id: 'north', x: width / 2, y: -margin + 10 },
    { id: 'south', x: width / 2, y: height + margin - 10 }
  ];
  const outside = [
    { id: 'far-west', x: -margin - 1000, y: height / 2 },
    { id: 'far-east', x: width + margin + 1000, y: height / 2 },
    { id: 'far-north', x: width / 2, y: -margin - 1000 },
    { id: 'far-south', x: width / 2, y: height + margin + 1000 }
  ];

  engine.enemies = [];
  engine.projectiles = [...inside, ...outside].map(point => ({
    ...point,
    vx: 0,
    vy: 0,
    damage: 1,
    radius: 3,
    type: 'bullet',
    color: '#fff'
  }));
  engine.updateProjectiles(0);
  assert.deepEqual(
    engine.projectiles.map(projectile => projectile.id).sort(),
    inside.map(projectile => projectile.id).sort()
  );

  engine.placedTowers = [];
  engine.enemyBullets = [...inside, ...outside].map(point => ({
    ...point,
    vx: 0,
    vy: 0,
    damage: 1,
    radius: 3,
    color: '#fff'
  }));
  engine.updateEnemyBullets(0);
  assert.deepEqual(
    engine.enemyBullets.map(projectile => projectile.id).sort(),
    inside.map(projectile => projectile.id).sort()
  );

  assert.equal(typeof engine.getApproachCullBounds, 'function');
});

test('les cibles et silhouettes restent lisibles quelle que soit l echelle camera', () => {
  const {
    GameEngine,
    DEFENSE_MIN_SCREEN_HIT_DIAMETER
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const view = engine.getBattlefieldView();
  const defense = { x: 200, y: 200, radius: 18 };

  assert.equal(DEFENSE_MIN_SCREEN_HIT_DIAMETER, 44);
  const hitRadius = engine.getDefenseHitRadius(defense, view);
  assert.ok(
    hitRadius * view.scale >= DEFENSE_MIN_SCREEN_HIT_DIAMETER / 2,
    'La cible tactile doit conserver un rayon ecran de 22 px'
  );

  engine.placedTowers = [defense];
  engine.battlefieldViewScale = view.scale;
  assert.equal(
    engine.findPlacedDefenseAt(
      defense.x + ((DEFENSE_MIN_SCREEN_HIT_DIAMETER / 2 - 0.5) / view.scale),
      defense.y
    ),
    defense,
    'Une activation a l interieur des 44 px ecran doit selectionner la defense'
  );

  assert.equal(engine.getReadableWorldSize(10, 16, 0.2), 80);
  assert.equal(engine.getReadableWorldSize(100, 16, 0.5), 100);
  assert.ok(
    [...GAME_SOURCE.matchAll(/getReadableWorldSize\(/g)].length >= 2,
    'Le helper de lisibilite doit etre utilise par le rendu, pas seulement declare'
  );
});

test('la construction reste interdite dans le corridor hors rectangle central', () => {
  const { GameEngine, TOWER_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.isPaused = false;
  engine.isGameOver = false;
  engine.coins = 100000;
  engine.placedTowers = [];
  engine.selectedTowerToBuild = Object.values(TOWER_TYPES)[0];

  [
    [-100, engine.canvas.height / 2],
    [engine.canvas.width + 100, engine.canvas.height / 2],
    [engine.canvas.width / 2, -100],
    [engine.canvas.width / 2, engine.canvas.height + 100]
  ].forEach(([x, y]) => engine.buildSelectedTowerAt(x, y));

  assert.equal(engine.placedTowers.length, 0);
  assert.equal(engine.coins, 100000, 'Un placement hors terrain ne doit rien couter');
});

test('les seize heroines disposent de CG narratives et de chapitres VN accessibles sans faux verrou', () => {
  const { GameEngine, HERO_CLASSES, VN_NARRATIVE_CGS, COASTLINE_IMAGE_SRC } = loadGameModule();
  const engine = createEngine(GameEngine);
  assert.deepEqual(Object.keys(VN_NARRATIVE_CGS).sort(), Object.keys(HERO_CLASSES).sort());
  assert.equal(COASTLINE_IMAGE_SRC, 'assets/environment/infernal-city-coastline.webp');

  const ariaScenes = engine.getVnHeroine('aria');
  assert.equal(ariaScenes.chapters.length, 3);
  HERO_CLASSES.aria.affinityLvl = 1;
  HERO_CLASSES.aria.romanceOptIn = true;
  assert.equal(
    engine.getVnChapterLockReason(HERO_CLASSES.aria, ariaScenes.chapters[0]),
    '',
    'romanceOptIn:false signifie absence de prerequis et non obligation de desactiver la romance'
  );
  HERO_CLASSES.aria.affinityLvl = 2;
  assert.match(
    engine.getVnChapterLockReason(HERO_CLASSES.aria, ariaScenes.chapters[1]),
    /Chapitre pr.c.dent/u,
    'la suite reste liee au drapeau de completion'
  );

  const romanticChapter = ariaScenes.chapters[1];
  const romanticKey = engine.getVnChapterKey('aria', romanticChapter.id);
  engine.vnSceneProgress.chapterResults[romanticKey] = 'completed';
  HERO_CLASSES.aria.romanceOptIn = false;
  assert.match(
    engine.getVnChapterLockReason(HERO_CLASSES.aria, romanticChapter),
    /Accord relationnel requis/,
    'un chapitre romantique termine ne devient jamais une autorisation permanente'
  );

  engine.vnSceneProgress.active = {
    heroId: 'aria',
    chapterId: romanticChapter.id,
    beatId: 'middle',
    lineIndex: 0,
    history: []
  };
  assert.equal(engine.canResumeVnChapter(HERO_CLASSES.aria, romanticChapter), false);
  engine.redirectSavedVnSessionAfterRevocation('aria');
  assert.equal(engine.vnSceneProgress.active.beatId, 'revoke');
  assert.equal(
    engine.canResumeVnChapter(HERO_CLASSES.aria, romanticChapter),
    true,
    'seul le message terminal de revocation reste reprenable sans accord'
  );
});

test('les effets VN ne peuvent pas etre farmes en relecture et la revocation reste immediate', () => {
  const { GameEngine, HERO_CLASSES, document } = loadGameModule();
  const engine = createEngine(GameEngine);
  let grantedXp = 0;
  engine.gainHeroAffinity = (_hero, amount) => { grantedXp += amount; };
  HERO_CLASSES.aria.romanceOptIn = true;

  const effects = { relationshipXp: 3, romanceOptIn: false, setFlags: ['vn.aria.midnight-relief.complete'] };
  engine.applyVnEffects(effects, 'aria.midnight-relief.close.end', HERO_CLASSES.aria);
  engine.applyVnEffects(effects, 'aria.midnight-relief.close.end', HERO_CLASSES.aria);

  assert.equal(grantedXp, 3);
  assert.equal(HERO_CLASSES.aria.romanceOptIn, false);
  assert.equal(engine.vnSceneProgress.appliedEffects.length, 1);
  assert.deepEqual(Array.from(engine.vnSceneProgress.flags), ['vn.aria.midnight-relief.complete']);

  engine.activeVnSession = { isReplay: true };
  HERO_CLASSES.aria.romanceOptIn = true;
  engine.applyVnEffects(
    {
      relationshipXp: 5,
      romanceOptIn: false,
      setFlags: ['vn.aria.shield-dance.complete']
    },
    'aria.midnight-relief.alternate.option',
    HERO_CLASSES.aria
  );

  assert.equal(grantedXp, 3, 'une autre branche de relecture ne doit pas redonner d XP');
  assert.equal(HERO_CLASSES.aria.romanceOptIn, false, 'la revocation reste effective en relecture');
  assert.ok(!engine.vnSceneProgress.flags.includes('vn.aria.shield-dance.complete'));

  const chapter = engine.getVnHeroine('aria').chapters[0];
  const chapterKey = engine.getVnChapterKey('aria', chapter.id);
  const revokeBeat = chapter.beats.find(beat => beat.id === 'revoke');
  engine.vnSceneProgress.chapterResults[chapterKey] = 'completed';
  engine.activeVnSession = {
    heroId: 'aria',
    chapterId: chapter.id,
    beatId: revokeBeat.id,
    lineIndex: 0,
    history: [],
    isReplay: true
  };
  engine.finishVnChapter(revokeBeat);
  assert.equal(
    engine.vnSceneProgress.chapterResults[chapterKey],
    'completed',
    'pause ou revocation en relecture ne doit jamais effacer la completion'
  );

  const vnElements = new Map([
    ['vn-chapter-browser', { hidden: false }],
    ['vn-dialogue-panel', { hidden: true }],
    ['vn-modal-title', { textContent: '' }],
    ['vn-chapter-subtitle', { textContent: '' }]
  ]);
  document.getElementById = id => vnElements.get(id) || null;
  engine.renderActiveVnBeat = () => {};
  HERO_CLASSES.aria.romanceOptIn = true;
  engine.startVnChapter('aria', chapter.id);
  assert.equal(engine.activeVnSession.isReplay, true);
  engine.applyVnEffects(
    { relationshipXp: 9, setFlags: ['vn.aria.shield-dance.complete'] },
    'aria.midnight-relief.unseen-replay-token',
    HERO_CLASSES.aria
  );
  assert.equal(grantedXp, 3, 'le cycle completion puis revocation ne doit pas rouvrir le farming');
  assert.ok(!engine.vnSceneProgress.flags.includes('vn.aria.shield-dance.complete'));
  assert.match(GAME_SOURCE, /btn-vn-revoke/);
  assert.match(GAME_SOURCE, /this\.transitionVnBeat\('revoke'\)/);
});

test('les variantes de terrain placent la Citadelle et limitent leurs vraies routes de horde', () => {
  const { GameEngine, EXPANSION } = loadGameModule();
  const engine = createEngine(GameEngine);
  const expectations = {
    convergence: { x: 600, y: 400, routes: 4, sides: ['east', 'north', 'south', 'west'] },
    western_wall: { x: 140, y: 400, routes: 3, sides: ['east'] },
    southern_watch: { x: 600, y: 125, routes: 3, sides: ['south'] },
    twin_rift: { x: 165, y: 400, routes: 2, sides: ['east'] }
  };

  assert.match(GAME_SOURCE, /EXPANSION_FALLBACK/);
  Object.entries(expectations).forEach(([layoutId, expected]) => {
    const result = engine.applyWorldLayout(layoutId, { force: true, repositionUnits: false });
    assert.equal(result.ok, true);
    assert.equal(engine.selectedLayoutId, layoutId);
    assert.deepEqual(
      { x: engine.citadel.x, y: engine.citadel.y },
      { x: expected.x, y: expected.y }
    );
    assert.equal(engine.spawnRoutes.length, expected.routes);
    assert.deepEqual([...new Set(engine.spawnRoutes.map(route => route.side))].sort(), expected.sides);
    assert.equal(engine.worldWidth, EXPANSION.world.width);
  });
});

test('un ennemi suit chaque segment de sa polyline au lieu de viser directement la Citadelle', () => {
  const { GameEngine } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.applyWorldLayout('western_wall', { force: true, repositionUnits: false });
  const enemy = engine.spawnEnemy('swarmer', 0, { countForWave: false });
  enemy.speed = 100;

  for (let step = 0; step < 36; step++) engine.updateEnemies(0.1);

  assert.ok(enemy.waypointIndex >= 2, 'le premier waypoint doit etre franchi');
  assert.ok(enemy.x < 1185, 'la horde doit progresser depuis le bord droit');
  assert.ok(enemy.y < 220, 'elle doit rester sur la branche nord de la route');
  assert.equal(enemy.routeId, 'western_wall_east_north');
});

test('le directeur des quinze vagues programme les quatre specialistes et les trois boss', () => {
  const { GameEngine } = loadGameModule();
  const engine = createEngine(GameEngine);
  const expectedByWave = new Map([
    [4, 'flying'],
    [5, 'bulwark'],
    [6, 'artillery'],
    [7, 'splitter']
  ]);

  expectedByWave.forEach((type, wave) => {
    engine.configureWave(wave);
    assert.ok(engine.waveSpawnQueue.some(entry => entry.type === type), `specialiste ${type} absent`);
  });
  [[5, 'vespera'], [10, 'carmilla'], [15, 'leviathan']].forEach(([wave, boss]) => {
    engine.configureWave(wave);
    const bossEntries = engine.waveSpawnQueue.filter(entry => entry.type === boss && entry.boss);
    assert.equal(bossEntries.length, 1);
  });

  engine.endlessMode = true;
  engine.configureWave(30);
  assert.equal(engine.waveSpawnQueue.length, 0);
  assert.ok(engine.waveSpawnTarget <= 96, 'le fallback Infinitum/endless doit rester borne');
});

test('volant rempart artillerie et scissipare possedent leurs comportements actifs', () => {
  const { GameEngine, TOWER_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.applyWorldLayout('western_wall', { force: true, repositionUnits: false });

  const flying = engine.spawnEnemy('flying', 1, { countForWave: false });
  const barrier = engine.createPlacedDefense(TOWER_TYPES.aegis_barrier, flying.x - 12, flying.y);
  engine.placedTowers = [barrier];
  const barrierHp = barrier.hp;
  const flyingHp = flying.hp;
  engine.hazards = [{ x: flying.x, y: flying.y, radius: 100, damage: 999, life: 2, tickTimer: 0.5, color: '#fff' }];
  engine.updateHazards(0.1);
  engine.updateEnemies(0.1);
  assert.equal(flying.hp, flyingHp, 'un volant ignore le piege au sol');
  assert.equal(barrier.hp, barrierHp, 'un volant ignore la barriere');

  const bulwark = engine.spawnEnemy('bulwark', 1, { x: 900, y: 400, countForWave: false });
  const ally = engine.spawnEnemy('swarmer', 1, { x: 920, y: 400, countForWave: false });
  const allyHp = ally.hp;
  engine.damageEnemy(bulwark, 100);
  assert.equal(bulwark.hp, bulwark.maxHp, 'le bouclier absorbe avant les HP');
  assert.equal(bulwark.shield, bulwark.maxShield - 100);
  engine.damageEnemy(ally, 100);
  assert.equal(Math.round(allyHp - ally.hp), 82, 'aura de reduction du Rempart');

  const defense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 760, 400);
  engine.placedTowers = [defense];
  const artillery = engine.spawnEnemy('artillery', 1, { x: 1000, y: 400, countForWave: false });
  const artilleryX = artillery.x;
  for (let step = 0; step < 36; step++) engine.updateEnemies(0.1);
  assert.equal(artillery.x, artilleryX, 'l artillerie se deploie au lieu d avancer');
  assert.ok(engine.enemyBullets.some(bullet => bullet.sourceType === 'artillery'));

  const splitter = engine.spawnEnemy('splitter', 1, { x: 850, y: 400, countForWave: false });
  engine.killEnemy(splitter);
  assert.ok(engine.enemies.filter(enemy => enemy.type === 'swarmer' && !enemy.dead).length >= 3);
});

test('Vespera Carmilla et Leviathan telegraphient trois phases et des patterns distincts', () => {
  const { GameEngine } = loadGameModule();
  const engine = createEngine(GameEngine);
  const bulletCounts = {};

  ['vespera', 'carmilla', 'leviathan'].forEach(type => {
    engine.enemies = [];
    engine.enemyBullets = [];
    const boss = engine.spawnEnemy(type, 0, { countForWave: false, isBoss: true });
    boss.hp = boss.maxHp * 0.6;
    assert.equal(engine.updateBossPhase(boss), 2);
    assert.ok(boss.telegraphTimer > 0);
    boss.hp = boss.maxHp * 0.25;
    assert.equal(engine.updateBossPhase(boss), 3);
    engine.fireBossPattern(boss);
    bulletCounts[type] = engine.enemyBullets.length;
    assert.ok(engine.enemyBullets.every(bullet => bullet.bossPhase === 3));
  });

  assert.notEqual(bulletCounts.vespera, bulletCounts.carmilla);
  assert.notEqual(bulletCounts.carmilla, bulletCounts.leviathan);
  assert.ok(bulletCounts.leviathan > bulletCounts.vespera);
});

test('les dix Trones combattent en trois phases et arrivent toutes les deux vagues', () => {
  const { GameEngine, CHARACTER_EXPANSION } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.activeCampaignId = 'ten_thrones';

  CHARACTER_EXPANSION.campaigns.ten_thrones.bossSchedule.forEach(entry => {
    const queue = engine.buildWaveSpawnQueue(entry.wave);
    assert.ok(
      queue.some(spec => spec.type === entry.bossId && spec.boss === true),
      `${entry.bossId}: absent de la vague ${entry.wave}`
    );
  });

  CHARACTER_EXPANSION.bossIds.forEach(type => {
    engine.enemies = [];
    engine.enemyBullets = [];
    const boss = engine.spawnEnemy(type, 0, { countForWave: false, isBoss: true });
    boss.hp = boss.maxHp * 0.6;
    assert.equal(engine.updateBossPhase(boss), 2, `${type}: phase 2`);
    boss.hp = boss.maxHp * 0.25;
    assert.equal(engine.updateBossPhase(boss), 3, `${type}: phase 3`);
    engine.fireBossPattern(boss);
    assert.ok(
      engine.enemyBullets.length > 0,
      `${type}: la phase finale doit produire une menace esquivable`
    );
  });
});

test('chaque Trone execute une mecanique signature mesurable', () => {
  const {
    GameEngine, CHARACTER_EXPANSION, TOWER_TYPES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.activeCampaignId = 'ten_thrones';
  engine.placedTowers = [
    engine.createPlacedDefense(TOWER_TYPES.railgun_pylon, 650, 360),
    engine.createPlacedDefense(TOWER_TYPES.aegis_barrier, 720, 440),
    engine.createPlacedDefense(TOWER_TYPES.plasma_mortar, 780, 360)
  ];

  CHARACTER_EXPANSION.bossIds.forEach(type => {
    engine.enemies = [];
    engine.enemyBullets = [];
    engine.bossHazards = [];
    const boss = engine.spawnEnemy(type, 0, {
      x: 860,
      y: 400,
      hpMultiplier: 4,
      countForWave: false,
      isBoss: true
    });
    boss.hp = boss.maxHp * 0.5;
    const result = engine.applyBossSignature(
      boss,
      CHARACTER_EXPANSION.bosses[type],
      3,
      'phase'
    );
    assert.ok(result?.affected > 0, `${type}: mecanique signature sans effet`);
  });
});

test('la premiere chute d un Trone donne sa recompense et debloque son heroine une seule fois', () => {
  const {
    GameEngine, HERO_CLASSES, CHARACTER_EXPANSION, GALLERY_ITEMS
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.activeCampaignId = 'ten_thrones';
  engine.getRunRandom = () => 0.99;
  engine.unlockAchievement = () => {};
  const metaBefore = engine.metaCoins;
  const expectedMeta = CHARACTER_EXPANSION.bosses.xyra.rewards.metaCoins;
  const first = engine.spawnEnemy('xyra', 0, {
    x: 780,
    y: 400,
    countForWave: false,
    isBoss: true
  });

  engine.killEnemy(first);

  assert.ok(engine.defeatedBossIds.includes('xyra'));
  assert.equal(engine.metaCoins, metaBefore + expectedMeta);
  assert.equal(HERO_CLASSES.maris.unlocked, true);
  assert.equal(GALLERY_ITEMS.find(item => item.id === 'maris').unlocked, true);

  const second = engine.spawnEnemy('xyra', 0, {
    x: 780,
    y: 400,
    countForWave: false,
    isBoss: true
  });
  engine.killEnemy(second);
  assert.equal(engine.metaCoins, metaBefore + expectedMeta);
});

test('les Trones volants ignorent les sols et les barrieres mais prennent les bonus anti-aeriens', () => {
  const {
    GameEngine, TOWER_TYPES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const flyingBoss = engine.spawnEnemy('nhalzara', 0, {
    x: 760,
    y: 400,
    hpMultiplier: 5,
    countForWave: false,
    isBoss: true
  });
  const mine = engine.createPlacedDefense(TOWER_TYPES.landmine, 760, 400);
  const barrier = engine.createPlacedDefense(TOWER_TYPES.aegis_barrier, 740, 400);
  const antiAir = engine.createPlacedDefense(TOWER_TYPES.tesla_spire, 650, 400);
  engine.placedTowers = [barrier];
  const hpBefore = flyingBoss.hp;
  const barrierBefore = barrier.hp;
  engine.hazards = [{
    x: flyingBoss.x,
    y: flyingBoss.y,
    radius: 100,
    damage: 80,
    life: 2,
    tickTimer: 0,
    ground: true,
    sourceDefense: mine
  }];

  assert.equal(engine.canDefenseTargetEnemy(mine, flyingBoss), false);
  engine.updateHazards(0.5);
  engine.updateEnemies(0.05);
  assert.equal(flyingBoss.hp, hpBefore);
  assert.equal(barrier.hp, barrierBefore);

  const specialization = engine.getDefenseSpecializationOptions(antiAir)
    .find(option => Number(option.modifiers?.flyingDamageMultiplier) > 1);
  assert.ok(specialization);
  antiAir.specializationId = specialization.id;
  engine.damageEnemyFromDefense(antiAir, flyingBoss, 100);
  assert.ok(hpBefore - flyingBoss.hp > 100);
});

test('les sept coupes de Hana frappent bien sept fois un boss isole', () => {
  const {
    GameEngine, HERO_CLASSES, CHARACTER_EXPANSION
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.selectedHero = HERO_CLASSES.hana;
  const boss = engine.spawnEnemy('noctis', 0, {
    x: 760,
    y: 400,
    hpMultiplier: 20,
    countForWave: false,
    isBoss: true
  });
  boss.shield = 0;
  const before = boss.hp;
  engine.applySelectedHeroUltimate();
  const effect = CHARACTER_EXPANSION.heroKits.hana.ultimate.effect;
  const expected = effect.strikeCount * effect.strikeDamage * effect.bossDamageMultiplier;
  assert.equal(Math.round(before - boss.hp), Math.round(expected));
});

test('une chasse de Codex ne donne ni victoire ni recompense de campagne', () => {
  const {
    GameEngine
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.activeCampaignId = 'ten_thrones';
  engine.activeBossHuntId = 'noctis';
  engine.wave = 20;
  engine.waveActive = true;
  engine.waveRewardClaimed = false;
  engine.metaCoins = 90;
  engine.runMetaCoinsEarned = 12;
  engine.bestWave = 7;
  engine.bestScore = 1234;
  engine.score = 80;
  let codexOpened = false;
  engine.openAntagonistCodex = () => { codexOpened = true; };

  engine.completeWave();

  assert.equal(engine.campaignVictory, false);
  assert.equal(engine.campaignVictoryClaimed, false);
  assert.equal(engine.activeBossHuntId, null);
  assert.equal(engine.metaCoins, 90);
  assert.equal(engine.runMetaCoinsEarned, 12);
  assert.equal(engine.bestWave, 7);
  assert.equal(engine.bestScore, 1234);
  assert.equal(engine.score, 80);
  assert.equal(codexOpened, true);
});

test('le Codex rend les dix portraits et verrouille les chasses non vaincues', () => {
  const module = loadGameModule();
  const grid = createElement('div');
  const elements = new Map([
    ['antagonist-codex-grid', grid],
    ['antagonist-codex-modal', createElement('div')],
    ['hq-menu-modal', createElement('div')]
  ]);
  module.document.getElementById = id => elements.get(id) || null;
  const engine = createEngine(module.GameEngine);
  let openedModal = '';
  engine.closeModal = () => {};
  engine.openModal = modal => {
    openedModal = typeof modal === 'string' ? modal : modal?.id || '';
  };

  engine.openAntagonistCodex();

  assert.equal(grid.children.length, 10);
  assert.equal(openedModal, 'antagonist-codex-modal');
  grid.children.forEach(card => {
    assert.equal(card.children.length, 2);
    const [preview, body] = card.children;
    assert.match(preview.style.backgroundImage, /assets\/characters\/villains\/.+-portrait-v1\.webp/u);
    assert.ok(preview.classList.contains('uses-portrait'));
    assert.ok(body.children.some(child => child.className === 'antagonist-signature'));
    assert.ok(body.children.some(child => child.className === 'antagonist-phases'));
    const hunt = body.children.find(child => child.className?.includes('antagonist-hunt-btn'));
    assert.ok(hunt);
    assert.equal(hunt.disabled, true);
    assert.equal(hunt.textContent, 'CHASSE VERROUILLÉE');
  });
});

test('une chasse de Trone devient rejouable uniquement apres sa premiere victoire', () => {
  const module = loadGameModule();
  const engine = createEngine(module.GameEngine);
  engine.startNewGame = () => {};
  engine.closeModal = () => {};
  engine.configureWave = wave => { engine.wave = wave; };
  engine.clearRunCheckpoint = () => {};
  engine.focusBattlefield = () => {};

  assert.equal(engine.startVillainHunt('xyra'), false);
  assert.equal(engine.activeBossHuntId, null);

  engine.defeatedBossIds.push('xyra');
  assert.equal(engine.startVillainHunt('xyra'), true);
  assert.equal(engine.activeBossHuntId, 'xyra');
  assert.equal(engine.wave, 2);
});

test('la victoire Dix Trones debloque sa conclusion et Quatre Portes restaure son texte', () => {
  const elements = new Map([
    ['victory-title', createElement('h2')],
    ['victory-description', createElement('p')],
    ['victory-ending-copy', createElement('p')]
  ]);
  const module = loadGameModule();
  module.document.getElementById = id => elements.get(id) || null;
  const campaignEngine = createEngine(module.GameEngine);
  campaignEngine.openModal = () => {};
  campaignEngine.recordRunHistory = () => {};
  campaignEngine.unlockAchievement = () => {};
  campaignEngine.activeCampaignId = 'ten_thrones';
  campaignEngine.triggerCampaignVictory();
  const conclusion = module.GALLERY_ITEMS.find(item => item.id === 'ten_thrones_conclusion');
  assert.equal(conclusion.unlocked, true);
  assert.equal(campaignEngine.metaCoins, 500);
  assert.match(elements.get('victory-title').textContent, /Madame Noctis/u);

  campaignEngine.campaignVictory = false;
  campaignEngine.campaignVictoryClaimed = false;
  campaignEngine.activeCampaignId = 'four_gates';
  campaignEngine.triggerCampaignVictory();
  assert.equal(elements.get('victory-title').textContent, 'LE LÉVIATHAN EST NEUTRALISÉ');
  assert.match(elements.get('victory-description').textContent, /Quatre Portes/u);
});

test('le bouton de pouvoir arme un ciblage puis les six kits appliquent un effet au clic', () => {
  const { GameEngine, HERO_CLASSES, TOWER_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);

  engine.selectedHero = HERO_CLASSES.aria;
  assert.equal(engine.triggerHeroAbility().ok, true);
  assert.equal(engine.abilityCooldownTimer, 0, 'le cooldown commence seulement apres le clic cible');
  assert.equal(engine.executeHeroAbilityAt(700, 400).ok, true);
  assert.ok(engine.decoys.some(decoy => decoy.shieldHp > 0));

  engine.abilityCooldownTimer = 0;
  engine.selectedHero = HERO_CLASSES.kira;
  engine.triggerHeroAbility();
  engine.executeHeroAbilityAt(720, 400);
  assert.ok(engine.decoys.some(decoy => decoy.heroId === 'kira' && decoy.explosionDamage > 0));

  engine.abilityCooldownTimer = 0;
  engine.selectedHero = HERO_CLASSES.rin;
  engine.triggerHeroAbility();
  engine.executeHeroAbilityAt(740, 400);
  assert.ok(engine.hazards.some(hazard => hazard.ground === false));

  engine.enemies = [];
  const lunarTarget = engine.spawnEnemy('swarmer', 0, { x: 760, y: 400, countForWave: false });
  engine.abilityCooldownTimer = 0;
  engine.selectedHero = HERO_CLASSES.selene;
  engine.triggerHeroAbility();
  assert.equal(engine.executeHeroAbilityAt(900, 400).ok, true);
  assert.ok(lunarTarget.dead || lunarTarget.slowTimer > 0);

  const convertTarget = engine.spawnEnemy('brute', 0, { x: 700, y: 400, countForWave: false });
  engine.abilityCooldownTimer = 0;
  engine.selectedHero = HERO_CLASSES.vespera;
  engine.triggerHeroAbility();
  assert.equal(engine.executeHeroAbilityAt(700, 400).ok, true);
  assert.ok(convertTarget.convertedTimer > 0);

  const defense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 680, 470);
  engine.placedTowers = [defense];
  engine.abilityCooldownTimer = 0;
  engine.selectedHero = HERO_CLASSES.carmilla;
  engine.triggerHeroAbility();
  assert.equal(engine.executeHeroAbilityAt(680, 470).ok, true);
  assert.ok(defense.abilityBuffTimer > 0);

  engine.abilityCooldownTimer = 0;
  engine.triggerHeroAbility();
  assert.equal(engine.cancelHeroAbilityTargeting(), true);
  assert.equal(engine.activeHeroTargeting, null);
});

test('les dix nouvelles heroines appliquent leur actif unique sur le champ de bataille', () => {
  const { GameEngine, HERO_CLASSES, TOWER_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);
  const useActive = (heroId, x = 760, y = 400) => {
    engine.selectedHero = HERO_CLASSES[heroId];
    engine.abilityCooldownTimer = 0;
    assert.equal(engine.triggerHeroAbility().ok, true, `${heroId}: ciblage`);
    assert.equal(engine.executeHeroAbilityAt(x, y).ok, true, `${heroId}: execution`);
  };

  useActive('nyx');
  assert.ok(engine.hazards.some(hazard => hazard.heroId === 'nyx' && hazard.damageTakenMultiplier > 1));

  const chronoDefense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 760, 400);
  engine.placedTowers = [chronoDefense];
  const chronoRate = chronoDefense.fireRate;
  useActive('aurelia');
  assert.ok(chronoDefense.fireRate < chronoRate && chronoDefense.abilityBuffTimer > 0);

  engine.enemies = [];
  const broadsideTarget = engine.spawnEnemy('brute', 0, { x: 760, y: 400, countForWave: false });
  const broadsideHp = broadsideTarget.hp;
  useActive('maris');
  assert.ok(broadsideTarget.dead || broadsideTarget.hp < broadsideHp);

  useActive('zahra');
  assert.ok(engine.decoys.some(decoy => decoy.heroId === 'zahra' && decoy.pulseDamage > 0));

  useActive('mircalla');
  assert.ok(engine.decoys.some(decoy => decoy.heroId === 'mircalla' && decoy.projectileInterceptions > 0));

  engine.enemies = [];
  const requiemTarget = engine.spawnEnemy('brute', 0, { x: 760, y: 400, countForWave: false });
  useActive('isolde');
  assert.ok(requiemTarget.damageDebuffTimer > 0);

  engine.enemies = [];
  const cutTarget = engine.spawnEnemy('brute', 0, { x: 760, y: 400, countForWave: false });
  const cutHp = cutTarget.hp;
  useActive('hana', 950, 400);
  assert.ok(cutTarget.dead || cutTarget.hp < cutHp);

  useActive('freyja');
  assert.ok(engine.hazards.some(hazard => hazard.heroId === 'freyja' && hazard.slowMultiplier < 1));

  engine.enemies = [];
  const solarTarget = engine.spawnEnemy('brute', 0, { x: 760, y: 400, countForWave: false });
  const solarHp = solarTarget.hp;
  useActive('vega', 950, 400);
  assert.ok(solarTarget.dead || solarTarget.hp < solarHp);

  useActive('amara');
  assert.ok(engine.hazards.some(hazard => hazard.heroId === 'amara' && hazard.armorReduction > 0));
});

test('les dix nouveaux ultimes modifient reellement hordes defenses ou projectiles', () => {
  const { GameEngine, HERO_CLASSES, TOWER_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);
  const freshTarget = (type = 'brute') => {
    engine.enemies = [];
    return engine.spawnEnemy(type, 0, { x: 760, y: 400, hpMultiplier: 12, countForWave: false });
  };
  const useUltimate = heroId => {
    engine.selectedHero = HERO_CLASSES[heroId];
    engine.applySelectedHeroUltimate();
  };

  let target = freshTarget();
  useUltimate('nyx');
  assert.ok(target.stunTimer > 0);

  engine.placedTowers = [engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 700, 400)];
  const baseRate = engine.placedTowers[0].fireRate;
  useUltimate('aurelia');
  assert.ok(target.stunTimer > 0 && engine.placedTowers[0].fireRate < baseRate);

  target = freshTarget();
  const marisHp = target.hp;
  useUltimate('maris');
  assert.ok(target.hp < marisHp);

  engine.decoys = [];
  useUltimate('zahra');
  assert.equal(engine.decoys.length, engine.spawnRoutes.length);
  assert.ok(engine.decoys.every(decoy => decoy.projectileInterceptions > 0));

  target = freshTarget('artillery');
  useUltimate('mircalla');
  assert.ok(target.stunTimer > 0 && target.hp < target.maxHp);

  target = freshTarget();
  const isoldeHp = target.hp;
  useUltimate('isolde');
  assert.ok(target.hp < isoldeHp);

  target = freshTarget();
  const hanaHp = target.hp;
  useUltimate('hana');
  assert.ok(target.hp < hanaHp);

  target = freshTarget();
  target.slowTimer = 2;
  const frozenX = target.x;
  useUltimate('freyja');
  assert.ok(target.x !== frozenX && target.hp < target.maxHp);

  target = freshTarget();
  engine.enemyBullets = [{ x: 650, y: 400, vx: 0, vy: 0, damage: 1, radius: 2 }];
  useUltimate('vega');
  assert.equal(engine.enemyBullets.length, 0);

  target = freshTarget();
  engine.hazards = [];
  engine.citadel.hp = engine.citadel.maxHp / 2;
  const woundedHp = engine.citadel.hp;
  useUltimate('amara');
  assert.ok(engine.hazards.length > 0 && engine.citadel.hp > woundedHp);
});

test('la specialisation de niveau 2 applique ses modificateurs et sa priorite de cible', () => {
  const { GameEngine, TOWER_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);
  const defense = engine.createPlacedDefense(TOWER_TYPES.missile_pod, 600, 400);
  engine.placedTowers = [defense];
  engine.coins = 1000;
  const upgrade = engine.upgradeDefense(defense);
  assert.equal(upgrade.requiresSpecialization, true);
  const bunkerBuster = upgrade.specializationOptions.find(option => option.id === 'missile_bunker_buster');
  assert.ok(bunkerBuster);
  const unmodifiedDamage = defense.damage;
  assert.equal(engine.chooseDefenseSpecialization(defense, bunkerBuster.id).ok, true);
  assert.ok(defense.damage > unmodifiedDamage);
  assert.ok(defense.targetPriorities.includes('artillery'));

  const nearbySwarmer = engine.spawnEnemy('swarmer', 0, { x: 640, y: 400, countForWave: false });
  const artillery = engine.spawnEnemy('artillery', 0, { x: 820, y: 400, countForWave: false });
  assert.equal(engine.findTarget(600, 400, defense.range, defense), artillery);
  assert.notEqual(nearbySwarmer, artillery);
});

test('Infinitum cumule ses mutateurs et ne rend le QG qu aux paliers de dix', () => {
  const { GameEngine, EXPANSION } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.towerMutators = [EXPANSION.infinitumMutators[0], EXPANSION.infinitumMutators[1]];
  engine.configureWave(9, { towerMode: true, mutators: engine.towerMutators });
  assert.equal(engine.canReturnFromInfinitum(), false);
  engine.waveActive = false;
  engine.enemies = [];
  engine.advanceWave();
  assert.equal(engine.wave, 10);
  assert.equal(engine.isTowerMode, true);
  assert.equal(engine.towerMutators.length, 2);
  engine.infinitumCanReturn = true;
  assert.equal(engine.canReturnFromInfinitum(), true);
});

test('le defi quotidien est seede et l historique sauvegarde seulement dix runs', () => {
  const { GameEngine, EXPANSION, localStorage } = loadGameModule();
  const engine = createEngine(GameEngine);
  const first = engine.startDailyChallenge('2026-07-29T12:00:00Z', 'qa');
  const expected = EXPANSION.utils.createDailyChallenge('2026-07-29T20:00:00Z', 'qa');
  assert.equal(first.seed, expected.seed);
  assert.equal(first.layoutId, expected.layoutId);
  assert.deepEqual([...first.mutatorIds], [...expected.mutatorIds]);

  const rngA = EXPANSION.utils.createSeededRng(first.seed);
  const rngB = EXPANSION.utils.createSeededRng(expected.seed);
  assert.deepEqual(
    Array.from({ length: 8 }, () => rngA()),
    Array.from({ length: 8 }, () => rngB())
  );

  for (let index = 0; index < 12; index++) {
    engine.recordRunHistory({ id: `run-${index}`, score: index });
  }
  assert.equal(engine.runHistory.length, 10);
  assert.equal(engine.runHistory[0].id, 'run-11');
  const save = JSON.parse(localStorage.getItem('valkyrie_sweeper_save'));
  assert.equal(save.runHistory.length, 10);
});

test('la rotation de carte attend une intermission vide et conserve les defenses', () => {
  const { GameEngine, TOWER_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.applyWorldLayout('convergence', { force: true, repositionUnits: false });
  const defense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 700, 400);
  engine.placedTowers = [defense];
  engine.setMapRotation(['convergence', 'western_wall', 'southern_watch']);
  engine.waveActive = true;
  assert.equal(engine.rotateWorldLayoutBetweenWaves(), false);
  engine.waveActive = false;
  engine.enemies = [];
  assert.equal(engine.rotateWorldLayoutBetweenWaves(), true);
  assert.equal(engine.selectedLayoutId, 'western_wall');
  assert.equal(engine.placedTowers.length, 1);
  assert.ok(defense.x >= engine.worldLayout.buildBounds.minX);
  assert.ok(defense.y >= engine.worldLayout.buildBounds.minY);
});

test('le runtime VN 2.3 charge les vraies CG, les expressions et une memoire de lore sans effet militaire', () => {
  const {
    GameEngine, HERO_CLASSES, document, window, audio
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const expansion = window.INFERNAL_VN_EXPANSION;
  const chapter = engine.getVnChapter('aria', 'midnight-relief');
  const expansionChapter = expansion.getChapter('aria', chapter.id);
  const scene = createElement('img');
  const expression = createElement('div');
  const status = createElement('p');
  const history = createElement('ol');
  const lore = createElement('fieldset');
  const prompt = createElement('legend');
  const elements = new Map([
    ['vn-scene-img', scene],
    ['vn-expression-portrait', expression],
    ['vn-status', status],
    ['vn-history-list', history],
    ['vn-lore-container', lore],
    ['vn-lore-prompt', prompt]
  ]);
  document.getElementById = id => elements.get(id) || null;

  HERO_CLASSES.aria.romanceOptIn = true;
  audio.currentStation = 'heavy';
  audio.setStation = station => { audio.currentStation = station; };
  engine.syncVnExpansionConsent('aria', true);
  engine.activeVnSession = {
    heroId: 'aria',
    chapterId: chapter.id,
    beatId: chapter.entryBeat,
    lineIndex: 0,
    history: [],
    isReplay: false
  };
  const before = {
    score: engine.score,
    coins: engine.coins,
    wave: engine.wave,
    hp: engine.citadel.hp
  };
  engine.setVnSceneImage('aria', chapter);
  engine.setVnExpressionMood('aria', 'warm', chapter.id);
  engine.chooseVnLoreOption(expansionChapter.loreChoices[0]);

  assert.equal(scene.src, 'assets/vn/cg/chapters/aria-midnight-relief.webp');
  assert.equal(audio.currentStation, 'industrial');
  assert.match(expression.style.backgroundImage, /aria-expressions-v1\.webp/u);
  assert.equal(expression.hidden, false);
  assert.equal(engine.vnExpansionState.heroines.aria.memories.length, 1);
  assert.equal(engine.vnExpansionState.heroines.aria.traits.devoir, 1);
  assert.deepEqual(
    { score: engine.score, coins: engine.coins, wave: engine.wave, hp: engine.citadel.hp },
    before,
    'une branche narrative ne modifie aucune ressource ni statistique militaire'
  );
  engine.setVnSceneImage('aria');
  assert.equal(audio.currentStation, 'heavy', 'la station choisie par le joueur est restauree');

  engine.syncVnExpansionConsent('aria', false);
  assert.equal(engine.vnExpansionState.heroines.aria.consent.revoked, true);
  assert.equal(engine.vnExpansionState.heroines.aria.consent.granted, false);
});

test('les reglages 2.3 persistent son, contraste, texte et la sauvegarde portable valide avant ecriture', async () => {
  const {
    GameEngine, localStorage, document
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.musicVolume = 0.35;
  engine.sfxVolume = 0.55;
  engine.contrastMode = 'high';
  engine.textSize = 'large';
  engine.applyVisualPreferences();
  engine.saveProgress();

  const saved = JSON.parse(localStorage.getItem('valkyrie_sweeper_save'));
  assert.equal(saved.musicVolume, 0.35);
  assert.equal(saved.sfxVolume, 0.55);
  assert.equal(saved.contrastMode, 'high');
  assert.equal(saved.textSize, 'large');
  assert.equal(document.body.dataset.contrast, 'high');
  assert.equal(document.body.dataset.textSize, 'large');

  const portable = engine.createPortableSavePayload();
  assert.equal(portable.schema, 'infernal-city.portable-save/1');
  assert.equal(portable.campaign.version, 8);
  assert.equal(portable.narrative.dataVersion, 1);
  const original = localStorage.getItem('valkyrie_sweeper_save');
  const settingsStatus = createElement('p');
  document.getElementById = id => id === 'settings-status' ? settingsStatus : null;
  const rejected = await engine.importPortableSaveFile({
    size: 32,
    text: async () => '{"version":999}'
  });
  assert.equal(rejected, false);
  assert.equal(localStorage.getItem('valkyrie_sweeper_save'), original);
  assert.match(settingsStatus.textContent, /Import refus/u);
});

test('les sauvegardes campagne et VN futures restent bloquees et exportables sans reecriture', () => {
  const campaignRaw = '{"version":999,"metaCoins":777,"futureField":{"keep":true}}';
  const narrativeRaw = '{"dataVersion":99,"futureMemory":["keep-verbatim"]}';
  const {
    GameEngine, localStorage
  } = loadGameModule({
    valkyrie_sweeper_save: campaignRaw,
    'infernalCity.vnExpansion.v1': narrativeRaw
  });
  const engine = createEngine(GameEngine);

  assert.equal(engine.storageWriteBlocked, true);
  assert.equal(engine.narrativeStorageWriteBlocked, true);
  assert.equal(engine.futureCampaignSaveRaw, campaignRaw);
  assert.equal(engine.futureNarrativeSaveRaw, narrativeRaw);
  assert.equal(engine.saveProgress(), false);
  engine.syncVnExpansionConsent('aria', true);
  assert.equal(localStorage.getItem('valkyrie_sweeper_save'), campaignRaw);
  assert.equal(localStorage.getItem('infernalCity.vnExpansion.v1'), narrativeRaw);

  const backup = engine.createPortableSavePayload();
  assert.equal(backup.schema, 'infernal-city.raw-backup/1');
  assert.equal(backup.campaignRaw, campaignRaw);
  assert.equal(backup.narrativeRaw, narrativeRaw);
});

test('un refus de stockage VN reste en memoire et n annonce jamais un faux succes', () => {
  const {
    GameEngine, localStorage, document
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const settingsStatus = createElement('p');
  const studioNote = createElement('p');
  document.getElementById = id => ({
    'settings-status': settingsStatus,
    'studio-consent-note': studioNote
  })[id] || null;
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    if (key === 'infernalCity.vnExpansion.v1') throw new Error('quota exceeded');
    originalSetItem(key, value);
  };

  assert.equal(engine.syncVnExpansionConsent('aria', true), false);
  assert.equal(engine.vnExpansionState.heroines.aria.consent.granted, true);
  assert.equal(engine.narrativeStorageWriteBlocked, false);
  assert.equal(engine.narrativeStorageWriteFailed, true);
  assert.match(settingsStatus.textContent, /active pour cette session, mais non persist.e/u);
  assert.doesNotMatch(settingsStatus.textContent, /souvenir conserv.|progression sauvegard.e/u);

  const portable = engine.createPortableSavePayload();
  assert.equal(portable.schema, 'infernal-city.portable-save/1');
  assert.equal(portable.narrative.heroines.aria.consent.granted, true);
  assert.equal(engine.syncVnExpansionConsent('aria', false), false);
  assert.equal(engine.vnExpansionState.heroines.aria.consent.revoked, true);
  engine.setStudioMaturity('suggestive');
  assert.match(studioNote.textContent, /active pour cette session, mais non persist.e/u);
});

test('un import portable rejette atomiquement une progression narrative future', async () => {
  const {
    GameEngine, localStorage
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.saveProgress();
  const originalCampaign = localStorage.getItem('valkyrie_sweeper_save');
  const originalNarrative = localStorage.getItem('infernalCity.vnExpansion.v1');
  const payload = engine.createPortableSavePayload();
  payload.narrative.dataVersion = 999;

  const accepted = await engine.importPortableSaveFile({
    size: 1024,
    text: async () => JSON.stringify(payload)
  });
  assert.equal(accepted, false);
  assert.equal(localStorage.getItem('valkyrie_sweeper_save'), originalCampaign);
  assert.equal(localStorage.getItem('infernalCity.vnExpansion.v1'), originalNarrative);
});

test('Studio 2 conserve trois poses et ajoute le boudoir signature du nouveau roster', () => {
  const {
    GameEngine, window
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const studio = window.INFERNAL_VN_EXPANSION.studio.heroines.aria;
  assert.equal(studio.poses.length, 3);
  assert.equal(studio.ambiences.length, 3);
  studio.poses.forEach(pose => {
    assert.match(engine.getStudioPreviewSource('aria', pose.id), /^assets\/vn\/cg\/chapters\/.+\.webp$/u);
  });
  const nyxPoses = engine.getStudioPoseOptions('nyx');
  assert.equal(nyxPoses.length, 4);
  assert.equal(nyxPoses.at(-1).id, 'boudoir-signature');
  assert.equal(
    engine.getStudioPreviewSource('nyx', 'boudoir-signature'),
    'assets/vn/cg/boudoir/heroines/nyx-boudoir-v1.webp'
  );
  window.INFERNAL_VN_EXPANSION.studio.conclusionCgs.forEach(conclusion => {
    assert.equal(engine.getStudioConclusionUnlockState(conclusion), false);
  });
});

test('les six passifs de heroine produisent des effets de combat mesurables', () => {
  const {
    GameEngine, HERO_CLASSES, TOWER_TYPES
  } = loadGameModule();
  const engine = createEngine(GameEngine);

  engine.selectedHero = HERO_CLASSES.aria;
  const aegisDefense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 680, 400);
  const distantDefense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 1000, 400);
  assert.ok(aegisDefense.maxHp > distantDefense.maxHp);
  assert.equal(aegisDefense.stunIgnoresRemaining, 1);
  engine.placedTowers = [aegisDefense];
  const artilleryHit = () => ({
    x: aegisDefense.x,
    y: aegisDefense.y,
    vx: 0,
    vy: 0,
    damage: 1,
    radius: 9,
    stunDuration: 1,
    sourceType: 'artillery'
  });
  engine.enemyBullets = [artilleryHit()];
  engine.updateEnemyBullets(0);
  assert.equal(aegisDefense.disabledTimer, 0, 'le premier etourdissement est absorbe');
  engine.enemyBullets = [artilleryHit()];
  engine.updateEnemyBullets(0);
  assert.equal(aegisDefense.disabledTimer, 1, 'le suivant interrompt bien la defense');

  engine.selectedHero = HERO_CLASSES.kira;
  engine.enemies = [];
  const firstRouteTarget = engine.spawnEnemy('brute', 0, { x: 800, y: 350, countForWave: false });
  const secondRouteTarget = engine.spawnEnemy('brute', 0, { x: 820, y: 350, countForWave: false });
  const otherRouteTarget = engine.spawnEnemy('brute', 1, { x: 800, y: 450, countForWave: false });
  engine.damageEnemy(firstRouteTarget, 1);
  engine.damageEnemy(secondRouteTarget, 1);
  engine.damageEnemy(otherRouteTarget, 1);
  assert.ok(firstRouteTarget.markedDamageTakenMultiplier > 1);
  assert.equal(secondRouteTarget.markedDamageTakenMultiplier, 1);
  assert.ok(otherRouteTarget.markedDamageTakenMultiplier > 1);

  engine.selectedHero = HERO_CLASSES.rin;
  const emberTarget = engine.spawnEnemy('brute', 0, { x: 760, y: 400, countForWave: false });
  for (let stack = 0; stack < 8; stack++) engine.applyRinArmorBreak(emberTarget);
  assert.equal(emberTarget.rinEmberStacks, 5);
  assert.ok(emberTarget.armorBreakMultiplier > 1.17);

  engine.selectedHero = HERO_CLASSES.selene;
  engine.enemies = [];
  const lunarDefense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 600, 400);
  const slowedTarget = engine.spawnEnemy('brute', 0, { x: 710, y: 400, countForWave: false });
  slowedTarget.slowTimer = 2;
  assert.equal(engine.findTarget(600, 400, 100, lunarDefense), slowedTarget);
  slowedTarget.slowTimer = 0;
  assert.equal(engine.findTarget(600, 400, 100, lunarDefense), null);

  engine.selectedHero = HERO_CLASSES.vespera;
  engine.enemies = [];
  const tributeDefense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 700, 400);
  engine.placedTowers = [tributeDefense];
  engine.coins = 0;
  engine.getRunRandom = () => 0.1;
  const elite = engine.spawnEnemy('brute', 0, { x: 680, y: 400, countForWave: false });
  engine.killEnemy(elite);
  assert.equal(engine.coins, 23, 'Vespera multiplie la récompense authored de la Brute');
  assert.ok(tributeDefense.imperialBuffTimer > 0);
  assert.ok(tributeDefense.imperialDamageMultiplier > 1);

  engine.selectedHero = HERO_CLASSES.carmilla;
  engine.citadel.hp = engine.citadel.maxHp;
  engine.healCitadel(40);
  assert.equal(engine.carmillaStoredCharge, 18);
  const pactDefense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 680, 470);
  engine.placedTowers = [pactDefense];
  const baseDamage = pactDefense.damage;
  engine.abilityCooldownTimer = 0;
  engine.triggerHeroAbility();
  assert.equal(engine.executeHeroAbilityAt(680, 470).ok, true);
  assert.ok(pactDefense.damage > baseDamage * 1.75);
  assert.equal(engine.carmillaStoredCharge, 0);
});

test('les dix nouveaux passifs produisent chacun un effet de combat mesurable', () => {
  const { GameEngine, HERO_CLASSES, TOWER_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);

  engine.selectedHero = HERO_CLASSES.nyx;
  engine.enemies = [];
  const firstPacket = engine.spawnEnemy('brute', 0, { x: 850, y: 400, countForWave: false });
  const secondPacket = engine.spawnEnemy('brute', 0, { x: 870, y: 400, countForWave: false });
  engine.damageEnemy(firstPacket, 1);
  engine.damageEnemy(secondPacket, 1);
  assert.ok(firstPacket.markedDamageTakenMultiplier > 1);
  assert.equal(secondPacket.markedDamageTakenMultiplier, 1);

  engine.selectedHero = HERO_CLASSES.aurelia;
  const brassDefense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 680, 400);
  brassDefense.hp = brassDefense.maxHp / 2;
  engine.placedTowers = [brassDefense];
  const brassHp = brassDefense.hp;
  engine.update(0.25);
  assert.ok(brassDefense.hp > brassHp);

  engine.selectedHero = HERO_CLASSES.maris;
  engine.enemies = [];
  engine.coins = 0;
  engine.getRunRandom = () => 0.1;
  const distantPrize = engine.spawnEnemy('runner', 0, { x: 1000, y: 400, countForWave: false });
  engine.killEnemy(distantPrize);
  assert.ok(engine.coins >= 9, 'Maris ajoute sa part à la récompense authored du Runner');

  engine.selectedHero = HERO_CLASSES.zahra;
  engine.enemies = [];
  engine.decoys = [{ x: 760, y: 400, radius: 100, life: 5, pulseDamage: 0, pulseRadius: 0 }];
  const redirected = engine.spawnEnemy('brute', 0, { x: 800, y: 400, countForWave: false });
  engine.updateEnemies(0.05);
  assert.ok(redirected.slowTimer > 0 && redirected.markedDamageTakenMultiplier > 1);

  engine.selectedHero = HERO_CLASSES.mircalla;
  engine.enemies = [];
  const retaliationTarget = engine.spawnEnemy('brute', 0, { x: 760, y: 400, countForWave: false });
  const retaliationHp = retaliationTarget.hp;
  engine.mircallaRetaliationCharge = 35;
  engine.decoys = [{
    x: 700, y: 400, radius: 80, life: 5, projectileInterceptions: 1,
    pulseDamage: 0, pulseRadius: 0
  }];
  engine.enemyBullets = [{ x: 700, y: 400, vx: 0, vy: 0, damage: 1, radius: 4 }];
  engine.updateEnemyBullets(0);
  assert.ok(retaliationTarget.hp < retaliationHp);

  engine.selectedHero = HERO_CLASSES.isolde;
  engine.enemies = [];
  const grievingElite = engine.spawnEnemy('artillery', 0, { x: 850, y: 400, countForWave: false });
  grievingElite.hp = grievingElite.maxHp * 0.4;
  engine.update(0.05);
  assert.ok(grievingElite.damageDebuffMultiplier < 1);

  engine.selectedHero = HERO_CLASSES.hana;
  engine.enemies = [];
  const chargedCut = engine.spawnEnemy('brute', 0, { x: 800, y: 400, hpMultiplier: 10, countForWave: false });
  const chargedHp = chargedCut.hp;
  engine.hanaPassiveReady = true;
  engine.damageEnemy(chargedCut, 100);
  assert.equal(Math.round(chargedHp - chargedCut.hp), 145);

  engine.selectedHero = HERO_CLASSES.freyja;
  const rimedHeavy = engine.spawnEnemy('brute', 0, { x: 820, y: 400, countForWave: false });
  rimedHeavy.slowTimer = 2;
  engine.damageEnemy(rimedHeavy, 1);
  assert.ok(rimedHeavy.armorBreakMultiplier > 1);

  engine.selectedHero = HERO_CLASSES.vega;
  const solarDefense = engine.createPlacedDefense(TOWER_TYPES.plasma_mortar, 680, 400);
  const shadowTarget = engine.spawnEnemy('umbrael', 0, {
    x: 820, y: 400, hpMultiplier: 10, countForWave: false, isBoss: true
  });
  const shadowHp = shadowTarget.hp;
  engine.damageEnemyFromDefense(solarDefense, shadowTarget, 100);
  assert.ok(shadowHp - shadowTarget.hp > 117);

  engine.selectedHero = HERO_CLASSES.amara;
  const gardenDefense = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 700, 400);
  gardenDefense.hp = gardenDefense.maxHp / 2;
  engine.placedTowers = [gardenDefense];
  engine.hazards = [{
    x: 700, y: 400, radius: 125, damage: 0, life: 2, tickTimer: 0,
    color: '#34d399', ground: false
  }];
  const gardenHp = gardenDefense.hp;
  engine.updateHazards(0.5);
  assert.ok(gardenDefense.hp > gardenHp);
});

test('la manette pilote camera zoom curseur et pouvoir sans bloquer le clavier', () => {
  const {
    GameEngine, navigator
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
  buttons[2] = { pressed: true, value: 1 };
  buttons[7] = { pressed: false, value: 1 };
  navigator.getGamepads = () => [{
    index: 0,
    connected: true,
    id: 'QA Pad',
    axes: [1, 0, 1, 0],
    buttons
  }];
  engine.connectedGamepadIndex = 0;
  engine.worldLayout = { buildBounds: { minX: 100, minY: 100, maxX: 1100, maxY: 700 } };
  engine.buildCursor = { x: 600, y: 400, visible: false };
  engine.getBattlefieldView = () => ({
    scale: 1,
    screenCenterX: 600,
    screenCenterY: 400
  });
  let panned = 0;
  let zoomed = 0;
  let powerArmed = 0;
  engine.panBattlefieldCameraBy = () => { panned++; };
  engine.zoomBattlefieldCameraBy = () => { zoomed++; };
  engine.triggerHeroAbility = () => { powerArmed++; };

  assert.equal(engine.updateGamepadControls(0.5), true);
  assert.equal(panned, 1);
  assert.equal(zoomed, 1);
  assert.ok(engine.buildCursor.x > 600);
  assert.equal(engine.buildCursor.visible, true);
  assert.equal(powerArmed, 1);
});

test('la manette avance choisit et met en pause une route corporelle VN', () => {
  const {
    GameEngine, document, navigator
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
  navigator.getGamepads = () => [{
    index: 0,
    connected: true,
    id: 'QA VN Pad',
    axes: [0, 0, 0, 0],
    buttons
  }];
  engine.connectedGamepadIndex = 0;

  let phase = 'dialogue';
  let advances = 0;
  let selections = 0;
  let pauses = 0;
  const choices = [0, 1, 2].map(() => ({
    focus() { document.activeElement = this; },
    closest(selector) { return selector === '.body-route-vn-choice' ? this : null; },
    click() { selections++; }
  }));
  const modal = {
    id: 'body-route-vn-modal',
    querySelectorAll(selector) {
      return selector === '.body-route-vn-choice' ? choices : [];
    },
    querySelector(selector) {
      return selector === '.body-route-vn-choice' ? choices[0] : null;
    }
  };
  engine.getTopOpenModal = () => modal;
  engine.getActiveBodyRouteContext = () => ({ node: { kind: phase } });
  engine.advanceBodyRouteDialogue = () => { advances++; };
  engine.pauseBodyRouteToArchives = () => { pauses++; };

  buttons[0] = { pressed: true, value: 1 };
  assert.equal(engine.updateGamepadControls(0.016), true);
  assert.equal(advances, 1);

  buttons[0] = { pressed: false, value: 0 };
  engine.updateGamepadControls(0.016);
  phase = 'choice';
  document.activeElement = choices[0];
  buttons[13] = { pressed: true, value: 1 };
  engine.updateGamepadControls(0.016);
  assert.equal(document.activeElement, choices[1]);

  buttons[13] = { pressed: false, value: 0 };
  engine.updateGamepadControls(0.016);
  buttons[0] = { pressed: true, value: 1 };
  engine.updateGamepadControls(0.016);
  assert.equal(selections, 1);

  buttons[0] = { pressed: false, value: 0 };
  engine.updateGamepadControls(0.016);
  buttons[1] = { pressed: true, value: 1 };
  engine.updateGamepadControls(0.016);
  assert.equal(pauses, 1);
});

test('entrer dans le jeu initialise le runtime puis conserve le chargement des atlas a la demande', () => {
  const {
    GameEngine, document
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const gate = createElement('div');
  gate.classList.add('active');
  document.getElementById = id => id === 'adult-gate-modal' ? gate : null;
  engine.spriteAtlasImages = { 'assets/environment/map-western-wall.webp': {} };
  engine.enemySpriteImages = {};
  engine.towerSpriteImages = {};
  engine.heroSpriteImages = {};
  engine.syncMusicButtonState = () => {};
  engine.syncModalAccessibility = () => {};
  engine.openMissionBriefing = () => {};
  let preloads = 0;
  engine.preloadBattleSprites = () => { preloads++; };

  engine.enterAdultExperience();
  assert.equal(preloads, 1, 'Le terrain et la cité doivent être préchauffés après le consentement');
  assert.equal(engine.playableExperienceInitialized, true);
  assert.equal(gate.classList.contains('active'), false);
});

test('le prechauffage initial differe les heroines 2.4 non selectionnees et les dix Trones', () => {
  const {
    GameEngine, HERO_CLASSES, CHARACTER_EXPANSION
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.selectedHero = HERO_CLASSES.nyx;
  engine.hasEnteredAdultExperience = true;
  engine.preloadSpriteAsset = src => ({
    src,
    addEventListener() {}
  });

  engine.preloadBattleSprites();

  Object.keys(CHARACTER_EXPANSION.heroines).forEach(heroId => {
    assert.equal(
      Boolean(engine.heroSpriteImages[heroId]),
      heroId === 'nyx',
      `${heroId} ne doit être chargé que si elle est sélectionnée`
    );
  });
  Object.keys(CHARACTER_EXPANSION.bossDefinitions).forEach(bossId => {
    assert.equal(engine.enemySpriteImages[bossId], undefined, `${bossId} doit rester différé`);
  });
  ['aria', 'kira', 'rin', 'selene', 'vespera', 'carmilla'].forEach(heroId => {
    assert.equal(engine.heroSpriteImages[heroId], undefined, `${heroId} historique non sélectionnée doit rester différée`);
  });
});

test('une vague et un spawn direct prechauffent seulement le Trone requis', () => {
  const {
    GameEngine
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.hasEnteredAdultExperience = true;
  const ensured = [];
  engine.ensureEnemySprite = type => {
    ensured.push(type);
    return {};
  };

  const waveBosses = engine.preloadWaveCharacterBosses([
    { type: 'runner' },
    { type: 'xyra' },
    { type: 'xyra' }
  ]);
  assert.deepEqual(Array.from(waveBosses), ['xyra']);
  assert.deepEqual(ensured, ['xyra']);

  engine.spawnEnemy('ossuary', 0, { isBoss: true });
  assert.deepEqual(ensured, ['xyra', 'ossuary']);
});

test('changer de commandante charge immediatement son atlas si le portail est franchi', () => {
  const {
    GameEngine, HERO_CLASSES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.hasEnteredAdultExperience = true;
  engine.selectedHero = HERO_CLASSES.amara;
  let ensuredHero = null;
  engine.ensureHeroSprite = heroId => {
    ensuredHero = heroId;
    return {};
  };

  engine.updateHeroPresentation();
  assert.equal(ensuredHero, 'amara');
});

test('le runtime ne tente jamais de remplacer la propriete DOM dataset en lecture seule', () => {
  assert.doesNotMatch(GAME_SOURCE, /\.dataset\s*=/u);
});

test('les libelles dynamiques visibles ne contiennent aucun residu UTF-8 mal decode', () => {
  assert.doesNotMatch(GAME_SOURCE, /camÃ©ra|TRIBUT Ã—|âš¡|RÃ‰SERVE|rÃ©serve|Ã©carlate|prÃªt/u);
});

test('les cinematiques des Trones sont mises en file une seule fois par sortie', () => {
  const {
    GameEngine, document
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.hasEnteredAdultExperience = true;
  engine.getTopOpenModal = () => null;
  const ids = [
    'adult-gate-modal',
    'cinematic-modal',
    'cinematic-img',
    'cinematic-title',
    'cinematic-eyebrow',
    'cinematic-description'
  ];
  const elements = Object.fromEntries(ids.map(id => [id, createElement(
    id === 'cinematic-img' ? 'img' : 'div'
  )]));
  document.getElementById = id => elements[id] || null;
  let opened = null;
  engine.openModal = modal => { opened = modal; };

  assert.equal(engine.queueBossCinematic('xyra', 'intro'), true);
  assert.equal(engine.queueBossCinematic('xyra', 'intro'), false);
  assert.equal(engine.activeCinematic.id, 'xyra_intro');
  assert.equal(elements['cinematic-title'].textContent.includes('Xyra Bioforge'), true);
  assert.equal(elements['cinematic-img'].src.endsWith('xyra-intro-v1.webp'), true);
  assert.equal(opened, elements['cinematic-modal']);
});

test('les jalons ouvrent les routes corporelles sans reveler leurs CG avant la fin', () => {
  const {
    GameEngine, ADULT_SCENES, HERO_CLASSES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const nyxBikini = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'nyx_bikini');
  const pairedRomance = ADULT_SCENES.bonusScenes.find(
    scene => scene.id === 'nyx-aurelia_romance'
  );
  const gameOver = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'game_over_tease_01');
  const nyxVariants = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'nyx_body_chubby');
  const xyraVariants = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'xyra_body_maternity');
  const nyxBoudoir = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'nyx_boudoir');
  const xyraBoudoir = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'xyra_boudoir');
  const nyxRitual = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'nyx_private_ritual_before');
  const xyraRitual = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'xyra_private_ritual_before');
  const nyxEros = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'nyx_eros_time_prelude');
  const xyraEros = ADULT_SCENES.bonusScenes.find(scene => scene.id === 'xyra_eros_time_prelude');
  const nyxBodyRoute = engine.getBodyRouteForScene(nyxVariants);
  const xyraBodyRoute = engine.getBodyRouteForScene(xyraVariants);

  assert.equal(engine.isAdultBonusSceneUnlocked(nyxBikini), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(nyxVariants), false);
  assert.equal(engine.isBodyRouteAvailable(nyxBodyRoute), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(nyxBoudoir), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(nyxRitual), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(nyxEros), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(pairedRomance), false);
  assert.equal(engine.isAdultBonusSceneUnlocked(xyraVariants), false);
  assert.equal(engine.isBodyRouteAvailable(xyraBodyRoute), false);
  assert.equal(engine.isAdultBonusSceneUnlocked(xyraBoudoir), false);
  assert.equal(engine.isAdultBonusSceneUnlocked(xyraRitual), false);
  assert.equal(engine.isAdultBonusSceneUnlocked(xyraEros), false);
  HERO_CLASSES.aurelia.unlocked = true;
  assert.equal(engine.isAdultBonusSceneUnlocked(pairedRomance), true);
  engine.defeatedBossIds.push('xyra');
  assert.equal(engine.isBodyRouteAvailable(xyraBodyRoute), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(xyraVariants), false);
  assert.equal(engine.isAdultBonusSceneUnlocked(xyraBoudoir), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(xyraRitual), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(xyraEros), true);
  assert.match(engine.getAdultBonusUnlockLabel(xyraVariants), /route VN/u);
  assert.equal(engine.isAdultBonusSceneUnlocked(gameOver), false);
  engine.bestWave = 8;
  engine.runHistory = [{ victory: true }];
  assert.equal(engine.isAdultBonusSceneUnlocked(gameOver), false);
  engine.runHistory.unshift({ victory: false });
  assert.equal(engine.isAdultBonusSceneUnlocked(gameOver), true);
  assert.equal(engine.score, 0);
  assert.equal(engine.metaCoins, 0);
});

test('les choix et la progression d une route corporelle persistent et sont assainis', () => {
  const {
    GameEngine, ADULT_SCENES, localStorage
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const scene = ADULT_SCENES.bonusScenes.find(item => item.id === 'nyx_body_chubby');
  const route = engine.getBodyRouteForScene(scene);
  const state = engine.getOrCreateBodyRouteState(route);
  const perspective = engine.getBodyRouteNode(route, 'perspective-choice');
  const loreOption = perspective.options.find(option => option.id === 'lore');

  state.status = 'in_progress';
  state.nodeId = perspective.id;
  engine.activeBodyRouteId = route.id;
  engine.renderActiveBodyRouteNode = () => {};
  engine.chooseBodyRouteOption(loreOption);
  state.lineIndex = 3;
  engine.saveProgress();

  const rawSave = JSON.parse(localStorage.getItem('valkyrie_sweeper_save'));
  assert.equal(rawSave.version, 8);
  assert.equal(rawSave.bodyRouteProgress.dataVersion, ADULT_SCENES.bodyRouteDataVersion);
  assert.deepEqual(
    rawSave.bodyRouteProgress.routes[route.id],
    {
      status: 'in_progress',
      nodeId: 'path-lore',
      lineIndex: 3,
      choicePath: ['lore'],
      completed: false
    }
  );

  const restored = createEngine(GameEngine);
  const restoredState = restored.bodyRouteProgress.routes[route.id];
  assert.equal(restoredState.status, 'in_progress');
  assert.equal(restoredState.nodeId, 'path-lore');
  assert.equal(restoredState.lineIndex, 3);
  assert.deepEqual(Array.from(restoredState.choicePath), ['lore']);
  assert.equal(restoredState.completed, false);

  const opening = restored.getBodyRouteNode(route, route.initialNode);
  const sanitized = restored.sanitizeLoadedBodyRouteProgress({
    dataVersion: ADULT_SCENES.bodyRouteDataVersion,
    routes: {
      [route.id]: {
        status: 'invalid',
        nodeId: 'unknown-node',
        lineIndex: 999,
        choicePath: ['unknown-choice', 'lore', null],
        completed: false
      },
      unknown_route: {
        status: 'completed',
        nodeId: 'ending-private',
        lineIndex: 0,
        choicePath: [],
        completed: true
      }
    }
  });
  assert.deepEqual(Object.keys(sanitized.routes), [route.id]);
  assert.equal(sanitized.routes[route.id].status, 'new');
  assert.equal(sanitized.routes[route.id].nodeId, route.initialNode);
  assert.equal(sanitized.routes[route.id].lineIndex, opening.lines.length - 1);
  assert.deepEqual(Array.from(sanitized.routes[route.id].choicePath), ['lore']);
  assert.equal(sanitized.routes[route.id].completed, false);
  assert.deepEqual(
    Object.keys(restored.sanitizeLoadedBodyRouteProgress({
      dataVersion: 'obsolete',
      routes: rawSave.bodyRouteProgress.routes
    }).routes),
    []
  );

  const pollutedRoutes = Object.fromEntries(
    Array.from({ length: 60 }, (_, index) => [`unknown_${index}`, { completed: true }])
  );
  pollutedRoutes[route.id] = {
    status: 'in_progress',
    nodeId: 'path-lore',
    lineIndex: 2,
    choicePath: ['lore'],
    completed: false
  };
  assert.deepEqual(
    Object.keys(restored.sanitizeLoadedBodyRouteProgress({
      dataVersion: ADULT_SCENES.bodyRouteDataVersion,
      routes: pollutedRoutes
    }).routes),
    [route.id]
  );

  const forgedCompletion = restored.sanitizeLoadedBodyRouteProgress({
    dataVersion: ADULT_SCENES.bodyRouteDataVersion,
    routes: {
      [route.id]: {
        status: 'completed',
        nodeId: 'ending-private',
        lineIndex: 6,
        choicePath: ['private'],
        completed: true
      }
    }
  });
  assert.equal(forgedCompletion.routes[route.id].completed, false);
  assert.equal(forgedCompletion.routes[route.id].status, 'new');
});

test('terminer une route corporelle ne revele que sa CG et ne modifie pas le gameplay', () => {
  const {
    GameEngine, ADULT_SCENES, HERO_CLASSES, localStorage
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const scene = ADULT_SCENES.bonusScenes.find(item => item.id === 'nyx_body_chubby');
  const siblingScene = ADULT_SCENES.bonusScenes.find(item => item.id === 'nyx_body_maternity');
  const route = engine.getBodyRouteForScene(scene);
  const state = engine.getOrCreateBodyRouteState(route);
  const ending = engine.getBodyRouteNode(route, 'ending-private');
  const nyx = HERO_CLASSES.nyx;
  const gameplayBefore = {
    wave: engine.wave,
    score: engine.score,
    coins: engine.coins,
    metaCoins: engine.metaCoins,
    totalCoinsEarned: engine.totalCoinsEarned,
    xp: engine.xp,
    level: engine.level,
    citadelHp: engine.citadel.hp,
    affinityLvl: nyx.affinityLvl,
    relationshipXp: nyx.relationshipXp,
    romanceOptIn: nyx.romanceOptIn,
    privateMomentUnlocked: nyx.privateMomentUnlocked,
    defeatedBossIds: engine.defeatedBossIds.join(','),
    runHistoryLength: engine.runHistory.length
  };

  state.status = 'in_progress';
  state.nodeId = ending.id;
  state.lineIndex = ending.lines.length - 1;
  state.choicePath = ['lore', 'private'];
  engine.activeBodyRouteId = route.id;
  engine.closeModal = () => {};
  engine.renderAdultScenes = () => {};

  assert.equal(engine.isAdultBonusSceneUnlocked(scene), false);
  assert.equal(engine.isAdultBonusSceneUnlocked(siblingScene), false);
  assert.equal(engine.finishBodyRoute(), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(scene), true);
  assert.equal(engine.isAdultBonusSceneUnlocked(siblingScene), false);
  assert.deepEqual(
    {
      wave: engine.wave,
      score: engine.score,
      coins: engine.coins,
      metaCoins: engine.metaCoins,
      totalCoinsEarned: engine.totalCoinsEarned,
      xp: engine.xp,
      level: engine.level,
      citadelHp: engine.citadel.hp,
      affinityLvl: nyx.affinityLvl,
      relationshipXp: nyx.relationshipXp,
      romanceOptIn: nyx.romanceOptIn,
      privateMomentUnlocked: nyx.privateMomentUnlocked,
      defeatedBossIds: engine.defeatedBossIds.join(','),
      runHistoryLength: engine.runHistory.length
    },
    gameplayBefore
  );

  const rawSave = JSON.parse(localStorage.getItem('valkyrie_sweeper_save'));
  assert.equal(rawSave.bodyRouteProgress.routes[route.id].completed, true);
  assert.equal(rawSave.bodyRouteProgress.routes[route.id].status, 'completed');
  assert.equal(rawSave.bodyRouteProgress.routes[siblingScene.bodyRouteId], undefined);
});

test('le lecteur CG navigue chronologiquement dans une parenthese privee', () => {
  const {
    GameEngine, document, ADULT_SCENES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const ids = [
    'cg-viewer-modal',
    'cg-viewer-img',
    'cg-story-title-txt',
    'cg-story-sub-txt',
    'cg-story-quote-txt',
    'cg-story-desc-txt',
    'cg-stats-grid-container',
    'cg-sequence-nav',
    'btn-cg-sequence-prev',
    'cg-sequence-status',
    'btn-cg-sequence-next'
  ];
  const elements = Object.fromEntries(ids.map(id => [
    id,
    createElement(id === 'cg-viewer-img' ? 'img' : 'div')
  ]));
  document.getElementById = id => elements[id] || null;
  engine.openModal = () => {};

  const sequence = ADULT_SCENES.bonusScenes
    .filter(scene => scene.sequenceId === 'nyx_private_ritual')
    .sort((left, right) => left.sequenceIndex - right.sequenceIndex);
  assert.equal(sequence.length, 3);
  assert.equal(engine.openAdultSceneViewer(sequence[1]), true);
  assert.equal(elements['cg-sequence-nav'].hidden, false);
  assert.match(elements['cg-sequence-status'].textContent, /CG 2 sur 3/u);
  assert.equal(elements['btn-cg-sequence-prev'].disabled, false);
  assert.equal(elements['btn-cg-sequence-next'].disabled, false);
  assert.match(elements['btn-cg-sequence-prev'].getAttribute('aria-label'), /CG 1 sur 3/u);
  assert.match(elements['btn-cg-sequence-next'].getAttribute('aria-label'), /CG 3 sur 3/u);

  let openedSceneId = null;
  engine.openAdultSceneViewer = scene => {
    openedSceneId = scene.id;
    return true;
  };
  elements['btn-cg-sequence-prev'].onclick();
  assert.equal(openedSceneId, sequence[0].id);
  elements['btn-cg-sequence-next'].onclick();
  assert.equal(openedSceneId, sequence[2].id);

  engine.configureCgSequenceNavigation({ id: 'archive_sans_sequence' });
  assert.equal(elements['cg-sequence-nav'].hidden, true);
  assert.equal(elements['cg-sequence-status'].textContent, '');
});

test('la categorie Eros Time liste vingt sequences et filtre une entree par personnage', () => {
  const {
    GameEngine, document
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const elements = {
    'adult-scenes-grid': createElement('div'),
    'body-route-participant-filter': createElement('label'),
    'body-route-progress-summary': createElement('p')
  };
  document.getElementById = id => elements[id] || null;

  engine.activeBodyRouteParticipantFilter = 'all';
  engine.renderAdultScenes('eros_time');
  assert.equal(elements['body-route-participant-filter'].hidden, false);
  assert.equal(elements['body-route-progress-summary'].hidden, false);
  assert.equal(elements['adult-scenes-grid'].children.length, 20);
  assert.equal(
    new Set(elements['adult-scenes-grid'].children.map(card => card.dataset.sequenceId)).size,
    20
  );
  assert.match(elements['body-route-progress-summary'].textContent, /20 séquences \/ 60 CG/u);
  assert.match(elements['body-route-progress-summary'].textContent, /2 à 6 hommes adultes/u);
  assert.match(elements['body-route-progress-summary'].textContent, /hors champ/u);

  elements['adult-scenes-grid'].children = [];
  engine.activeBodyRouteParticipantFilter = 'nyx';
  engine.renderAdultScenes('eros_time');
  assert.equal(elements['adult-scenes-grid'].children.length, 1);
  assert.equal(elements['adult-scenes-grid'].children[0].dataset.sequenceId, 'nyx_eros_time');
  assert.match(elements['body-route-progress-summary'].textContent, /Nyx Circuit/u);
  assert.match(elements['body-route-progress-summary'].textContent, /3 hommes adultes/u);
});

test('le lecteur Eros Time annonce le hors champ et le consentement sans modifier le jeu', () => {
  const {
    GameEngine, document, ADULT_SCENES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const ids = [
    'cg-viewer-modal',
    'cg-viewer-img',
    'cg-story-title-txt',
    'cg-story-sub-txt',
    'cg-story-quote-txt',
    'cg-story-desc-txt',
    'cg-stats-grid-container',
    'cg-sequence-nav',
    'btn-cg-sequence-prev',
    'cg-sequence-status',
    'btn-cg-sequence-next'
  ];
  const elements = Object.fromEntries(ids.map(id => [
    id,
    createElement(id === 'cg-viewer-img' ? 'img' : 'div')
  ]));
  document.getElementById = id => elements[id] || null;
  engine.openModal = () => {};
  const sequence = ADULT_SCENES.bonusScenes
    .filter(scene => scene.sequenceId === 'nyx_eros_time')
    .sort((left, right) => left.sequenceIndex - right.sequenceIndex);
  const before = {
    score: engine.score,
    coins: engine.coins,
    metaCoins: engine.metaCoins,
    defeatedBossIds: engine.defeatedBossIds.join(',')
  };

  assert.equal(engine.openAdultSceneViewer(sequence[1]), true);
  assert.match(elements['cg-sequence-status'].textContent, /CG 2 sur 3 · Ellipse · intimité hors champ/u);
  assert.equal(elements['cg-viewer-img'].src, sequence[1].src);
  assert.match(elements['cg-viewer-img'].alt, /entièrement vide/u);
  const stats = elements['cg-stats-grid-container'].children.map(item => item.innerHTML).join(' ');
  assert.match(stats, /Partenaires: <strong>3 hommes adultes indépendants/u);
  assert.match(stats, /Âge minimum: <strong>28 ans/u);
  assert.match(stats, /Consentement: <strong>affirmé, révocable · sortie libre/u);
  assert.match(stats, /Intimité: <strong>hors champ · aucun acte montré/u);
  assert.deepEqual(
    {
      score: engine.score,
      coins: engine.coins,
      metaCoins: engine.metaCoins,
      defeatedBossIds: engine.defeatedBossIds.join(',')
    },
    before
  );
});

test('le Game Over choisit la taquinerie liee a l heroine quand elle existe', () => {
  const {
    GameEngine, document, HERO_CLASSES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.selectedHero = HERO_CLASSES.nyx;
  const figure = createElement('figure');
  const image = createElement('img');
  const caption = createElement('figcaption');
  image.closest = selector => selector === '.game-over-tease' ? figure : null;
  document.getElementById = id => ({
    'game-over-tease-img': image,
    'game-over-tease-caption': caption
  })[id] || null;

  const scene = engine.applyGameOverTease();
  assert.equal(scene.id, 'game_over_tease_01');
  assert.equal(image.src.endsWith('game-over-tease-01-v1.webp'), true);
  assert.equal(caption.textContent.length > 40, true);
  assert.equal(figure.hidden, false);
});

function normalizeRegressionState(value) {
  return JSON.parse(JSON.stringify(value));
}

function captureCampaignRegressionState(engine) {
  return normalizeRegressionState({
    wave: engine.wave,
    waveActive: engine.waveActive,
    waveIntermissionTimer: engine.waveIntermissionTimer,
    selectedLayoutId: engine.selectedLayoutId,
    activeCampaignId: engine.activeCampaignId,
    difficulty: engine.difficulty,
    runMode: engine.runMode,
    selectedHeroId: engine.selectedHero.id,
    selectedHeroProgress: {
      affinityLvl: engine.selectedHero.affinityLvl,
      relationshipXp: engine.selectedHero.relationshipXp,
      romanceOptIn: engine.selectedHero.romanceOptIn,
      privateMomentUnlocked: engine.selectedHero.privateMomentUnlocked
    },
    coins: engine.coins,
    score: engine.score,
    xp: engine.xp,
    level: engine.level,
    nextLevelXp: engine.nextLevelXp,
    metaCoins: engine.metaCoins,
    runMetaCoinsEarned: engine.runMetaCoinsEarned,
    totalCoinsEarned: engine.totalCoinsEarned,
    bestScore: engine.bestScore,
    bestWave: engine.bestWave,
    shopUpgrades: engine.shopUpgrades,
    affinityXp: engine.affinityXp,
    nextAffinityXp: engine.nextAffinityXp,
    hostileProjectileFreezeTimer: engine.hostileProjectileFreezeTimer,
    heroUltimateDefenseDamageTimer: engine.heroUltimateDefenseDamageTimer,
    seenBossIntroIds: [...engine.seenBossIntroIds].sort(),
    seenBossDefeatIds: [...engine.seenBossDefeatIds].sort(),
    kiraMarkedRoutes: [...engine.kiraMarkedRoutes].sort(),
    nyxExposedRoutes: [...engine.nyxExposedRoutes].sort(),
    citadel: engine.citadel,
    placedTowers: engine.placedTowers,
    activeRunCheckpoint: engine.activeRunCheckpoint,
    savedRunCheckpoint: engine.savedRunCheckpoint,
    campaignVictory: engine.campaignVictory,
    campaignVictoryClaimed: engine.campaignVictoryClaimed,
    isGameOver: engine.isGameOver
  });
}

function prepareCampaignRegressionState(engine, TOWER_TYPES) {
  engine.activeCampaignId = 'four_gates';
  engine.difficulty = 'nightmare';
  engine.applyWorldLayout('western_wall', { force: true, repositionUnits: false });
  engine.initWeapons();
  engine.wave = 7;
  engine.waveActive = true;
  engine.waveIntermissionTimer = 1.75;
  engine.coins = 287;
  engine.score = 4321;
  engine.xp = 64;
  engine.level = 3;
  engine.nextLevelXp = 90;
  engine.metaCoins = 91;
  engine.runMetaCoinsEarned = 19;
  engine.totalCoinsEarned = 777;
  engine.bestScore = 3141;
  engine.bestWave = 11;
  engine.shopUpgrades = { hpBonus: 2, fireRateBonus: 1, magnetRange: 3 };
  engine.selectedHero.affinityLvl = 2;
  engine.selectedHero.relationshipXp = 17;
  engine.selectedHero.romanceOptIn = true;
  engine.selectedHero.privateMomentUnlocked = true;
  engine.affinityXp = 17;
  engine.nextAffinityXp = engine.getAffinityThreshold(engine.selectedHero);
  engine.hostileProjectileFreezeTimer = 2.25;
  engine.heroUltimateDefenseDamageTimer = 3.5;
  engine.seenBossIntroIds = new Set(['vespera']);
  engine.seenBossDefeatIds = new Set(['vespera']);
  engine.kiraMarkedRoutes = new Set(['western_wall_east_center']);
  engine.nyxExposedRoutes = new Set(['western_wall_east_north']);
  engine.citadel.hp = 377;
  const vulcan = engine.createPlacedDefense(TOWER_TYPES.vulcan_turret, 420, 320);
  vulcan.level = 2;
  vulcan.hp = 123;
  const cryo = engine.createPlacedDefense(TOWER_TYPES.cryo_cannon, 510, 470);
  cryo.level = 3;
  cryo.hp = 156;
  engine.placedTowers = [vulcan, cryo];
  engine.saveRunCheckpoint();
  engine.runMode = 'campaign';
  engine.isGameOver = false;
  engine.campaignVictory = false;
  engine.campaignVictoryClaimed = false;
  return captureCampaignRegressionState(engine);
}

function installInfinitumRegressionHarness(engine, document) {
  const ids = [
    'tower-infinitum-modal',
    'tower-floor-txt',
    'tower-mutator-txt',
    'btn-start-floor',
    'infinitum-segment-progress',
    'infinitum-segment-txt',
    'infinitum-floor-list',
    'infinitum-cumulative-mutators',
    'hq-menu-modal'
  ];
  const elements = Object.fromEntries(ids.map(id => [id, createElement('div')]));
  document.getElementById = id => elements[id] || null;
  engine.openModal = () => {};
  engine.closeModal = () => {};
  engine.closeAllGameplayModals = () => {};
  engine.focusBattlefield = () => {};
  engine.openTowerInfinitumModal();
  assert.equal(typeof elements['btn-start-floor'].onclick, 'function');
  return elements;
}

test('le defi quotidien rejoue exactement le meme contrat sans dupliquer sa prime permanente', () => {
  const {
    GameEngine, EXPANSION, HERO_CLASSES, TOWER_TYPES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const date = '2026-07-29T12:00:00Z';
  const salt = 'daily-regression';
  const expected = EXPANSION.utils.createDailyChallenge(date, salt);
  HERO_CLASSES[expected.heroId].unlocked = false;
  engine.openModal = () => {};
  const suspendedCampaign = prepareCampaignRegressionState(engine, TOWER_TYPES);

  const challenge = engine.startDailyChallenge(date, salt);
  const captureContract = () => normalizeRegressionState({
    id: engine.dailyChallenge.id,
    heroId: engine.selectedHero.id,
    layoutId: engine.selectedLayoutId,
    campaignId: engine.activeCampaignId,
    difficulty: engine.difficulty,
    deck: engine.dailyChallenge.startingDefenseIds,
    starterDefenses: engine.placedTowers.map(defense => defense.id),
    mutatorIds: engine.dailyChallenge.mutatorIds,
    rules: engine.dailyChallenge.rules,
    mapRotation: engine.mapRotation
  });
  const firstContract = captureContract();

  assert.equal(challenge.id, expected.id);
  assert.equal(firstContract.heroId, expected.heroId, 'le heros quotidien doit etre prete meme verrouille');
  assert.deepEqual(firstContract.deck, normalizeRegressionState(expected.startingDefenseIds));
  assert.deepEqual(firstContract.starterDefenses, firstContract.deck);

  const metaBeforeFirstClear = engine.metaCoins;
  const lifetimeCoinsBefore = engine.totalCoinsEarned;
  const campaignRecordsBefore = { bestScore: engine.bestScore, bestWave: engine.bestWave };
  engine.completeWave();
  engine.advanceWave();
  engine.completeWave();
  assert.equal(engine.metaCoins, metaBeforeFirstClear, 'les vagues quotidiennes ne donnent aucun credit meta');
  assert.equal(engine.totalCoinsEarned, lifetimeCoinsBefore, 'les gains temporaires ne gonflent pas le cumul campagne');
  assert.deepEqual(
    { bestScore: engine.bestScore, bestWave: engine.bestWave },
    campaignRecordsBefore,
    'un score quotidien ne remplace jamais les records campagne'
  );
  engine.triggerDailyVictory();
  const metaAfterFirstClear = engine.metaCoins;
  assert.equal(metaAfterFirstClear, metaBeforeFirstClear + 150, 'la premiere victoire attribue uniquement sa prime');
  assert.equal(engine.completedDailyChallengeIds.filter(id => id === challenge.id).length, 1);
  assert.deepEqual(captureCampaignRegressionState(engine), {
    ...suspendedCampaign,
    metaCoins: suspendedCampaign.metaCoins + 150
  }, 'la campagne et son checkpoint sont restaures avant application de la prime');
  assert.equal(engine.dailyChallenge, null);
  assert.equal(engine.campaignStateBeforeDaily, null);

  assert.equal(engine.retryDailyChallenge(), true);
  assert.deepEqual(captureContract(), firstContract);
  engine.triggerDailyVictory();

  assert.equal(engine.metaCoins, metaAfterFirstClear, 'la prime quotidienne permanente doit rester unique');
  assert.equal(engine.completedDailyChallengeIds.filter(id => id === challenge.id).length, 1);
  assert.deepEqual(captureCampaignRegressionState(engine), {
    ...suspendedCampaign,
    metaCoins: suspendedCampaign.metaCoins + 150
  });
});

test('une defaite quotidienne restaure la campagne et son checkpoint sans toucher aux records', () => {
  const {
    GameEngine, TOWER_TYPES
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.openModal = () => {};
  engine.closeAllGameplayModals = () => {};
  const suspendedCampaign = prepareCampaignRegressionState(engine, TOWER_TYPES);

  const challenge = engine.startDailyChallenge('2026-07-30T12:00:00Z', 'daily-defeat');
  engine.metaCoins += 999;
  engine.totalCoinsEarned += 888;
  engine.bestScore = 999999;
  engine.bestWave = 99;
  engine.selectedHero.relationshipXp = 777;
  engine.selectedHero.affinityLvl = 5;
  engine.shopUpgrades.hpBonus = 100;
  engine.activeRunCheckpoint = null;
  engine.savedRunCheckpoint = null;
  engine.triggerGameOver();

  assert.deepEqual(captureCampaignRegressionState(engine), suspendedCampaign);
  assert.equal(engine.completedDailyChallengeIds.includes(challenge.id), false);
  assert.equal(engine.dailyChallenge, null);
  assert.equal(engine.campaignStateBeforeDaily, null);
  assert.equal(engine.retryDailyChallenge(), true, 'la revanche conserve exactement le contrat echoue');
  assert.equal(engine.dailyChallenge.id, challenge.id);
});

test('le deck quotidien limite a la fois la barre et la construction effective', () => {
  const {
    GameEngine, TOWER_TYPES, document
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const buildBar = createElement('div');
  document.getElementById = id => id === 'hud-build-bar' ? buildBar : null;

  const challenge = engine.startDailyChallenge('2026-07-31T12:00:00Z', 'daily-deck');
  const deckIds = normalizeRegressionState(challenge.startingDefenseIds);
  assert.deepEqual(buildBar.children.map(card => card.dataset.towerId), deckIds);

  const forbiddenTower = Object.values(TOWER_TYPES).find(tower => !deckIds.includes(tower.id));
  assert.ok(forbiddenTower, 'le catalogue doit contenir au moins une defense hors deck');
  const towersBefore = engine.placedTowers.length;
  const coinsBefore = engine.coins;
  engine.selectedTowerToBuild = forbiddenTower;
  engine.buildSelectedTowerAt(engine.citadel.x + 250, engine.citadel.y + 180);
  assert.equal(engine.placedTowers.length, towersBefore);
  assert.equal(engine.coins, coinsBefore, 'une defense hors deck ne doit jamais etre facturee');
});

test('l armurerie meta reste inaccessible dans Daily, les chasses et Infinitum', () => {
  const {
    GameEngine, document
  } = loadGameModule();
  const engine = createEngine(GameEngine);
  const initialShop = normalizeRegressionState(engine.shopUpgrades);
  const initialMeta = engine.metaCoins;
  document.getElementById = () => {
    throw new Error('la modale boutique ne doit pas etre consultee dans un mode secondaire');
  };

  [
    { dailyChallenge: { id: 'daily-qa' }, runMode: 'daily', isTowerMode: false },
    { dailyChallenge: null, runMode: 'hunt', isTowerMode: false },
    { dailyChallenge: null, runMode: 'tower', isTowerMode: true }
  ].forEach(mode => {
    Object.assign(engine, mode);
    assert.doesNotThrow(() => engine.openShopModal());
    assert.deepEqual(normalizeRegressionState(engine.shopUpgrades), initialShop);
    assert.equal(engine.metaCoins, initialMeta);
  });
});

test('victoire et defaite de chasse restaurent exactement la campagne sans victoire parasite', () => {
  const {
    GameEngine, TOWER_TYPES
  } = loadGameModule();

  ['victory', 'defeat'].forEach(outcome => {
    const engine = createEngine(GameEngine);
    const expectedCampaign = prepareCampaignRegressionState(engine, TOWER_TYPES);
    engine.defeatedBossIds = ['xyra'];
    engine.openAntagonistCodex = () => {};
    let campaignVictories = 0;
    engine.triggerCampaignVictory = () => { campaignVictories += 1; };

    assert.equal(engine.startVillainHunt('xyra'), true, outcome);
    engine.coins = 1;
    engine.score = 999999;
    engine.xp = 0;
    engine.placedTowers = [];
    engine.selectedHero.relationshipXp = 999;
    engine.selectedHero.affinityLvl = 5;
    engine.shopUpgrades.hpBonus = 99;
    engine.hostileProjectileFreezeTimer = 0;
    engine.seenBossIntroIds.clear();
    if (outcome === 'victory') {
      engine.waveActive = true;
      engine.waveRewardClaimed = false;
      engine.completeWave();
    } else {
      engine.triggerGameOver();
    }

    assert.deepEqual(captureCampaignRegressionState(engine), expectedCampaign, outcome);
    assert.equal(campaignVictories, 0, `${outcome}: aucune victoire campagne`);
    assert.equal(engine.activeBossHuntId, null);
    assert.equal(engine.campaignStateBeforeBossHunt, null);
  });
});

test('defaite et palier Infinitum restaurent exactement la campagne suspendue', () => {
  const {
    GameEngine, TOWER_TYPES, document
  } = loadGameModule();

  [
    { outcome: 'defeat', floor: 6 },
    { outcome: 'checkpoint', floor: 10 }
  ].forEach(({ outcome, floor }) => {
    const engine = createEngine(GameEngine);
    const expectedCampaign = prepareCampaignRegressionState(engine, TOWER_TYPES);
    engine.towerFloor = floor;
    engine.getRunRandom = () => 0;
    const elements = installInfinitumRegressionHarness(engine, document);
    elements['btn-start-floor'].onclick();

    assert.equal(engine.isTowerMode, true, outcome);
    assert.equal(engine.enemies.length, 0, `${outcome}: aucune larve tutorielle ne doit contaminer l'etage`);
    engine.coins = 2;
    engine.score = 888888;
    engine.xp = 0;
    engine.placedTowers = [];
    engine.selectedHero.relationshipXp = 888;
    engine.selectedHero.affinityLvl = 5;
    engine.shopUpgrades.fireRateBonus = 9;
    engine.heroUltimateDefenseDamageTimer = 0;
    engine.kiraMarkedRoutes.clear();
    if (outcome === 'defeat') {
      engine.triggerGameOver();
    } else {
      const permanentLedgerBeforeFloor = {
        metaCoins: engine.metaCoins,
        totalCoinsEarned: engine.totalCoinsEarned
      };
      engine.waveActive = true;
      engine.waveRewardClaimed = false;
      engine.completeWave();
      assert.deepEqual({
        metaCoins: engine.metaCoins,
        totalCoinsEarned: engine.totalCoinsEarned
      }, permanentLedgerBeforeFloor, 'une vague Tour ne credite jamais le registre permanent');
      engine.advanceWave();
    }

    assert.deepEqual(captureCampaignRegressionState(engine), expectedCampaign, outcome);
    assert.equal(engine.isTowerMode, false);
    assert.equal(engine.campaignStateBeforeTower, null);
  });
});

test('gravite impulsion de controle et Tesla respectent immunite et resistance des lourds et boss', () => {
  const { GameEngine, TOWER_TYPES } = loadGameModule();
  const engine = createEngine(GameEngine);
  engine.enemies = [];
  engine.enemyBullets = [];
  engine.particles = [];

  const normal = engine.spawnEnemy('swarmer', 0, {
    x: 760, y: 330, countForWave: false
  });
  const heavy = engine.spawnEnemy('brute', 0, {
    x: 760, y: 400, countForWave: false
  });
  const immuneBoss = engine.spawnEnemy('hellwarden', 0, {
    x: 760, y: 470, countForWave: false, isBoss: true, suppressCinematic: true
  });
  immuneBoss.ccImmunityTimer = 1;
  const gravity = engine.createPlacedDefense(TOWER_TYPES.gravity_well, 700, 400);
  const starts = new Map([
    [normal, { x: normal.x, y: normal.y }],
    [heavy, { x: heavy.x, y: heavy.y }],
    [immuneBoss, { x: immuneBoss.x, y: immuneBoss.y }]
  ]);

  engine.fireTower(gravity, normal);
  const moved = enemy => Math.hypot(enemy.x - starts.get(enemy).x, enemy.y - starts.get(enemy).y);
  assert.ok(Math.abs(moved(normal) - 32) < 0.001);
  assert.ok(Math.abs(moved(heavy) - 9.6) < 0.001);
  assert.equal(moved(immuneBoss), 0);

  normal.x = 760;
  normal.y = 330;
  heavy.x = 760;
  heavy.y = 400;
  immuneBoss.x = 760;
  immuneBoss.y = 470;
  const pulse = engine.createPlacedDefense(TOWER_TYPES.magnet_drone, 700, 400);
  pulse.specializationId = 'magnet_polarizer';
  pulse.controlPulseTimer = 0;
  engine.placedTowers = [pulse];
  starts.set(normal, { x: normal.x, y: normal.y });
  starts.set(heavy, { x: heavy.x, y: heavy.y });
  starts.set(immuneBoss, { x: immuneBoss.x, y: immuneBoss.y });

  engine.updatePlacedTowers(0.001);
  assert.ok(Math.abs(moved(normal) - 70) < 0.001);
  assert.ok(Math.abs(moved(heavy) - 21) < 0.001);
  assert.equal(moved(immuneBoss), 0);

  const tesla = engine.createPlacedDefense(TOWER_TYPES.tesla_spire, 700, 400);
  tesla.specializationId = 'tesla_tempest';
  heavy.x = 760;
  heavy.y = 400;
  heavy.stunTimer = 0;
  heavy.ccImmunityTimer = 0;
  engine.enemies = [heavy];
  engine.fireTower(tesla, heavy);
  assert.ok(Math.abs(heavy.stunTimer - (0.65 * 0.55)) < 0.001);

  immuneBoss.x = 760;
  immuneBoss.y = 400;
  immuneBoss.stunTimer = 0;
  immuneBoss.ccImmunityTimer = 0;
  engine.enemies = [immuneBoss];
  engine.fireTower(tesla, immuneBoss);
  assert.ok(Math.abs(immuneBoss.stunTimer - (0.65 * 0.25)) < 0.001);
  assert.ok(immuneBoss.ccImmunityTimer >= 2.4);
  immuneBoss.stunTimer = 0;
  engine.fireTower(tesla, immuneBoss);
  assert.equal(immuneBoss.stunTimer, 0);
});

test('checkpoint et rotation replacent chaque tour dans une position tactique valide', () => {
  const { GameEngine, TOWER_TYPES } = loadGameModule();
  const source = createEngine(GameEngine);
  ['citadel', 'route', 'occupied', 'bounds'].forEach(reason => {
    assert.doesNotMatch(source.getDefensePlacementFailureMessage(reason), /Ã|â€|Â /u);
  });
  source.saveProgress = () => {};
  source.configureWave(5);
  source.placedTowers = [
    source.createPlacedDefense(TOWER_TYPES.vulcan_turret, 600, 400),
    source.createPlacedDefense(TOWER_TYPES.plasma_mortar, 600, 250),
    source.createPlacedDefense(TOWER_TYPES.tesla_spire, 600, 250),
    source.createPlacedDefense(TOWER_TYPES.gravity_well, 50, 50)
  ];
  const checkpoint = source.createRunCheckpoint();
  const resumed = createEngine(GameEngine);
  resumed.savedRunCheckpoint = checkpoint;
  resumed.activeRunCheckpoint = checkpoint;

  assert.equal(resumed.restoreRunCheckpoint(), true);
  assert.equal(resumed.placedTowers.length, 4);
  resumed.placedTowers.forEach(defense => {
    const validation = resumed.validateDefensePlacement(defense.x, defense.y, {
      radius: defense.radius,
      ignoreDefense: defense
    });
    assert.equal(validation.ok, true, `checkpoint: ${validation.reason}`);
  });

  resumed.setMapRotation(['convergence', 'western_wall']);
  resumed.waveActive = false;
  resumed.enemies = [];
  assert.equal(resumed.rotateWorldLayoutBetweenWaves(), true);
  assert.equal(resumed.placedTowers.length, 4);
  resumed.placedTowers.forEach(defense => {
    const validation = resumed.validateDefensePlacement(defense.x, defense.y, {
      radius: defense.radius,
      ignoreDefense: defense
    });
    assert.equal(validation.ok, true, `rotation: ${validation.reason}`);
  });
});
