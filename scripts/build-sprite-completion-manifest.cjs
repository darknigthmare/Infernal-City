'use strict';

// Review whitelist: --qa review.json, where review.json contains
// { approved: [{ key, sha256 }], rejected: [key, ...] }.
// Optional --scales scales.json contains { assets: [{ key, sha256, drawScale }] }.
// Scale measurements never approve artwork, and apply only to their exact hash.
// No image bytes are transformed. Presence never implies visual approval.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const rootPath = path.resolve(__dirname, '..');
const qaIndex = process.argv.indexOf('--qa');
const scaleIndex = process.argv.indexOf('--scales');
if (process.argv.includes('--approve-existing')) {
  throw new Error('Use --qa <review.json> with an explicit, SHA-256-bound approval list; presence is not visual approval.');
}
if (qaIndex >= 0 && !process.argv[qaIndex + 1]) throw new Error('--qa requires a JSON review file.');
if (scaleIndex >= 0 && !process.argv[scaleIndex + 1]) throw new Error('--scales requires a JSON measurement file.');
const qaPath = qaIndex >= 0 ? path.resolve(process.argv[qaIndex + 1]) : null;
const qa = qaPath ? JSON.parse(fs.readFileSync(qaPath, 'utf8')) : {};
const scaleReview = scaleIndex >= 0
  ? JSON.parse(fs.readFileSync(path.resolve(process.argv[scaleIndex + 1]), 'utf8')) : {};
const measuredScales = new Map();
for (const entry of scaleReview.assets || []) {
  if (!entry || typeof entry.key !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')
    || !Number.isFinite(entry.drawScale) || entry.drawScale < 0.5 || entry.drawScale > 2.5) {
    throw new Error('Every scale measurement requires a key, exact SHA-256 and finite drawScale between 0.5 and 2.5.');
  }
  if (measuredScales.has(entry.key)) throw new Error(`Duplicate scale measurement: ${entry.key}`);
  measuredScales.set(entry.key, entry);
}
const reviewedHashes = new Map();
for (const entry of qa.approved || []) {
  if (!entry || typeof entry.key !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')) {
    throw new Error('Every QA approval requires a key and exact SHA-256.');
  }
  if (reviewedHashes.has(entry.key)) throw new Error(`Duplicate QA approval: ${entry.key}`);
  reviewedHashes.set(entry.key, entry.sha256);
}
const rejected = new Set(qa.rejected || []);
const window = {
  INFERNAL_CITY_ENEMY_LEGIONS: require('../enemy-legions.v1.js')
};
const context = vm.createContext({ window, console });
for (const file of ['sprite-completion-approved.v1.js', 'sprite-completion.v1.js']) {
  vm.runInContext(fs.readFileSync(path.join(rootPath, file), 'utf8'), context, { filename: file });
}
const registry = window.INFERNAL_CITY_SPRITE_COMPLETION;
for (const key of [...reviewedHashes.keys(), ...rejected, ...measuredScales.keys()]) {
  if (!registry.assets[key]) throw new Error(`Unknown completion asset in QA review: ${key}`);
  if (registry.assets[key].preparedOnly && measuredScales.has(key) && measuredScales.get(key).drawScale !== 1) {
    throw new Error(`Prepared-only asset cannot receive combat scaling: ${key}`);
  }
}
const prior = window.INFERNAL_CITY_SPRITE_COMPLETION_APPROVED?.assets || {};
const approved = Object.create(null);
const present = [];
const missing = [];
for (const [key, spec] of Object.entries(registry.assets)) {
  const file = path.join(rootPath, spec.src);
  if (!fs.existsSync(file)) {
    if (reviewedHashes.has(key)) throw new Error(`Reviewed asset is missing: ${spec.src}`);
    if (measuredScales.has(key)) throw new Error(`Measured asset is missing: ${spec.src}`);
    missing.push(key); continue;
  }
  const bytes = fs.readFileSync(file);
  if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`${spec.src}: invalid PNG`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width < spec.columns || height < spec.rows || ![4, 6].includes(bytes[25])) {
    throw new Error(`${spec.src}: invalid dimensions or missing alpha channel`);
  }
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (reviewedHashes.has(key) && reviewedHashes.get(key) !== sha256) {
    throw new Error(`QA hash mismatch: ${spec.src}; review the current native file before enabling it.`);
  }
  const measured = measuredScales.get(key);
  if (measured && measured.sha256 !== sha256) {
    throw new Error(`Scale hash mismatch: ${spec.src}; remeasure the current native file.`);
  }
  const previousScale = prior[key]?.sha256 === sha256 && prior[key]?.drawScaleSha256 === sha256
    ? prior[key].drawScale : 1;
  const requestedScale = measured?.drawScale ?? previousScale;
  const drawScale = !spec.preparedOnly && Number.isFinite(requestedScale) && requestedScale >= 0.5 && requestedScale <= 2.5
    ? requestedScale : 1;
  const reviewed = !rejected.has(key) && (reviewedHashes.has(key)
    || (qa.replace !== true && prior[key]?.approved === true && prior[key].sha256 === sha256));
  const entry = { key, src: spec.src, width, height, columns: spec.columns, rows: spec.rows,
    states: spec.states, frameCount: spec.columns * spec.rows, bytes: bytes.length, sha256,
    sequenceFrames: spec.sequenceFrames || null, fps: spec.fps, preparedOnly: spec.preparedOnly === true,
    drawScale, drawScaleSha256: sha256,
    approved: reviewed, source: 'built-in image_gen', nativeBytesPreserved: true };
  present.push(entry);
  if (reviewed) approved[key] = entry;
}
const payload = { schemaVersion: 1, assets: approved };
const script = '// Generated by scripts/build-sprite-completion-manifest.cjs after asset review.\n'
  + '(function (root) {\n  \'use strict\';\n  root.INFERNAL_CITY_SPRITE_COMPLETION_APPROVED = '
  + JSON.stringify(payload, null, 2) + ';\n})(typeof window !== \'undefined\' ? window : globalThis);\n';
fs.writeFileSync(path.join(rootPath, 'sprite-completion-approved.v1.js'), script);
const outputDirectory = path.join(rootPath, registry.prefix);
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, 'manifest.json'), JSON.stringify({
  schemaVersion: 1, expected: Object.keys(registry.assets).length,
  present: present.length, approved: Object.keys(approved).length,
  requestedFrames: Object.values(registry.assets).reduce((total, spec) => total + spec.columns * spec.rows, 0),
  presentFrames: present.reduce((total, entry) => total + entry.frameCount, 0),
  files: present, missing, rejected: [...rejected].sort()
}, null, 2) + '\n');
console.log(JSON.stringify({ expected: Object.keys(registry.assets).length, present: present.length,
  approved: Object.keys(approved).length, missing: missing.length }, null, 2));
