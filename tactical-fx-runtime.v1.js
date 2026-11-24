(function installTacticalEffects(root) {
  'use strict';

  if (typeof GameEngine !== 'function') return;
  const proto = GameEngine.prototype;
  if (proto.__infernalCityTacticalEffectsV1) return;
  const states = new WeakMap();
  const prefix = 'assets/dlc/illustrated-v1/fx/';
  const projectileStates = ['flight', 'impact', 'overload'];
  const synergyStates = ['cast', 'active', 'impact', 'fade'];
  const synergyIds = new Set(['choc_thermique', 'tempete_magnetique', 'embrasement_toxique']);
  const defenseEffects = Object.freeze({
    missile: 'siege_missile', cryo: 'cryo_shard', acid: 'acid_glob',
    drone: 'drone_laser', siphon: 'siphon_seed'
  });
  const projectileIds = new Set(['flame_stream', ...Object.values(defenseEffects)]);

  function stateFor(engine) {
    if (!states.has(engine)) states.set(engine, { images: new Map(), lastImpact: new WeakMap() });
    return states.get(engine);
  }

  function specFor(id, expectedStates) {
    const spec = root.INFERNAL_CITY_DLC_ART?.assets?.[`fx/${id}`];
    if (!spec || spec.approved !== true || spec.nativeBytesPreserved !== true
      || spec.src !== `${prefix}${id}.png` || !/^[a-f0-9]{64}$/u.test(spec.sha256 || '')
      || spec.columns !== 8 || spec.rows !== expectedStates.length
      || !Array.isArray(spec.states) || spec.states.length !== expectedStates.length
      || expectedStates.some((name, index) => spec.states[index] !== name)) return null;
    return spec;
  }

  function ready(engine, id, expectedStates) {
    if (engine.hasEnteredAdultExperience !== true) return null;
    const spec = specFor(id, expectedStates);
    if (!spec) return null;
    const images = stateFor(engine).images;
    if (!images.has(spec.src)) images.set(spec.src, engine.preloadSpriteAsset(spec.src, spec.name));
    const image = images.get(spec.src);
    return engine.isSpriteReady(image) ? { image, spec } : null;
  }

  function projectileId(projectile) {
    if (!projectile || projectile.completionEvolution || projectile.visualType === 'saw') return null;
    if (projectile.type === 'flame') return 'flame_stream';
    if (!['bullet', 'acid', 'plasma_mortar'].includes(projectile.type)) return null;
    return defenseEffects[projectile.sourceDefense?.type] || null;
  }

  function draw(engine, loaded, row, frame, effect, size, alpha = 1, rotation = 0) {
    const ctx = engine.ctx;
    if (!ctx || !loaded || !Number.isFinite(effect.x) || !Number.isFinite(effect.y) || !(size > 0)) return false;
    const { image, spec } = loaded;
    const cellW = (image.naturalWidth || image.width) / spec.columns;
    const cellH = (image.naturalHeight || image.height) / spec.rows;
    if (!(cellW > 0 && cellH > 0)) return false;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(effect.x, effect.y);
    if (rotation) ctx.rotate(rotation);
    // Fractional native cells are intentional. No resized derivative is created.
    ctx.drawImage(image, frame * cellW, row * cellH, cellW, cellH,
      -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function progressFor(particle) {
    const duration = Math.max(0.01, Number(particle.maxLife) || 0.34);
    return Math.max(0, Math.min(0.999, 1 - (Number(particle.life) || 0) / duration));
  }

  proto.emitTacticalProjectileImpact = function emitTacticalProjectileImpact(projectile, enemy) {
    const id = projectileId(projectile);
    if (!id || this.hasEnteredAdultExperience !== true || this.prefersReducedMotion
      || !specFor(id, projectileStates) || !Array.isArray(this.particles) || this.particles.length >= 220
      || !Number.isFinite(enemy?.x) || !Number.isFinite(enemy?.y)) return false;
    const state = stateFor(this);
    const now = Number(this.animationClock) || 0;
    const last = state.lastImpact.get(projectile);
    // Piercing beams and flame cones keep their collision rules, but do not
    // emit an atlas for every target within the same frame.
    if (Number.isFinite(last) && now >= last && now - last < 0.08) return false;
    state.lastImpact.set(projectile, now);
    this.particles.push({
      type: 'tactical_projectile_impact', tacticalFxId: id,
      x: enemy.x, y: enemy.y, life: 0.32, maxLife: 0.32,
      size: Math.max(30, Math.min(90, (Number(projectile.radius) || 6) * 7))
    });
    return true;
  };

  const baseEffect = proto.drawCompletedEvolution;
  proto.drawCompletedEvolution = function drawTacticalEffect(effect) {
    // Existing evolved weapons and named duo animations have precedence.
    if (baseEffect?.call(this, effect)) return true;
    if (!effect || effect.completionEvolution) return false;

    if (effect.type === 'gravity_ring' && synergyIds.has(effect.synergyId)) {
      if (this.prefersReducedMotion) return false;
      const loaded = ready(this, effect.synergyId, synergyStates);
      if (!loaded) return false;
      const progress = progressFor(effect);
      const sequenceFrame = Math.min(31, Math.floor(progress * 32));
      const radius = Math.max(4, Number(effect.maxRadius) || Number(effect.radius) || 56);
      return draw(this, loaded, Math.floor(sequenceFrame / 8), sequenceFrame % 8, effect,
        radius * 4, Math.min(0.9, (1 - progress) * 2));
    }

    if (effect.type === 'tactical_projectile_impact' && projectileIds.has(effect.tacticalFxId)) {
      if (this.prefersReducedMotion) return false;
      const loaded = ready(this, effect.tacticalFxId, projectileStates);
      const progress = progressFor(effect);
      return draw(this, loaded, 1, Math.min(7, Math.floor(progress * 8)), effect,
        this.getReadableWorldSize?.(effect.size, 14) || effect.size, 1 - progress * 0.6);
    }

    const id = projectileId(effect);
    if (!id) return false;
    const loaded = ready(this, id, projectileStates);
    if (!loaded) return false;
    const seconds = Math.max(0, Number(this.animationClock) || 0);
    const frame = this.prefersReducedMotion ? 0 : Math.floor(seconds * loaded.spec.fps) % 8;
    const row = this.isOverdriveActive ? 2 : 0;
    const diameter = Math.max(18, (Number(effect.radius) || 4) * 5);
    const size = this.getReadableWorldSize?.(diameter, 12) || diameter;
    const alpha = id === 'flame_stream' ? Math.max(0.2, Math.min(0.9, (Number(effect.life) || 0.3) * 2)) : 1;
    return draw(this, loaded, row, frame, effect, size, alpha,
      Math.atan2(Number(effect.vy) || 0, Number(effect.vx) || 0));
  };

  Object.defineProperty(proto, '__infernalCityTacticalEffectsV1', { value: true });
  root.INFERNAL_CITY_TACTICAL_FX_RUNTIME = Object.freeze({ installed: true });
})(typeof window !== 'undefined' ? window : globalThis);
