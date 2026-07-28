'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const GAME_SOURCE = fs.readFileSync(path.join(ROOT, 'game.v9.js'), 'utf8');

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
  return {
    tagName: String(tagName).toUpperCase(),
    classList: createClassList(),
    dataset: {},
    style: {},
    children: [],
    textContent: '',
    innerHTML: '',
    disabled: false,
    inert: false,
    appendChild(child) { this.children.push(child); return child; },
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
      CAMPAIGN_FINAL_WAVE,
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
      WEAPONS_DATA,
      HERO_CLASSES,
      ACHIEVEMENTS,
      GALLERY_ITEMS
    };
  `;
  vm.runInContext(`${GAME_SOURCE}\n${exportHook}`, context, { filename: 'game.v9.js' });

  return {
    ...context.__INFERNAL_CITY_TEST__,
    localStorage,
    stored,
    audio
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

test('les sept archetypes ennemis possedent un sprite OpenAI local', () => {
  const { ENEMY_SPRITE_DATA } = loadGameModule();
  const expectedTypes = ['swarmer', 'runner', 'brute', 'vespera', 'carmilla', 'hellwarden', 'leviathan'];

  assert.deepEqual(Object.keys(ENEMY_SPRITE_DATA).sort(), expectedTypes.sort());
  Object.values(ENEMY_SPRITE_DATA).forEach(sprite => {
    assert.match(sprite.src, /^assets\/animations\/enemies\/enemy-atlas-\d+\.png$/);
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
  assert.equal(passiveEngine.enemies.length, 0, 'La barriere ne bloque pas l’ennemi');
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
  first.saveProgress();

  const rawSave = JSON.parse(localStorage.getItem('valkyrie_sweeper_save'));
  assert.equal(rawSave.version, 4);
  assert.equal(rawSave.metaCoins, 777);
  assert.equal(rawSave.characterProgress.kira.affinityLvl, 4);

  kira.activeSkin = 'default';
  kira.affinityLvl = 1;
  kira.relationshipXp = 0;
  kira.romanceOptIn = false;
  kira.privateMomentUnlocked = false;

  const restored = createEngine(GameEngine);
  assert.equal(restored.metaCoins, 777);
  assert.equal(restored.totalCoinsEarned, 3210);
  assert.equal(restored.towerFloor, 42);
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
  assert.equal(engine.waveSpawnTarget, 10);
  engine.configureWave(5);
  assert.equal(engine.waveSpawnTarget, 18);
  engine.configureWave(5, { mutator: { id: 'swarm' } });
  assert.equal(engine.waveSpawnTarget, 27);
  engine.configureWave(100);
  assert.equal(engine.waveSpawnTarget, 48, 'Le quota maximal doit etre borne');

  engine.configureWave(5);
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
  assert.equal(
    engine.enemies.filter(enemy => enemy.recruitableBossId === 'vespera').length,
    1
  );

  const rewardEngine = createEngine(GameEngine);
  rewardEngine.saveProgress = () => {};
  rewardEngine.unlockAchievement = () => {};
  rewardEngine.configureWave(5);
  const initialCoins = rewardEngine.coins;
  const initialMetaCoins = rewardEngine.metaCoins;
  rewardEngine.completeWave();
  rewardEngine.completeWave();
  assert.equal(rewardEngine.coins, initialCoins + 50);
  assert.equal(rewardEngine.metaCoins, initialMetaCoins + 18);
  assert.equal(rewardEngine.waveActive, false);
  rewardEngine.updateSpawns(4);
  assert.equal(rewardEngine.wave, 6);
  assert.equal(rewardEngine.waveSpawnTarget, 20);

  const leviathanEngine = createEngine(GameEngine);
  leviathanEngine.configureWave(15);
  leviathanEngine.enemiesSpawnedThisWave = leviathanEngine.waveSpawnTarget - 1;
  leviathanEngine.spawnMutant();
  const bosses = leviathanEngine.enemies.filter(enemy => enemy.isBoss);
  assert.equal(bosses.length, 1);
  assert.equal(bosses[0].type, 'leviathan');
});

test('la Tour restaure la vague suspendue et utilise un boss generique', () => {
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

  assert.equal(engine.wave, 7);
  assert.equal(engine.waveActive, true);
  assert.equal(engine.enemies[0], campaignEnemy);
  assert.equal(engine.isTowerMode, false);
  assert.equal(engine.towerFloor, 6);
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
  assert.deepEqual({ ...levelTwo }, { ok: true, cost: 38, level: 2 });
  assert.equal(defense.damage, 23.25);
  assert.equal(defense.range, 264);
  assert.equal(defense.fireRate, 264);
  assert.equal(engine.getDefenseUpgradeCost(defense), 53);

  engine.projectiles = [];
  engine.fireTower(defense, { x: 300, y: 200, radius: 12, dead: false });
  assert.equal(engine.projectiles[0].damage, 23.25, 'le niveau ne doit pas remultiplier les degats deja calcules');

  const levelThree = engine.upgradeDefense(defense);
  assert.equal(levelThree.ok, true);
  assert.equal(defense.level, DEFENSE_MAX_LEVEL);
  assert.equal(defense.damage, 33.75);
  assert.equal(defense.range, 288);
  assert.equal(defense.fireRate, 228);
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

test('une sauvegarde V2 migre ses anciens credits vers la V4', () => {
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
  assert.equal(Object.keys(ENEMY_SPRITE_DATA).length, 7);
  assert.equal(Object.keys(HERO_SPRITE_DATA).length, 6);

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
