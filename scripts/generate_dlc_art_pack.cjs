'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.resolve(__dirname, '..');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
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
        if (d <= radius - 0.5) this.blendPixel(cx + dx, cy + dy, r, g, b, a);
        else if (d <= radius + 0.75) this.blendPixel(cx + dx, cy + dy, r, g, b, a * Math.max(0, 1 - (d - (radius - 0.5)) / 1.25));
      }
    }
  }
  strokeRing(cx, cy, radius, thickness, r, g, b, a = 1) {
    const outer = radius + thickness / 2;
    const inner = Math.max(0, radius - thickness / 2);
    const rCeil = Math.ceil(outer) + 1;
    for (let dy = -rCeil; dy <= rCeil; dy++) {
      for (let dx = -rCeil; dx <= rCeil; dx++) {
        const d = Math.hypot(dx, dy);
        if (d < inner - 1 || d > outer + 1) continue;
        const dist = Math.abs(d - radius);
        const halfT = thickness / 2;
        const alpha = dist <= halfT ? 1 : Math.max(0, 1 - (dist - halfT));
        this.blendPixel(cx + dx, cy + dy, r, g, b, a * alpha);
      }
    }
  }
  fillPoly(points, r, g, b, a = 1) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of points) {
      if (px < minX) minX = px; if (py < minY) minY = py;
      if (px > maxX) maxX = px; if (py > maxY) maxY = py;
    }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i], [xj, yj] = points[j];
          if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-6) + xi)) inside = !inside;
        }
        if (inside) this.blendPixel(x, y, r, g, b, a);
      }
    }
  }
}

function regularPoly(cx, cy, radius, sides, offset = 0) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = offset + (i * Math.PI * 2 / sides);
    pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  return pts;
}

const BIOME_SPECS = [
  { id: 'astral', file: 'assets/dlc/biome-astral-atlas.png', base: [49, 46, 129], accent: [245, 158, 11], glow: [254, 243, 199], sides: 8 },
  { id: 'abyss', file: 'assets/dlc/biome-abyss-atlas.png', base: [4, 47, 46], accent: [45, 212, 191], glow: [168, 85, 247], sides: 6 },
  { id: 'flora', file: 'assets/dlc/biome-flora-atlas.png', base: [6, 78, 59], accent: [52, 211, 153], glow: [225, 29, 72], sides: 5 },
  { id: 'desert', file: 'assets/dlc/biome-desert-atlas.png', base: [15, 23, 42], accent: [234, 88, 12], glow: [253, 230, 138], sides: 4 },
  { id: 'arctic', file: 'assets/dlc/biome-arctic-atlas.png', base: [51, 65, 85], accent: [74, 222, 128], glow: [232, 121, 249], sides: 6 },
  { id: 'brass', file: 'assets/dlc/biome-brass-atlas.png', base: [136, 19, 55], accent: [217, 119, 6], glow: [251, 191, 36], sides: 8 }
];

for (const b of BIOME_SPECS) {
  const cell = 256;
  const cols = 4;
  const c = new Canvas2D(cell * cols, cell);
  for (let col = 0; col < cols; col++) {
    const cx = col * cell + 128;
    const cy = 128;
    const phase = (col / cols) * Math.PI * 2;
    const pulse = 1 + 0.08 * Math.sin(phase);
    c.fillGlow(cx, cy, 108 * pulse, b.glow[0], b.glow[1], b.glow[2], 0.28);
    c.fillPoly(regularPoly(cx, cy, 86, b.sides, phase * 0.15), b.base[0], b.base[1], b.base[2], 0.95);
    c.strokeRing(cx, cy, 90, 3.2, b.accent[0], b.accent[1], b.accent[2], 0.82);
    c.fillPoly(regularPoly(cx, cy, 48, b.sides, -phase * 0.25), b.accent[0], b.accent[1], b.accent[2], 0.78);
    c.fillGlow(cx, cy, 34 * pulse, b.glow[0], b.glow[1], b.glow[2], 0.75);
    c.fillCircle(cx, cy, 12, 255, 255, 255, 0.94);
  }
  writeRgbaPng(path.join(ROOT, b.file), c.width, c.height, c.buf);
}

// Generate DLC Crest Icon (128x128)
{
  const c = new Canvas2D(128, 128);
  c.fillGlow(64, 64, 56, 245, 158, 11, 0.38);
  c.fillPoly(regularPoly(64, 64, 48, 6, Math.PI / 6), 15, 23, 42, 0.96);
  c.strokeRing(64, 64, 48, 3.5, 245, 158, 11, 0.92);
  c.fillPoly(regularPoly(64, 64, 28, 4, 0), 0, 240, 255, 0.9);
  c.fillCircle(64, 64, 10, 255, 255, 255, 0.98);
  writeRgbaPng(path.join(ROOT, 'assets/icons/ui/dlc_crest.png'), 128, 128, c.buf);
}

console.log('Generated 6 DLC biome atlases and dlc_crest.png');
