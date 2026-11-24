'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const packs = require('../dlc-packs.v1.js');
const { specs } = require('../scripts/dlc-art-spec.cjs');
const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'dlc-art-runtime.v1.js'), 'utf8');

function load({ entered = true, imageReady = true, tamper } = {}) {
  const calls = [], requests = [], fallbacks = [], saves = [];
  const keys = ['maps/astral_parvis_solaire', 'maps/astral_nef_d_horlogerie',
    'maps/abyss_fosse_de_corail', 'props/astral_monument', 'fx/duo_aria_astarra'];
  const assets = Object.fromEntries(keys.map(key => [key, { ...specs[key], sha256: 'b'.repeat(64), approved: true }]));
  tamper?.(assets);
  class GameEngine {}
  Object.assign(GameEngine.prototype, {
    preloadSpriteAsset(src) {
      requests.push(src);
      const map = src.includes('/maps/');
      const prop = src.includes('/props/');
      return { src, complete: imageReady, naturalWidth: map ? 1536 : prop ? 1024 : 1774,
        naturalHeight: map ? 1024 : prop ? 1024 : 887 };
    },
    isSpriteReady(image) { return Boolean(image?.complete && image.naturalWidth); },
    renderDlcBiomeOverlay(...args) { fallbacks.push(['biome', ...args]); return 'old-biome'; },
    drawCompletedEvolution(particle) { fallbacks.push(['projectile', particle]); return false; },
    getReadableWorldSize(size) { return size; },
    activateDlcBiome(id) {
      if (!packs.paidDlcs.some(pack => pack.id === id)) return false;
      this.activeDlcBiomeId = id; return true;
    },
    saveProgress() { saves.push(JSON.parse(JSON.stringify({ biome: this.activeDlcBiomeId, maps: this.dlcMapSelections || {} }))); },
    openDlcHubModal() {}, render() {}
  });
  const window = { INFERNAL_CITY_DLCS: packs, INFERNAL_CITY_DLC_ART: { assets } };
  vm.runInNewContext(source, { window, GameEngine, console, performance: { now: () => 1000 } });
  const engine = new GameEngine();
  Object.assign(engine, { hasEnteredAdultExperience: entered, prefersReducedMotion: false,
    activeDlcBiomeId: 'dlc_astral_cathedral', animationClock: 0.75,
    ctx: { save() {}, restore() {}, drawImage(...args) { calls.push(args); } } });
  return { engine, calls, requests, fallbacks, saves, assets };
}

test('named DLC art catalogue covers every declared identity without inventing counted bestiaries', () => {
  assert.equal(Object.keys(specs).length, 82);
  for (const pack of packs.paidDlcs) {
    for (const hero of pack.heroines) assert.ok(specs[`heroes/${hero.id}`]);
    for (const boss of pack.bosses) assert.ok(specs[`bosses/${boss.id}`]);
    for (const tower of pack.towers) assert.ok(specs[`towers/${tower.id}`]);
    assert.ok(specs[`weapons/${pack.weapon.id}`]);
    assert.ok(specs[`evolutions/${pack.weapon.id}`]);
    assert.equal(Object.values(specs).filter(spec => spec.packId === pack.id && spec.group === 'maps').length, 2);
  }
  assert.equal(specs['bosses/architect_zero'].rows, 8);
  assert.equal(Object.values(specs).filter(spec => spec.group === 'enemies').length, 10);
});

test('DLC map and effects make no image request before entry', () => {
  const { engine, requests, fallbacks } = load({ entered: false });
  engine.renderDlcBiomeOverlay(1000, 500, {});
  engine.drawCompletedEvolution({ type: 'gravity_ring', dlcDuoId: 'duo_aria_astarra', life: 0.4, maxLife: 0.68 });
  assert.equal(requests.length, 0);
  assert.equal(fallbacks.length, 2);
});

test('unreviewed paths and malformed hashes cannot become runtime requests', () => {
  const { engine, requests, fallbacks } = load({ tamper(assets) {
    assets['maps/astral_parvis_solaire'].src = 'https://invalid.example/scene.png';
    assets['maps/astral_nef_d_horlogerie'].sha256 = 'not-reviewed';
    assets['fx/duo_aria_astarra'].approved = false;
  } });
  engine.renderDlcBiomeOverlay(1000, 500, {});
  engine.drawCompletedEvolution({ type: 'gravity_ring', dlcDuoId: 'duo_aria_astarra' });
  assert.equal(requests.length, 0);
  assert.equal(fallbacks.length, 2);
});

test('unavailable image retains the biome fallback and is requested only once', () => {
  const { engine, requests, fallbacks } = load({ imageReady: false });
  for (let i = 0; i < 5; i++) assert.equal(engine.renderDlcBiomeOverlay(1000, 500, {}), 'old-biome');
  assert.equal(requests.length, 1);
  assert.equal(fallbacks.length, 5);
});

test('map selection validates pack ownership and persists the selected scene', () => {
  const { engine, saves, requests } = load();
  assert.equal(engine.selectDlcIllustratedMap('dlc_astral_cathedral', 'abyss_fosse_de_corail'), false);
  assert.equal(saves.length, 0);
  assert.equal(engine.selectDlcIllustratedMap('dlc_astral_cathedral', 'astral_nef_d_horlogerie'), true);
  assert.equal(engine.getDlcIllustratedMap().id, 'astral_nef_d_horlogerie');
  assert.equal(saves.at(-1).maps.dlc_astral_cathedral, 'astral_nef_d_horlogerie');
  assert.deepEqual(requests, ['assets/dlc/illustrated-v1/maps/astral_nef_d_horlogerie.png']);
});

test('illustrated biome preserves aspect ratio and loads only its selected map and prop', () => {
  const { engine, calls, requests, fallbacks } = load();
  assert.equal(engine.renderDlcBiomeOverlay(1000, 500, { left: -100, right: 1100, top: -100, bottom: 600 }), true);
  assert.equal(fallbacks.length, 0);
  assert.equal(calls.length, 5);
  const scene = calls[0];
  assert.equal(scene[1], 0); assert.equal(scene[2], 128);
  assert.equal(scene[3], 1536); assert.equal(scene[4], 768);
  assert.equal(scene[7] / scene[8], scene[3] / scene[4]);
  assert.deepEqual(requests, ['assets/dlc/illustrated-v1/maps/astral_parvis_solaire.png',
    'assets/dlc/illustrated-v1/props/astral_monument.png']);
});

test('duo effect uses its own row-major sequence without mutating combat particles', () => {
  const { engine, calls, fallbacks } = load();
  const particle = { type: 'gravity_ring', dlcDuoId: 'duo_aria_astarra', x: 120, y: 80,
    radius: 100, life: 0.34, maxLife: 0.68 };
  const before = { ...particle };
  assert.equal(engine.drawCompletedEvolution(particle), true);
  assert.deepEqual(particle, before);
  assert.equal(fallbacks.length, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], 0);
  assert.equal(calls[0][2], 443.5);
  assert.equal(calls[0][3], 443.5);
});

test('ordinary particles and reduced motion keep the existing rendering contract', () => {
  const { engine, calls, requests, fallbacks } = load();
  engine.drawCompletedEvolution({ type: 'gravity_ring', radius: 70 });
  engine.prefersReducedMotion = true;
  engine.drawCompletedEvolution({ type: 'gravity_ring', dlcDuoId: 'duo_aria_astarra' });
  assert.equal(calls.length, 0); assert.equal(requests.length, 0); assert.equal(fallbacks.length, 2);
});

test('published DLC art approvals match the exact native files', () => {
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'dlc-art.v1.js'), 'utf8'), { window });
  const art = window.INFERNAL_CITY_DLC_ART;
  assert.equal(art.expected, 82);
  assert.equal(art.approved, 82);
  assert.equal(art.missing.length, 0);
  assert.equal(art.pending.length, 0);
  for (const [key, item] of Object.entries(art.assets)) {
    assert.equal(item.src, specs[key].src);
    const bytes = fs.readFileSync(path.join(ROOT, item.src));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, key);
    assert.equal(bytes.readUInt32BE(16), item.width, key);
    assert.equal(bytes.readUInt32BE(20), item.height, key);
    assert.equal(item.nativeBytesPreserved, true, key);
  }
});
