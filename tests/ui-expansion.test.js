'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'styles.v8.css'), 'utf8');
const worker = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const gameSource = fs.readFileSync(path.join(ROOT, 'game.v9.js'), 'utf8');

function hasId(id) {
  return new RegExp(`id="${id}"`).test(html);
}

test('the 2.8 content scripts load before the game runtime', () => {
  const expansionIndex = html.indexOf('<script src="expansion.v1.js"></script>');
  const characterIndex = html.indexOf('<script src="characters.v1.js"></script>');
  const vnExpansionIndex = html.indexOf('<script src="vn-expansion.v1.js"></script>');
  const adultScenesIndex = html.indexOf('<script src="adult-scenes.v1.js"></script>');
  const gameIndex = html.indexOf('<script src="game.v9.js"></script>');

  assert.ok(expansionIndex > 0);
  assert.ok(characterIndex > expansionIndex);
  assert.ok(vnExpansionIndex > characterIndex);
  assert.ok(adultScenesIndex > vnExpansionIndex);
  assert.ok(gameIndex > adultScenesIndex);
});

test('the campaign briefing exposes every terrain and the daily contract', () => {
  [
    'layout-select',
    'btn-daily-challenge',
    'daily-challenge-summary',
    'daily-challenge-date',
    'daily-challenge-layout',
    'daily-challenge-mutators',
    'mission-map-txt',
    'mission-next-wave-txt'
  ].forEach(id => assert.ok(hasId(id), `${id}: missing`));

  ['convergence', 'western_wall', 'southern_watch', 'twin_rift', 'rotation']
    .forEach(value => assert.match(html, new RegExp(`<option value="${value}"`)));
});

test('specializations, Infinitum and Studio 2.8 have accessible static surfaces', () => {
  [
    'defense-specialization-section',
    'defense-specialization-options',
    'btn-defense-specialization-a',
    'btn-defense-specialization-b',
    'infinitum-segment-progress',
    'infinitum-floor-list',
    'infinitum-cumulative-mutators',
    'studio-pose-select',
    'studio-ambience-select',
    'studio-maturity-select',
    'studio-consent-note',
    'studio-conclusion-gallery',
    'vn-expression-portrait',
    'vn-lore-container',
    'vn-lore-prompt'
  ].forEach(id => assert.ok(hasId(id), `${id}: missing`));

  assert.match(html, /id="defense-specialization-options"[^>]+role="group"/);
  assert.equal((html.match(/data-specialization-index="[01]"/g) || []).length, 2);
  assert.match(html, /id="infinitum-segment-progress" max="10"/);
  assert.match(html, /<option value="suggestive">/);
  assert.match(html, /<option value="intense">/);
  assert.match(css, /\.vn-expression-portrait/);
  assert.match(css, /\.vn-lore-btn/);
});

test('cinematics, adult archives and playful Game Over have accessible surfaces', () => {
  [
    'btn-adult-scenes-toggle',
    'adult-scenes-modal',
    'adult-scenes-filter-select',
    'adult-scenes-grid',
    'cg-sequence-nav',
    'btn-cg-sequence-prev',
    'cg-sequence-status',
    'btn-cg-sequence-next',
    'cinematic-modal',
    'cinematic-img',
    'cinematic-title',
    'cinematic-description',
    'btn-cinematic-continue',
    'game-over-tease-img',
    'game-over-tease-caption'
  ].forEach(id => assert.ok(hasId(id), `${id}: missing`));

  assert.match(html, /id="adult-scenes-modal" role="dialog" aria-modal="true"/);
  assert.match(html, /60 CG de parenthèses privées OpenAI/);
  assert.match(html, /20 parenthèses privées en trois CG indépendantes/);
  assert.match(html, /id="cinematic-modal" role="dialog" aria-modal="true"/);
  assert.match(html, /id="game-over-modal" role="dialog" aria-modal="true"/);
  assert.match(css, /\.adult-scenes-grid/);
  assert.match(css, /\.cg-sequence-nav/);
  assert.match(css, /#cg-sequence-status/);
  assert.match(css, /\.cinematic-frame img/);
  assert.match(css, /\.game-over-tease img/);
  assert.match(css, /\.antagonist-cinematic-actions/);
  assert.match(css, /\.modal-overlay\.active\[aria-hidden="false"\]:not\(\.adult-gate\)/);
  assert.match(gameSource, /queueBossCinematic\(enemy\.bossDefinitionId, 'intro'\)/);
  assert.match(gameSource, /queueBossCinematic\(enemy\.bossDefinitionId, 'defeat'\)/);
  assert.match(gameSource, /openBossCinematicArchive\(definition\.id, moment\)/);
  assert.match(gameSource, /applyGameOverTease\(\)/);
});

test('settings and run history cover comfort, gamepad and portable saves', () => {
  [
    'btn-settings-toggle',
    'settings-modal',
    'music-volume',
    'sfx-volume',
    'contrast-mode',
    'text-size',
    'gamepad-status',
    'btn-export-save',
    'import-save-input',
    'settings-status',
    'btn-run-history-toggle',
    'run-history-modal',
    'run-history-list'
  ].forEach(id => assert.ok(hasId(id), `${id}: missing`));

  assert.match(html, /id="settings-modal" role="dialog" aria-modal="true"/);
  assert.match(html, /id="import-save-input" type="file" accept="application\/json,.json"/);
});

test('touch, compact viewport, focus and reduced-motion rules remain explicit', () => {
  assert.match(css, /button,\s*select\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width:\s*340px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.settings-grid/);
  assert.match(css, /\.defense-specialization-options/);
});

test('card headings do not skip directly from modal h2 titles to h4', () => {
  assert.doesNotMatch(html, /<h4(?:\s|>)/);
  assert.doesNotMatch(gameSource, /<h4(?:\s|>)/);
  assert.match(css, /\.hq-card h3/);
  assert.match(css, /\.upgrade-text h3/);
});

test('PWA 2.8 keeps heavy terrains, atlases and CG in a separate runtime cache', () => {
  assert.match(worker, /CACHE_NAME = `\$\{CACHE_PREFIX\}v13`/);
  assert.match(worker, /MEDIA_CACHE_NAME = `\$\{CACHE_PREFIX\}media-v2\.8`/);
  assert.match(worker, /'\.\/expansion\.v1\.js'/);
  assert.match(worker, /'\.\/characters\.v1\.js'/);
  assert.match(worker, /'\.\/vn-expansion\.v1\.js'/);
  assert.match(worker, /'\.\/adult-scenes\.v1\.js'/);
  assert.doesNotMatch(worker, /'\.\/assets\/animations\/.+\.(?:png|webp)'/);
  assert.match(worker, /assets\/environment\/map-western-wall\.png/);
  assert.match(worker, /assets\/environment\/map-southern-watch\.png/);
  assert.match(worker, /assets\/environment\/map-twin-rift\.png/);
  assert.match(worker, /isNarrativeCg/);
  assert.match(worker, /assets\/animations\//);
  assert.match(worker, /assets\/characters\//);
  assert.match(worker, /assets\/vn\//);
  assert.match(worker, /serveRuntimeMedia/);
});

test('package and web manifest expose release 2.8.0', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));

  assert.equal(packageJson.version, '2.8.0');
  assert.equal(manifest.version, '2.8.0');
  assert.match(packageJson.scripts.check, /node --check expansion\.v1\.js/);
  assert.match(packageJson.scripts.check, /node --check characters\.v1\.js/);
  assert.match(packageJson.scripts.check, /node --check vn-expansion\.v1\.js/);
  assert.match(packageJson.scripts.check, /node --check adult-scenes\.v1\.js/);
  assert.match(packageJson.scripts.check, /node --test tests\/\*\.test\.js/);
});
