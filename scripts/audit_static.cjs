'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const game = fs.readFileSync(path.join(root, 'game.v9.js'), 'utf8');

const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const jsReferences = [...game.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)]
  .map(match => match[1]);
const missingJsReferences = [...new Set(jsReferences.filter(id => !ids.includes(id)))];
const localAssets = [...new Set([
  ...[...html.matchAll(/(?:src|href)="(assets\/[^"?#]+)/g)].map(match => match[1]),
  ...[...game.matchAll(/['"](assets\/[^'"?#]+)['"]/g)].map(match => match[1])
])];
const missingAssets = localAssets.filter(relativePath => !fs.existsSync(path.join(root, relativePath)));

const result = {
  ids: ids.length,
  duplicateIds,
  jsReferences: new Set(jsReferences).size,
  missingJsReferences,
  localAssets: localAssets.length,
  missingAssets
};

console.log(JSON.stringify(result, null, 2));
if (duplicateIds.length || missingJsReferences.length || missingAssets.length) {
  process.exitCode = 1;
}
