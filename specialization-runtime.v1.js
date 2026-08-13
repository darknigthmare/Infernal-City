(function createSpecializationRuntime(root) {
  'use strict';

  if (root.INFERNAL_CITY_SPECIALIZATION_RUNTIME) return;

  const rampTargets = new WeakMap();

  function specialization(engine, defense) {
    return engine.getDefenseSpecializationOptions(defense)
      .find(option => option.id === defense.specializationId) || null;
  }

  function initializeDefense(defense, spec) {
    if (!defense || !spec) return;
    defense.specializationHeat = 0;
    defense.specializationRamp = 0;
    defense.specializationTargetId = null;
    defense.specializationPulseTimer = 0;
    defense.specializationOriginX = Number(defense.x) || 0;
    defense.specializationOriginY = Number(defense.y) || 0;
    if (spec.id === 'landmine_scatter') {
      defense.remainingCharges = Math.max(1, Math.floor(Number(spec.modifiers?.mineCount) || 4));
    }
  }

  function beforeUpdate(engine, dt) {
    engine.placedTowers.forEach(defense => {
      const spec = specialization(engine, defense);
      if (!spec) return;
      const modifiers = spec.modifiers || {};

      if (spec.id === 'vulcan_cerberus') {
        const hasTarget = Boolean(engine.findTarget(defense.x, defense.y, defense.range, defense));
        const capacity = 100 * (Number(modifiers.heatCapacityMultiplier) || 1);
        defense.specializationHeat = Math.max(0, Math.min(
          capacity,
          (Number(defense.specializationHeat) || 0) + (hasTarget ? 36 : -48) * dt
        ));
      }

      if (['flame_furnace', 'gravity_singularity', 'orbital_judgement'].includes(spec.id)) {
        const target = engine.findTarget(defense.x, defense.y, defense.range, defense);
        if (!target) {
          rampTargets.delete(defense);
          defense.specializationRamp = Math.max(0, (Number(defense.specializationRamp) || 0) - dt * 2);
        } else {
          if (rampTargets.get(defense) !== target) defense.specializationRamp = 0;
          rampTargets.set(defense, target);
          defense.specializationRamp = Math.min(
            Number(modifiers.maximumRamp) || 1.25,
            (Number(defense.specializationRamp) || 0) + (Number(modifiers.rampDamagePerSecond) || 0.12) * dt
          );
        }
      }

      if (spec.id === 'laser_interceptor') {
        const radius = defense.range * (Number(modifiers.patrolRadiusMultiplier) || 1) * 0.14;
        const originX = Number(defense.specializationOriginX);
        const originY = Number(defense.specializationOriginY);
        if (
          !Number.isFinite(originX)
          || !Number.isFinite(originY)
          || Math.hypot(defense.x - originX, defense.y - originY) > radius * 2.25
        ) {
          defense.specializationOriginX = Number(defense.x) || 0;
          defense.specializationOriginY = Number(defense.y) || 0;
        }
        defense.specializationPulseTimer = (Number(defense.specializationPulseTimer) || 0) + dt;
        defense.x = defense.specializationOriginX + Math.cos(defense.specializationPulseTimer * 1.45) * radius;
        defense.y = defense.specializationOriginY + Math.sin(defense.specializationPulseTimer * 1.45) * radius;
      }

      if (spec.id === 'gravity_orbit') {
        engine.getEnemiesInRange(defense.x, defense.y, defense.range, defense).forEach(enemy => {
          enemy.pathDistortionTimer = Math.max(Number(enemy.pathDistortionTimer) || 0, 0.25);
          enemy.pathDistortionMultiplier = Number(modifiers.pathLengthMultiplier) || 1.18;
        });
      }

      if (spec.id === 'magnet_salvager') {
        const speed = 125 * (Number(modifiers.collectionSpeedMultiplier) || 1.4) * dt;
        const capacity = Math.max(1, Math.floor(
          Number(modifiers.collectionCapacity)
          || Number(modifiers.storageCapacity)
          || 8
        ));
        [...engine.crates, ...engine.powerups].slice(0, capacity).forEach(item => {
          if (Math.hypot(item.x - defense.x, item.y - defense.y) > defense.range) return;
          const angle = Math.atan2(defense.y - item.y, defense.x - item.x);
          item.x += Math.cos(angle) * speed;
          item.y += Math.sin(angle) * speed;
        });
      }
    });

    engine.enemies.forEach(enemy => {
      if (enemy.pathDistortionTimer > 0) {
        enemy.pathDistortionTimer = Math.max(0, enemy.pathDistortionTimer - dt);
        enemy.slowTimer = Math.max(Number(enemy.slowTimer) || 0, 0.2);
        enemy.slowSpeedMultiplier = Math.min(
          Number(enemy.slowSpeedMultiplier) || 1,
          1 / Math.max(1, Number(enemy.pathDistortionMultiplier) || 1)
        );
      }
    });
  }

  function afterUpdate(engine) {
    engine.placedTowers.forEach(defense => {
      const spec = specialization(engine, defense);
      if (spec?.id === 'landmine_scatter' && !engine.waveActive) {
        defense.remainingCharges = Math.max(
          Number(defense.remainingCharges) || 0,
          Math.floor(Number(spec.modifiers?.mineCount) || 4)
        );
        defense.rearmTimer = 0;
      }
    });
  }

  root.INFERNAL_CITY_SPECIALIZATION_RUNTIME = Object.freeze({
    version: '1.0.0',
    initializeDefense,
    beforeUpdate,
    afterUpdate
  });
})(typeof window !== 'undefined' ? window : globalThis);
