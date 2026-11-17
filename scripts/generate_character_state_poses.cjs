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
  const compressed = zlib.deflateSync(raw, { level: 7 });
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
const cols = 8;
const rows = 6;
const c = new Canvas2D(cell * cols, cell * rows);

for (let col = 0; col < cols; col++) {
  const t = col / cols;
  const spin = t * Math.PI * 2;
  const cx = (col * cell) + 64;

  // Row 0: Intro / Insertion Pose Aura (Cyan tactical teleportation sigil)
  {
    const cy = 64;
    const rad = 26 + Math.sin(spin) * 12;
    c.fillGlow(cx, cy, 44, 0, 240, 255, 0.25);
    c.strokeRing(cx, cy, rad, 2.4, 0, 240, 255, 0.85, spin, spin + Math.PI * 1.4);
    for (let k = 0; k < 4; k++) {
      const lx = cx + Math.cos(spin + k * Math.PI / 2) * 32;
      c.drawLine(lx, cy + 34, lx, cy - 34, 2, 103, 232, 249, 0.55);
    }
  }

  // Row 1: Special / Ultimate Pose Aura (Blazing Valkyrie energy wings)
  {
    const cy = cell + 64;
    const spread = 34 + Math.sin(spin) * 8;
    c.fillGlow(cx, cy, 48, 245, 158, 11, 0.35);
    c.fillPoly([[cx - 10, cy], [cx - spread, cy - 30], [cx - spread * 0.7, cy + 16]], 245, 158, 11, 0.45);
    c.fillPoly([[cx + 10, cy], [cx + spread, cy - 30], [cx + spread * 0.7, cy + 16]], 245, 158, 11, 0.45);
    c.strokeRing(cx, cy, 38, 2.5, 254, 243, 199, 0.75, -spin, -spin + Math.PI * 1.3);
  }

  // Row 2: Boss Phase Shift Pose Aura (Crimson-Violet Sovereign eruption)
  {
    const cy = (2 * cell) + 64;
    const r = 22 + t * 34;
    const alpha = Math.max(0.2, 1 - t * 0.7);
    c.fillGlow(cx, cy, 46, 255, 42, 95, 0.35 * alpha);
    c.strokeRing(cx, cy, r, 3.2, 255, 42, 95, 0.9 * alpha);
    c.strokeRing(cx, cy, r * 0.65, 2, 168, 85, 247, 0.85 * alpha, spin, spin + Math.PI * 1.5);
  }

  // Row 3: Victory / Outro Pose Aura (Golden-Cyan triumphant halo + rising motes)
  {
    const cy = (3 * cell) + 64;
    c.fillGlow(cx, cy - 12, 42, 250, 204, 21, 0.28);
    c.strokeRing(cx, cy - 26, 24, 2.6, 250, 204, 21, 0.88);
    for (let m = 0; m < 6; m++) {
      const mx = cx + Math.sin(spin + m * 1.1) * 28;
      const my = cy + 28 - ((t * 56 + m * 11) % 56);
      c.fillCircle(mx, my, 2.5, 254, 243, 199, 0.85);
    }
  }

  // Row 4: Defeat / Retreat Pose Aura (Crimson ash & fractured shield ring)
  {
    const cy = (4 * cell) + 64;
    c.fillGlow(cx, cy + 10, 38, 239, 68, 68, 0.24);
    for (let seg = 0; seg < 4; seg++) {
      const a = spin * 0.4 + seg * (Math.PI / 2);
      c.strokeRing(cx, cy + 6, 30 + t * 8, 2.2, 239, 68, 68, 0.72 * (1 - t * 0.5), a, a + 0.65);
    }
  }

  // Row 5: Consensual Intimate / Afterglow Aura (Warm rose-gold bokeh & petals)
  {
    const cy = (5 * cell) + 64;
    c.fillGlow(cx, cy, 46, 236, 72, 153, 0.28);
    for (let p = 0; p < 7; p++) {
      const angle = spin + (p * Math.PI * 2 / 7);
      const px = cx + Math.cos(angle) * (24 + Math.sin(spin * 2 + p) * 8);
      const py = cy + Math.sin(angle) * (20 + Math.cos(spin * 2 + p) * 6);
      c.fillGlow(px, py, 9, 244, 114, 182, 0.65);
      c.fillCircle(px, py, 2.8, 253, 242, 248, 0.88);
    }
  }
}

writeRgbaPng(path.join(ROOT, 'assets/animations/smooth/character-states-fx-atlas.png'), c.width, c.height, c.buf);
console.log('Generated 6-pose 8-frame character state aura atlas: assets/animations/smooth/character-states-fx-atlas.png');
