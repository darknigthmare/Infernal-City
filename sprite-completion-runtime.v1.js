(function installSpriteCompletion(root) {
  'use strict';

  const registry = root.INFERNAL_CITY_SPRITE_COMPLETION;
  if (!registry || typeof GameEngine !== 'function') return;
  const proto = GameEngine.prototype;
  const runtimes = new WeakMap();
  const MAX_TRANSIENTS = 64;
  const loopStates = new Set(['idle', 'idle_respiration', 'move']);
  const evolutionIds = {
    vulcan: 'vulcan-cerberus', plasma: 'nova-cataclysm',
    railgun: 'odin-lance', flamethrower: 'niflhel-breath'
  };

  function runtime(engine) {
    if (!runtimes.has(engine)) runtimes.set(engine, {
      time: 0, images: new Map(), poses: new WeakMap(), deployment: new WeakMap(),
      shieldBreak: new WeakMap(), deaths: new WeakSet(), transients: [], drawContext: null, endFrameAt: null
    });
    return runtimes.get(engine);
  }

  function approvedImage(engine, key) {
    if (engine.hasEnteredAdultExperience !== true) return null;
    const spec = registry.approved(key);
    if (!spec) return null;
    const state = runtime(engine);
    if (!state.images.has(key)) {
      // Keep a failed image in this small per-run cache. The legacy sprite stays
      // visible, and a network error cannot produce a request on every frame.
      state.images.set(key, engine.preloadSpriteAsset(spec.src, 'Animation dédiée'));
    }
    const image = state.images.get(key);
    return engine.isSpriteReady(image) ? { spec, image } : null;
  }

  function elapsedFor(engine, subject, key, stateName, remainingTimer) {
    const state = runtime(engine);
    const token = `${key}:${stateName}`;
    let pose = state.poses.get(subject);
    if (!pose || pose.token !== token || (Number.isFinite(remainingTimer)
      && Number.isFinite(pose.remaining) && remainingTimer > pose.remaining + 0.0001)) {
      pose = { token, started: state.time };
      state.poses.set(subject, pose);
    }
    pose.remaining = remainingTimer;
    return Math.max(0, state.time - pose.started);
  }

  [['ensureHeroSprite', 'heroes'], ['ensureEnemySprite', 'enemies'], ['ensureTowerSprite', 'towers']].forEach(([method, group]) => {
    const original = proto[method];
    if (typeof original !== 'function') return;
    proto[method] = function ensureCompletedSprite(id, ...args) {
      const result = original.call(this, id, ...args);
      const resolvedId = id || (group === 'heroes' ? this.selectedHero?.id : null);
      const resolvedGroup = group === 'enemies' && registry.assets[`bosses/${resolvedId}`] ? 'bosses' : group;
      approvedImage(this, `${resolvedGroup}/${resolvedId}`);
      return result;
    };
  });

  function frameFor(engine, spec, stateName, elapsed, duration) {
    if (engine.prefersReducedMotion) return 0;
    if (duration > 0) return Math.min(spec.columns - 1,
      Math.floor(Math.max(0, elapsed) / duration * spec.columns));
    const frame = Math.floor(Math.max(0, elapsed) * spec.fps);
    return loopStates.has(stateName) ? frame % spec.columns : Math.min(spec.columns - 1, frame);
  }

  function drawFrame(engine, loaded, row, frame, x, y, size, options = {}) {
    if (!engine.ctx || !loaded) return false;
    const { image, spec } = loaded;
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!(width > 0 && height > 0 && size > 0)) return false;
    // Native dimensions are intentionally retained. Fractional source cell
    // bounds are valid canvas coordinates; no atlas normalization is required.
    const cellWidth = width / spec.columns;
    const cellHeight = height / spec.rows;
    // A single hash-bound scale matches the old silhouette despite the new
    // atlas gutters. It is fixed across poses, including death and recycling.
    const scale = size * spec.drawScale / Math.max(cellWidth, cellHeight);
    const drawWidth = options.drawWidth > 0 ? options.drawWidth : cellWidth * scale;
    const drawHeight = options.drawHeight > 0 ? options.drawHeight : cellHeight * scale;
    const column = Math.max(0, Math.min(spec.columns - 1, Math.floor(frame)));
    const safeRow = Math.max(0, Math.min(spec.rows - 1, Math.floor(row)));
    const ctx = engine.ctx;
    ctx.save();
    ctx.translate(x, y);
    if (Number.isFinite(options.rotation)) ctx.rotate(options.rotation);
    if (options.flipX) ctx.scale(-1, 1);
    if (Number.isFinite(options.alpha)) ctx.globalAlpha = options.alpha;
    if (options.shadowColor) {
      ctx.shadowColor = options.shadowColor;
      ctx.shadowBlur = options.shadowBlur || 0;
    }
    ctx.drawImage(image, column * cellWidth, safeRow * cellHeight, cellWidth, cellHeight,
      -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
    return true;
  }

  function drawState(engine, loaded, stateName, elapsed, x, y, size, options = {}, duration) {
    const row = loaded?.spec.states.indexOf(stateName) ?? -1;
    if (row < 0) return false;
    return drawFrame(engine, loaded, row,
      frameFor(engine, loaded.spec, stateName, elapsed, duration), x, y, size, options);
  }

  function withContext(engine, context, callback) {
    const state = runtime(engine);
    const previous = state.drawContext;
    state.drawContext = context;
    try { return callback(); } finally { state.drawContext = previous; }
  }

  const baseAtlas = proto.drawAtlasFrame;
  proto.drawAtlasFrame = function drawCompletedAtlas(image, data, frame, x, y, size, options = {}) {
    const context = runtime(this).drawContext;
    if (context) {
      // Authored poses replace the old body and its generic pose aura, while
      // the original renderer still draws shadows, HP bars and status cues.
      if (data?.src === COMPANION_FX_SPRITE_DATA.state_poses?.src) return true;
      if (data?.src === context.originalSrc) {
        return drawState(this, context.loaded, context.stateName, context.elapsed,
          x, y, size, options, context.duration);
      }
    }
    return baseAtlas.call(this, image, data, frame, x, y, size, options);
  };

  const baseHero = proto.drawHero;
  proto.drawHero = function drawCompletedHero(x, y, options = {}) {
    const id = options.heroId || this.selectedHero?.id;
    const key = `heroes/${id}`;
    const stateName = options.heroId ? 'idle_respiration'
      : (this.heroAnimationState === 'idle' ? 'idle_respiration' : this.heroAnimationState);
    const spec = registry.approved(key);
    const loaded = spec?.states.includes(stateName) ? approvedImage(this, key) : null;
    if (!loaded) return baseHero.call(this, x, y, options);
    const duration = stateName === 'attack' ? 0.3 : undefined;
    return withContext(this, {
      originalSrc: HERO_SPRITE_DATA[id]?.src, loaded, stateName, duration,
      // A decoy shares the artwork, not the selected heroine's pose clock.
      elapsed: options.heroId ? runtime(this).time
        : elapsedFor(this, this.selectedHero || this, key, stateName, this.heroAnimationTimer)
    }, () => baseHero.call(this, x, y, options));
  };

  function enemyPose(engine, enemy) {
    if (enemy.isBoss) {
      if (enemy.poseState === 'intro') return 'intro';
      if (enemy.poseState === 'phase_shift') return enemy.bossPhase >= 3 ? 'phase_shift_3' : 'phase_shift_2';
      if (enemy.telegraphTimer > 0) return 'heavy_telegraph';
      if (!(enemy.attackAnimationTimer > 0) && (enemy.speed <= 0 || enemy.stunTimer > 0 || engine.freezeTimer > 0)) return 'idle';
      return null; // Existing walk, attack and ultimate drawings remain active.
    }
    const brokenAt = runtime(engine).shieldBreak.get(enemy);
    if (Number.isFinite(brokenAt) && runtime(engine).time - brokenAt < 0.55) return 'shield_break';
    return enemy.attackAnimationTimer > 0 ? 'attack' : 'move';
  }

  const baseEnemy = proto.drawEnemy;
  proto.drawEnemy = function drawCompletedEnemy(enemy) {
    const key = `${enemy.isBoss ? 'bosses' : 'enemies'}/${enemy.type}`;
    const stateName = enemyPose(this, enemy);
    const loaded = stateName ? approvedImage(this, key) : null;
    // The legacy draw method must see a ready image to take its atlas branch.
    // It can safely use the completion image temporarily because interception
    // above supplies the completion grid rather than the legacy grid.
    if (!loaded) return baseEnemy.call(this, enemy);
    const oldImage = this.enemySpriteImages[enemy.type];
    this.enemySpriteImages[enemy.type] = loaded.image;
    try {
      const elapsed = stateName === 'shield_break'
        ? runtime(this).time - runtime(this).shieldBreak.get(enemy)
        : elapsedFor(this, enemy, key, stateName,
          stateName === 'attack' ? enemy.attackAnimationTimer
            : (stateName === 'heavy_telegraph' ? enemy.telegraphTimer : enemy.poseTimer));
      return withContext(this, {
        originalSrc: ENEMY_SPRITE_DATA[enemy.type]?.src, loaded, stateName,
        elapsed,
        duration: stateName === 'attack' ? Math.max(0.05, elapsed + enemy.attackAnimationTimer)
          : (stateName === 'shield_break' ? 0.55 : undefined)
      }, () => baseEnemy.call(this, enemy));
    } finally { this.enemySpriteImages[enemy.type] = oldImage; }
  };

  function towerPose(engine, tower) {
    const deployedAt = runtime(engine).deployment.get(tower);
    if (Number.isFinite(deployedAt) && runtime(engine).time - deployedAt < 0.8) return 'deploy';
    const options = engine.getDefenseSpecializationOptions(tower);
    const index = options.findIndex(option => option.id === tower.specializationId);
    if (index === 0) return 'specialization_a';
    if (index === 1) return 'specialization_b';
    const level = Math.max(1, Math.min(3, Number(tower.level) || 1));
    // The authored idle row depicts the base defense. Upgraded defenses keep
    // the first pose of their own row so resting never removes their armor.
    if (level === 1 && !(tower.animationTimer > 0)) return 'idle';
    return `level${level}`;
  }

  const baseTower = proto.drawTower;
  proto.drawTower = function drawCompletedTower(tower, options = {}) {
    const key = `towers/${tower.id}`;
    const loaded = approvedImage(this, key);
    if (!loaded) return baseTower.call(this, tower, options);
    const stateName = towerPose(this, tower);
    let elapsed = 0;
    let duration;
    if (stateName === 'deploy') {
      elapsed = runtime(this).time - runtime(this).deployment.get(tower);
      duration = 0.8;
    } else if (tower.animationTimer > 0) {
      elapsed = Math.max(0, 0.34 - tower.animationTimer);
      duration = 0.34;
    } else if (stateName === 'idle') {
      elapsed = runtime(this).time + (Number(tower.animationPhase) || 0) / loaded.spec.fps;
    }
    return withContext(this, { originalSrc: TOWER_SPRITE_DATA[tower.id]?.src,
      loaded, stateName, elapsed, duration }, () => baseTower.call(this, tower, options));
  };

  proto.drawCompletedTowerPreview = function drawCompletedTowerPreview(id, x, y, size, options = {}) {
    const loaded = approvedImage(this, `towers/${id}`);
    if (!loaded) return false;
    return drawState(this, loaded, 'level1', 0, x, y, size, options);
  };

  function pushTransient(engine, entry) {
    const state = runtime(engine);
    if (!registry.approved(entry.key)) return;
    approvedImage(engine, entry.key);
    state.transients.push({ ...entry, born: state.time });
    if (state.transients.length > MAX_TRANSIENTS) state.transients.splice(0, state.transients.length - MAX_TRANSIENTS);
  }

  const baseDamage = proto.damageEnemy;
  proto.damageEnemy = function damageEnemyWithShieldPose(enemy, amount, options) {
    const before = Number(enemy?.shield) || 0;
    const result = baseDamage.call(this, enemy, amount, options);
    if (enemy && !enemy.dead && before > 0 && Number(enemy.shield) <= 0) {
      runtime(this).shieldBreak.set(enemy, runtime(this).time);
    }
    return result;
  };

  const baseKill = proto.killEnemy;
  function recordDeath(engine, enemy) {
    const state = runtime(engine);
    if (state.deaths.has(enemy)) return;
    state.deaths.add(enemy);
    const sprite = ENEMY_SPRITE_DATA[enemy.type];
    const facing = Number.isFinite(enemy.facingAngle) ? enemy.facingAngle : 0;
    pushTransient(engine, {
      key: `${enemy.isBoss ? 'bosses' : 'enemies'}/${enemy.type}`,
      stateName: enemy.isBoss ? 'defeat' : 'death_dissolve', x: enemy.x, y: enemy.y,
      size: sprite?.size || enemy.radius * 2,
      minSize: enemy.isBoss ? 52 : 26, duration: enemy.isBoss ? 1.4 : 0.8,
      rotation: sprite?.rotate ? facing + (sprite.rotationOffset || 0) : undefined,
      flipX: !sprite?.rotate && Math.cos(facing) < 0
    });
  }
  proto.killEnemy = function killEnemyWithDeathPose(enemy) {
    const stateBefore = runtime(this);
    const alreadyDead = !enemy || enemy.dead;
    const result = baseKill.call(this, enemy);
    // Revivals can cancel a kill in the legion runtime. Add art only after
    // the real removal, without delaying rewards or adding a target/hitbox.
    if (!alreadyDead && runtime(this) === stateBefore && enemy.dead && !this.enemies.includes(enemy)) {
      recordDeath(this, enemy);
    }
    return result;
  };

  ['buildSelectedTowerAt', 'placeStarterDefenses'].forEach(method => {
    const original = proto[method];
    proto[method] = function buildWithDeployment(...args) {
      const before = new Set(this.placedTowers);
      const result = original.apply(this, args);
      this.placedTowers.forEach(tower => {
        if (!before.has(tower)) {
          runtime(this).deployment.set(tower, runtime(this).time);
          approvedImage(this, `towers/${tower.id}`);
        }
      });
      return result;
    };
  });

  const baseSell = proto.sellDefense;
  proto.sellDefense = function sellWithRecycling(defense) {
    const result = baseSell.call(this, defense);
    if (result?.ok) pushTransient(this, {
      key: `towers/${defense.id}`, stateName: 'recycle', x: defense.x, y: defense.y,
      size: TOWER_SPRITE_DATA[defense.id]?.size || 56, minSize: 26, duration: 0.7,
      rotation: TOWER_SPRITE_DATA[defense.id]?.rotate ? defense.facingAngle || 0 : undefined
    });
    return result;
  };

  const baseWeapon = proto.fireWeapon;
  proto.fireWeapon = function fireWeaponWithEvolvedArt(weapon, target) {
    const projectilesBefore = new Set(this.projectiles);
    const particlesBefore = new Set(this.particles);
    const priorityPose = ['ability', 'ultimate'].includes(this.heroAnimationState) && this.heroAnimationTimer > 0
      ? { name: this.heroAnimationState, remaining: this.heroAnimationTimer, hero: this.selectedHero } : null;
    const result = baseWeapon.call(this, weapon, target);
    // Automatic fire still happens normally, but must not erase an active
    // ability/ultimate pose. A terminal state set during damage stays intact.
    if (priorityPose && this.selectedHero === priorityPose.hero && this.heroAnimationState === 'attack') {
      this.heroAnimationState = priorityPose.name;
      this.heroAnimationTimer = priorityPose.remaining;
    }
    const id = weapon?.isEvolved ? evolutionIds[weapon.id] : null;
    if (id && registry.approved(`evolutions/${id}`)) {
      const tag = object => {
        object.completionEvolution = id;
        object.completionBorn = runtime(this).time;
      };
      this.projectiles.forEach(p => { if (!projectilesBefore.has(p)) tag(p); });
      this.particles.forEach(p => { if (!particlesBefore.has(p) && p.type === 'rail_beam') tag(p); });
      approvedImage(this, `evolutions/${id}`);
    }
    return result;
  };

  proto.drawCompletedEvolution = function drawCompletedEvolution(projectile) {
    const id = projectile.completionEvolution;
    if (!id) return false;
    const loaded = approvedImage(this, `evolutions/${id}`);
    if (!loaded) return false;
    const elapsed = Math.max(0, runtime(this).time - (projectile.completionBorn || 0));
    const frame = this.prefersReducedMotion ? 0 : Math.floor(elapsed * loaded.spec.fps) % 8;
    let x = projectile.x, y = projectile.y;
    let size = this.getReadableWorldSize(Math.max(22, (projectile.radius || 6) * 4.5), 12);
    let rotation = Math.atan2(projectile.vy || 0, projectile.vx || 0);
    if (projectile.type === 'rail_beam') {
      x = (projectile.x1 + projectile.x2) / 2;
      y = (projectile.y1 + projectile.y2) / 2;
      rotation = Math.atan2(projectile.y2 - projectile.y1, projectile.x2 - projectile.x1);
      size = Math.hypot(projectile.x2 - projectile.x1, projectile.y2 - projectile.y1);
    }
    const beam = projectile.type === 'rail_beam';
    return drawFrame(this, loaded, Math.floor(frame / loaded.spec.columns), frame % loaded.spec.columns,
      x, y, size, { rotation, alpha: beam ? Math.min(1, Math.max(0, projectile.life / 0.25)) : 1,
        // A rail beam spans its trajectory, but its thickness must not grow
        // with range: a square destination would cover the whole battlefield.
        drawWidth: beam ? size : undefined,
        drawHeight: beam ? this.getReadableWorldSize(30, 12) : undefined });
  };

  const baseUpdate = proto.update;
  proto.update = function updateCompletedSprites(dt) {
    const state = runtime(this);
    const priorEnemies = this.enemies.slice();
    state.time += Math.max(0, Number(dt) || 0);
    state.transients = state.transients.filter(effect => state.time - effect.born < effect.duration);
    const result = baseUpdate.call(this, dt);
    if (runtime(this) !== state) return result;
    const survivors = new Set(this.enemies);
    priorEnemies.forEach(enemy => {
      if (enemy.dead && !survivors.has(enemy)) recordDeath(this, enemy);
    });
    return result;
  };

  const baseRender = proto.render;
  proto.render = function renderCompletedSprites() {
    const state = runtime(this);
    // Victory/defeat stop gameplay updates; allow their one-shot artwork to
    // finish without resuming the simulation or modifying campaign timers.
    const now = typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
    if ((this.campaignVictory || this.isGameOver) && state.endFrameAt !== null) {
      state.time += Math.max(0, Math.min(0.1, now - state.endFrameAt));
      state.transients = state.transients.filter(effect => state.time - effect.born < effect.duration);
    }
    state.endFrameAt = now;
    const result = baseRender.call(this);
    if (!this.ctx || !this.canvas || !state.transients.length) return result;
    this.ctx.save();
    this.applyBattlefieldView(this.getBattlefieldView(this.canvas.width, this.canvas.height));
    state.transients.forEach(effect => {
      const loaded = approvedImage(this, effect.key);
      if (!loaded) return;
      drawState(this, loaded, effect.stateName, state.time - effect.born, effect.x, effect.y,
        this.getReadableWorldSize(effect.size, effect.minSize),
        { flipX: effect.flipX, rotation: effect.rotation }, effect.duration);
    });
    this.ctx.restore();
    return result;
  };

  ['startNewGame', 'restoreGameplayState'].forEach(method => {
    const original = proto[method];
    if (typeof original !== 'function') return;
    proto[method] = function resetCompletedSpriteState(...args) {
      runtimes.delete(this);
      const result = original.apply(this, args);
      if (method === 'restoreGameplayState') {
        [...(this.projectiles || []), ...(this.particles || [])].forEach(item => {
          if (item.completionEvolution) item.completionBorn = runtime(this).time;
        });
      }
      return result;
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
