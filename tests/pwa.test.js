'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

function readPngSize(filePath) {
  const data = fs.readFileSync(filePath);
  assert.equal(data.toString('hex', 0, 8), '89504e470d0a1a0a', `${filePath}: signature PNG absente`);
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20)
  };
}

test('le manifeste PWA reference deux icones PNG carrees valides', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512']);
  manifest.icons.forEach(icon => {
    const iconPath = path.join(ROOT, icon.src);
    assert.ok(fs.existsSync(iconPath), `${icon.src}: fichier absent`);
    const expectedSize = Number(icon.sizes.split('x')[0]);
    assert.deepEqual(readPngSize(iconPath), { width: expectedSize, height: expectedSize });
  });
});

test('le service worker precache uniquement des fichiers locaux existants', () => {
  const source = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const urls = [...source.matchAll(/^\s*'\.\/([^']*)'/gm)].map(match => match[1]);
  const narrativeCgs = [
    'assets/cg_aria_nightwatch.png',
    'assets/cg_kira_rooftop.png',
    'assets/cg_rin_embers.png',
    'assets/cg_selene_observatory.png',
    'assets/cg_vespera_truce.png',
    'assets/cg_carmilla_library.png'
  ];
  assert.ok(urls.includes('index.html'));
  assert.ok(urls.includes('characters.v1.js'));
  assert.ok(urls.includes('assets/icons/icon-512.png'));
  urls.filter(Boolean).forEach(relativePath => {
    assert.ok(fs.existsSync(path.join(ROOT, relativePath)), `${relativePath}: précache introuvable`);
  });
  narrativeCgs.forEach(relativePath => {
    assert.ok(!urls.includes(relativePath), `${relativePath}: les CG lourdes doivent rester chargées à la demande`);
  });
  assert.ok(
    urls.every(relativePath => !relativePath.startsWith('assets/animations/')),
    'les atlas de combat lourds doivent rester chargés à la demande'
  );
  const precacheBytes = urls
    .filter(Boolean)
    .reduce((total, relativePath) => total + fs.statSync(path.join(ROOT, relativePath)).size, 0);
  assert.ok(precacheBytes < 20 * 1024 * 1024, `budget de précache excessif: ${precacheBytes} octets`);
});

test('le script PWA limite son enregistrement aux contextes surs', () => {
  const source = fs.readFileSync(path.join(ROOT, 'pwa.v4.js'), 'utf8');
  assert.match(source, /window\.isSecureContext/);
  assert.match(source, /serviceWorker\.register\('\.\/sw\.js'/);
  assert.match(source, /updateViaCache:\s*'none'/);
});

test('les actifs coeur 2.7 sont fingerprints et servis network first', () => {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const worker = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

  assert.match(index, /styles\.v8\.css/);
  assert.match(index, /audio\.v8\.js/);
  assert.match(index, /game\.v9\.js/);
  assert.match(index, /pwa\.v4\.js/);
  assert.match(worker, /CACHE_NAME = `\$\{CACHE_PREFIX\}v12`/);
  assert.match(worker, /vn-scenes\.v1\.js/);
  assert.match(worker, /characters\.v1\.js/);
  assert.match(worker, /adult-scenes\.v1\.js/);
  assert.match(worker, /infernal-city-coastline\.png/);
  assert.match(worker, /infernal-city-approach-terrain\.png/);
  assert.match(worker, /infernal-city-spawn-gate-atlas\.png/);
  assert.match(worker, /isMutableCoreAsset/);
  assert.match(worker, /if \(isMutableCoreAsset\) \{\s*event\.respondWith\(\s*fetch\(request\)/);
  assert.match(worker, /cache\.put\(request, response\.clone\(\)\)/);
});

test('les atlas et médias narratifs utilisent un cache media cache-first', () => {
  const worker = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

  assert.match(worker, /MEDIA_CACHE_NAME = `\$\{CACHE_PREFIX\}media-v2\.7`/);
  assert.match(worker, /relativePath\.startsWith\('assets\/animations\/'\)/);
  assert.match(worker, /relativePath\.startsWith\('assets\/characters\/'\)/);
  assert.match(worker, /relativePath\.startsWith\('assets\/vn\/'\)/);
  assert.match(worker, /if \(cachedResponse\) \{\s*return cachedResponse;\s*\}/);
  assert.match(worker, /if \(isRuntimeMedia\) \{/);
});
