(function installEnemyLegionsRuntime(root) {
  'use strict';

  const legions = root.INFERNAL_CITY_ENEMY_LEGIONS;
  if (!legions || typeof GameEngine !== 'function') return;
  const proto = GameEngine.prototype;
  const definitions = legions.enemies || {};
  const effects = legions.effects || {};
  const legionIds = Object.keys(definitions);
  const rangedKinds = new Set(['projectile', 'projectile_arc', 'ranged_arc', 'beam', 'area', 'area_pulse']);

  Object.entries(definitions).forEach(([id, definition]) => {
    ENEMY_SPRITE_DATA[id] = {
      src: definition.spriteSrc || definition.sprite?.src,
      row: 0,
      rows: 1,
      columns: 4,
      size: Math.max(34, Math.min(92, (Number(definition.stats?.radius) || 18) * 2.35)),
      fps: definition.tier >= 4 ? 5 : 7,
      rotate: false
    };
  });

  function state(engine) {
    if (!engine.legionRuntime) engine.legionRuntime = { fields: [], effectImages: Object.create(null) };
    return engine.legionRuntime;
  }

  function mechanic(enemy, type) {
    return (definitions[enemy?.type]?.mechanics || []).find(entry => entry.type === type);
  }

  function getTarget(engine, enemy) {
    const attack = definitions[enemy.type]?.attack || {};
    const minimum = Number(attack.minimumRange) || 0;
    const maximum = Number(definitions[enemy.type]?.stats?.attackRange) || 0;
    return engine.placedTowers
      .filter(tower => tower.hp > 0)
      .map(tower => ({ tower, distance: Math.hypot(tower.x - enemy.x, tower.y - enemy.y) }))
      .filter(entry => entry.distance >= minimum && entry.distance <= maximum)
      .sort((left, right) => left.distance - right.distance)[0]?.tower || null;
  }

  function effectImage(engine, effectId) {
    const spec = effects[effectId];
    if (!spec?.sprite?.src) return null;
    const runtime = state(engine);
    if (!runtime.effectImages[effectId]) {
      runtime.effectImages[effectId] = engine.preloadSpriteAsset(spec.sprite.src, 'Effet de légion');
    }
    return runtime.effectImages[effectId];
  }

  const baseSpawnEnemy = proto.spawnEnemy;
  proto.spawnEnemy = function spawnEnemyLegion(type, routeIndex, options) {
    const enemy = baseSpawnEnemy.call(this, type, routeIndex, options);
    const definition = definitions[type];
    if (!enemy || !definition) return enemy;
    enemy.legionFactionId = definition.factionId;
    enemy.legionAttackTimer = this.getRunRandom() * enemy.attackCooldown;
    enemy.legionMechanicTimer = 0;
    enemy.legionDistanceTravelled = 0;
    enemy.legionRewound = false;
    enemy.legionRevived = false;
    enemy.legionBaseSpeed = enemy.speed;
    enemy.legionArmor = Math.max(0, Math.min(0.75, Number(definition.stats?.armor) || 0));
    enemy.legionControlResistance = Math.max(0, Math.min(0.9, Number(definition.stats?.controlResistance) || 0));
    enemy.legionDamageMultiplier = 1;
    (definition.mechanics || []).forEach(entry => effectImage(this, entry.effectId));
    effectImage(this, definition.attack?.effectId);
    return enemy;
  };

  proto.fireLegionAttack = function fireLegionAttack(enemy, definition, target) {
    const attack = definition.attack || {};
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const speed = Math.max(140, Number(attack.projectileSpeed) || 230);
    this.enemyBullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: (dx / distance) * speed,
      vy: (dy / distance) * speed,
      damage: Math.max(1, Math.round(enemy.damage * (Number(enemy.legionDamageMultiplier) || 1))),
      radius: Math.max(6, Number(effects[attack.effectId]?.lifecycle?.hitboxRadius) || 8),
      splashRadius: Number(effects[attack.effectId]?.gameplay?.splashRadius) || 0,
      stunDuration: (Number(effects[attack.effectId]?.gameplay?.defenseStunMs) || Number(effects[attack.effectId]?.gameplay?.silenceMs) || 0) / 1000,
      color: enemy.color,
      sourceType: enemy.type,
      sourceEnemy: enemy,
      legionEffectId: attack.effectId || null,
      legionBornAt: Number(this.animationClock) || 0
    });
    enemy.attackAnimationTimer = 0.42;
  };

  proto.updateLegionRuntime = function updateLegionRuntime(dt) {
    const runtime = state(this);
    runtime.fields = runtime.fields.filter(field => {
      field.life -= dt;
      field.frameTime += dt;
      return field.life > 0;
    });

    this.enemies.forEach(enemy => {
      const definition = definitions[enemy.type];
      if (!definition || enemy.dead) return;
      enemy.legionMechanicTimer = Math.max(0, (Number(enemy.legionMechanicTimer) || 0) - dt);
      enemy.legionDistanceTravelled += Math.max(0, Number(enemy.speed) || 0) * dt;
      const nearbyAllies = this.enemies.filter(candidate => (
        candidate !== enemy && !candidate.dead && candidate.legionFactionId === enemy.legionFactionId
        && Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y) <= 130
      ));
      let speedMultiplier = 1;
      (definition.synergies || []).forEach(entry => {
        if (nearbyAllies.some(ally => entry.with?.includes(ally.type))) {
          speedMultiplier *= Number(entry.bonus?.speedMultiplier) || 1;
          enemy.legionDamageMultiplier = Math.max(Number(enemy.legionDamageMultiplier) || 1, Number(entry.bonus?.damageMultiplier) || 1);
        }
      });
      enemy.speed = Math.max(1, enemy.legionBaseSpeed * speedMultiplier);

      const heal = mechanic(enemy, 'chain_heal');
      if (heal && enemy.legionMechanicTimer <= 0) {
        nearbyAllies.filter(ally => ally.hp < ally.maxHp).slice(0, Number(heal.values.chainCount) || 2)
          .forEach(ally => { ally.hp = Math.min(ally.maxHp, ally.hp + (Number(heal.values.healPerSecond) || 24)); });
        enemy.legionMechanicTimer = 1;
      }
      const aura = (definition.mechanics || []).find(entry => ['deploy_aura', 'stealth_aura', 'revive_aura'].includes(entry.type));
      if (aura) nearbyAllies.forEach(ally => {
        if (aura.type === 'stealth_aura') ally.stealthTimer = Math.max(Number(ally.stealthTimer) || 0, 0.3);
        else ally.speed = Math.max(ally.speed, ally.legionBaseSpeed * (Number(aura.values.hasteMultiplier) || 1.08));
      });
      const evade = mechanic(enemy, 'evasion');
      if (evade && enemy.legionMechanicTimer <= 0) {
        enemy.stealthTimer = Math.max(Number(enemy.stealthTimer) || 0, (Number(evade.values.untargetableMs) || 320) / 1000);
        enemy.legionMechanicTimer = (Number(evade.values.intervalMs) || 2100) / 1000;
      }
      const skip = (definition.mechanics || []).find(entry => ['gap_closer', 'path_skip', 'teleport_strike'].includes(entry.type));
      if (skip && enemy.legionMechanicTimer <= 0 && enemy.legionDistanceTravelled >= (Number(skip.values.distanceRequired) || 140)) {
        const target = this.getEnemyRouteTarget(enemy);
        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        const distance = Number(skip.values.leapDistance || skip.values.skipDistance || skip.values.teleportRange) || 70;
        enemy.x += Math.cos(angle) * distance;
        enemy.y += Math.sin(angle) * distance;
        enemy.legionDistanceTravelled = 0;
        enemy.legionMechanicTimer = (Number(skip.values.cooldownMs) || 4800) / 1000;
        enemy.attackAnimationTimer = 0.42;
      }
      const summon = (definition.mechanics || []).find(entry => ['summon', 'deploy_barrier', 'deploy_hazard', 'deploy_stealth', 'deploy_slow', 'spawn_decoys'].includes(entry.type));
      if (summon && enemy.legionMechanicTimer <= 0) {
        const summonIds = summon.summonIds || [];
        if (summonIds.length && this.enemies.length < 96) {
          const count = Math.min(3, Number(summon.values.count || summon.values.decoyCount) || 1);
          for (let index = 0; index < count; index++) this.spawnEnemy(summonIds[index % summonIds.length], enemy.routeIndex, {
            x: enemy.x + ((index - ((count - 1) / 2)) * 20), y: enemy.y + 10, waypointIndex: enemy.waypointIndex, hpMultiplier: 0.65, countForWave: false
          });
        }
        if (summon.effectId) runtime.fields.push({ x: enemy.x, y: enemy.y, effectId: summon.effectId, life: Math.min(9, (Number(summon.values.durationMs) || 4000) / 1000), frameTime: 0, size: Math.max(44, Number(summon.values.radius || summon.values.auraRadius) || 64) });
        enemy.legionMechanicTimer = (Number(summon.values.cooldownMs) || 7600) / 1000;
      }

      if (rangedKinds.has(definition.attack?.mode)) {
        enemy.legionAttackTimer += dt;
        const target = getTarget(this, enemy);
        if (target && enemy.legionAttackTimer >= enemy.attackCooldown) {
          enemy.legionAttackTimer = Math.max(0, enemy.legionAttackTimer - enemy.attackCooldown);
          this.fireLegionAttack(enemy, definition, target);
        }
      }
    });
  };

  const baseUpdate = proto.update;
  proto.update = function updateEnemyLegions(dt) {
    const result = baseUpdate.call(this, dt);
    if (!this.isPaused && !this.isGameOver) this.updateLegionRuntime(dt);
    return result;
  };

  const baseKillEnemy = proto.killEnemy;
  proto.killEnemy = function killEnemyLegion(enemy) {
    const definition = definitions[enemy?.type];
    if (!definition) return baseKillEnemy.call(this, enemy);
    const deathMechanic = (definition.mechanics || []).find(entry => ['death_burst', 'death_field', 'revive'].includes(entry.type));
    if (deathMechanic?.type === 'revive' && !enemy.legionRevived && this.getRunRandom() < (Number(deathMechanic.values.reviveChance) || 0)) {
      enemy.legionRevived = true;
      enemy.hp = Math.max(1, enemy.maxHp * (Number(deathMechanic.values.reviveHealthRatio) || 0.35));
      enemy.hitAnimationTimer = 0.5;
      return;
    }
    if (deathMechanic && deathMechanic.type !== 'revive') {
      const runtime = state(this);
      if (deathMechanic.effectId) runtime.fields.push({ x: enemy.x, y: enemy.y, effectId: deathMechanic.effectId, life: (Number(deathMechanic.values.durationMs) || 1200) / 1000, frameTime: 0, size: Number(deathMechanic.values.radius) || 52 });
      const damage = Number(deathMechanic.values.splashDamage) || 0;
      if (damage > 0) this.placedTowers.forEach(tower => {
        if (Math.hypot(tower.x - enemy.x, tower.y - enemy.y) <= (Number(deathMechanic.values.radius) || 52)) tower.hp -= damage;
      });
    }
    return baseKillEnemy.call(this, enemy);
  };

  const baseDamageEnemy = proto.damageEnemy;
  proto.damageEnemy = function damageLegionEnemy(enemy, amount, options) {
    const armor = Math.max(0, Math.min(0.75, Number(enemy?.legionArmor) || 0));
    return baseDamageEnemy.call(this, enemy, amount * (1 - armor), options);
  };

  const baseControlResistance = proto.getEnemyControlResistance;
  proto.getEnemyControlResistance = function getLegionControlResistance(enemy, controlType) {
    const base = baseControlResistance.call(this, enemy, controlType);
    const authored = Math.max(0, Math.min(0.9, Number(enemy?.legionControlResistance) || 0));
    return base * (1 - authored);
  };

  const basePreloadWave = proto.preloadWaveCharacterBosses;
  proto.preloadWaveCharacterBosses = function preloadWaveLegions(queue) {
    const result = basePreloadWave.call(this, queue);
    [...new Set((queue || []).map(entry => entry?.type).filter(type => definitions[type]))]
      .forEach(type => this.ensureEnemySprite(type));
    return result;
  };

  const baseFallbackType = proto.chooseFallbackEnemyType;
  proto.chooseFallbackEnemyType = function chooseLegionFallbackType() {
    if (this.wave >= 4 && this.getRunRandom() < 0.72) {
      const unlocked = Math.min(10, Math.max(1, Math.ceil(this.wave / 3)));
      const faction = Object.values(legions.factions)[Math.floor(this.getRunRandom() * unlocked)];
      const pool = faction?.enemyIds?.slice(0, Math.min(5, 2 + Math.floor(this.wave / 5))) || [];
      if (pool.length) return pool[Math.floor(this.getRunRandom() * pool.length)];
    }
    return baseFallbackType.call(this);
  };

  proto.drawLegionEffect = function drawLegionEffect(effectId, x, y, size, frame) {
    const image = effectImage(this, effectId);
    const spec = effects[effectId];
    if (!spec || !this.isSpriteReady(image)) return false;
    return this.drawAtlasFrame(image, { ...spec.sprite, row: 0, rows: 1, columns: 4 }, frame, x, y, size, { shadowColor: '#ff2aaf', shadowBlur: 9 });
  };

  const baseRender = proto.render;
  proto.render = function renderEnemyLegions() {
    const result = baseRender.call(this);
    if (!this.ctx || !this.canvas) return result;
    const runtime = state(this);
    const view = this.getBattlefieldView(this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.applyBattlefieldView(view);
    runtime.fields.forEach(field => this.drawLegionEffect(field.effectId, field.x, field.y, field.size, Math.min(3, Math.floor(field.frameTime * 7) % 4)));
    this.enemyBullets.forEach(bullet => {
      if (!bullet.legionEffectId) return;
      const frame = Math.min(2, Math.floor(((Number(this.animationClock) || 0) - (bullet.legionBornAt || 0)) * 9) % 3);
      this.drawLegionEffect(bullet.legionEffectId, bullet.x, bullet.y, Math.max(24, bullet.radius * 3), frame);
    });
    this.ctx.restore();
    return result;
  };

  const baseCodex = proto.openAntagonistCodex;
  proto.openAntagonistCodex = function openLegionCodex() {
    const result = baseCodex.call(this);
    const grid = document.getElementById('antagonist-codex-grid');
    if (!grid || grid.querySelector('[data-legion-faction]')) return result;
    Object.values(legions.factions).forEach(faction => {
      const card = document.createElement('article');
      card.className = 'antagonist-card legion-codex-card';
      card.dataset.legionFaction = faction.id;
      const body = document.createElement('div');
      body.className = 'antagonist-card-body';
      const title = document.createElement('h3');
      title.textContent = faction.name;
      const doctrine = document.createElement('p');
      doctrine.className = 'antagonist-signature';
      doctrine.textContent = faction.doctrine;
      const list = document.createElement('ol');
      list.className = 'antagonist-phases';
      faction.enemyIds.forEach(id => {
        const enemy = definitions[id];
        const item = document.createElement('li');
        item.textContent = `${enemy.name} · ${enemy.role} · ${enemy.stats.hp} PV · ${enemy.attack.description}`;
        list.appendChild(item);
      });
      const counter = document.createElement('p');
      counter.className = 'antagonist-counter';
      counter.textContent = `Contre : ${faction.counterplay}`;
      body.append(title, doctrine, list, counter);
      card.append(body);
      grid.appendChild(card);
    });
    return result;
  };

  root.INFERNAL_CITY_ENEMY_LEGIONS_RUNTIME = Object.freeze({ version: '1.0.0', enemyCount: legionIds.length });
})(typeof window !== 'undefined' ? window : globalThis);
