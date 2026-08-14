'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/animations/enemy-legions/manifest.json'), 'utf8'));

function loadLegions() {
  const source = fs.readFileSync(path.join(ROOT, 'enemy-legions.v1.js'), 'utf8');
  const window = { INFERNAL_CITY_EXPANSION: { enemyDefinitions: {} } };
  const sandbox = { window, globalThis: null, console, Object, Array, Set, String, Number, Math };
  sandbox.globalThis = sandbox;
  vm.runInContext(source, vm.createContext(sandbox));
  return window.INFERNAL_CITY_ENEMY_LEGIONS;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function assertWebp(relativePath) {
  const file = path.join(ROOT, relativePath);
  assert.equal(fs.existsSync(file), true, relativePath);
  const header = fs.readFileSync(file).subarray(0, 12);
  assert.equal(header.subarray(0, 4).toString('ascii'), 'RIFF', relativePath);
  assert.equal(header.subarray(8, 12).toString('ascii'), 'WEBP', relativePath);
  return file;
}

test('OpenAI legion manifest accounts for generated sheets and runtime aliases', () => {
  assert.equal(MANIFEST.provenance.provider, 'OpenAI');
  assert.equal(MANIFEST.provenance.generator, 'built-in image_gen');
  assert.match(MANIFEST.provenance.generationSession, /^[0-9a-f-]{36}$/);
  assert.equal(MANIFEST.counts.generatedEnemies, 50);
  assert.equal(MANIFEST.counts.generatedEffects, 30);
  assert.equal(MANIFEST.counts.runtimeEffectAliases, 24);
  assert.equal(MANIFEST.counts.deployedWebp, 104);
  assert.equal(Object.keys(MANIFEST.runtimeAliases).length, 24);
  assert.equal(MANIFEST.runtimePrecache.length, 76);
  assert.equal(new Set(MANIFEST.runtimePrecache).size, 76);
});

test('all fifty enemies and twenty-six gameplay effect ids resolve to real WebP files', () => {
  const legions = loadLegions();
  Object.values(legions.enemies).forEach(enemy => assertWebp(enemy.spriteSrc));
  Object.values(legions.effects).forEach(effect => assertWebp(effect.sprite.src));
  const expectedPrecache = [
    ...Object.values(legions.enemies).map(enemy => enemy.spriteSrc),
    ...Object.values(legions.effects).map(effect => effect.sprite.src)
  ].sort();
  assert.deepEqual(MANIFEST.runtimePrecache, expectedPrecache);
});

test('manifest SHA-256 provenance is intact and aliases equal their OpenAI source', () => {
  MANIFEST.assets.forEach(entry => {
    const file = assertWebp(entry.path);
    assert.equal(sha256(file), entry.sha256, entry.id);
  });
  Object.entries(MANIFEST.runtimeAliases).forEach(([aliasId, sourceId]) => {
    const alias = path.join(ROOT, 'assets/animations/enemy-legions/effects', aliasId + '.webp');
    const source = path.join(ROOT, 'assets/animations/enemy-legions/effects', sourceId + '.webp');
    assert.equal(sha256(alias), sha256(source), aliasId);
  });
});
