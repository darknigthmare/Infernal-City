(function installInfinitumRuntime(root) {
  'use strict';

  const RUNTIME_KEY = '__infernalCityInfinitumRuntimeV1';
  const MODIFIER_KEYS = Object.freeze([
    'defenseCostMultiplier',
    'secondaryRewardMultiplier',
    'enemyDamageMultiplier',
    'enemySpeedMultiplier',
    'groundSpeedMultiplier',
    'flyingStealthSeconds',
    'flyingRewardMultiplier',
    'barrierHpDrainPerSecond',
    'heavyCountMultiplier',
    'specialistHpMultiplier',
    'enemyFireRateMultiplier',
    'sellRatioMultiplier',
    'specialistControlResistanceMultiplier',
    'specialistRewardMultiplier',
    'heavyDirectDamageMultiplier',
    'heavySplashDamageMultiplier',
    'crateChanceMultiplier',
    'defenseRangeMultiplier',
    'revealedDamageTakenMultiplier',
    'splashDamageMultiplier',
    'artilleryFireRateMultiplier',
    'hostileProjectileSpeedMultiplier',
    'barrierHpMultiplier',
    'defenseHpMultiplier',
    'controlDurationMultiplier',
    'bossControlResistanceMultiplier',
    'milestoneMetaMultiplier'
  ]);
  const SPECIALIST_TYPES = new Set(['flying', 'bulwark', 'artillery', 'splitter']);
  const HEAVY_TYPES = new Set(['brute', 'bulwark']);
  const IMMEDIATE_SPLASH_TOWERS = new Set(['gravity', 'emp', 'sonic']);

  if (root.INFERNAL_CITY_INFINITUM_RUNTIME?.installed === true) return;
  if (typeof GameEngine !== 'function') {
    console.warn('Infinitum runtime ignoré : GameEngine doit être chargé en premier.');
    return;
  }

  const proto = GameEngine.prototype;
  if (proto[RUNTIME_KEY]) return;

  const decoratedEnemies = new WeakSet();
  const decoratedBullets = new WeakSet();
  const decoratedHostileHazards = new WeakSet();
  const rewardContexts = new WeakMap();
  const splashDepths = new WeakMap();

  function activeMutators(engine) {
    const mutators = typeof engine?.getActiveRunMutators === 'function'
      ? engine.getActiveRunMutators()
      : (engine?.isTowerMode ? engine?.towerMutators : engine?.activeRunMutators);
    return Array.isArray(mutators) ? mutators : [];
  }

  function modifierProduct(engine, key, fallback = 1) {
    return activeMutators(engine).reduce((product, mutator) => {
      const value = Number(mutator?.modifiers?.[key]);
      return product * (Number.isFinite(value) && value > 0 ? value : 1);
    }, fallback);
  }

  function modifierMaximum(engine, key, fallback = 0) {
    return activeMutators(engine).reduce((maximum, mutator) => {
      const value = Number(mutator?.modifiers?.[key]);
      return Number.isFinite(value) ? Math.max(maximum, value) : maximum;
    }, fallback);
  }

  function boundedProduct(engine, key, minimum = 0.1, maximum = 10) {
    return Math.max(minimum, Math.min(maximum, modifierProduct(engine, key)));
  }

  function isFlying(engine, enemy) {
    return typeof engine?.isEnemyFlying === 'function'
      ? engine.isEnemyFlying(enemy)
      : enemy?.type === 'flying' || enemy?.traits?.includes?.('flying');
  }

  function isSpecialist(enemy) {
    return Boolean(enemy && (SPECIALIST_TYPES.has(enemy.type) || enemy.traits?.includes?.('specialist')));
  }

  function isHeavy(enemy) {
    return Boolean(enemy && (HEAVY_TYPES.has(enemy.type) || enemy.traits?.includes?.('heavy')));
  }

  function withSplashContext(engine, callback) {
    const previous = splashDepths.get(engine) || 0;
    splashDepths.set(engine, previous + 1);
    try {
      return callback();
    } finally {
      if (previous > 0) splashDepths.set(engine, previous);
      else splashDepths.delete(engine);
    }
  }

  function getTowerType(id) {
    if (typeof TOWER_TYPES === 'undefined' || !TOWER_TYPES) return null;
    return TOWER_TYPES[id] || null;
  }

  function getDefenseCost(engine, towerType) {
    const baseCost = Math.max(0, Number(towerType?.cost) || 0);
    return Math.max(0, Math.ceil(
      baseCost * boundedProduct(engine, 'defenseCostMultiplier', 0.25, 5)
    ));
  }

  function decorateHostileBullet(engine, bullet, damageAlreadyScaled = false) {
    if (!bullet || decoratedBullets.has(bullet)) return bullet;
    const speedMultiplier = boundedProduct(engine, 'hostileProjectileSpeedMultiplier', 0.2, 3);
    if (Number.isFinite(bullet.vx)) bullet.vx *= speedMultiplier;
    if (Number.isFinite(bullet.vy)) bullet.vy *= speedMultiplier;
    if (!damageAlreadyScaled && Number.isFinite(bullet.damage)) {
      bullet.damage *= boundedProduct(engine, 'enemyDamageMultiplier', 0.2, 5);
    }
    decoratedBullets.add(bullet);
    return bullet;
  }

  function decorateHostileHazard(engine, hazard) {
    if (!hazard || decoratedHostileHazards.has(hazard)) return hazard;
    if (Number.isFinite(hazard.damage)) {
      hazard.damage *= boundedProduct(engine, 'enemyDamageMultiplier', 0.2, 5);
    }
    decoratedHostileHazards.add(hazard);
    return hazard;
  }

  const baseGetRunModifierProduct = proto.getRunModifierProduct;
  proto.getRunModifierProduct = function getRunModifierProductInfinitum(key, fallback = 1) {
    let result = baseGetRunModifierProduct.call(this, key, fallback);
    const rewardEnemy = rewardContexts.get(this);
    if (key === 'coinRewardMultiplier' && rewardEnemy) {
      if (isFlying(this, rewardEnemy)) {
        result *= boundedProduct(this, 'flyingRewardMultiplier', 0.1, 5);
      }
      if (isSpecialist(rewardEnemy)) {
        result *= boundedProduct(this, 'specialistRewardMultiplier', 0.1, 5);
      }
    }
    return result;
  };

  const baseSpawnEnemy = proto.spawnEnemy;
  proto.spawnEnemy = function spawnEnemyInfinitum(type = 'swarmer', routeIndex = 0, options = {}) {
    const enemy = baseSpawnEnemy.call(this, type, routeIndex, options);
    if (!enemy || decoratedEnemies.has(enemy)) return enemy;

    if (isSpecialist(enemy)) {
      const specialistHpMultiplier = boundedProduct(this, 'specialistHpMultiplier', 0.2, 5);
      enemy.hp *= specialistHpMultiplier;
      enemy.maxHp *= specialistHpMultiplier;
    }
    const enemySpeedMultiplier = boundedProduct(this, 'enemySpeedMultiplier', 0.2, 3);
    if (!isFlying(this, enemy)) {
      const groundSpeedMultiplier = enemySpeedMultiplier * boundedProduct(this, 'groundSpeedMultiplier', 0.2, 3);
      enemy.speed *= groundSpeedMultiplier;
      enemy.baseSpeed *= groundSpeedMultiplier;
    } else {
      enemy.speed *= enemySpeedMultiplier;
      enemy.baseSpeed *= enemySpeedMultiplier;
      enemy.stealthTimer = Math.max(
        Number(enemy.stealthTimer) || 0,
        Math.max(0, Math.min(30, modifierMaximum(this, 'flyingStealthSeconds')))
      );
    }
    enemy.damage *= boundedProduct(this, 'enemyDamageMultiplier', 0.2, 5);
    decoratedEnemies.add(enemy);
    return enemy;
  };

  const baseGetAdjustedWaveGroupCount = proto.getAdjustedWaveGroupCount;
  proto.getAdjustedWaveGroupCount = function getAdjustedWaveGroupCountInfinitum(group) {
    const count = baseGetAdjustedWaveGroupCount.call(this, group);
    if (!HEAVY_TYPES.has(group?.type)) return count;
    return Math.max(1, Math.min(160, Math.round(
      count * boundedProduct(this, 'heavyCountMultiplier', 0.25, 4)
    )));
  };

  const baseSpawnMutant = proto.spawnMutant;
  proto.spawnMutant = function spawnMutantInfinitum(spawnSpec = null) {
    const enemy = baseSpawnMutant.call(this, spawnSpec);
    const multiplier = boundedProduct(this, 'heavyCountMultiplier', 0.25, 4);
    if (
      !enemy
      || enemy.isBoss
      || !isSpecialist(enemy)
      || isHeavy(enemy)
      || multiplier <= 1
      || this.enemies.length >= 160
    ) return enemy;

    const guaranteedEscorts = Math.min(2, Math.floor(multiplier - 1));
    const fractionalEscort = Math.min(1, Math.max(0, multiplier - 1 - guaranteedEscorts));
    const escortCount = guaranteedEscorts
      + (this.getRunRandom() < fractionalEscort ? 1 : 0);
    for (let index = 0; index < escortCount && this.enemies.length < 160; index++) {
      const escortType = this.getRunRandom() < 0.5 ? 'brute' : 'bulwark';
      const angle = ((Number(enemy.routeIndex) || 0) + index + 1) * 2.399963;
      this.spawnEnemy(escortType, enemy.routeIndex, {
        x: enemy.x + Math.cos(angle) * (enemy.radius + 22),
        y: enemy.y + Math.sin(angle) * (enemy.radius + 22),
        waypointIndex: enemy.waypointIndex,
        countForWave: false,
        suppressCinematic: true
      });
    }
    return enemy;
  };

  const baseGetDefenseStatsAtLevel = proto.getDefenseStatsAtLevel;
  proto.getDefenseStatsAtLevel = function getDefenseStatsAtLevelInfinitum(defense, requestedLevel) {
    const stats = baseGetDefenseStatsAtLevel.call(this, defense, requestedLevel);
    if (!stats) return stats;
    const hpMultiplier = defense?.type === 'barrier'
      ? boundedProduct(this, 'barrierHpMultiplier', 0.2, 5)
      : boundedProduct(this, 'defenseHpMultiplier', 0.2, 5);
    return {
      ...stats,
      range: Math.max(1, Math.round(
        stats.range * boundedProduct(this, 'defenseRangeMultiplier', 0.2, 3)
      )),
      maxHp: Math.max(1, Math.round(stats.maxHp * hpMultiplier))
    };
  };

  proto.getInfinitumDefenseCost = function getInfinitumDefenseCost(towerType) {
    return getDefenseCost(this, towerType);
  };

  const baseBuildSelectedTowerAt = proto.buildSelectedTowerAt;
  proto.buildSelectedTowerAt = function buildSelectedTowerAtInfinitum(x, y) {
    const originalTower = this.selectedTowerToBuild;
    const runtimeCost = getDefenseCost(this, originalTower);
    if (!originalTower || runtimeCost === Number(originalTower.cost)) {
      return baseBuildSelectedTowerAt.call(this, x, y);
    }
    this.selectedTowerToBuild = { ...originalTower, cost: runtimeCost };
    try {
      return baseBuildSelectedTowerAt.call(this, x, y);
    } finally {
      this.selectedTowerToBuild = originalTower;
    }
  };

  function refreshBuildCostPresentation(engine) {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.build-tower-card').forEach(card => {
      const tower = getTowerType(card.dataset.towerId);
      if (!tower) return;
      const cost = getDefenseCost(engine, tower);
      const affordable = engine.coins >= cost;
      const costNode = card.querySelector('.cost');
      if (costNode) costNode.textContent = `${cost}🪙`;
      card.title = `${tower.name} (${cost} 🪙) - ${tower.desc}`;
      card.setAttribute('aria-label', `${tower.name}, coût ${cost} Bio-Coins. ${tower.desc}`);
      card.classList.toggle('unaffordable', !affordable);
      card.dataset.affordable = String(affordable);
      card.dataset.runtimeCost = String(cost);
      card.setAttribute('aria-disabled', String(!affordable));
      if (card.dataset.runtimeCostAnnouncementBound !== 'true') {
        card.dataset.runtimeCostAnnouncementBound = 'true';
        card.addEventListener('click', () => {
          const selectedTower = getTowerType(card.dataset.towerId);
          const selectedCost = getDefenseCost(engine, selectedTower);
          if (!selectedTower) return;
          const currentlyAffordable = engine.coins >= selectedCost;
          engine.announce?.(currentlyAffordable
            ? `${selectedTower.name} sélectionnée. Coût ${selectedCost} Bio-Coins.`
            : `${selectedTower.name} indisponible : ${selectedCost} Bio-Coins requis, ${engine.coins} disponibles.`);
        });
      }
    });
  }

  const baseRenderBuildBar = proto.renderBuildBar;
  proto.renderBuildBar = function renderBuildBarInfinitum() {
    const result = baseRenderBuildBar.call(this);
    refreshBuildCostPresentation(this);
    return result;
  };

  const baseUpdateBuildBarAffordability = proto.updateBuildBarAffordability;
  proto.updateBuildBarAffordability = function updateBuildBarAffordabilityInfinitum() {
    const result = baseUpdateBuildBarAffordability.call(this);
    refreshBuildCostPresentation(this);
    return result;
  };

  const baseGetDefenseSellValue = proto.getDefenseSellValue;
  proto.getDefenseSellValue = function getDefenseSellValueInfinitum(defense) {
    const refund = baseGetDefenseSellValue.call(this, defense);
    return Math.max(0, Math.floor(
      refund * boundedProduct(this, 'sellRatioMultiplier', 0.05, 3)
    ));
  };

  const baseUpdatePlacedTowers = proto.updatePlacedTowers;
  proto.updatePlacedTowers = function updatePlacedTowersInfinitum(dt) {
    const drain = Math.max(0, Math.min(1000, modifierMaximum(this, 'barrierHpDrainPerSecond')));
    if (drain > 0 && Number.isFinite(dt) && dt > 0) {
      for (let index = this.placedTowers.length - 1; index >= 0; index--) {
        const barrier = this.placedTowers[index];
        if (barrier?.type !== 'barrier' || barrier.ultimateInvulnerableTimer > 0) continue;
        barrier.hp -= drain * dt;
        if (barrier.hp > 0) continue;
        this.placedTowers.splice(index, 1);
        this.showFeedback?.(`${barrier.name} consumée par la Route d’Épines.`, '#ef4444');
      }
    }
    return baseUpdatePlacedTowers.call(this, dt);
  };

  const baseGetEnemyControlResistance = proto.getEnemyControlResistance;
  proto.getEnemyControlResistance = function getEnemyControlResistanceInfinitum(enemy, controlType = 'stun') {
    let resistance = baseGetEnemyControlResistance.call(this, enemy, controlType);
    if (isSpecialist(enemy)) {
      resistance *= boundedProduct(this, 'specialistControlResistanceMultiplier', 0.05, 2);
    }
    if (enemy?.isBoss) {
      resistance *= boundedProduct(this, 'bossControlResistanceMultiplier', 0.05, 2);
    }
    return Math.max(0, Math.min(1, resistance));
  };

  const baseApplyEnemyStun = proto.applyEnemyStun;
  proto.applyEnemyStun = function applyEnemyStunInfinitum(enemy, baseDurationSeconds) {
    const duration = Math.max(0, Number(baseDurationSeconds) || 0)
      * boundedProduct(this, 'controlDurationMultiplier', 0.1, 5);
    return baseApplyEnemyStun.call(this, enemy, duration);
  };

  const baseDamageEnemy = proto.damageEnemy;
  proto.damageEnemy = function damageEnemyInfinitum(enemy, amount, options = {}) {
    let adjustedAmount = amount;
    if (enemy && Number.isFinite(amount) && amount > 0) {
      const isSplash = (splashDepths.get(this) || 0) > 0;
      if (isHeavy(enemy)) {
        adjustedAmount *= boundedProduct(
          this,
          isSplash ? 'heavySplashDamageMultiplier' : 'heavyDirectDamageMultiplier',
          0.1,
          5
        );
      }
      if (isSplash) {
        adjustedAmount *= boundedProduct(this, 'splashDamageMultiplier', 0.1, 5);
      }
      if ((Number(enemy.markedTimer) || 0) > 0 || (Number(enemy.revealedTimer) || 0) > 0) {
        adjustedAmount *= boundedProduct(this, 'revealedDamageTakenMultiplier', 0.1, 5);
      }
    }
    return baseDamageEnemy.call(this, enemy, adjustedAmount, options);
  };

  const baseCreateExplosion = proto.createExplosion;
  proto.createExplosion = function createExplosionInfinitum(x, y, radius, damage, options = {}) {
    return withSplashContext(this, () => (
      baseCreateExplosion.call(this, x, y, radius, damage, options)
    ));
  };

  const baseUpdateHazards = proto.updateHazards;
  proto.updateHazards = function updateHazardsInfinitum(dt) {
    return withSplashContext(this, () => baseUpdateHazards.call(this, dt));
  };

  const baseFireTower = proto.fireTower;
  proto.fireTower = function fireTowerInfinitum(tower, target) {
    if (!IMMEDIATE_SPLASH_TOWERS.has(tower?.type)) {
      return baseFireTower.call(this, tower, target);
    }
    return withSplashContext(this, () => baseFireTower.call(this, tower, target));
  };

  const baseUpdateArtillerySiege = proto.updateArtillerySiege;
  proto.updateArtillerySiege = function updateArtillerySiegeInfinitum(enemy, dt) {
    const cadenceMultiplier = boundedProduct(this, 'enemyFireRateMultiplier', 0.2, 5)
      * boundedProduct(this, 'artilleryFireRateMultiplier', 0.2, 5);
    if (
      enemy?.type === 'artillery'
      && Number(enemy.siegeDeployTimer) <= 0
      && Number.isFinite(dt)
      && dt > 0
    ) {
      enemy.siegeTimer = Math.max(
        0,
        (Number(enemy.siegeTimer) || 0) + dt * ((1 / cadenceMultiplier) - 1)
      );
    }
    const firstBullet = this.enemyBullets.length;
    const result = baseUpdateArtillerySiege.call(this, enemy, dt);
    this.enemyBullets.slice(firstBullet).forEach(bullet => {
      // Artillery damage already inherits enemyDamageMultiplier from spawnEnemy.
      decorateHostileBullet(this, bullet, true);
    });
    return result;
  };

  const baseUpdateEnemies = proto.updateEnemies;
  proto.updateEnemies = function updateEnemiesInfinitum(dt) {
    const cadenceMultiplier = boundedProduct(this, 'enemyFireRateMultiplier', 0.2, 5);
    if (
      cadenceMultiplier !== 1
      && this.freezeTimer <= 0
      && Number.isFinite(dt)
      && dt > 0
    ) {
      this.enemies.forEach(enemy => {
        const insideArena = enemy.x >= 0 && enemy.x <= this.worldWidth
          && enemy.y >= 0 && enemy.y <= this.worldHeight;
        if (
          !enemy.isBoss
          || enemy.dead
          || enemy.stunTimer > 0
          || enemy.convertedTimer > 0
          || enemy.telegraphTimer > 0
          || !insideArena
        ) return;
        enemy.bulletTimer = Math.max(
          0,
          (Number(enemy.bulletTimer) || 0) + dt * ((1 / cadenceMultiplier) - 1)
        );
      });
    }
    return baseUpdateEnemies.call(this, dt);
  };

  const baseFireBossPattern = proto.fireBossPattern;
  proto.fireBossPattern = function fireBossPatternInfinitum(boss) {
    const firstBullet = this.enemyBullets.length;
    const firstHazard = this.bossHazards.length;
    const result = baseFireBossPattern.call(this, boss);
    this.enemyBullets.slice(firstBullet).forEach(bullet => decorateHostileBullet(this, bullet));
    this.bossHazards.slice(firstHazard).forEach(hazard => decorateHostileHazard(this, hazard));
    return result;
  };

  const baseApplyBossSignature = proto.applyBossSignature;
  proto.applyBossSignature = function applyBossSignatureInfinitum(boss, definition, phase = 1, trigger = 'pattern') {
    const firstBullet = this.enemyBullets.length;
    const firstHazard = this.bossHazards.length;
    const result = baseApplyBossSignature.call(this, boss, definition, phase, trigger);
    this.enemyBullets.slice(firstBullet).forEach(bullet => decorateHostileBullet(this, bullet));
    this.bossHazards.slice(firstHazard).forEach(hazard => decorateHostileHazard(this, hazard));
    return result;
  };

  const baseKillEnemy = proto.killEnemy;
  proto.killEnemy = function killEnemyInfinitum(enemy) {
    if (!enemy || enemy.dead) return baseKillEnemy.call(this, enemy);
    const existingCrates = new Set(this.crates);
    rewardContexts.set(this, enemy);
    let result;
    try {
      result = baseKillEnemy.call(this, enemy);
    } finally {
      rewardContexts.delete(this);
    }

    const crateMultiplier = boundedProduct(this, 'crateChanceMultiplier', 0.1, 5);
    const baseChance = 0.07;
    const targetChance = Math.min(0.75, baseChance * crateMultiplier);
    const crateAdded = this.crates.some(crate => !existingCrates.has(crate));
    if (!enemy.isBoss && !crateAdded && targetChance > baseChance) {
      const conditionalChance = (targetChance - baseChance) / (1 - baseChance);
      if (this.getRunRandom() < conditionalChance) {
        const isRed = this.getRunRandom() < 0.25;
        this.addBoundedLoot('crate', {
          x: enemy.x,
          y: enemy.y,
          type: isRed ? 'red' : 'blue',
          radius: 14
        });
      }
    }
    return result;
  };

  const baseCompleteWave = proto.completeWave;
  proto.completeWave = function completeWaveInfinitum() {
    const eligible = !this.waveRewardClaimed && this.waveActive;
    const completedWave = Number(this.wave) || 1;
    const completedTowerFloor = this.isTowerMode ? Number(this.towerFloor) : null;
    const milestoneWasClaimed = completedTowerFloor != null
      && this.claimedInfinitumMilestones?.has?.(completedTowerFloor);
    const result = baseCompleteWave.call(this);
    if (!eligible) return result;

    let progressionChanged = false;
    if (this.secondaryObjectiveResult === true) {
      const baseBonus = 16 + (completedWave * 2);
      const totalBonus = Math.round(
        baseBonus * boundedProduct(this, 'secondaryRewardMultiplier', 0.1, 5)
      );
      const extraBonus = Math.max(0, totalBonus - baseBonus);
      if (extraBonus > 0) {
        this.coins += extraBonus;
        this.score += extraBonus * 5;
        progressionChanged = true;
      }
    }

    const milestoneNowClaimed = completedTowerFloor != null
      && completedTowerFloor % 10 === 0
      && this.claimedInfinitumMilestones?.has?.(completedTowerFloor);
    if (
      milestoneNowClaimed
      && !milestoneWasClaimed
      && this.lastProfessionalInfinitumMilestoneFloor !== completedTowerFloor
    ) {
      const baseMilestone = 25 + Math.floor(completedTowerFloor / 2);
      const totalMilestone = Math.round(
        baseMilestone * boundedProduct(this, 'milestoneMetaMultiplier', 0.1, 5)
      );
      const extraMilestone = Math.max(0, totalMilestone - baseMilestone);
      if (extraMilestone > 0) {
        this.metaCoins += extraMilestone;
        this.runMetaCoinsEarned += extraMilestone;
        progressionChanged = true;
      }
    }

    if (progressionChanged) {
      this.updateHUD?.();
      this.saveProgress?.();
    }
    return result;
  };

  Object.defineProperty(proto, RUNTIME_KEY, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: true
  });

  const CONTRACTS = Object.freeze({
    defenseCostMultiplier: 'construction cost, affordability and paid investment',
    secondaryRewardMultiplier: 'successful secondary objective coins and score',
    enemyDamageMultiplier: 'spawned enemy contact/artillery damage plus boss projectiles and hazards',
    enemySpeedMultiplier: 'global enemy speed and base speed at spawn',
    groundSpeedMultiplier: 'ground enemy speed and base speed at spawn',
    flyingStealthSeconds: 'untargetable flying entry window',
    flyingRewardMultiplier: 'flying kill coin reward',
    barrierHpDrainPerSecond: 'fixed-step barrier durability drain',
    heavyCountMultiplier: 'authored heavy groups plus deterministic specialist escorts',
    specialistHpMultiplier: 'specialist health at spawn',
    enemyFireRateMultiplier: 'boss and artillery cadence',
    sellRatioMultiplier: 'defense sale refund',
    specialistControlResistanceMultiplier: 'specialist stun and displacement resistance',
    specialistRewardMultiplier: 'specialist kill coin reward',
    heavyDirectDamageMultiplier: 'direct damage received by heavy enemies',
    heavySplashDamageMultiplier: 'area damage received by heavy enemies',
    crateChanceMultiplier: 'bounded additional crate probability',
    defenseRangeMultiplier: 'level-derived defense range',
    revealedDamageTakenMultiplier: 'damage against marked or revealed enemies',
    splashDamageMultiplier: 'explosion, hazard and immediate area damage',
    artilleryFireRateMultiplier: 'artillery cadence',
    hostileProjectileSpeedMultiplier: 'new hostile projectile velocity',
    barrierHpMultiplier: 'level-derived barrier durability',
    defenseHpMultiplier: 'level-derived non-barrier durability',
    controlDurationMultiplier: 'stun duration before target resistance',
    bossControlResistanceMultiplier: 'boss stun and displacement resistance',
    milestoneMetaMultiplier: 'new ten-floor Infinitum milestone meta reward'
  });

  root.INFERNAL_CITY_INFINITUM_RUNTIME = Object.freeze({
    version: '1.0.0',
    installed: true,
    installOrder: 'after gameplay-professional.v1.js and before DOMContentLoaded boot',
    modifierKeys: MODIFIER_KEYS,
    contracts: CONTRACTS,
    modifierProduct,
    modifierMaximum,
    getDefenseCost,
    isSpecialist,
    isHeavy
  });
})(typeof window !== 'undefined' ? window : globalThis);
