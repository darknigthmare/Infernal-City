(function installAerialLegions(root) {
  'use strict';

  const aerial = root.INFERNAL_CITY_AERIAL_LEGIONS;
  const completion = root.INFERNAL_CITY_SPRITE_COMPLETION;
  if (!aerial || !completion || typeof GameEngine !== 'function') return;
  const proto = GameEngine.prototype;
  const runtimeKey = '__infernalCityAerialLegionsV1';
  if (proto[runtimeKey]) return;

  const states = Object.freeze(['move', 'attack', 'death_dissolve', 'shield_break']);
  const assets = Object.create(null);
  const approvedSpecs = new WeakMap();
  aerial.enemyIds.forEach(id => {
    // Retain the established flying sprite as the loading/error fallback.
    // Completion supplies the approved native DLC atlas and all pose timers.
    ENEMY_SPRITE_DATA[id] = { ...ENEMY_SPRITE_DATA.flying };
    if (!SPECIALIST_ENEMY_TYPES.includes(id)) SPECIALIST_ENEMY_TYPES.push(id);
    const key = 'enemies/' + id;
    assets[key] = Object.freeze({
      key, group: 'enemies', id,
      src: aerial.enemies[id].spriteSrc,
      columns: 8, rows: 4, states, fps: 8, usage: 'combat'
    });
  });

  root.INFERNAL_CITY_SPRITE_COMPLETION = Object.freeze({
    ...completion,
    assets: Object.freeze({ ...completion.assets, ...assets }),
    approved(key) {
      const spec = assets[key];
      if (!spec) return completion.approved(key);
      // The DLC register is intentionally resolved at use time, after the
      // script bootstrap. A planned filename alone never permits a request.
      const entry = root.INFERNAL_CITY_DLC_ART?.assets?.[key];
      if (entry?.approved !== true || entry.src !== spec.src
        || !/^[a-f0-9]{64}$/u.test(entry.sha256 || '')
        || entry.columns !== spec.columns || entry.rows !== spec.rows
        || entry.nativeBytesPreserved !== true
        || !Array.isArray(entry.states) || entry.states.length !== states.length
        || states.some((state, index) => entry.states[index] !== state)) return null;
      const drawScale = entry.drawScaleSha256 === entry.sha256
        && Number.isFinite(entry.drawScale) && entry.drawScale >= 0.5 && entry.drawScale <= 2.5
        ? entry.drawScale : 1;
      let approved = approvedSpecs.get(entry);
      if (!approved || approved.drawScale !== drawScale) {
        approved = Object.freeze({ ...spec, drawScale });
        approvedSpecs.set(entry, approved);
      }
      return approved;
    }
  });

  function factionForWave(engine) {
    const wave = engine.activeWaveDefinition;
    if (aerial.byFaction[wave?.factionId]) return wave.factionId;
    for (const group of wave?.groups || []) {
      const faction = root.INFERNAL_CITY_EXPANSION?.enemyDefinitions?.[group.type]?.factionId;
      if (aerial.byFaction[faction]) return faction;
    }
    return null;
  }

  const baseQueue = proto.buildWaveSpawnQueue;
  proto.buildWaveSpawnQueue = function buildAerialWaveSpawnQueue(waveNumber = this.wave) {
    const queue = baseQueue.call(this, waveNumber);
    const type = aerial.selectForWave(waveNumber, factionForWave(this));
    if (!type || !queue.some(entry => entry.type === 'flying' && !entry.boss)) return queue;
    // Keep authored contracts immutable; update only this run's queue and
    // tactical preview. Counts, cadence, routes and scheduled bosses survive.
    if (this.activeWaveDefinition?.groups) this.activeWaveDefinition = {
      ...this.activeWaveDefinition,
      groups: this.activeWaveDefinition.groups.map(group => group.type === 'flying'
        ? { ...group, type } : group)
    };
    return queue.map(entry => entry.type === 'flying' && !entry.boss ? { ...entry, type } : entry);
  };

  const baseFallback = proto.chooseFallbackEnemyType;
  proto.chooseFallbackEnemyType = function chooseAerialFallbackType() {
    const type = baseFallback.call(this);
    return type === 'flying'
      ? aerial.selectForWave(this.wave, factionForWave(this)) || type
      : type;
  };

  const baseSpawn = proto.spawnEnemy;
  proto.spawnEnemy = function spawnAerialLegion(type, routeIndex, options) {
    const enemy = baseSpawn.call(this, type, routeIndex, options);
    const definition = aerial.enemies[type];
    if (enemy && definition) {
      enemy.legionFactionId = definition.factionId;
      enemy.legionBaseSpeed = enemy.baseSpeed;
    }
    return enemy;
  };

  const basePreload = proto.preloadWaveCharacterBosses;
  proto.preloadWaveCharacterBosses = function preloadAerialWave(queue) {
    const result = basePreload.call(this, queue);
    if (this.hasEnteredAdultExperience === true) {
      [...new Set((queue || []).map(entry => entry.type))]
        .filter(type => aerial.enemies[type])
        .forEach(type => this.ensureEnemySprite(type));
    }
    return result;
  };

  Object.defineProperty(proto, runtimeKey, { value: true });
  root.INFERNAL_CITY_AERIAL_LEGIONS_RUNTIME = Object.freeze({ installed: true, enemyIds: aerial.enemyIds });
})(typeof window !== 'undefined' ? window : globalThis);
