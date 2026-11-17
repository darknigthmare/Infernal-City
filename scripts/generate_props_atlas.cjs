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
        if (d <= radius - 0.5) {
          this.blendPixel(cx + dx, cy + dy, r, g, b, a);
        } else if (d < radius + 0.8) {
          const edge = Math.max(0, Math.min(1, radius + 0.8 - d));
          this.blendPixel(cx + dx, cy + dy, r, g, b, a * edge);
        }
      }
    }
  }

  strokeRing(cx, cy, radius, thickness, r, g, b, a = 1) {
    const outer = radius + (thickness / 2) + 1;
    const inner = Math.max(0, radius - (thickness / 2) - 1);
    const oCeil = Math.ceil(outer);
    for (let dy = -oCeil; dy <= oCeil; dy++) {
      for (let dx = -oCeil; dx <= oCeil; dx++) {
        const d = Math.hypot(dx, dy);
        if (d < inner || d > outer) continue;
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
    const x0 = Math.floor(minX), y0 = Math.floor(minY), x1 = Math.ceil(maxX), y1 = Math.ceil(maxY);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i], [xj, yj] = points[j];
          const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-6) + xi);
          if (intersect) inside = !inside;
        }
        if (inside) this.blendPixel(x, y, r, g, b, a);
      }
    }
  }
}

const cell = 128;
const c = new Canvas2D(cell * 4, cell);

// Col 0: Cyber Relay Pylon
{
  const cx = 64, cy = 64;
  c.fillGlow(cx, cy - 8, 40, 0, 240, 255, 0.38);
  c.fillCircle(cx, cy + 20, 24, 15, 23, 42, 0.95);
  c.strokeRing(cx, cy + 20, 24, 2, 0, 240, 255, 0.75);
  c.fillPoly([[cx - 10, cy + 20], [cx - 5, cy - 28], [cx + 5, cy - 28], [cx + 10, cy + 20]], 30, 41, 59, 1);
  c.drawLine(cx, cy + 16, cx, cy - 28, 3, 0, 240, 255, 0.9);
  c.fillCircle(cx, cy - 30, 7, 0, 240, 255, 0.95);
  c.fillCircle(cx, cy - 30, 3, 255, 255, 255, 1);
}

// Col 1: Gothic Brazier
{
  const cx = cell + 64, cy = 64;
  c.fillGlow(cx, cy - 10, 44, 255, 85, 42, 0.45);
  c.fillCircle(cx, cy + 14, 22, 20, 24, 38, 0.96);
  c.strokeRing(cx, cy + 14, 22, 2.2, 255, 42, 95, 0.8);
  c.fillPoly([[cx, cy - 28], [cx + 14, cy + 2], [cx + 8, cy + 14], [cx - 8, cy + 14], [cx - 14, cy + 2]], 255, 85, 42, 0.95);
  c.fillPoly([[cx, cy - 14], [cx + 7, cy + 4], [cx, cy + 12], [cx - 7, cy + 4]], 254, 243, 199, 0.95);
}

// Col 2: Bastion Armored Pillar
{
  const cx = (cell * 2) + 64, cy = 64;
  c.fillGlow(cx, cy, 34, 168, 85, 247, 0.3);
  c.fillPoly([[cx - 22, cy + 24], [cx - 16, cy - 24], [cx + 16, cy - 24], [cx + 22, cy + 24]], 18, 25, 44, 0.98);
  c.drawLine(cx - 16, cy - 24, cx + 16, cy - 24, 3, 168, 85, 247, 0.9);
  c.drawLine(cx - 12, cy, cx + 12, cy, 3, 0, 240, 255, 0.85);
}

// Col 3: Fallen Legion Obelisk
{
  const cx = (cell * 3) + 64, cy = 64;
  c.fillGlow(cx, cy - 6, 38, 255, 42, 95, 0.35);
  c.fillPoly([[cx - 14, cy + 26], [cx - 7, cy - 22], [cx, cy - 34], [cx + 7, cy - 22], [cx + 14, cy + 26]], 15, 23, 42, 0.98);
  c.drawLine(cx, cy - 22, cx, cy + 18, 2.5, 255, 42, 95, 0.9);
  c.fillCircle(cx, cy - 8, 4, 255, 42, 95, 0.95);
}

writeRgbaPng(path.join(ROOT, 'assets/animations/environment/props-atlas.png'), c.width, c.height, c.buf);
console.log('Generated battlefield props atlas: assets/animations/environment/props-atlas.png');
