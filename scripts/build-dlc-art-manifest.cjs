'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { specs, prefix } = require('./dlc-art-spec.cjs');
const root = path.resolve(__dirname, '..');
const qaIndex = process.argv.indexOf('--qa');
if (qaIndex < 0 || !process.argv[qaIndex + 1]) {
  throw new Error('An explicit --qa review.json with SHA-256-bound visual approvals is required.');
}
const review = JSON.parse(fs.readFileSync(path.resolve(process.argv[qaIndex + 1]), 'utf8'));
const approvals = new Map();
for (const item of review.approved || []) {
  if (!specs[item.key] || !/^[a-f0-9]{64}$/.test(item.sha256 || '') || approvals.has(item.key)) {
    throw new Error(`Invalid or duplicate visual approval: ${item.key}`);
  }
  approvals.set(item.key, item.sha256);
}
const assets = Object.create(null);
const missing = [];
const pending = [];
for (const [key, spec] of Object.entries(specs)) {
  const file = path.join(root, spec.src);
  if (!fs.existsSync(file)) {
    if (approvals.has(key)) throw new Error(`Reviewed file is missing: ${spec.src}`);
    missing.push(key); continue;
  }
  const bytes = fs.readFileSync(file);
  if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`Not a native PNG: ${spec.src}`);
  }
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width < spec.columns || height < spec.rows || (!spec.opaque && ![4, 6].includes(bytes[25]))) {
    throw new Error(`Invalid dimensions or alpha channel: ${spec.src}`);
  }
  if (!spec.opaque && Math.abs((width / spec.columns) / (height / spec.rows) - 1) > 0.03) {
    throw new Error(`Sprite cells must be square: ${spec.src}`);
  }
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (!approvals.has(key)) { pending.push(key); continue; }
  if (approvals.get(key) !== sha256) throw new Error(`Visual approval hash mismatch: ${spec.src}`);
  assets[key] = { ...spec, width, height, bytes: bytes.length, sha256, approved: true,
    nativeBytesPreserved: true, source: 'built-in image_gen' };
}
if (process.argv.includes('--require-complete') && (missing.length || pending.length)) {
  throw new Error(`Catalogue incomplete: ${missing.length} missing, ${pending.length} awaiting visual review.`);
}
const payload = { version: 1, prefix, expected: Object.keys(specs).length,
  approved: Object.keys(assets).length, missing, pending, assets };
const script = '// Generated only from explicit, hash-bound visual approvals.\n'
  + '(function (root) {\n  \'use strict\';\n  root.INFERNAL_CITY_DLC_ART = '
  + JSON.stringify(payload, null, 2) + ';\n})(typeof window !== \'undefined\' ? window : globalThis);\n';
fs.writeFileSync(path.join(root, 'dlc-art.v1.js'), script);
fs.mkdirSync(path.join(root, prefix), { recursive: true });
fs.writeFileSync(path.join(root, prefix, 'manifest.json'), JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ expected: payload.expected, approved: payload.approved,
  missing: missing.length, pending: pending.length }, null, 2));
