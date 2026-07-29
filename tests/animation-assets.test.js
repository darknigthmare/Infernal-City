'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'assets', 'animations', 'atlas-manifest.json');

function readPngHeader(filePath) {
  const data = fs.readFileSync(filePath);
  assert.equal(data.toString('hex', 0, 8), '89504e470d0a1a0a', `${filePath}: signature PNG absente`);
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data[25]
  };
}

test('le manifeste couvre toutes les defenses, ennemis et heros jouables', () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const rows = category => manifest.atlases
    .filter(atlas => atlas.category === category)
    .flatMap(atlas => atlas.rows)
    .filter(Boolean);

  assert.equal(manifest.generator, 'OpenAI ImageGen integrated tool');
  assert.deepEqual(manifest.columns.towers, ['idle', 'charge', 'fire', 'cooldown']);
  assert.deepEqual(manifest.columns.gates, ['dormant', 'warning', 'open', 'cooldown']);
  assert.equal(new Set(rows('towers')).size, 20);
  assert.equal(new Set(rows('enemies')).size, 7);
  assert.equal(new Set(rows('heroes')).size, 6);
  assert.deepEqual(rows('gates'), ['north', 'east', 'south', 'west']);
});

test('chaque planche est un PNG RGBA carre et le sol OpenAI existe', () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  manifest.atlases.forEach(atlas => {
    const filePath = path.join(ROOT, atlas.src);
    assert.ok(fs.existsSync(filePath), `${atlas.src}: planche absente`);
    const header = readPngHeader(filePath);
    assert.deepEqual(
      { width: header.width, height: header.height },
      { width: 1024, height: 1024 },
      `${atlas.src}: les cellules doivent rester exactement a 256 px`
    );
    assert.equal(header.colorType, 6, `${atlas.src}: transparence RGBA absente`);
  });

  const floorPath = path.join(ROOT, manifest.floor.src);
  assert.ok(fs.existsSync(floorPath), `${manifest.floor.src}: sol absent`);
  const floor = readPngHeader(floorPath);
  assert.deepEqual({ width: floor.width, height: floor.height }, { width: 1024, height: 1024 });

  const approachPath = path.join(ROOT, manifest.approachTerrain.src);
  assert.ok(fs.existsSync(approachPath), `${manifest.approachTerrain.src}: terrain d'approche absent`);
  const approach = readPngHeader(approachPath);
  assert.deepEqual({ width: approach.width, height: approach.height }, { width: 1536, height: 1024 });
});

test('le runtime et le mode hors ligne referencent les nouveaux assets', () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const game = fs.readFileSync(path.join(ROOT, 'game.v9.js'), 'utf8');
  const worker = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

  assert.match(game, /preloadBattleSprites\(\)/);
  assert.match(game, /drawInfernalFloor\(w, h\)/);
  assert.match(game, /drawAtlasFrame\(/);
  manifest.atlases.map(atlas => atlas.src).forEach(src => {
    assert.ok(game.includes(src), `${src}: absent du runtime`);
  });
  [manifest.floor.src, manifest.approachTerrain.src].forEach(src => {
    assert.ok(game.includes(src), `${src}: absent du runtime`);
    assert.ok(worker.includes(src), `${src}: absent du precache coeur`);
  });
  assert.match(worker, /relativePath\.startsWith\('assets\/animations\/'\)/);
  assert.match(worker, /serveRuntimeMedia\(request, event\)/);
});
