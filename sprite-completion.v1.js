(function registerSpriteCompletion(root) {
  'use strict';

  const prefix = 'assets/animations/completion-v1/';
  const assets = Object.create(null);
  const approvedSpecs = new WeakMap();
  function add(group, id, columns, states, options = {}) {
    const key = `${group}/${id}`;
    assets[key] = Object.freeze({
      key, group, id, src: `${prefix}${key}.png`, columns, rows: states.length,
      states: Object.freeze(states.slice()), fps: 10, ...options
    });
  }
  const historicalHeroes = ['aria', 'kira', 'rin', 'selene', 'vespera', 'carmilla'];
  historicalHeroes.forEach(id => add('heroes', id, 8,
    ['intro', 'idle_respiration', 'attack', 'ability', 'ultimate', 'victory', 'defeat', 'outro']));
  const expansionHeroes = Object.keys(root.INFERNAL_CITY_CHARACTERS?.heroines || {});
  const heroineIds = expansionHeroes.length ? expansionHeroes
    : ['nyx', 'aurelia', 'maris', 'zahra', 'mircalla', 'isolde', 'hana', 'freyja', 'vega', 'amara'];
  heroineIds.forEach(id => add('heroes', id, 8, ['intro', 'victory', 'defeat', 'outro']));
  const bossIds = ['xyra', 'ossuary', 'nhalzara', 'astarra', 'umbrael', 'pestifera', 'vexara', 'kalix', 'malika', 'noctis', 'leviathan'];
  bossIds.forEach(id => add('bosses', id, 8,
    ['intro', 'phase_shift_2', 'phase_shift_3', 'heavy_telegraph', 'defeat', 'idle']));
  const legionIds = Object.keys(root.INFERNAL_CITY_ENEMY_LEGIONS?.enemies || {});
  [...legionIds, 'flying', 'bulwark', 'artillery', 'splitter'].forEach(id => add('enemies', id, 8,
    ['move', 'attack', 'death_dissolve', 'shield_break']));
  [
    'vulcan_turret', 'plasma_mortar', 'railgun_pylon', 'flame_trap', 'tesla_spire',
    'cryo_cannon', 'acid_trap', 'laser_drone', 'landmine', 'aegis_barrier',
    'gravity_well', 'missile_pod', 'bio_siphon', 'magnet_drone', 'sawblade_turret',
    'emp_tower', 'orbital_beam', 'napalm_mine', 'blood_shrine', 'sonic_cannon'
  ].forEach(id => add('towers', id, 8,
    ['level1', 'level2', 'level3', 'specialization_a', 'specialization_b', 'deploy', 'recycle', 'idle']));
  ['vulcan-cerberus', 'nova-cataclysm', 'odin-lance', 'niflhel-breath'].forEach(id => add(
    'evolutions', id, 4, ['sequence_1', 'sequence_2'], { sequenceFrames: 8, fps: 16 }
  ));
  // These additional authored assets are available in the review viewer.
  // Their UI/weather wiring is deliberately separate from combat replacement.
  heroineIds.forEach(id => add('portraits', id, 4, ['portrait_loop_1', 'portrait_loop_2'],
    { sequenceFrames: 8, fps: 4, preparedOnly: true }));
  ['acid-rain', 'ion-storm', 'debris-settle'].forEach(id => add(
    'environment', id, 4, ['sequence_1', 'sequence_2'],
    { sequenceFrames: 8, fps: 10, preparedOnly: true }
  ));

  root.INFERNAL_CITY_SPRITE_COMPLETION = Object.freeze({
    version: 1, prefix, assets: Object.freeze(assets),
    // A planned filename is never enough to trigger a request. The generated
    // approval register contains only inspected, present assets and their hashes.
    approved(key) {
      const spec = assets[key];
      const entry = root.INFERNAL_CITY_SPRITE_COMPLETION_APPROVED?.assets?.[key];
      if (!spec || entry?.approved !== true || entry.src !== spec.src
        || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')) return null;
      const drawScale = !spec.preparedOnly && entry.drawScaleSha256 === entry.sha256
        && Number.isFinite(entry.drawScale) && entry.drawScale >= 0.5 && entry.drawScale <= 2.5
        ? entry.drawScale : 1;
      let approvedSpec = approvedSpecs.get(entry);
      if (!approvedSpec || approvedSpec.drawScale !== drawScale) {
        approvedSpec = Object.freeze({ ...spec, drawScale });
        approvedSpecs.set(entry, approvedSpec);
      }
      return approvedSpec;
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
