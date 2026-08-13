'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

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
  assert.equal(manifest.version, '3.0.0');
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
  assert.ok(
    urls.every(relativePath => !relativePath.startsWith('assets/vn/cg/eros-time/')),
    'les 60 CG Eros Time doivent rester chargées à la demande'
  );
  const precacheBytes = urls
    .filter(Boolean)
    .reduce((total, relativePath) => total + fs.statSync(path.join(ROOT, relativePath)).size, 0);
  assert.ok(precacheBytes < 20 * 1024 * 1024, `budget de précache excessif: ${precacheBytes} octets`);
});

test('le script PWA limite son enregistrement aux contextes surs', () => {
  const source = fs.readFileSync(path.join(ROOT, 'pwa.v4.js'), 'utf8');
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(source, /window\.isSecureContext/);
  assert.match(source, /serviceWorker\.register\('\.\/sw\.js'/);
  assert.match(source, /updateViaCache:\s*'none'/);
  assert.match(source, /SKIP_WAITING/);
  assert.match(index, /id="pwa-status-banner"[^>]*role="status"/);
  assert.match(index, /id="pwa-status-title"/);
  assert.match(index, /id="pwa-status-message"/);
  assert.match(index, /id="btn-install-update"/);
});

test('les actifs coeur 3.0 sont servis network first et le pack terrain reste hors ligne', () => {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const worker = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

  assert.match(index, /styles\.v8\.css/);
  assert.match(index, /audio\.v8\.js/);
  assert.match(index, /game\.v9\.js/);
  assert.match(index, /pwa\.v4\.js/);
  assert.match(worker, /RELEASE_VERSION = '3\.0\.0'/);
  assert.match(worker, /CACHE_NAME = `\$\{CACHE_PREFIX\}core-\$\{RELEASE_VERSION\}`/);
  assert.match(worker, /vn-scenes\.v1\.js/);
  assert.match(worker, /characters\.v1\.js/);
  assert.match(worker, /adult-scenes\.v1\.js/);
  assert.match(worker, /relativePath\.startsWith\('assets\/environment\/'\)/);
  assert.doesNotMatch(worker.match(/const OPTIONAL_PRECACHE_URLS = \[[\s\S]*?\];/)?.[0] || '', /cover\.jpg|approach-terrain|spawn-gate-atlas/);
  assert.match(worker, /isMutableCoreAsset/);
  assert.match(worker, /if \(isMutableCoreAsset\) \{\s*event\.respondWith\(\s*fetch\(request\)/);
  assert.match(worker, /cache\.put\(request, response\.clone\(\)\)/);
});

test('les atlas et médias narratifs utilisent un cache media cache-first', () => {
  const worker = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

  assert.match(worker, /MEDIA_CACHE_NAME = `\$\{CACHE_PREFIX\}media-\$\{RELEASE_VERSION\}`/);
  assert.match(worker, /MAX_MEDIA_CACHE_ENTRIES = 320/);
  assert.match(worker, /relativePath\.startsWith\('assets\/animations\/'\)/);
  assert.match(worker, /relativePath\.startsWith\('assets\/characters\/'\)/);
  assert.match(worker, /relativePath\.startsWith\('assets\/vn\/'\)/);
  assert.match(
    worker,
    /if \(cachedResponse\) \{[\s\S]*?touchRuntimeMedia\(cache, request, cachedResponse\.clone\(\)\)[\s\S]*?return cachedResponse;\s*\}/
  );
  assert.match(worker, /if \(isRuntimeMedia\) \{/);
});

function loadWorkerForTests(cache) {
  const source = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const listeners = {};
  const warnings = [];
  let skipWaitingCalls = 0;
  const sandbox = {
    URL,
    Promise,
    console: {
      warn(...args) { warnings.push(args); },
      error: console.error,
      log: console.log
    },
    caches: {
      open: async () => cache,
      keys: async () => [],
      delete: async () => true,
      match: async () => null
    },
    fetch: async () => { throw new Error('network disabled in unit test'); },
    self: {
      registration: { scope: 'https://example.test/' },
      location: { origin: 'https://example.test' },
      clients: { claim: async () => {} },
      addEventListener(type, listener) { listeners[type] = listener; },
      skipWaiting: async () => { skipWaitingCalls++; }
    }
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(
    `${source}\n;globalThis.__SW_TEST__ = { precacheRelease, trimMediaCache, ESSENTIAL_PRECACHE_URLS, OPTIONAL_PRECACHE_URLS };`,
    context,
    { filename: 'sw.js' }
  );
  return {
    listeners,
    warnings,
    getSkipWaitingCalls: () => skipWaitingCalls,
    hook: context.__SW_TEST__
  };
}

test('l installation exige le coeur mais tolere un actif optionnel indisponible', async () => {
  let essentialUrls = [];
  const optionalUrls = [];
  const cache = {
    async addAll(urls) { essentialUrls = Array.from(urls); },
    async add(url) {
      optionalUrls.push(url);
      if (url === './manifest.webmanifest') throw new Error('optional asset unavailable');
    }
  };
  const worker = loadWorkerForTests(cache);
  let installPromise;
  worker.listeners.install({ waitUntil(promise) { installPromise = promise; } });

  await assert.doesNotReject(installPromise);
  assert.ok(essentialUrls.includes('./index.html'));
  assert.ok(essentialUrls.includes('./game.v9.js'));
  assert.ok(optionalUrls.includes('./manifest.webmanifest'));
  assert.equal(worker.warnings.length, 1);
  assert.equal(worker.getSkipWaitingCalls(), 0);
  worker.listeners.message({ data: { type: 'SKIP_WAITING' } });
  await Promise.resolve();
  assert.equal(worker.getSkipWaitingCalls(), 1);
});

test('le plafond media supprime les entrees les moins recentes', async () => {
  const deleted = [];
  const cache = {
    async keys() { return ['oldest', 'older', 'recent', 'newest']; },
    async delete(key) { deleted.push(key); return true; }
  };
  const worker = loadWorkerForTests(cache);

  assert.equal(await worker.hook.trimMediaCache(cache, 2), 2);
  assert.deepEqual(deleted, ['oldest', 'older']);
});

test('vercel applique des headers de securite et de cache compatibles avec le jeu statique', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.equal(config.headers.length, 3);
  assert.equal(config.headers[0].source, '/(.*)');
  const headers = Object.fromEntries(
    config.headers[0].headers.map(header => [header.key.toLowerCase(), header.value])
  );
  assert.match(headers['content-security-policy'], /script-src 'self'/);
  assert.doesNotMatch(headers['content-security-policy'], /script-src[^;]*'unsafe-inline'/);
  assert.match(headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['referrer-policy'], 'no-referrer');
  assert.match(headers['permissions-policy'], /camera=\(\)/);
  const assetHeaders = Object.fromEntries(
    config.headers.find(rule => rule.source === '/assets/(.*)').headers
      .map(header => [header.key.toLowerCase(), header.value])
  );
  assert.match(assetHeaders['cache-control'], /max-age=0/);
  assert.match(assetHeaders['cache-control'], /must-revalidate/);
  assert.doesNotMatch(assetHeaders['cache-control'], /immutable/);
  const workerHeaders = Object.fromEntries(
    config.headers.find(rule => rule.source === '/sw.js').headers
      .map(header => [header.key.toLowerCase(), header.value])
  );
  assert.match(workerHeaders['cache-control'], /max-age=0/);
  assert.equal(workerHeaders['service-worker-allowed'], '/');
});

test('github actions execute le controle complet avec des permissions minimales', () => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /uses: actions\/checkout@v4/);
  assert.match(workflow, /uses: actions\/setup-node@v4/);
  assert.match(workflow, /node-version: 22/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /run: npm run check/);
  assert.match(workflow, /run: npx playwright install --with-deps chromium/);
  assert.match(workflow, /run: npm run test:e2e/);
  assert.doesNotMatch(workflow, /VERCEL_TOKEN|secrets\./);
});

test('vercel exclut les masters PNG remplaces par les decors WebP', () => {
  const ignore = fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8');
  assert.match(ignore, /^assets\/environment\/\*\.png$/m);
  const game = fs.readFileSync(path.join(ROOT, 'game.v9.js'), 'utf8');
  const expansion = fs.readFileSync(path.join(ROOT, 'expansion.v1.js'), 'utf8');
  assert.doesNotMatch(game, /assets\/environment\/.+\.png/);
  assert.doesNotMatch(expansion, /assets\/environment\/.+\.png/);
});
