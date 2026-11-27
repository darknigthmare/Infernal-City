'use strict';

// The named catalogue is the source of truth. Counts without individual IDs
// (the rest of the premium bestiaries, skins and chapters) are not invented here.
const packs = require('../dlc-packs.v1.js');
const prefix = 'assets/dlc/illustrated-v1/';
const specs = Object.create(null);
const slug = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
function add(group, id, name, columns, states, options = {}) {
  const key = `${group}/${id}`;
  specs[key] = { key, group, id, name, src: `${prefix}${key}.png`, columns,
    rows: states.length, states, fps: 8, usage: ['catalogue'], ...options };
}
for (const pack of packs.paidDlcs) {
  const common = { packId: pack.id, biomeKey: pack.biomeKey, firstDesign: true };
  for (const hero of pack.heroines) add('heroes', hero.id, hero.name, 8,
    ['intro', 'idle_respiration', 'attack', 'ability', 'ultimate', 'victory', 'defeat', 'outro'], common);
  for (const boss of pack.bosses) add('bosses', boss.id, boss.name, 8,
    ['intro', 'phase_shift_2', 'phase_shift_3', 'heavy_telegraph', 'defeat', 'idle'], common);
  for (const tower of pack.towers) add('towers', tower.id, tower.name, 8,
    ['level1', 'level2', 'level3', 'charged', 'overdrive', 'deploy', 'recycle', 'idle'], common);
  for (const enemy of pack.enemies || []) add('enemies', enemy.id, enemy.name, 8,
    ['move', 'attack', 'death_dissolve', 'shield_break'], common);
  add('weapons', pack.weapon.id, pack.weapon.name, 4, ['sequence_1', 'sequence_2'],
    { ...common, sequenceFrames: 8, fps: 14 });
  add('evolutions', pack.weapon.id, pack.weapon.evolution, 4, ['sequence_1', 'sequence_2'],
    { ...common, sequenceFrames: 8, fps: 14 });
  pack.maps.forEach(name => add('maps', `${pack.biomeKey}_${slug(name)}`, name, 1, ['scene'],
    { ...common, fps: 0, opaque: true, usage: ['battlefield', 'catalogue'] }));
  add('props', `${pack.biomeKey}_monument`, `Monument · ${pack.name}`, 2, ['sequence_1', 'sequence_2'],
    { ...common, sequenceFrames: 4, fps: 4, usage: ['battlefield', 'catalogue'] });
}
const aerial = packs.freeExpansions.find(pack => pack.id === 'free_aerial_horizon');
for (const enemy of aerial.aerialLegionUnits) add('enemies', enemy.id, enemy.name, 8,
  ['move', 'attack', 'death_dissolve', 'shield_break'],
  { packId: aerial.id, faction: enemy.faction, firstDesign: true, usage: ['combat', 'catalogue'] });
const pact = packs.freeExpansions.find(pack => pack.id === 'free_eclipse_pact');
add('bosses', 'architect_zero', 'L’Architecte Zéro', 8,
  ['intro', 'phase_shift_2', 'phase_shift_3', 'phase_shift_4', 'heavy_telegraph', 'attack', 'defeat', 'idle'],
  { packId: pact.id, firstDesign: true });
for (const duo of pact.duoCombos) add('fx', duo.id, duo.name, 4, ['sequence_1', 'sequence_2'],
  { packId: pact.id, sequenceFrames: 8, fps: 12, usage: ['combat', 'catalogue'] });
add('fx', 'infernal_fog', 'Brouillard infernal', 4, ['sequence_1', 'sequence_2'],
  { packId: aerial.id, sequenceFrames: 8, fps: 4, usage: ['weather', 'catalogue'] });

const haven = require('../expansion.v1.js');
for (const layout of Object.values(haven.worldLayouts).filter(layout => layout.id.startsWith('haven_'))) {
  add('maps', layout.id, layout.name, 1, ['scene'],
    { packId: 'haven_theatres', firstDesign: true, opaque: true, fps: 0, usage: ['battlefield'] });
}
for (const [id, name] of Object.entries({
  flame_stream: 'Jet de flammes', siege_missile: 'Missile de siège',
  cryo_shard: 'Éclat cryogénique', acid_glob: 'Globule corrosif',
  drone_laser: 'Trait laser du drone', siphon_seed: 'Graine de siphon'
})) add('fx', id, name, 8, ['flight', 'impact', 'overload'],
  { packId: 'haven_arsenal', firstDesign: true, fps: 16, usage: ['combat'] });
for (const [id, name] of Object.entries({
  choc_thermique: 'Choc Thermique', tempete_magnetique: 'Tempête Magnétique',
  embrasement_toxique: 'Embrasement Toxique'
})) add('fx', id, name, 8, ['cast', 'active', 'impact', 'fade'],
  { packId: 'free_first_breach', firstDesign: true, fps: 12, usage: ['combat', 'catalogue'] });

module.exports = { version: 1, prefix, specs, slug };
