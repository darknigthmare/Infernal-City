'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.resolve(__dirname, '..');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function writeRgbaPng(filePath, width, height, rgba) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(filePath, png);
}

class Canvas2D {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buf = Buffer.alloc(width * height * 4);
  }

  blendPixel(x, y, r, g, b, a) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height || a <= 0) return;
    const idx = ((iy * this.width) + ix) * 4;
    const sa = Math.min(1, Math.max(0, a));
    const da = this.buf[idx + 3] / 255;
    const outA = sa + da * (1 - sa);
    if (outA <= 0) return;
    this.buf[idx] = Math.min(255, Math.round(((r * sa) + (this.buf[idx] * da * (1 - sa))) / outA));
    this.buf[idx + 1] = Math.min(255, Math.round(((g * sa) + (this.buf[idx + 1] * da * (1 - sa))) / outA));
    this.buf[idx + 2] = Math.min(255, Math.round(((b * sa) + (this.buf[idx + 2] * da * (1 - sa))) / outA));
    this.buf[idx + 3] = Math.min(255, Math.round(outA * 255));
  }

  fillGlow(cx, cy, radius, r, g, b, maxAlpha = 1) {
    const rCeil = Math.ceil(radius);
    for (let dy = -rCeil; dy <= rCeil; dy++) {
      for (let dx = -rCeil; dx <= rCeil; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > radius) continue;
        const t = 1 - (d / radius);
        this.blendPixel(cx + dx, cy + dy, r, g, b, maxAlpha * t * t);
      }
    }
  }

  fillCircle(cx, cy, radius, r, g, b, a = 1) {
    const rCeil = Math.ceil(radius) + 1;
    for (let dy = -rCeil; dy <= rCeil; dy++) {
      for (let dx = -rCeil; dx <= rCeil; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= radius - 0.5) {
          this.blendPixel(cx + dx, cy + dy, r, g, b, a);
        } else if (d < radius + 0.8) {
          const edge = Math.max(0, Math.min(1, radius + 0.8 - d));
          this.blendPixel(cx + dx, cy + dy, r, g, b, a * edge);
        }
      }
    }
  }

  strokeRing(cx, cy, radius, thickness, r, g, b, a = 1, startAngle = 0, endAngle = Math.PI * 2) {
    const outer = radius + (thickness / 2) + 1;
    const inner = Math.max(0, radius - (thickness / 2) - 1);
    const oCeil = Math.ceil(outer);
    const norm = ang => {
      let res = ang % (Math.PI * 2);
      if (res < 0) res += Math.PI * 2;
      return res;
    };
    const full = Math.abs(endAngle - startAngle) >= (Math.PI * 2 - 0.001);
    const s = norm(startAngle);
    const e = norm(endAngle);
    for (let dy = -oCeil; dy <= oCeil; dy++) {
      for (let dx = -oCeil; dx <= oCeil; dx++) {
        const d = Math.hypot(dx, dy);
        if (d < inner || d > outer) continue;
        if (!full) {
          const ang = norm(Math.atan2(dy, dx));
          const inArc = s <= e ? (ang >= s && ang <= e) : (ang >= s || ang <= e);
          if (!inArc) continue;
        }
        const distFromMid = Math.abs(d - radius);
        const half = thickness / 2;
        const alpha = distFromMid <= half ? a : a * Math.max(0, 1 - (distFromMid - half));
        if (alpha > 0) this.blendPixel(cx + dx, cy + dy, r, g, b, alpha);
      }
    }
  }

  drawLine(x0, y0, x1, y1, thickness, r, g, b, a = 1) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.fillCircle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, thickness / 2, r, g, b, a);
    }
  }

  fillPoly(points, r, g, b, a = 1) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of points) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    const x0 = Math.floor(minX);
    const y0 = Math.floor(minY);
    const x1 = Math.ceil(maxX);
    const y1 = Math.ceil(maxY);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i];
          const [xj, yj] = points[j];
          const intersect = ((yi > y) !== (yj > y))
            && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-6) + xi);
          if (intersect) inside = !inside;
        }
        if (inside) this.blendPixel(x, y, r, g, b, a);
      }
    }
  }
}

function generateMercHunterAtlas() {
  const cell = 128;
  const cols = 8;
  const rows = 2;
  const c = new Canvas2D(cell * cols, cell * rows);

  for (let row = 0; row < rows; row++) {
    const firing = row === 1;
    for (let col = 0; col < cols; col++) {
      const t = col / cols;
      const cx = (col * cell) + (cell / 2);
      const bob = Math.sin(t * Math.PI * 2) * 3.5;
      const cy = (row * cell) + (cell / 2) + bob;
      const flamePulse = 1 + 0.28 * Math.sin(t * Math.PI * 4);

      c.fillGlow(cx - 26, cy - 11, (firing ? 22 : 16) * flamePulse, 245, 158, 11, 0.78);
      c.fillGlow(cx - 26, cy + 11, (firing ? 22 : 16) * flamePulse, 245, 158, 11, 0.78);
      c.fillCircle(cx - 24, cy - 11, 4.5 * flamePulse, 254, 243, 199, 0.95);
      c.fillCircle(cx - 24, cy + 11, 4.5 * flamePulse, 254, 243, 199, 0.95);

      c.fillPoly([[cx - 18, cy - 30], [cx + 8, cy - 12], [cx + 18, cy - 6], [cx - 22, cy - 8]], 30, 41, 59, 0.98);
      c.fillPoly([[cx - 18, cy + 30], [cx + 8, cy + 12], [cx + 18, cy + 6], [cx - 22, cy + 8]], 30, 41, 59, 0.98);

      c.drawLine(cx - 18, cy - 28, cx + 10, cy - 11, 2.2, 245, 158, 11, 0.9);
      c.drawLine(cx - 18, cy + 28, cx + 10, cy + 11, 2.2, 245, 158, 11, 0.9);

      c.fillPoly([[cx - 22, cy - 10], [cx + 12, cy - 12], [cx + 32, cy], [cx + 12, cy + 12], [cx - 22, cy + 10]], 15, 23, 42, 1);
      c.fillPoly([[cx - 4, cy - 6], [cx + 18, cy - 4], [cx + 24, cy], [cx + 18, cy + 4], [cx - 4, cy + 6]], 0, 240, 255, 0.85);
      c.fillGlow(cx + 8, cy, 12, 0, 240, 255, 0.35);

      c.drawLine(cx + 16, cy - 9, cx + 38, cy - 9, 3.2, 148, 163, 184, 1);
      c.drawLine(cx + 16, cy + 9, cx + 38, cy + 9, 3.2, 148, 163, 184, 1);

      if (firing) {
        const muzzlePhase = (col % 2 === 0) ? 1 : 0.65;
        c.fillGlow(cx + 42, cy - 9, 16 * muzzlePhase, 245, 158, 11, 0.95);
        c.fillGlow(cx + 42, cy + 9, 16 * (1.2 - muzzlePhase * 0.4), 245, 158, 11, 0.95);
        c.fillCircle(cx + 41, cy - 9, 5 * muzzlePhase, 255, 255, 255, 0.95);
        c.fillCircle(cx + 41, cy + 9, 4, 255, 255, 255, 0.9);
      }
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/companions/merc-hunter-atlas.png'), c.width, c.height, c.buf);
}

function generatePetDroneAtlas() {
  const cell = 128;
  const cols = 8;
  const rows = 2;
  const c = new Canvas2D(cell * cols, cell * rows);

  for (let row = 0; row < rows; row++) {
    const attacking = row === 1;
    for (let col = 0; col < cols; col++) {
      const t = col / cols;
      const flap = Math.sin(t * Math.PI * 2);
      const cx = (col * cell) + (cell / 2);
      const cy = (row * cell) + (cell / 2) + (flap * -3);
      const wingSpread = 34 + (flap * 6);
      const wingTipY = cy - 14 + (flap * 18);

      c.fillGlow(cx, cy, attacking ? 36 : 26, 236, 72, 153, attacking ? 0.55 : 0.35);

      c.fillPoly([
        [cx - 6, cy - 3],
        [cx - wingSpread, wingTipY],
        [cx - wingSpread * 0.72, cy + 12 + (flap * 6)],
        [cx - 12, cy + 8]
      ], 131, 24, 67, 0.92);
      c.fillPoly([
        [cx + 6, cy - 3],
        [cx + wingSpread, wingTipY],
        [cx + wingSpread * 0.72, cy + 12 + (flap * 6)],
        [cx + 12, cy + 8]
      ], 131, 24, 67, 0.92);

      c.drawLine(cx - 6, cy - 3, cx - wingSpread, wingTipY, 2.2, 244, 114, 182, 0.95);
      c.drawLine(cx + 6, cy - 3, cx + wingSpread, wingTipY, 2.2, 244, 114, 182, 0.95);

      c.fillCircle(cx, cy, 13, 15, 23, 42, 1);
      c.strokeRing(cx, cy, 13, 2, 236, 72, 153, 0.95);
      c.fillCircle(cx, cy, attacking ? 7.5 : 5.5, 244, 114, 182, 0.95);
      c.fillCircle(cx, cy, 3, 255, 255, 255, 0.95);

      c.fillPoly([[cx - 9, cy - 8], [cx - 15, cy - 22], [cx - 3, cy - 12]], 30, 41, 59, 1);
      c.fillPoly([[cx + 9, cy - 8], [cx + 15, cy - 22], [cx + 3, cy - 12]], 30, 41, 59, 1);

      c.fillCircle(cx - 4.5, cy - 2, 2, 0, 240, 255, 1);
      c.fillCircle(cx + 4.5, cy - 2, 2, 0, 240, 255, 1);

      if (attacking) {
        c.strokeRing(cx, cy, 20 + (col % 3) * 4, 2, 0, 240, 255, 0.75);
      }
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/companions/pet-drone-atlas.png'), c.width, c.height, c.buf);
}

function generateLootCratesAtlas() {
  const cell = 128;
  const cols = 8;
  const rows = 2;
  const c = new Canvas2D(cell * cols, cell * rows);

  for (let row = 0; row < rows; row++) {
    const isRed = row === 1;
    const [pr, pg, pb] = isRed ? [255, 42, 95] : [0, 240, 255];
    const [sr, sg, sb] = isRed ? [245, 158, 11] : [168, 85, 247];

    for (let col = 0; col < cols; col++) {
      const t = col / cols;
      const cx = (col * cell) + (cell / 2);
      const bob = Math.sin(t * Math.PI * 2) * 4;
      const cy = (row * cell) + (cell / 2) + bob;
      const spin = Math.cos(t * Math.PI * 2);
      const halfW = 14 + Math.abs(spin) * 10;

      c.fillGlow(cx, cy, 34, pr, pg, pb, 0.42);
      c.strokeRing(cx, cy, 28, 2, sr, sg, sb, 0.65, t * Math.PI * 2, t * Math.PI * 2 + Math.PI * 1.2);

      c.fillPoly([
        [cx, cy - 22],
        [cx + halfW, cy - 8],
        [cx + halfW, cy + 12],
        [cx, cy + 24],
        [cx - halfW, cy + 12],
        [cx - halfW, cy - 8]
      ], 15, 23, 42, 0.98);

      c.drawLine(cx - halfW + 3, cy + 1, cx + halfW - 3, cy + 1, 3, pr, pg, pb, 0.95);
      c.drawLine(cx, cy - 20, cx, cy + 22, 2.5, pr, pg, pb, 0.9);
      c.fillCircle(cx, cy + 1, 5.5, 255, 255, 255, 0.95);
      c.fillGlow(cx, cy + 1, 14, pr, pg, pb, 0.85);
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/fx/loot-crates-atlas.png'), c.width, c.height, c.buf);
}

function generateCombatFxAtlas() {
  const cell = 128;
  const cols = 8;
  const rows = 4;
  const c = new Canvas2D(cell * cols, cell * rows);

  for (let col = 0; col < cols; col++) {
    const t = col / (cols - 1);
    const cx = (col * cell) + (cell / 2);
    const cy = cell / 2;
    const scale = 1 - (t * 0.65);
    const alpha = 1 - (t * 0.85);
    c.fillGlow(cx, cy, 36 * scale, 0, 240, 255, alpha * 0.9);
    c.fillCircle(cx, cy, 12 * scale, 255, 255, 255, alpha);
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI * 2 * k / 6) + (t * 0.35);
      const r1 = 8 + (t * 24);
      const r2 = r1 + 14 * scale;
      c.drawLine(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, 2.5, 255, 255, 255, alpha);
    }
  }

  for (let col = 0; col < cols; col++) {
    const t = col / (cols - 1);
    const cx = (col * cell) + (cell / 2);
    const cy = cell + (cell / 2);
    const radius = 14 + (t * 42);
    const alpha = Math.max(0, 1 - (t * 0.95));
    c.fillGlow(cx, cy, radius, 168, 85, 247, alpha * 0.85);
    c.fillGlow(cx, cy, radius * 0.65, 255, 42, 95, alpha * 0.9);
    c.strokeRing(cx, cy, radius * 0.9, 3.5 * (1 - t * 0.5), 245, 158, 11, alpha);
    if (t < 0.45) c.fillCircle(cx, cy, 16 * (1 - t * 2), 255, 255, 255, 1 - t * 2);
  }

  for (let col = 0; col < cols; col++) {
    const angleOffset = (col / cols) * (Math.PI / 2);
    const cx = (col * cell) + (cell / 2);
    const cy = (2 * cell) + (cell / 2);
    c.fillGlow(cx, cy, 34, 0, 240, 255, 0.4);
    for (let tooth = 0; tooth < 8; tooth++) {
      const a = angleOffset + (tooth * Math.PI / 4);
      const a2 = a + 0.24;
      c.fillPoly([
        [cx + Math.cos(a) * 18, cy + Math.sin(a) * 18],
        [cx + Math.cos(a + 0.1) * 34, cy + Math.sin(a + 0.1) * 34],
        [cx + Math.cos(a2) * 20, cy + Math.sin(a2) * 20]
      ], 226, 232, 240, 0.96);
    }
    c.fillCircle(cx, cy, 20, 15, 23, 42, 1);
    c.strokeRing(cx, cy, 18, 2.5, 0, 240, 255, 0.95);
    c.fillCircle(cx, cy, 6, 0, 240, 255, 0.95);
  }

  for (let col = 0; col < cols; col++) {
    const t = col / (cols - 1);
    const cx = (col * cell) + (cell / 2);
    const cy = (3 * cell) + (cell / 2);
    const r = 12 + (t * 44);
    const a = 1 - (t * 0.9);
    c.strokeRing(cx, cy, r, 4, 0, 240, 255, a);
    c.strokeRing(cx, cy, r * 0.65, 2, 103, 232, 249, a * 0.8);
    c.fillGlow(cx, cy, r * 0.5, 0, 240, 255, a * 0.35);
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/fx/combat-fx-atlas.png'), c.width, c.height, c.buf);
}

generateMercHunterAtlas();
generatePetDroneAtlas();
generateLootCratesAtlas();
generateCombatFxAtlas();
console.log('Generated 4 smooth 8-frame RGBA sprite sheets.');
