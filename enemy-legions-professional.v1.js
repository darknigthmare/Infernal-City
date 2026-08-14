(function installProfessionalEnemyLegions(root) {
  'use strict';

  const legions = root.INFERNAL_CITY_ENEMY_LEGIONS;
  if (!legions || typeof GameEngine !== 'function') return;

  const proto = GameEngine.prototype;
  const definitions = legions.enemies || {};
  const effects = legions.effects || {};
  const ATTACK_MODES = Object.freeze([
    'projectile', 'melee', 'beam', 'ranged_arc', 'sonic', 'ranged', 'contact',
    'area', 'projectile_arc', 'drain', 'pulse', 'melee_area', 'channel', 'area_pulse'
  ]);
  const TARGET_POLICIES = Object.freeze([
    'nearest_defense', 'weakest_defense', 'citadel', 'furthest_defense',
    'area_defenses', 'rear_defense', 'highest_cost_defense', 'defense_cluster',
    'marked_defense', 'burning_defense', 'lowest_health_defense',
    'highest_damage_defense', 'path_near_defenses', 'highest_level_defense',
    'highest_attack_speed_defense', 'feared_defense', 'all_defenses_in_range'
  ]);
  const MECHANIC_TYPES = Object.freeze([
    'armor_shred', 'gap_closer', 'chain_heal', 'damage_redirect', 'summon',
    'revive', 'pierce', 'revive_aura', 'frontal_shield', 'deploy_barrier',
    'evasion', 'path_skip', 'silence', 'pull_field', 'mark_execute', 'burn',
    'hazard_trail', 'deploy_aura', 'retaliation', 'siege_channel',
    'accuracy_debuff', 'teleport_strike', 'stealth_aura', 'deploy_stealth',
    'charged_critical', 'death_field', 'death_burst', 'infection_splash',
    'conditional_regeneration', 'deploy_hazard', 'barrier_bonus', 'attack_combo',
    'tether', 'deploy_cover', 'siege_splash', 'chain_damage', 'delayed_repeat',
    'deploy_slow', 'shared_health', 'position_rewind', 'evasion_aura',
    'moving_area_attack', 'spawn_decoys', 'adaptive_resistance',
    'scaling_barrage', 'fear_stack', 'target_scramble', 'sleep_charm',
    'consume_debuff', 'stacking_global_pulse'
  ]);

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const distance = (left, right) => Math.hypot((left?.x || 0) - (right?.x || 0), (left?.y || 0) - (right?.y || 0));
  const seconds = value => Math.max(0, (Number(value) || 0) / 1000);

  function runtime(engine) {
    if (!engine.legionRuntime || typeof engine.legionRuntime !== 'object') {
      engine.legionRuntime = { fields: [], effectImages: Object.create(null) };
    }
    const state = engine.legionRuntime;
    if (!Array.isArray(state.fields)) state.fields = [];
    if (!Array.isArray(state.delayed)) state.delayed = [];
    if (!state.effectImages || typeof state.effectImages !== 'object') state.effectImages = Object.create(null);
    if (!(state.spatial instanceof Map)) state.spatial = new Map();
    return state;
  }

  function definitionFor(enemyOrType) {
    return definitions[typeof enemyOrType === 'string' ? enemyOrType : enemyOrType?.type] || null;
  }

  function mechanicFor(enemyOrType, requestedType) {
    const mechanics = definitionFor(enemyOrType)?.mechanics || [];
    return requestedType
      ? mechanics.find(entry => entry.type === requestedType) || null
      : mechanics[0] || null;
  }

  function clock(engine) {
    return Math.max(0, Number(engine.animationClock) || 0);
  }

  function timerReady(enemy, id) {
    return (Number(enemy?.legionMechanicTimers?.[id]) || 0) <= 0;
  }

  function setMechanicTimer(enemy, id, duration) {
    if (!enemy.legionMechanicTimers || typeof enemy.legionMechanicTimers !== 'object') {
      enemy.legionMechanicTimers = Object.create(null);
    }
    enemy.legionMechanicTimers[id] = Math.max(0, Number(duration) || 0);
  }

  function tickMechanicTimers(enemy, dt) {
    if (!enemy.legionMechanicTimers || typeof enemy.legionMechanicTimers !== 'object') {
      enemy.legionMechanicTimers = Object.create(null);
      return;
    }
    Object.keys(enemy.legionMechanicTimers).forEach(id => {
      enemy.legionMechanicTimers[id] = Math.max(0, (Number(enemy.legionMechanicTimers[id]) || 0) - dt);
    });
  }

  function spatialKey(x, y, cellSize = 160) {
    return `${Math.floor((Number(x) || 0) / cellSize)}:${Math.floor((Number(y) || 0) / cellSize)}`;
  }

  function rebuildSpatial(engine) {
    const state = runtime(engine);
    state.spatial.clear();
    (engine.enemies || []).forEach(enemy => {
      if (!enemy || enemy.dead || !definitionFor(enemy)) return;
      const key = spatialKey(enemy.x, enemy.y);
      if (!state.spatial.has(key)) state.spatial.set(key, []);
      state.spatial.get(key).push(enemy);
    });
  }

  function nearbyLegions(engine, source, radius, predicate = null) {
    const state = runtime(engine);
    const cellSize = 160;
    const cellX = Math.floor((Number(source?.x) || 0) / cellSize);
    const cellY = Math.floor((Number(source?.y) || 0) / cellSize);
    const span = Math.max(1, Math.ceil((Number(radius) || 0) / cellSize));
    const result = [];
    for (let x = cellX - span; x <= cellX + span; x++) {
      for (let y = cellY - span; y <= cellY + span; y++) {
        (state.spatial.get(`${x}:${y}`) || []).forEach(enemy => {
          if (enemy === source || enemy.dead || distance(enemy, source) > radius) return;
          if (predicate && !predicate(enemy)) return;
          result.push(enemy);
        });
      }
    }
    return result;
  }

  function towerMetric(tower, policy, engine) {
    if (policy === 'weakest_defense') return (Number(tower.hp) || 0) / Math.max(1, Number(tower.maxHp) || 1);
    if (policy === 'lowest_health_defense') return Number(tower.hp) || 0;
    if (policy === 'furthest_defense') return -distance(tower, engine.citadel);
    if (policy === 'rear_defense') return distance(tower, engine.citadel);
    if (policy === 'highest_cost_defense') return -(Number(tower.investedCost || tower.baseCost || tower.cost) || 0);
    if (policy === 'highest_damage_defense') return -(Number(tower.damage) || 0);
    if (policy === 'highest_level_defense') return -(Number(tower.level) || 1);
    if (policy === 'highest_attack_speed_defense') return Number(tower.fireRate || tower.attackCooldown || 999999);
    if (policy === 'marked_defense') return tower.legionMarkedUntil > clock(engine) ? -1000000 : 0;
    if (policy === 'burning_defense') return tower.legionBurnUntil > clock(engine) ? -1000000 : 0;
    if (policy === 'feared_defense') return -(Number(tower.legionFearStacks) || 0);
    return 0;
  }

  function selectTowerTarget(engine, enemy, policy, maximumRange = Infinity, minimumRange = 0) {
    const towers = (engine.placedTowers || []).filter(tower => (
      tower && Number(tower.hp) > 0
      && distance(enemy, tower) <= maximumRange + (Number(tower.radius) || 0)
      && distance(enemy, tower) >= minimumRange
    ));
    if (!towers.length) return null;
    if (policy === 'defense_cluster' || policy === 'area_defenses' || policy === 'all_defenses_in_range') {
      let best = towers[0];
      let bestCount = -1;
      towers.forEach(candidate => {
        const count = towers.filter(other => distance(candidate, other) <= 95).length;
        if (count > bestCount) { best = candidate; bestCount = count; }
      });
      return best;
    }
    let best = towers[0];
    let bestMetric = policy === 'nearest_defense' || policy === 'path_near_defenses'
      ? distance(enemy, best)
      : towerMetric(best, policy, engine);
    for (let index = 1; index < towers.length; index++) {
      const candidate = towers[index];
      const metric = policy === 'nearest_defense' || policy === 'path_near_defenses'
        ? distance(enemy, candidate)
        : towerMetric(candidate, policy, engine);
      if (metric < bestMetric) { best = candidate; bestMetric = metric; }
    }
    return best;
  }

  function selectAttackTarget(engine, enemy, attack, mechanic) {
    const maximum = Math.max(24, (Number(definitionFor(enemy)?.stats?.attackRange) || 24) * (Number(enemy.legionRangeMultiplier) || 1));
    const minimum = Math.max(0, Number(attack?.minimumRange) || 0);
    if (mechanic?.type === 'barrier_bonus') {
      const barrier = selectTowerTarget(engine, enemy, 'nearest_defense', maximum, minimum);
      if (barrier?.type === 'barrier') return barrier;
    }
    if (attack?.target === 'citadel') return distance(enemy, engine.citadel) <= maximum + (engine.citadel?.radius || 0) ? engine.citadel : null;
    return selectTowerTarget(engine, enemy, attack?.target || 'nearest_defense', maximum, minimum);
  }

  function removeDestroyedTower(engine, tower, sourceName = 'une légion') {
    if (!tower || tower === engine.citadel || Number(tower.hp) > 0) return false;
    const index = (engine.placedTowers || []).indexOf(tower);
    if (index >= 0) engine.placedTowers.splice(index, 1);
    engine.showFeedback?.(`${tower.name || 'Défense'} détruite par ${sourceName}.`, '#ef4444');
    return true;
  }

  function damageTower(engine, tower, rawDamage, sourceEnemy, options = {}) {
    if (!tower || !Number.isFinite(rawDamage) || rawDamage <= 0) return 0;
    const sourceName = definitionFor(sourceEnemy)?.name || sourceEnemy?.name || 'une légion';
    let damage = rawDamage;
    if (tower !== engine.citadel) {
      if (Number(tower.ultimateInvulnerableTimer) > 0) return 0;
      const corrosion = tower.legionCorrosion;
      if (corrosion && corrosion.until > clock(engine)) damage *= 1 + (corrosion.stacks * corrosion.amount);
      if (tower.legionMarkedUntil > clock(engine)) damage *= Number(tower.legionMarkedDamageMultiplier) || 1.12;
      damage = Math.max(1, Math.round(damage));
      tower.hp -= damage;
      engine.addFloatingText?.(`-${damage}`, tower.x, tower.y - 24, '#fca5a5');
      removeDestroyedTower(engine, tower, sourceName);
      return damage;
    }
    if (engine.isOverdriveActive || Number(engine.invincibleTimer) > 0) return 0;
    damage = Math.max(1, Math.round(damage));
    engine.damageCitadel?.(damage);
    engine.addFloatingText?.(`-${damage}`, tower.x, tower.y - 30, '#ff2a5f');
    engine.updateHUD?.();
    return damage;
  }

  function addField(engine, field) {
    const state = runtime(engine);
    state.fields.push({
      kind: field.kind || 'visual',
      x: Number(field.x) || 0,
      y: Number(field.y) || 0,
      radius: Math.max(12, Number(field.radius || field.size) || 52),
      size: Math.max(24, Number(field.size || field.radius) || 52),
      life: clamp(Number(field.life) || 1, 0.05, 20),
      frameTime: 0,
      tickTimer: 0,
      effectId: field.effectId || null,
      ownerType: field.ownerType || null,
      factionId: field.factionId || null,
      values: { ...(field.values || {}) },
      summonIds: Array.isArray(field.summonIds) ? [...field.summonIds] : [],
      spawnCount: Math.max(0, Math.floor(Number(field.spawnCount) || 0)),
      routeIndex: Math.max(0, Math.floor(Number(field.routeIndex) || 0))
    });
    if (state.fields.length > 72) state.fields.splice(0, state.fields.length - 72);
    return state.fields[state.fields.length - 1];
  }

  function addDelayed(engine, task) {
    const state = runtime(engine);
    state.delayed.push({ ...task, delay: Math.max(0, Number(task.delay) || 0) });
    if (state.delayed.length > 128) state.delayed.splice(0, state.delayed.length - 128);
  }

  function applyBurn(engine, tower, mechanic) {
    const values = mechanic.values || {};
    tower.legionBurnStacks = Math.min(
      Math.max(1, Math.floor(Number(values.maxStacks) || 1)),
      (Number(tower.legionBurnStacks) || 0) + 1
    );
    tower.legionBurnDps = Math.max(Number(tower.legionBurnDps) || 0, Number(values.damagePerSecond) || 0);
    tower.legionBurnUntil = Math.max(Number(tower.legionBurnUntil) || 0, clock(engine) + seconds(values.durationMs));
  }

  function applyFear(engine, tower, stacks, durationMs) {
    tower.legionFearStacks = clamp((Number(tower.legionFearStacks) || 0) + (Number(stacks) || 0), 0, 9);
    tower.legionFearUntil = Math.max(Number(tower.legionFearUntil) || 0, clock(engine) + seconds(durationMs));
  }

  function executeHitMechanic(engine, enemy, target, mechanic, context) {
    const handler = MECHANIC_HANDLERS[mechanic?.type];
    if (handler?.onHit) handler.onHit(engine, enemy, target, mechanic, context);
  }

  function executeAttackMechanic(engine, enemy, target, mechanic, context) {
    const handler = MECHANIC_HANDLERS[mechanic?.type];
    if (handler?.onAttack) handler.onAttack(engine, enemy, target, mechanic, context);
  }

  function applyLegionImpact(engine, enemy, target, mechanic, context) {
    const dealt = damageTower(engine, target, context.damage, enemy, context);
    executeHitMechanic(engine, enemy, target, mechanic, { ...context, damage: dealt });
    return dealt;
  }

  function areaTowerTargets(engine, center, radius) {
    return (engine.placedTowers || []).filter(tower => Number(tower.hp) > 0 && distance(center, tower) <= radius + (tower.radius || 0));
  }

  function fireManagedProjectile(engine, enemy, target, attack, mechanic, context, burstIndex = 0) {
    const dx = (target.x || 0) - (enemy.x || 0);
    const dy = (target.y || 0) - (enemy.y || 0);
    const length = Math.max(1, Math.hypot(dx, dy));
    const speed = Math.max(120, Number(attack.projectileSpeed) || (attack.mode.includes('arc') ? 165 : 260));
    const spread = ((burstIndex - ((Math.max(1, attack.burstCount || 1) - 1) / 2)) * 0.045);
    const angle = Math.atan2(dy, dx) + spread;
    engine.enemyBullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: context.damage,
      radius: Math.max(5, Number(effects[attack.effectId]?.lifecycle?.hitboxRadius) || 7),
      color: enemy.color,
      sourceType: enemy.type,
      sourceEnemy: enemy,
      legionManaged: true,
      legionEffectId: attack.effectId || mechanic?.effectId || null,
      legionMechanicType: mechanic?.type || null,
      legionBornAt: clock(engine),
      life: 8,
      splashRadius: Number(context.splashRadius) || Number(effects[attack.effectId]?.gameplay?.splashRadius) || 0,
      stunDuration: Number(context.stunDuration) || 0,
      targetX: target.x,
      targetY: target.y
    });
    return length;
  }

  function performLegionAttack(engine, enemy, target) {
    const definition = definitionFor(enemy);
    const attack = definition?.attack || {};
    const mechanic = mechanicFor(enemy);
    if (!definition || !target) return false;
    const context = {
      damage: Math.max(1, (Number(enemy.damage) || Number(definition.stats?.damage) || 1) * (Number(enemy.legionDamageMultiplier) || 1)),
      multiplier: Math.max(0.1, Number(enemy.legionNextAttackMultiplier) || 1),
      splashRadius: 0,
      stunDuration: 0
    };
    executeAttackMechanic(engine, enemy, target, mechanic, context);
    context.damage *= Math.max(0.1, Number(context.multiplier) || 1);
    const mode = attack.mode || 'melee';
    const projectileModes = new Set(['projectile', 'projectile_arc', 'ranged_arc', 'ranged']);
    const directModes = new Set(['beam', 'channel', 'drain']);
    const areaModes = new Set(['area', 'pulse', 'sonic', 'melee_area', 'area_pulse']);
    if (projectileModes.has(mode)) {
      const burst = clamp(Math.floor(Number(attack.burstCount) || 1), 1, 5);
      for (let index = 0; index < burst; index++) fireManagedProjectile(engine, enemy, target, attack, mechanic, context, index);
    } else if (directModes.has(mode)) {
      applyLegionImpact(engine, enemy, target, mechanic, context);
      if (mode === 'drain' && target !== engine.citadel) {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + (context.damage * 0.35));
      }
      if (attack.effectId || mechanic?.effectId) addField(engine, {
        kind: 'beam', x: target.x, y: target.y, radius: 28, life: 0.35,
        effectId: attack.effectId || mechanic.effectId, ownerType: enemy.type, factionId: enemy.legionFactionId
      });
    } else if (areaModes.has(mode)) {
      const radius = Math.max(48, Number(context.splashRadius) || (mode === 'area_pulse' ? 150 : 72));
      const targets = mode === 'area_pulse'
        ? (engine.placedTowers || []).filter(tower => distance(enemy, tower) <= Math.max(radius, Number(definition.stats?.attackRange) || radius))
        : areaTowerTargets(engine, target, radius);
      targets.forEach(tower => applyLegionImpact(engine, enemy, tower, mechanic, { ...context, damage: context.damage * (tower === target ? 1 : 0.72) }));
      if (attack.effectId || mechanic?.effectId) addField(engine, {
        kind: 'pulse', x: target.x, y: target.y, radius, life: 0.8,
        effectId: attack.effectId || mechanic.effectId, ownerType: enemy.type, factionId: enemy.legionFactionId
      });
    } else {
      applyLegionImpact(engine, enemy, target, mechanic, context);
    }
    enemy.attackAnimationTimer = Math.max(Number(enemy.attackAnimationTimer) || 0, 0.42);
    return true;
  }

  function updateManagedProjectiles(engine, dt, projectiles) {
    const bounds = engine.getApproachCullBounds?.(220) || { left: -1000, right: (engine.worldWidth || 1000) + 1000, top: -1000, bottom: (engine.worldHeight || 600) + 1000 };
    for (let index = projectiles.length - 1; index >= 0; index--) {
      const bullet = projectiles[index];
      bullet.life = (Number(bullet.life) || 8) - dt;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      const impacted = (engine.placedTowers || []).find(tower => Number(tower.hp) > 0 && distance(tower, bullet) <= (tower.radius || 0) + (bullet.radius || 0));
      const hitsCitadel = !impacted && distance(engine.citadel, bullet) <= (engine.citadel?.radius || 0) + (bullet.radius || 0);
      if (impacted || hitsCitadel) {
        const target = impacted || engine.citadel;
        const enemy = bullet.sourceEnemy || { type: bullet.sourceType, damage: bullet.damage, legionFactionId: definitionFor(bullet.sourceType)?.factionId };
        const mechanic = mechanicFor(bullet.sourceType, bullet.legionMechanicType) || mechanicFor(bullet.sourceType);
        const context = { damage: Number(bullet.damage) || 1, splashRadius: Number(bullet.splashRadius) || 0, stunDuration: Number(bullet.stunDuration) || 0 };
        applyLegionImpact(engine, enemy, target, mechanic, context);
        if (context.splashRadius > 0 && target !== engine.citadel) {
          areaTowerTargets(engine, target, context.splashRadius).filter(tower => tower !== target)
            .forEach(tower => applyLegionImpact(engine, enemy, tower, mechanic, { ...context, damage: context.damage * 0.65 }));
        }
        projectiles.splice(index, 1);
        continue;
      }
      if (bullet.life <= 0 || bullet.x < bounds.left || bullet.x > bounds.right || bullet.y < bounds.top || bullet.y > bounds.bottom) {
        projectiles.splice(index, 1);
      }
    }
  }

  function updateDelayed(engine, dt) {
    const state = runtime(engine);
    for (let index = state.delayed.length - 1; index >= 0; index--) {
      const task = state.delayed[index];
      task.delay -= dt;
      if (task.delay > 0) continue;
      if (task.kind === 'spawn') {
        const ids = Array.isArray(task.summonIds) ? task.summonIds : [];
        for (let count = 0; count < Math.min(4, Number(task.count) || 1); count++) {
          const type = ids[count % Math.max(1, ids.length)];
          if (!type || (engine.enemies || []).length >= 96) break;
          const spawned = engine.spawnEnemy(type, task.routeIndex || 0, {
            x: task.x + ((count - ((task.count - 1) / 2)) * 18), y: task.y + 8,
            waypointIndex: task.waypointIndex || 1, hpMultiplier: Number(task.hpMultiplier) || 0.65,
            countForWave: false
          });
          if (task.life && spawned) spawned.legionDecoyLife = task.life;
        }
      } else if (task.kind === 'damage') {
        const target = (engine.placedTowers || []).filter(tower => Number(tower.hp) > 0)
          .sort((left, right) => distance(left, task) - distance(right, task))[0];
        if (target && distance(target, task) <= 80) damageTower(engine, target, Number(task.damage) || 1, { type: task.sourceType });
      }
      state.delayed.splice(index, 1);
    }
  }

  function inferLegacyFieldKind(field) {
    if (field.kind && field.kind !== 'visual') return field.kind;
    const id = field.effectId || '';
    if (/miasma/.test(id)) return 'death_field';
    if (/grave_rune/.test(id)) return 'revive_aura';
    if (/brazier/.test(id)) return 'deploy_aura';
    if (/lantern/.test(id)) return 'deploy_stealth';
    if (/anchor/.test(id)) return 'deploy_slow';
    if (/canker/.test(id)) return 'deploy_hazard';
    if (/wall|barricade/.test(id)) return 'deploy_cover';
    if (/gravity/.test(id)) return 'pull_field';
    return field.kind || 'visual';
  }

  function updateFields(engine, dt) {
    const state = runtime(engine);
    const current = clock(engine);
    for (let index = state.fields.length - 1; index >= 0; index--) {
      const field = state.fields[index];
      field.kind = inferLegacyFieldKind(field);
      field.life -= dt;
      field.frameTime = (Number(field.frameTime) || 0) + dt;
      field.tickTimer = (Number(field.tickTimer) || 0) - dt;
      if (field.tickTimer <= 0) {
        field.tickTimer = 0.25;
        const allies = nearbyLegions(engine, field, field.radius, enemy => !field.factionId || enemy.legionFactionId === field.factionId);
        if (['hazard_trail', 'death_field', 'deploy_hazard'].includes(field.kind)) {
          areaTowerTargets(engine, field, field.radius).forEach(tower => {
            damageTower(engine, tower, (Number(field.values.damagePerSecond) || Number(field.values.pulseDamage) || 4) * 0.25, { type: field.ownerType });
            if (field.kind === 'deploy_hazard') tower.legionInfectionUntil = Math.max(Number(tower.legionInfectionUntil) || 0, current + 1);
          });
        } else if (field.kind === 'pull_field') {
          areaTowerTargets(engine, field, field.radius).forEach(tower => {
            tower.disabledTimer = Math.max(Number(tower.disabledTimer) || 0, 0.18);
            tower.legionAccuracyPenaltyUntil = Math.max(Number(tower.legionAccuracyPenaltyUntil) || 0, current + 0.4);
          });
        } else if (field.kind === 'revive_aura') {
          allies.forEach(ally => { ally.legionReviveAuraUntil = Math.max(Number(ally.legionReviveAuraUntil) || 0, current + 0.5); });
        } else if (field.kind === 'deploy_aura') {
          allies.forEach(ally => { ally.legionHasteUntil = Math.max(Number(ally.legionHasteUntil) || 0, current + 0.5); ally.legionFieldHaste = Number(field.values.hasteMultiplier) || 1.1; });
        } else if (['stealth_aura', 'deploy_stealth'].includes(field.kind)) {
          allies.forEach(ally => { ally.stealthTimer = Math.max(Number(ally.stealthTimer) || 0, 0.45); });
        } else if (field.kind === 'deploy_slow') {
          areaTowerTargets(engine, field, field.radius).forEach(tower => {
            tower.legionCooldownSlowUntil = Math.max(Number(tower.legionCooldownSlowUntil) || 0, current + 0.5);
            tower.legionCooldownMultiplier = Math.max(Number(tower.legionCooldownMultiplier) || 1, Number(field.values.cooldownMultiplier) || 1.2);
          });
        } else if (['deploy_barrier', 'deploy_cover'].includes(field.kind)) {
          allies.forEach(ally => { ally.legionCoverUntil = Math.max(Number(ally.legionCoverUntil) || 0, current + 0.5); ally.legionCoverReduction = 0.22; });
        }
      }
      if (field.life > 0) continue;
      if (field.spawnCount > 0 && field.summonIds.length) addDelayed(engine, {
        kind: 'spawn', delay: 0, x: field.x, y: field.y, routeIndex: field.routeIndex,
        summonIds: field.summonIds, count: field.spawnCount, hpMultiplier: 0.55
      });
      state.fields.splice(index, 1);
    }
  }

  function updateTowerLegionStatuses(engine, dt) {
    const current = clock(engine);
    (engine.placedTowers || []).forEach(tower => {
      if (tower.legionBurnUntil > current) {
        damageTower(engine, tower, (Number(tower.legionBurnDps) || 0) * (Number(tower.legionBurnStacks) || 1) * dt, { name: 'la combustion' });
      } else {
        tower.legionBurnStacks = 0;
        tower.legionBurnDps = 0;
      }
      if (tower.legionFearUntil <= current) tower.legionFearStacks = 0;
      if (tower.legionCorrosion?.until <= current) tower.legionCorrosion = null;
      const fearPenalty = (Number(tower.legionFearStacks) || 0) * 0.06;
      const accuracyPenalty = tower.legionAccuracyPenaltyUntil > current ? (Number(tower.legionAccuracyPenalty) || 0.2) : 0;
      const slow = tower.legionCooldownSlowUntil > current ? Math.max(0, (Number(tower.legionCooldownMultiplier) || 1) - 1) : 0;
      tower.legionRuntimeRateMultiplier = 1 + fearPenalty + accuracyPenalty + slow;
      if (tower.legionSleepUntil > current) tower.disabledTimer = Math.max(Number(tower.disabledTimer) || 0, 0.2);
    });
  }

  function applySynergies(engine) {
    const current = clock(engine);
    (engine.enemies || []).forEach(enemy => {
      const definition = definitionFor(enemy);
      if (!definition || enemy.dead) return;
      enemy.legionDamageMultiplier = 1;
      enemy.legionAttackSpeedMultiplier = 1;
      enemy.legionRangeMultiplier = 1;
      enemy.legionArmorBonus = 0;
      enemy.legionSynergy = Object.create(null);
      (definition.synergies || []).forEach(synergy => {
        const radius = Math.max(1, Number(synergy.radius) || 125);
        const active = nearbyLegions(engine, enemy, radius, ally => (synergy.with || []).includes(ally.type));
        if (!active.length) return;
        const bonus = synergy.bonus || {};
        enemy.legionSynergy = { ...enemy.legionSynergy, ...bonus };
        enemy.legionDamageMultiplier *= Number(bonus.damageMultiplier || bonus.attackDamageMultiplier || bonus.projectileDamageMultiplier) || 1;
        enemy.legionAttackSpeedMultiplier *= Number(bonus.attackSpeedMultiplier) || 1;
        enemy.legionRangeMultiplier *= Number(bonus.rangeMultiplier) || 1;
        enemy.legionArmorBonus += Number(bonus.armorBonus) || 0;
        if (Number(bonus.speedMultiplier) > 0) enemy.legionSynergySpeedMultiplier = Number(bonus.speedMultiplier);
      });
      const baseSpeed = Math.max(1, Number(enemy.legionBaseSpeed || enemy.baseSpeed || enemy.speed) || 1);
      let speedMultiplier = Number(enemy.legionSynergySpeedMultiplier) || 1;
      if (enemy.legionHasteUntil > current) speedMultiplier *= Number(enemy.legionFieldHaste) || 1.1;
      if (enemy.legionEvasionSpeedUntil > current) speedMultiplier *= Number(enemy.legionEvasionSpeedMultiplier) || 1.2;
      enemy.speed = Math.max(1, baseSpeed * speedMultiplier);
      enemy.legionSynergySpeedMultiplier = 1;
    });
  }

  function periodicField(engine, enemy, mechanic, kind, defaultCooldown, defaultDuration, defaultRadius) {
    if (!timerReady(enemy, mechanic.id)) return false;
    const values = mechanic.values || {};
    addField(engine, {
      kind, x: enemy.x, y: enemy.y, radius: Number(values.radius || values.auraRadius || values.stealthRadius) || defaultRadius,
      size: Number(values.radius || values.auraRadius || values.stealthRadius) || defaultRadius,
      life: seconds(values.durationMs || values.trailDurationMs) || defaultDuration,
      effectId: mechanic.effectId, ownerType: enemy.type, factionId: enemy.legionFactionId,
      values, summonIds: mechanic.summonIds, routeIndex: enemy.routeIndex
    });
    setMechanicTimer(enemy, mechanic.id, seconds(values.cooldownMs) || defaultCooldown);
    return true;
  }

  const MECHANIC_HANDLERS = {
    armor_shred: { onHit(engine, enemy, target, mechanic) {
      if (!target || target === engine.citadel) return;
      const values = mechanic.values || {};
      const prior = target.legionCorrosion && target.legionCorrosion.until > clock(engine) ? target.legionCorrosion : { stacks: 0 };
      target.legionCorrosion = {
        stacks: Math.min(Number(values.maxStacks) || 1, prior.stacks + 1),
        amount: Number(values.armorShred) || 0.1,
        until: clock(engine) + seconds(values.durationMs)
      };
    } },
    gap_closer: { update(engine, enemy, mechanic) {
      if (!timerReady(enemy, mechanic.id)) return;
      const target = selectTowerTarget(engine, enemy, 'weakest_defense', 240, 32);
      if (!target) return;
      const leap = Math.min(distance(enemy, target) - 24, Number(mechanic.values.leapDistance) || 70);
      if (leap <= 0) return;
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      enemy.x += Math.cos(angle) * leap; enemy.y += Math.sin(angle) * leap;
      enemy.legionNextAttackMultiplier = Number(mechanic.values.bonusDamageMultiplier) || 1.35;
      setMechanicTimer(enemy, mechanic.id, seconds(mechanic.values.cooldownMs) || 4.8);
    } },
    chain_heal: { update(engine, enemy, mechanic, dt) {
      if (!timerReady(enemy, mechanic.id)) return;
      const range = (Number(mechanic.values.range) || 175) * (Number(enemy.legionRangeMultiplier) || 1);
      nearbyLegions(engine, enemy, range, ally => ally.hp < ally.maxHp)
        .sort((left, right) => (left.hp / left.maxHp) - (right.hp / right.maxHp))
        .slice(0, Number(mechanic.values.chainCount) || 2)
        .forEach(ally => { ally.hp = Math.min(ally.maxHp, ally.hp + (Number(mechanic.values.healPerSecond) || 24)); });
      setMechanicTimer(enemy, mechanic.id, 1);
    } },
    damage_redirect: {},
    summon: { update(engine, enemy, mechanic) {
      if (!timerReady(enemy, mechanic.id)) return;
      const multiplier = Number(enemy.legionSynergy?.incubationTimeMultiplier) || 1;
      addField(engine, { kind: 'incubator', x: enemy.x, y: enemy.y, radius: 42, life: seconds(mechanic.values.incubationMs) * multiplier, effectId: mechanic.effectId, ownerType: enemy.type, factionId: enemy.legionFactionId });
      addDelayed(engine, { kind: 'spawn', delay: seconds(mechanic.values.incubationMs) * multiplier, x: enemy.x, y: enemy.y, routeIndex: enemy.routeIndex, waypointIndex: enemy.waypointIndex, summonIds: mechanic.summonIds, count: Number(mechanic.values.count) || 1, hpMultiplier: 0.65 });
      setMechanicTimer(enemy, mechanic.id, seconds(mechanic.values.cooldownMs) || 7.6);
    } },
    revive: {},
    pierce: { onHit(engine, enemy, target, mechanic, context) {
      if (!target || target === engine.citadel) return;
      const secondary = (engine.placedTowers || []).filter(tower => tower !== target && tower.hp > 0 && distance(tower, target) <= 120)
        .sort((left, right) => distance(left, target) - distance(right, target))[0];
      if (secondary) damageTower(engine, secondary, context.damage * (Number(mechanic.values.secondaryDamageMultiplier) || 0.6), enemy);
    } },
    revive_aura: { update(engine, enemy, mechanic) { periodicField(engine, enemy, mechanic, 'revive_aura', 10.5, 8, 105); } },
    frontal_shield: { update(engine, enemy, mechanic, dt) {
      const capacity = Number(mechanic.values.capacity) || 400;
      enemy.maxShield = Math.max(Number(enemy.maxShield) || 0, capacity);
      enemy.shield = clamp((Number(enemy.shield) || 0) + ((Number(mechanic.values.regenerationPerSecond) || 0) * dt), 0, enemy.maxShield);
    } },
    deploy_barrier: { update(engine, enemy, mechanic) {
      if (!periodicField(engine, enemy, mechanic, 'deploy_barrier', 8.2, 9, 82)) return;
      const field = runtime(engine).fields.at(-1);
      field.spawnCount = Number(enemy.legionSynergy?.spawnCount) || 0;
      field.summonIds = [...(mechanic.summonIds || [])];
    } },
    evasion: { update(engine, enemy, mechanic) {
      if (!timerReady(enemy, mechanic.id)) return;
      const duration = seconds(mechanic.values.untargetableMs) * (Number(enemy.legionSynergy?.evasionDurationMultiplier) || 1);
      enemy.stealthTimer = Math.max(Number(enemy.stealthTimer) || 0, duration);
      enemy.legionEvasionSpeedUntil = clock(engine) + duration;
      enemy.legionEvasionSpeedMultiplier = Number(mechanic.values.phaseSpeedMultiplier) || 1.2;
      setMechanicTimer(enemy, mechanic.id, seconds(mechanic.values.intervalMs) || 2.1);
    } },
    path_skip: { update(engine, enemy, mechanic, dt) {
      enemy.legionDistanceTravelled = (Number(enemy.legionDistanceTravelled) || 0) + (Math.max(0, Number(enemy.speed) || 0) * dt);
      if (enemy.legionDistanceTravelled < (Number(mechanic.values.distanceRequired) || 180)) return;
      const target = engine.getEnemyRouteTarget?.(enemy) || engine.citadel;
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      const skip = Number(mechanic.values.skipDistance) || 80;
      enemy.x += Math.cos(angle) * skip; enemy.y += Math.sin(angle) * skip;
      enemy.stealthTimer = Math.max(Number(enemy.stealthTimer) || 0, seconds(mechanic.values.untargetableMs));
      enemy.legionDistanceTravelled = 0;
    } },
    silence: { onHit(engine, enemy, target, mechanic) {
      if (!target || target === engine.citadel) return;
      target.disabledTimer = Math.max(Number(target.disabledTimer) || 0, seconds(mechanic.values.silenceMs));
      target.timer = Math.max(0, (Number(target.timer) || 0) - (Number(mechanic.values.energyDrain) || 0));
    } },
    pull_field: { update(engine, enemy, mechanic) { periodicField(engine, enemy, mechanic, 'pull_field', 7.8, 4.4, 58); } },
    mark_execute: { onHit(engine, enemy, target, mechanic) {
      if (!target || target === engine.citadel) return;
      if (target.hp / Math.max(1, target.maxHp) <= (Number(mechanic.values.executeThreshold) || 0.18)) damageTower(engine, target, target.hp + 1, enemy);
      else {
        target.legionMarkedUntil = clock(engine) + seconds(mechanic.values.markDurationMs);
        target.legionMarkedDamageMultiplier = 1.18;
      }
    } },
    burn: { onHit(engine, enemy, target, mechanic) {
      if (target && target !== engine.citadel) applyBurn(engine, target, mechanic);
    } },
    hazard_trail: { update(engine, enemy, mechanic) {
      if (!timerReady(enemy, mechanic.id)) return;
      addField(engine, { kind: 'hazard_trail', x: enemy.x, y: enemy.y, radius: Number(mechanic.values.width) || 20, life: seconds(mechanic.values.trailDurationMs) || 2.6, effectId: mechanic.effectId, ownerType: enemy.type, factionId: enemy.legionFactionId, values: mechanic.values });
      setMechanicTimer(enemy, mechanic.id, 0.7);
    } },
    deploy_aura: { update(engine, enemy, mechanic) { periodicField(engine, enemy, mechanic, 'deploy_aura', 10.8, 8.5, 110); } },
    retaliation: {},
    siege_channel: { onAttack(engine, enemy, target, mechanic, context) { context.splashRadius = Number(mechanic.values.splashRadius) || 72; } },
    accuracy_debuff: { onHit(engine, enemy, target, mechanic) {
      if (!target || target === engine.citadel) return;
      target.legionAccuracyPenalty = Number(mechanic.values.accuracyPenalty) || 0.2;
      target.legionAccuracyPenaltyUntil = clock(engine) + seconds(mechanic.values.durationMs);
    } },
    teleport_strike: { update(engine, enemy, mechanic) {
      if (!timerReady(enemy, mechanic.id)) return;
      const target = selectTowerTarget(engine, enemy, 'lowest_health_defense', (Number(mechanic.values.teleportRange) || 100) * 2.4, 34);
      if (!target) return;
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      enemy.x = target.x - Math.cos(angle) * 24; enemy.y = target.y - Math.sin(angle) * 24;
      enemy.legionBonusStrikes = Math.max(0, (Number(mechanic.values.strikeCount) || 2) - 1);
      setMechanicTimer(enemy, mechanic.id, seconds(mechanic.values.cooldownMs) || 5.2);
    } },
    stealth_aura: { update(engine, enemy, mechanic) {
      nearbyLegions(engine, enemy, Number(mechanic.values.radius) || 115, ally => ally.legionFactionId === enemy.legionFactionId)
        .forEach(ally => { ally.stealthTimer = Math.max(Number(ally.stealthTimer) || 0, seconds(mechanic.values.revealDelayMs) + 0.25); ally.legionFirstHitReduction = Number(mechanic.values.firstHitReduction) || 0.55; });
    } },
    deploy_stealth: { update(engine, enemy, mechanic) { periodicField(engine, enemy, mechanic, 'deploy_stealth', 9.2, 7.5, 125); } },
    charged_critical: { onAttack(engine, enemy, target, mechanic, context) { if (enemy.legionChargedReady) { context.multiplier *= Number(mechanic.values.criticalMultiplier) || 2.4; enemy.legionChargedReady = false; } } },
    death_field: {},
    death_burst: {},
    infection_splash: { onHit(engine, enemy, target, mechanic, context) {
      if (!target || target === engine.citadel) return;
      areaTowerTargets(engine, target, Number(mechanic.values.splashRadius) || 56).forEach(tower => {
        tower.legionInfectionStacks = clamp((Number(tower.legionInfectionStacks) || 0) + (Number(mechanic.values.infectionStacks) || 1), 0, 6);
        tower.legionInfectionUntil = clock(engine) + 5;
        tower.legionHealingMultiplier = Number(mechanic.values.healingReduction) || 0.5;
        if (tower !== target) damageTower(engine, tower, context.damage * 0.45, enemy);
      });
    } },
    conditional_regeneration: { update(engine, enemy, mechanic, dt) {
      const inHazard = runtime(engine).fields.some(field => ['death_field', 'deploy_hazard'].includes(inferLegacyFieldKind(field)) && distance(field, enemy) <= (field.radius || 0));
      const rat = nearbyLegions(engine, enemy, Number(mechanic.values.checkRadius) || 52, ally => ally.type === 'plague_miasma_rat').length > 0;
      if (!inHazard && !rat) { enemy.legionConditionalReduction = 0; return; }
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + ((Number(mechanic.values.healthPerSecond) || 34) * dt));
      enemy.legionConditionalReduction = Number(mechanic.values.damageReduction) || 0.16;
    } },
    deploy_hazard: { update(engine, enemy, mechanic) {
      if (!periodicField(engine, enemy, mechanic, 'deploy_hazard', 6.6, 7.2, 58)) return;
      if (mechanic.summonIds?.length) addDelayed(engine, { kind: 'spawn', delay: 1.2, x: enemy.x, y: enemy.y, routeIndex: enemy.routeIndex, waypointIndex: enemy.waypointIndex, summonIds: mechanic.summonIds, count: 1, hpMultiplier: 0.55 });
    } },
    barrier_bonus: { onAttack(engine, enemy, target, mechanic, context) { if (target?.type === 'barrier') context.multiplier *= Number(mechanic.values.damageMultiplier) || 1.55; } },
    attack_combo: { onAttack(engine, enemy, target, mechanic, context) {
      const current = clock(engine);
      if (enemy.legionComboTarget !== target || enemy.legionComboUntil < current) enemy.legionComboCount = 0;
      enemy.legionComboTarget = target; enemy.legionComboUntil = current + seconds(mechanic.values.comboWindowMs);
      enemy.legionComboCount = (Number(enemy.legionComboCount) || 0) + 1;
      if (enemy.legionComboCount >= (Number(mechanic.values.hitsRequired) || 3)) { context.multiplier *= Number(mechanic.values.finalHitMultiplier) || 1.8; enemy.legionComboCount = 0; }
    } },
    tether: { onHit(engine, enemy, target, mechanic) {
      if (!target || target === engine.citadel) return;
      target.disabledTimer = Math.max(Number(target.disabledTimer) || 0, seconds(mechanic.values.disableMs));
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      enemy.x += Math.cos(angle) * Math.min(Number(mechanic.values.pullDistance) || 68, distance(enemy, target) * 0.5);
      enemy.y += Math.sin(angle) * Math.min(Number(mechanic.values.pullDistance) || 68, distance(enemy, target) * 0.5);
    } },
    deploy_cover: { update(engine, enemy, mechanic) {
      if (enemy.legionCoverDeployed || enemy.hp / Math.max(1, enemy.maxHp) > (Number(mechanic.values.triggerHealthRatio) || 0.62)) return;
      enemy.legionCoverDeployed = true;
      addField(engine, { kind: 'deploy_cover', x: enemy.x, y: enemy.y, radius: 100, life: seconds(mechanic.values.durationMs) || 9.5, effectId: mechanic.effectId, ownerType: enemy.type, factionId: enemy.legionFactionId, values: mechanic.values });
    } },
    siege_splash: { onAttack(engine, enemy, target, mechanic, context) { context.splashRadius = Number(mechanic.values.splashRadius) || 78; context.stunDuration = seconds(mechanic.values.defenseStunMs); } },
    chain_damage: { onHit(engine, enemy, target, mechanic, context) {
      if (!target || target === engine.citadel) return;
      const count = (Number(mechanic.values.chainCount) || 2) + (Number(enemy.legionSynergy?.chainCountBonus) || 0);
      (engine.placedTowers || []).filter(tower => tower !== target && tower.hp > 0 && distance(tower, target) <= (Number(mechanic.values.chainRange) || 75))
        .sort((left, right) => distance(left, target) - distance(right, target)).slice(0, count)
        .forEach(tower => damageTower(engine, tower, context.damage * (Number(mechanic.values.chainDamageMultiplier) || 0.72), enemy));
    } },
    delayed_repeat: { onHit(engine, enemy, target, mechanic, context) {
      if (!target) return;
      const delayMultiplier = Number(enemy.legionSynergy?.echoDelayMultiplier) || 1;
      for (let echo = 1; echo <= Math.min(3, Number(mechanic.values.maxEchoes) || 1); echo++) addDelayed(engine, {
        kind: 'damage', delay: seconds(mechanic.values.delayMs) * echo * delayMultiplier,
        x: target.x, y: target.y, damage: context.damage * (Number(mechanic.values.repeatDamageMultiplier) || 0.55), sourceType: enemy.type
      });
    } },
    deploy_slow: { update(engine, enemy, mechanic) { periodicField(engine, enemy, mechanic, 'deploy_slow', 8.8, 6.8, 105); } },
    shared_health: {},
    position_rewind: {},
    evasion_aura: {},
    moving_area_attack: { onAttack(engine, enemy, target, mechanic, context) {
      enemy.legionAreaHitCount = (Number(enemy.legionAreaHitCount) || 0) + 1;
      if (enemy.legionAreaHitCount >= (Number(mechanic.values.hitsRequired) || 3)) {
        context.splashRadius = (Number(mechanic.values.radius) || 48) * (Number(enemy.legionSynergy?.areaRadiusMultiplier) || 1);
        context.multiplier *= Number(mechanic.values.damageMultiplier) || 0.7;
        enemy.legionAreaHitCount = 0;
      }
    } },
    spawn_decoys: { onAttack(engine, enemy, target, mechanic) {
      addDelayed(engine, { kind: 'spawn', delay: 0.05, x: enemy.x, y: enemy.y, routeIndex: enemy.routeIndex, waypointIndex: enemy.waypointIndex, summonIds: ['ash_ember_wisp'], count: Number(mechanic.values.decoyCount) || 2, hpMultiplier: Math.max(0.02, Number(mechanic.values.decoyHealth) / 100), life: seconds(mechanic.values.durationMs) || 3.6 });
    } },
    adaptive_resistance: {},
    scaling_barrage: { onAttack(engine, enemy, target, mechanic, context) {
      const current = clock(engine);
      if (enemy.legionBarrageResetAt < current) enemy.legionBarrageCasts = 0;
      const casts = Math.min(Number(mechanic.values.maxCasts) || 3, (Number(enemy.legionBarrageCasts) || 0) + 1);
      enemy.legionBarrageCasts = casts;
      enemy.legionBarrageResetAt = current + seconds(mechanic.values.resetDelayMs);
      context.multiplier *= 1 + ((casts - 1) * (Number(mechanic.values.damageGrowthPerCast) || 0.18));
      context.splashRadius = Math.max(context.splashRadius, 62);
    } },
    fear_stack: { onHit(engine, enemy, target, mechanic) { if (target && target !== engine.citadel) applyFear(engine, target, mechanic.values.stacks, mechanic.values.durationMs); } },
    target_scramble: {},
    sleep_charm: { onHit(engine, enemy, target, mechanic, context) {
      if (!target || target === engine.citadel) return;
      target.legionSleepUntil = clock(engine) + seconds(mechanic.values.sleepMs);
      target.disabledTimer = Math.max(Number(target.disabledTimer) || 0, seconds(mechanic.values.sleepMs));
      const redirected = (engine.placedTowers || []).filter(tower => tower !== target && tower.hp > 0).sort((left, right) => distance(left, target) - distance(right, target))[0];
      if (redirected && Number(mechanic.values.redirectedShots) > 0) damageTower(engine, redirected, context.damage * 0.6, enemy);
    } },
    consume_debuff: { onAttack(engine, enemy, target, mechanic, context) {
      if (!target || target === engine.citadel) return;
      const virtual = target.legionSleepUntil > clock(engine) ? (Number(enemy.legionSynergy?.virtualFearStacks) || 3) : 0;
      const available = (Number(target.legionFearStacks) || 0) + virtual;
      if (available < (Number(mechanic.values.stacksConsumed) || 3)) return;
      target.legionFearStacks = Math.max(0, (Number(target.legionFearStacks) || 0) - (Number(mechanic.values.stacksConsumed) || 3));
      context.multiplier *= Number(mechanic.values.damageMultiplier) || 1.65;
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + (enemy.maxHp * (Number(mechanic.values.healRatio) || 0.12)));
    } },
    stacking_global_pulse: { onAttack(engine, enemy, target, mechanic) {
      (engine.placedTowers || []).forEach(tower => {
        applyFear(engine, tower, mechanic.values.fearStacksPerPulse, 6500);
        if ((Number(tower.legionFearStacks) || 0) >= (Number(mechanic.values.sleepThreshold) || 3)) {
          tower.legionSleepUntil = Math.max(Number(tower.legionSleepUntil) || 0, clock(engine) + 1.25);
          tower.disabledTimer = Math.max(Number(tower.disabledTimer) || 0, 1.25);
        }
      });
    } }
  };

  const baseSpawnEnemy = proto.spawnEnemy;
  proto.spawnEnemy = function spawnProfessionalLegion(type, routeIndex, options) {
    const enemy = baseSpawnEnemy.call(this, type, routeIndex, options);
    const definition = definitionFor(type);
    if (!enemy || !definition) return enemy;
    enemy.legionMechanicTimers = Object.create(null);
    enemy.legionBaseArmor = clamp(Number(definition.stats?.armor) || 0, 0, 0.75);
    enemy.legionArmor = enemy.legionBaseArmor;
    enemy.legionControlResistance = clamp(Number(definition.stats?.controlResistance) || 0, 0, 0.9);
    enemy.legionBaseSpeed = Math.max(1, Number(enemy.legionBaseSpeed || enemy.baseSpeed || enemy.speed) || 1);
    enemy.legionAttackTimer = Math.max(0, Number(enemy.legionAttackTimer) || 0);
    enemy.legionDistanceTravelled = 0;
    enemy.legionDamageMultiplier = 1;
    enemy.legionAttackSpeedMultiplier = 1;
    enemy.legionRangeMultiplier = 1;
    const shield = mechanicFor(enemy, 'frontal_shield');
    if (shield) {
      enemy.maxShield = Math.max(Number(enemy.maxShield) || 0, Number(shield.values.capacity) || 0);
      enemy.shield = enemy.maxShield;
    }
    return enemy;
  };

  proto.prepareProfessionalLegions = function prepareProfessionalLegions(dt) {
    if (this.isPaused || this.isGameOver) return;
    rebuildSpatial(this);
    applySynergies(this);
    updateTowerLegionStatuses(this, dt);
  };

  proto.updateLegionRuntime = function updateProfessionalLegionRuntime(dt) {
    if (this.isPaused || this.isGameOver) return;
    rebuildSpatial(this);
    updateDelayed(this, dt);
    updateFields(this, dt);
    (this.enemies || []).slice().forEach(enemy => {
      const definition = definitionFor(enemy);
      if (!definition || enemy.dead) return;
      tickMechanicTimers(enemy, dt);
      if (enemy.legionDecoyLife > 0) {
        enemy.legionDecoyLife -= dt;
        if (enemy.legionDecoyLife <= 0) { enemy.hp = 0; this.killEnemy(enemy); return; }
      }
      const mechanic = mechanicFor(enemy);
      const handler = MECHANIC_HANDLERS[mechanic?.type];
      handler?.update?.(this, enemy, mechanic, dt);
      if (enemy.dead) return;
      enemy.legionAttackTimer = (Number(enemy.legionAttackTimer) || 0) + dt;
      const cooldown = Math.max(0.25, (Number(enemy.attackCooldown) || seconds(definition.stats?.attackCooldownMs) || 0.9) / Math.max(0.1, Number(enemy.legionAttackSpeedMultiplier) || 1));
      if (enemy.legionAttackTimer < cooldown) return;
      const target = selectAttackTarget(this, enemy, definition.attack, mechanic);
      if (!target) { enemy.legionAttackTimer = Math.min(enemy.legionAttackTimer, cooldown); return; }
      const channelMs = Number(mechanic?.values?.channelMs || mechanic?.values?.aimMs) || 0;
      if (channelMs > 0 && !enemy.legionChargedReady) {
        if (!enemy.legionChargeRemaining) enemy.legionChargeRemaining = seconds(channelMs);
        enemy.legionChargeRemaining -= dt;
        enemy.attackAnimationTimer = Math.max(Number(enemy.attackAnimationTimer) || 0, 0.2);
        if (enemy.legionChargeRemaining > 0) return;
        enemy.legionChargeRemaining = 0;
        enemy.legionChargedReady = true;
      }
      enemy.legionAttackTimer = Math.max(0, enemy.legionAttackTimer - cooldown);
      performLegionAttack(this, enemy, target);
      const bonusStrikes = Math.min(3, Number(enemy.legionBonusStrikes) || 0);
      for (let strike = 0; strike < bonusStrikes && target.hp > 0; strike++) {
        applyLegionImpact(this, enemy, target, mechanic, { damage: enemy.damage * 0.62 * (Number(enemy.legionDamageMultiplier) || 1), splashRadius: 0 });
      }
      enemy.legionBonusStrikes = 0;
      if (enemy.legionNextAttackMultiplier) enemy.legionNextAttackMultiplier = 0;
    });
  };

  const wrappedUpdate = proto.update;
  proto.update = function updateProfessionalEnemyLegions(dt) {
    this.prepareProfessionalLegions(dt);
    return wrappedUpdate.call(this, dt);
  };

  const wrappedEnemyBullets = proto.updateEnemyBullets;
  proto.updateEnemyBullets = function updateProfessionalEnemyBullets(dt) {
    const managed = [];
    const regular = [];
    (this.enemyBullets || []).forEach(bullet => (bullet.legionManaged ? managed : regular).push(bullet));
    this.enemyBullets = regular;
    const result = wrappedEnemyBullets.call(this, dt);
    updateManagedProjectiles(this, dt, managed);
    this.enemyBullets.push(...managed);
    return result;
  };

  const wrappedPlacedTowers = proto.updatePlacedTowers;
  proto.updatePlacedTowers = function updateProfessionalTowerStatuses(dt) {
    const snapshots = (this.placedTowers || []).map(tower => ({ tower, fireRate: tower.fireRate, hp: tower.hp }));
    snapshots.forEach(({ tower }) => {
      const multiplier = Math.max(1, Number(tower.legionRuntimeRateMultiplier) || 1);
      if (Number.isFinite(tower.fireRate)) tower.fireRate *= multiplier;
    });
    const result = wrappedPlacedTowers.call(this, dt);
    snapshots.forEach(({ tower, fireRate, hp }) => {
      tower.fireRate = fireRate;
      if (tower.hp > hp && tower.legionInfectionUntil > clock(this)) {
        const healed = tower.hp - hp;
        tower.hp = hp + (healed * clamp(Number(tower.legionHealingMultiplier) || 0.5, 0, 1));
      }
    });
    return result;
  };

  const wrappedDamageFromDefense = proto.damageEnemyFromDefense;
  proto.damageEnemyFromDefense = function damageProfessionalLegionFromDefense(defense, enemy, amount) {
    this.legionDamageSourceDefense = defense || null;
    try { return wrappedDamageFromDefense.call(this, defense, enemy, amount); }
    finally { this.legionDamageSourceDefense = null; }
  };

  const wrappedDamageEnemy = proto.damageEnemy;
  proto.damageEnemy = function damageProfessionalLegion(enemy, amount, options = {}) {
    const definition = definitionFor(enemy);
    if (!definition || !enemy || enemy.dead) return wrappedDamageEnemy.call(this, enemy, amount, options);
    let adjusted = amount;
    const sourceDefense = options.sourceDefense || this.legionDamageSourceDefense;
    if (enemy.legionFirstHitReduction > 0) {
      adjusted *= 1 - clamp(enemy.legionFirstHitReduction, 0, 0.85);
      enemy.legionFirstHitReduction = 0;
    }
    if (enemy.legionCoverUntil > clock(this)) adjusted *= 1 - clamp(Number(enemy.legionCoverReduction) || 0.22, 0, 0.7);
    if (enemy.legionConditionalReduction > 0) adjusted *= 1 - clamp(enemy.legionConditionalReduction, 0, 0.7);
    const adaptive = clamp((Number(enemy.legionAdaptiveStacks) || 0) * 0.08, 0, 0.48);
    adjusted *= 1 - adaptive;

    const redirector = nearbyLegions(this, enemy, 110, ally => mechanicFor(ally, 'damage_redirect') && ally.hp > 1)
      .sort((left, right) => distance(left, enemy) - distance(right, enemy))[0];
    if (redirector && options.legionRedirect !== true) {
      const ratio = clamp(Number(mechanicFor(redirector, 'damage_redirect').values.redirectRatio) || 0.3, 0, 0.6);
      const redirected = adjusted * ratio;
      adjusted -= redirected;
      this.damageEnemy(redirector, redirected, { ...options, legionRedirect: true });
    }
    const linked = nearbyLegions(this, enemy, Number(mechanicFor(enemy, 'shared_health')?.values?.linkRange) || 160, ally => ally.type === enemy.type && ally.hp > 1)[0];
    if (linked && mechanicFor(enemy, 'shared_health') && options.legionShared !== true) {
      const ratio = clamp(Number(mechanicFor(enemy, 'shared_health').values.sharedDamageRatio) || 0.42, 0, 0.6);
      const shared = adjusted * ratio;
      adjusted -= shared;
      this.damageEnemy(linked, shared, { ...options, legionShared: true });
    }
    const savedArmor = enemy.legionArmor;
    enemy.legionArmor = options.ignoreArmor || options.trueDamage
      ? 0
      : clamp((Number(enemy.legionBaseArmor) || 0) + (Number(enemy.legionArmorBonus) || 0), 0, 0.75);
    const beforeHp = enemy.hp;
    const result = wrappedDamageEnemy.call(this, enemy, adjusted, options);
    enemy.legionArmor = savedArmor;

    const retaliation = mechanicFor(enemy, 'retaliation');
    if (retaliation && sourceDefense && enemy.hp > 0) {
      enemy.legionRetaliationHits = (Number(enemy.legionRetaliationHits) || 0) + 1;
      if (enemy.legionRetaliationHits >= (Number(retaliation.values.hitsRequired) || 5) && timerReady(enemy, retaliation.id)) {
        enemy.legionRetaliationHits = 0;
        damageTower(this, sourceDefense, Number(retaliation.values.returnDamage) || 22, enemy);
        setMechanicTimer(enemy, retaliation.id, seconds(retaliation.values.internalCooldownMs));
      }
    }
    const rewind = mechanicFor(enemy, 'position_rewind');
    if (rewind && !enemy.legionRewound && enemy.hp > 0 && enemy.hp / enemy.maxHp <= (Number(rewind.values.triggerHealthRatio) || 0.35)) {
      enemy.legionRewound = true;
      const routeTarget = this.getEnemyRouteTarget?.(enemy) || this.citadel;
      const angle = Math.atan2(routeTarget.y - enemy.y, routeTarget.x - enemy.x);
      enemy.x -= Math.cos(angle) * (Number(rewind.values.rewindDistance) || 150);
      enemy.y -= Math.sin(angle) * (Number(rewind.values.rewindDistance) || 150);
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + (enemy.maxHp * (Number(rewind.values.healRatio) || 0.22)));
    }
    const ashAura = mechanicFor(enemy, 'evasion_aura');
    if (ashAura && beforeHp > enemy.hp) {
      nearbyLegions(this, enemy, Number(ashAura.values.radius) || 44, ally => ally.legionFactionId === enemy.legionFactionId)
        .forEach(ally => { ally.stealthTimer = Math.max(Number(ally.stealthTimer) || 0, seconds(ashAura.values.durationMs)); ally.legionFirstHitReduction = Number(ashAura.values.accuracyPenalty) || 0.18; });
    }
    const adaptiveAura = mechanicFor(enemy, 'adaptive_resistance');
    if (adaptiveAura && beforeHp > enemy.hp) {
      nearbyLegions(this, enemy, Number(adaptiveAura.values.radius) || 110, ally => ally.legionFactionId === enemy.legionFactionId)
        .forEach(ally => { ally.legionAdaptiveStacks = Math.min(Number(adaptiveAura.values.maxStacks) || 4, (Number(ally.legionAdaptiveStacks) || 0) + 1); });
    }
    const scramble = mechanicFor(enemy, 'target_scramble');
    if (scramble && !enemy.legionScrambleTriggered && enemy.hp > 0 && enemy.hp / enemy.maxHp <= (Number(scramble.values.triggerHealthRatio) || 0.5)) {
      enemy.legionScrambleTriggered = true;
      areaTowerTargets(this, enemy, Number(scramble.values.radius) || 82).forEach(tower => {
        tower.legionAccuracyPenalty = 0.4;
        tower.legionAccuracyPenaltyUntil = clock(this) + seconds(scramble.values.durationMs);
        tower.disabledTimer = Math.max(Number(tower.disabledTimer) || 0, 0.35);
      });
    }
    return result;
  };

  const wrappedKillEnemy = proto.killEnemy;
  proto.killEnemy = function killProfessionalLegion(enemy) {
    const definition = definitionFor(enemy);
    if (!definition) return wrappedKillEnemy.call(this, enemy);
    const revive = mechanicFor(enemy, 'revive');
    const guaranteed = Number(enemy.legionReviveAuraUntil) > clock(this);
    const chance = clamp((Number(revive?.values?.reviveChance) || 0) + (Number(enemy.legionSynergy?.reviveChanceBonus) || 0), 0, 1);
    if (revive && !enemy.legionRevived && (guaranteed || this.getRunRandom() < chance)) {
      enemy.legionRevived = true;
      enemy.dead = false;
      enemy.hp = Math.max(1, enemy.maxHp * (Number(revive.values.reviveHealthRatio) || 0.38));
      enemy.stunTimer = Math.max(Number(enemy.stunTimer) || 0, seconds(revive.values.delayMs));
      enemy.hitAnimationTimer = 0.5;
      return;
    }
    const deathField = mechanicFor(enemy, 'death_field');
    const deathBurst = mechanicFor(enemy, 'death_burst');
    if (revive) enemy.legionRevived = true;
    const fieldsBeforeDeath = runtime(this).fields.length;
    const result = wrappedKillEnemy.call(this, enemy);
    if (deathField) {
      const legacyField = runtime(this).fields.slice(fieldsBeforeDeath).find(field => field.effectId === deathField.effectId);
      if (legacyField) {
        legacyField.kind = 'death_field';
        legacyField.values = { ...deathField.values };
        legacyField.radius = Number(deathField.values.radius) || 34;
        legacyField.ownerType = enemy.type;
        legacyField.factionId = enemy.legionFactionId;
      } else {
        addField(this, { kind: 'death_field', x: enemy.x, y: enemy.y, radius: Number(deathField.values.radius) || 34, life: seconds(deathField.values.durationMs) || 2.8, effectId: deathField.effectId, ownerType: enemy.type, factionId: enemy.legionFactionId, values: deathField.values });
      }
    }
    if (deathBurst) {
      areaTowerTargets(this, enemy, Number(deathBurst.values.radius) || 52).forEach(tower => {
        tower.legionInfectionStacks = clamp((Number(tower.legionInfectionStacks) || 0) + (Number(deathBurst.values.infectionStacks) || 0), 0, 6);
      });
    }
    return result;
  };

  const wrappedCapture = proto.captureGameplayState;
  proto.captureGameplayState = function captureProfessionalLegionState() {
    const captured = wrappedCapture.call(this);
    const state = runtime(this);
    captured.legionRuntimeState = {
      fields: state.fields.map(field => JSON.parse(JSON.stringify(field))),
      delayed: state.delayed.map(task => JSON.parse(JSON.stringify(task)))
    };
    return captured;
  };

  const wrappedRestore = proto.restoreGameplayState;
  proto.restoreGameplayState = function restoreProfessionalLegionState(saved) {
    const result = wrappedRestore.call(this, saved);
    const state = runtime(this);
    state.fields = Array.isArray(saved?.legionRuntimeState?.fields)
      ? saved.legionRuntimeState.fields.slice(0, 72).map(field => JSON.parse(JSON.stringify(field)))
      : [];
    state.delayed = Array.isArray(saved?.legionRuntimeState?.delayed)
      ? saved.legionRuntimeState.delayed.slice(0, 128).map(task => JSON.parse(JSON.stringify(task)))
      : [];
    return result;
  };

  const wrappedStartNewGame = proto.startNewGame;
  proto.startNewGame = function startProfessionalLegionRun(options) {
    const result = wrappedStartNewGame.call(this, options);
    const state = runtime(this);
    state.fields = [];
    state.delayed = [];
    state.spatial.clear();
    return result;
  };

  const wrappedCodex = proto.openAntagonistCodex;
  proto.openAntagonistCodex = function openProfessionalLegionCodex() {
    const result = wrappedCodex.call(this);
    if (typeof document === 'undefined') return result;
    Object.values(legions.factions || {}).forEach(faction => {
      const card = document.querySelector(`[data-legion-faction="${faction.id}"]`);
      if (!card || card.querySelector('.legion-unit-grid')) return;
      const grid = document.createElement('div');
      grid.className = 'legion-unit-grid';
      (faction.enemyIds || []).forEach(id => {
        const enemy = definitions[id];
        if (!enemy) return;
        const details = document.createElement('details');
        details.className = 'legion-unit-entry';
        const summary = document.createElement('summary');
        const portrait = document.createElement('span');
        portrait.className = 'legion-unit-sprite';
        portrait.setAttribute('role', 'img');
        portrait.setAttribute('aria-label', `Aperçu animé de ${enemy.name}`);
        portrait.style.backgroundImage = `url("${enemy.spriteSrc}")`;
        const label = document.createElement('span');
        label.className = 'legion-unit-label';
        const name = document.createElement('strong');
        name.textContent = enemy.name;
        const role = document.createElement('small');
        role.textContent = `${enemy.role} · rang ${enemy.tier}`;
        label.append(name, role);
        summary.append(portrait, label);
        const body = document.createElement('div');
        body.className = 'legion-unit-body';
        const stats = document.createElement('p');
        stats.className = 'legion-unit-stats';
        stats.textContent = `${enemy.stats.hp} PV · ${enemy.stats.damage} dégâts · vitesse ${enemy.stats.speed} · portée ${enemy.stats.attackRange}`;
        const attack = document.createElement('p');
        attack.textContent = `Attaque — ${enemy.attack.description}`;
        const mechanic = document.createElement('p');
        mechanic.textContent = `Mécanique — ${enemy.codex.tactics}`;
        const synergy = document.createElement('p');
        synergy.textContent = `Synergie — ${enemy.synergies[0]?.description || faction.doctrine}`;
        const counter = document.createElement('p');
        counter.className = 'legion-unit-counter';
        counter.textContent = `Contre-jeu — ${enemy.counterplay}`;
        body.append(stats, attack, mechanic, synergy, counter);
        details.append(summary, body);
        grid.append(details);
      });
      card.querySelector('.antagonist-card-body')?.append(grid);
    });
    return result;
  };

  root.INFERNAL_CITY_ENEMY_LEGIONS_PROFESSIONAL = Object.freeze({
    version: '1.0.0',
    mechanicHandlers: Object.freeze(Object.keys(MECHANIC_HANDLERS).sort()),
    attackModes: Object.freeze([...ATTACK_MODES].sort()),
    targetPolicies: Object.freeze([...TARGET_POLICIES].sort()),
    addField,
    selectAttackTarget
  });
})(typeof window !== 'undefined' ? window : globalThis);
