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

  fillRoundRect(x, y, w, h, radius, r, g, b, a = 1) {
    const rClamped = Math.min(radius, w / 2, h / 2);
    for (let py = Math.floor(y); py <= Math.ceil(y + h); py++) {
      for (let px = Math.floor(x); px <= Math.ceil(x + w); px++) {
        const cx = Math.max(x + rClamped, Math.min(px, x + w - rClamped));
        const cy = Math.max(y + rClamped, Math.min(py, y + h - rClamped));
        const d = Math.hypot(px - cx, py - cy);
        if (d <= rClamped - 0.5) {
          this.blendPixel(px, py, r, g, b, a);
        } else if (d < rClamped + 0.8) {
          this.blendPixel(px, py, r, g, b, a * Math.max(0, rClamped + 0.8 - d));
        }
      }
    }
  }
}

function drawBadgeBase(c, r, g, b, cx = 32, cy = 32) {
  c.fillGlow(cx, cy, 30, r, g, b, 0.34);
  c.fillCircle(cx, cy, 24, 10, 16, 30, 0.96);
  c.strokeRing(cx, cy, 24, 2, r, g, b, 0.85);
  c.strokeRing(cx, cy, 20.5, 0.9, 255, 255, 255, 0.16);
}

function drawPetDrone(c) {
  const cx = 32;
  const cy = 32;
  drawBadgeBase(c, 236, 72, 153, cx, cy);

  // Swept cyber-chiropteran wings
  c.fillPoly([[cx - 4, cy - 2], [cx - 19, cy - 11], [cx - 15, cy + 4], [cx - 7, cy + 7]], 30, 41, 59, 0.96);
  c.fillPoly([[cx + 4, cy - 2], [cx + 19, cy - 11], [cx + 15, cy + 4], [cx + 7, cy + 7]], 30, 41, 59, 0.96);

  // Neon wing leading edges
  c.drawLine(cx - 5, cy - 2, cx - 19, cy - 11, 2.2, 236, 72, 153, 0.98);
  c.drawLine(cx - 19, cy - 11, cx - 15, cy + 4, 1.8, 244, 114, 182, 0.85);
  c.drawLine(cx + 5, cy - 2, cx + 19, cy - 11, 2.2, 236, 72, 153, 0.98);
  c.drawLine(cx + 19, cy - 11, cx + 15, cy + 4, 1.8, 244, 114, 182, 0.85);

  // Central drone chassis & sensor ears
  c.fillPoly([[cx - 4, cy - 6], [cx - 7, cy - 14], [cx - 1, cy - 8]], 236, 72, 153, 0.95);
  c.fillPoly([[cx + 4, cy - 6], [cx + 7, cy - 14], [cx + 1, cy - 8]], 236, 72, 153, 0.95);
  c.fillCircle(cx, cy + 1, 7.5, 15, 23, 42, 1);
  c.strokeRing(cx, cy + 1, 7.5, 1.6, 236, 72, 153, 0.9);

  // Glowing cyan plasma optics
  c.fillGlow(cx, cy + 1, 7, 0, 240, 255, 0.7);
  c.fillCircle(cx, cy + 1, 3.2, 0, 240, 255, 1);
  c.fillCircle(cx - 0.8, cy + 0.2, 1.2, 255, 255, 255, 0.95);
}

function drawMercRay(c) {
  const cx = 32;
  const cy = 32;
  drawBadgeBase(c, 245, 158, 11, cx, cy);

  // Crossed dual blasters behind tactical silhouette
  c.drawLine(cx - 13, cy + 13, cx + 13, cy - 9, 3, 148, 163, 184, 0.95);
  c.drawLine(cx + 13, cy + 13, cx - 13, cy - 9, 3, 148, 163, 184, 0.95);
  c.fillCircle(cx + 13, cy - 9, 2.2, 245, 158, 11, 1);
  c.fillCircle(cx - 13, cy - 9, 2.2, 245, 158, 11, 1);

  // Tactical hat / cyber-brim
  c.fillPoly([[cx - 9, cy - 6], [cx - 5, cy - 15], [cx + 5, cy - 15], [cx + 9, cy - 6]], 30, 41, 59, 0.98);
  c.drawLine(cx - 15, cy - 5, cx + 15, cy - 5, 3, 245, 158, 11, 0.98);

  // Helmet / face plate + glowing cyan visor
  c.fillRoundRect(cx - 7, cy - 4, 14, 13, 4, 15, 23, 42, 0.98);
  c.fillGlow(cx, cy + 1, 8, 0, 240, 255, 0.6);
  c.drawLine(cx - 5, cy + 1, cx + 5, cy + 1, 3.2, 0, 240, 255, 1);
  c.drawLine(cx - 3, cy + 1, cx + 3, cy + 1, 1.4, 255, 255, 255, 0.9);
}

function drawSlotEmblem(c) {
  const cx = 32;
  const cy = 32;
  drawBadgeBase(c, 245, 158, 11, cx, cy);

  // Lever on right
  c.drawLine(cx + 14, cy + 4, cx + 17, cy - 7, 2.2, 226, 232, 240, 0.95);
  c.fillCircle(cx + 17, cy - 8, 2.8, 255, 42, 95, 1);

  // Main chassis
  c.fillRoundRect(cx - 15, cy - 10, 28, 20, 4, 30, 41, 59, 0.98);
  c.drawLine(cx - 14, cy - 10, cx + 12, cy - 10, 1.8, 245, 158, 11, 0.95);
  c.drawLine(cx - 14, cy + 10, cx + 12, cy + 10, 1.8, 245, 158, 11, 0.95);

  // Three neon reels
  const reelOffsets = [-9, -1, 7];
  const reelColors = [
    [255, 42, 95],
    [0, 240, 255],
    [245, 158, 11]
  ];
  for (let i = 0; i < 3; i++) {
    const rx = cx + reelOffsets[i];
    c.fillRoundRect(rx - 3, cy - 6, 6, 12, 1.5, 10, 16, 30, 1);
    const [rr, rg, rb] = reelColors[i];
    c.fillGlow(rx, cy, 5, rr, rg, rb, 0.65);
    c.fillCircle(rx, cy, 2.1, rr, rg, rb, 1);
    c.fillCircle(rx, cy, 0.9, 255, 255, 255, 0.9);
  }
}

function drawInfinitumGate(c) {
  const cx = 32;
  const cy = 32;
  drawBadgeBase(c, 168, 85, 247, cx, cy);

  // Gate pillars
  c.drawLine(cx - 13, cy + 12, cx - 10, cy - 10, 3.2, 51, 65, 85, 0.95);
  c.drawLine(cx + 13, cy + 12, cx + 10, cy - 10, 3.2, 51, 65, 85, 0.95);
  c.drawLine(cx - 15, cy + 12, cx + 15, cy + 12, 2.4, 168, 85, 247, 0.9);

  // Concentric vortex arcs
  c.strokeRing(cx, cy - 1, 13.5, 2.2, 168, 85, 247, 0.95, 0.2, Math.PI * 1.45);
  c.strokeRing(cx, cy - 1, 9.2, 2.2, 0, 240, 255, 0.95, Math.PI * 0.9, Math.PI * 2.15);
  c.strokeRing(cx, cy - 1, 5.2, 1.8, 244, 114, 182, 0.95);

  // Singularity core
  c.fillGlow(cx, cy - 1, 9, 0, 240, 255, 0.85);
  c.fillCircle(cx, cy - 1, 2.6, 255, 255, 255, 1);
}

const UI_BADGES = [
  { id: 'pet_drone', draw: drawPetDrone },
  { id: 'merc_ray', draw: drawMercRay },
  { id: 'slot_emblem', draw: drawSlotEmblem },
  { id: 'infinitum_gate', draw: drawInfinitumGate }
];

for (const badge of UI_BADGES) {
  const c = new Canvas2D(64, 64);
  badge.draw(c);
  writeRgbaPng(path.join(ROOT, `assets/icons/ui/${badge.id}.png`), c.width, c.height, c.buf);
}

console.log(`Generated ${UI_BADGES.length} UI badges in assets/icons/ui/.`);
