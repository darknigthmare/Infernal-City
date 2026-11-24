(function registerAerialLegions(root) {
  'use strict';

  if (root.INFERNAL_CITY_AERIAL_LEGIONS) return;
  const expansion = root.INFERNAL_CITY_EXPANSION;
  const flying = expansion?.enemyDefinitions?.flying;
  const pack = root.INFERNAL_CITY_DLCS?.freeExpansions?.find(entry => entry.id === 'free_aerial_horizon');
  if (!flying || pack?.status !== 'active') return;

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  const enemies = Object.create(null);
  const byFaction = Object.create(null);
  (pack.aerialLegionUnits || []).forEach(unit => {
    if (!unit?.id || !unit.faction || !(unit.hp > 0 && unit.speed > 0)) return;
    // The pack already authors identity, HP and speed. Every remaining combat
    // value and counter comes from the existing aerial specialist.
    enemies[unit.id] = {
      ...flying,
      id: unit.id,
      name: unit.name,
      baseType: 'flying',
      factionId: unit.faction,
      packId: pack.id,
      spriteSrc: 'assets/dlc/illustrated-v1/enemies/' + unit.id + '.png',
      stats: { ...flying.stats, hp: unit.hp, speed: unit.speed },
      traits: [...new Set([...(flying.traits || []), 'specialist'])]
    };
    byFaction[unit.faction] = unit.id;
  });

  const enemyIds = Object.keys(enemies);
  if (!enemyIds.length) return;
  const factionIds = Object.keys(root.INFERNAL_CITY_ENEMY_LEGIONS?.factions || byFaction)
    .filter(id => byFaction[id]);

  root.INFERNAL_CITY_AERIAL_LEGIONS = deepFreeze({
    version: 1,
    packId: pack.id,
    enemies,
    enemyIds,
    byFaction,
    factionIds,
    selectForWave(waveNumber, factionId) {
      const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
      if (wave < 4) return null;
      if (byFaction[factionId]) return byFaction[factionId];
      // Match the existing legion fallback's unlock rule without consuming
      // another seeded random draw or changing a wave's number of enemies.
      const unlocked = Math.min(factionIds.length, Math.max(1, Math.ceil(wave / 3)));
      const selectedFaction = factionIds[(wave - 1) % unlocked];
      return byFaction[selectedFaction] || null;
    }
  });
  root.INFERNAL_CITY_EXPANSION = deepFreeze({
    ...expansion,
    enemyDefinitions: { ...expansion.enemyDefinitions, ...enemies }
  });
})(typeof window !== 'undefined' ? window : globalThis);
