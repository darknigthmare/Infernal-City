'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'game.v9.js'), 'utf8');

test('atlas renderer honours asset-specific row and column metadata', () => {
  assert.match(source, /Number\(spriteData\?\.columns\)/);
  assert.match(source, /Number\(spriteData\?\.rows\)/);
  assert.match(source, /sourceWidth \/ columns/);
  assert.match(source, /sourceHeight \/ rows/);
});
