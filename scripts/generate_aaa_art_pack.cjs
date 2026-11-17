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

function generateCitadelCoreAtlas() {
  const cell = 128;
  const cols = 8;
  const rows = 2;
  const c = new Canvas2D(cell * cols, cell * rows);

  for (let row = 0; row < rows; row++) {
    const overdrive = row === 1;
    const [pr, pg, pb] = overdrive ? [245, 158, 11] : [0, 240, 255];
    const [sr, sg, sb] = overdrive ? [255, 42, 95] : [255, 42, 95];

    for (let col = 0; col < cols; col++) {
      const t = col / cols;
      const cx = (col * cell) + (cell / 2);
      const cy = (row * cell) + (cell / 2);
      const spin = t * Math.PI * 2;
      const pulse = 1 + 0.14 * Math.sin(spin * 2);

      c.fillGlow(cx, cy, 56 * pulse, pr, pg, pb, overdrive ? 0.48 : 0.34);

      // Octagonal armored bastion base
      const oct = [];
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI / 4) + (Math.PI / 8);
        oct.push([cx + Math.cos(a) * 44, cy + Math.sin(a) * 44]);
      }
      c.fillPoly(oct, 14, 20, 38, 0.96);

      // 4 cardinal armored buttresses
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2;
        const bx = cx + Math.cos(a) * 42;
        const by = cy + Math.sin(a) * 42;
        c.drawLine(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20, bx, by, 7, 30, 41, 59, 1);
        c.fillCircle(bx, by, 4, sr, sg, sb, 0.95);
      }

      // Rotating energy conduits
      c.strokeRing(cx, cy, 36, 2.5, sr, sg, sb, 0.85, spin, spin + Math.PI * 0.7);
      c.strokeRing(cx, cy, 36, 2.5, sr, sg, sb, 0.85, spin + Math.PI, spin + Math.PI * 1.7);
      c.strokeRing(cx, cy, 26, 2, pr, pg, pb, 0.9, -spin, -spin + Math.PI * 1.3);

      // Central Haven reactor heart
      c.fillCircle(cx, cy, 18, 10, 16, 30, 1);
      c.fillGlow(cx, cy, 20 * pulse, pr, pg, pb, 0.95);
      c.fillCircle(cx, cy, 10 * pulse, pr, pg, pb, 0.95);
      c.fillCircle(cx, cy, 5, 255, 255, 255, 0.98);
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/citadel/citadel-core-atlas.png'), c.width, c.height, c.buf);
}

function generatePowerupsAtlas() {
  const cell = 128;
  const cols = 8;
  const rows = 6;
  const c = new Canvas2D(cell * cols, cell * rows);
  const themes = [
    [255, 42, 95],   // nuke
    [0, 240, 255],   // freeze
    [245, 158, 11],  // quad
    [168, 85, 247],  // magnet
    [16, 185, 129],  // invincible
    [236, 72, 153]   // frenzy
  ];

  for (let row = 0; row < rows; row++) {
    const [r, g, b] = themes[row];
    for (let col = 0; col < cols; col++) {
      const t = col / cols;
      const cx = (col * cell) + (cell / 2);
      const bob = Math.sin(t * Math.PI * 2) * 4;
      const cy = (row * cell) + (cell / 2) + bob;
      const spin = t * Math.PI * 2;

      c.fillGlow(cx, cy, 42, r, g, b, 0.45);
      c.strokeRing(cx, cy, 34, 2.4, r, g, b, 0.85, spin, spin + Math.PI * 1.15);
      c.fillCircle(cx, cy, 22, 11, 16, 30, 0.95);
      c.strokeRing(cx, cy, 22, 2.2, r, g, b, 0.95);

      if (row === 0) { // Nuke radiation tri-blade
        for (let k = 0; k < 3; k++) {
          const a = spin * 0.5 + (k * Math.PI * 2 / 3);
          c.fillPoly([
            [cx, cy],
            [cx + Math.cos(a - 0.32) * 16, cy + Math.sin(a - 0.32) * 16],
            [cx + Math.cos(a + 0.32) * 16, cy + Math.sin(a + 0.32) * 16]
          ], r, g, b, 0.95);
        }
        c.fillCircle(cx, cy, 4.5, 255, 255, 255, 1);
      } else if (row === 1) { // Chrono Frost crystal
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI / 3) + (spin * 0.25);
          c.drawLine(cx, cy, cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 2.6, 224, 242, 254, 0.95);
        }
        c.fillCircle(cx, cy, 5, r, g, b, 1);
      } else if (row === 2) { // Quad lightning bolt
        c.fillPoly([
          [cx + 3, cy - 16], [cx - 8, cy + 1], [cx, cy + 1],
          [cx - 3, cy + 16], [cx + 9, cy - 2], [cx + 1, cy - 2]
        ], r, g, b, 1);
      } else if (row === 3) { // Magnet horseshoe arc
        c.strokeRing(cx, cy + 2, 12, 4.5, r, g, b, 1, Math.PI, Math.PI * 2);
        c.drawLine(cx - 12, cy + 2, cx - 12, cy + 12, 4.5, 226, 232, 240, 1);
        c.drawLine(cx + 12, cy + 2, cx + 12, cy + 12, 4.5, 226, 232, 240, 1);
      } else if (row === 4) { // Shield hex
        c.fillPoly([
          [cx, cy - 15], [cx + 13, cy - 7], [cx + 10, cy + 8], [cx, cy + 16], [cx - 10, cy + 8], [cx - 13, cy - 7]
        ], r, g, b, 0.92);
        c.fillCircle(cx, cy, 4.5, 255, 255, 255, 0.95);
      } else { // Frenzy flame diamond
        c.fillPoly([[cx, cy - 16], [cx + 12, cy], [cx, cy + 16], [cx - 12, cy]], r, g, b, 0.95);
        c.fillCircle(cx, cy, 5, 255, 255, 255, 0.95);
      }
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/fx/powerups-atlas.png'), c.width, c.height, c.buf);
}

function generateProjectilesAtlas() {
  const cell = 128;
  const cols = 8;
  const rows = 4;
  const c = new Canvas2D(cell * cols, cell * rows);
  const colors = [
    [0, 240, 255],   // Cyan energy bolt
    [168, 85, 247],  // Plasma orb
    [255, 42, 95],   // Enemy/Boss crimson orb
    [245, 158, 11]   // Amber/Merc bolt
  ];

  for (let row = 0; row < rows; row++) {
    const [r, g, b] = colors[row];
    for (let col = 0; col < cols; col++) {
      const t = col / cols;
      const cx = (col * cell) + (cell / 2);
      const cy = (row * cell) + (cell / 2);
      const pulse = 1 + 0.18 * Math.sin(t * Math.PI * 2);
      const spin = t * Math.PI * 2;

      c.fillGlow(cx, cy, 34 * pulse, r, g, b, 0.72);
      c.strokeRing(cx, cy, 22 * pulse, 2.2, r, g, b, 0.8, spin, spin + Math.PI * 1.1);
      c.fillCircle(cx, cy, 13 * pulse, r, g, b, 0.95);
      c.fillCircle(cx, cy, 6.5, 255, 255, 255, 0.98);
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/fx/projectiles-atlas.png'), c.width, c.height, c.buf);
}

function generateHqIcons() {
  const specs = [
    { name: 'harem', color: [236, 72, 153], motif: 'heart' },
    { name: 'roster', color: [0, 240, 255], motif: 'sword' },
    { name: 'codex', color: [255, 42, 95], motif: 'crown' },
    { name: 'wardrobe', color: [244, 114, 182], motif: 'diamond' },
    { name: 'biolab', color: [16, 185, 129], motif: 'helix' },
    { name: 'mercs', color: [245, 158, 11], motif: 'crosshair' },
    { name: 'tower', color: [168, 85, 247], motif: 'spiral' },
    { name: 'studio', color: [56, 189, 248], motif: 'lens' },
    { name: 'slot', color: [250, 204, 21], motif: 'star' },
    { name: 'shop', color: [34, 211, 238], motif: 'hex' },
    { name: 'gallery', color: [251, 113, 133], motif: 'eye' },
    { name: 'adult_scenes', color: [236, 72, 153], motif: 'rose' },
    { name: 'achieve', color: [245, 158, 11], motif: 'trophy' },
    { name: 'history', color: [148, 163, 184], motif: 'bars' },
    { name: 'settings', color: [103, 232, 249], motif: 'gear' }
  ];

  const size = 96;
  const cx = 48;
  const cy = 48;

  for (const spec of specs) {
    const c = new Canvas2D(size, size);
    const [r, g, b] = spec.color;

    // Cyber-gothic octagonal badge frame
    c.fillGlow(cx, cy, 42, r, g, b, 0.28);
    const oct = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI / 4) + (Math.PI / 8);
      oct.push([cx + Math.cos(a) * 38, cy + Math.sin(a) * 38]);
    }
    c.fillPoly(oct, 12, 18, 34, 0.96);
    for (let i = 0; i < 8; i++) {
      const p1 = oct[i];
      const p2 = oct[(i + 1) % 8];
      c.drawLine(p1[0], p1[1], p2[0], p2[1], 2.2, r, g, b, 0.85);
    }

    if (spec.motif === 'heart' || spec.motif === 'rose') {
      c.fillCircle(cx - 8, cy - 4, 9, r, g, b, 0.95);
      c.fillCircle(cx + 8, cy - 4, 9, r, g, b, 0.95);
      c.fillPoly([[cx - 17, cy - 1], [cx + 17, cy - 1], [cx, cy + 17]], r, g, b, 0.95);
      c.fillCircle(cx, cy + 2, 4, 255, 255, 255, 0.85);
    } else if (spec.motif === 'sword') {
      c.drawLine(cx - 14, cy + 14, cx + 15, cy - 15, 4, 226, 232, 240, 1);
      c.drawLine(cx - 10, cy + 2, cx - 2, cy + 10, 3.5, r, g, b, 1);
      c.fillCircle(cx + 15, cy - 15, 3.5, r, g, b, 1);
    } else if (spec.motif === 'crown') {
      c.fillPoly([
        [cx - 16, cy + 10], [cx - 18, cy - 8], [cx - 7, cy + 1],
        [cx, cy - 14], [cx + 7, cy + 1], [cx + 18, cy - 8], [cx + 16, cy + 10]
      ], r, g, b, 0.95);
      c.fillCircle(cx, cy - 14, 3, 255, 255, 255, 1);
    } else if (spec.motif === 'diamond') {
      c.fillPoly([[cx, cy - 17], [cx + 15, cy], [cx, cy + 17], [cx - 15, cy]], r, g, b, 0.95);
      c.fillPoly([[cx, cy - 8], [cx + 7, cy], [cx, cy + 8], [cx - 7, cy]], 255, 255, 255, 0.7);
    } else if (spec.motif === 'helix') {
      c.strokeRing(cx, cy - 7, 9, 3, r, g, b, 0.95);
      c.strokeRing(cx, cy + 7, 9, 3, 0, 240, 255, 0.95);
      c.fillCircle(cx, cy, 4, 255, 255, 255, 0.95);
    } else if (spec.motif === 'crosshair') {
      c.strokeRing(cx, cy, 14, 2.5, r, g, b, 0.95);
      c.drawLine(cx - 20, cy, cx + 20, cy, 2, r, g, b, 0.9);
      c.drawLine(cx, cy - 20, cx, cy + 20, 2, r, g, b, 0.9);
      c.fillCircle(cx, cy, 4, 255, 255, 255, 0.95);
    } else if (spec.motif === 'spiral') {
      c.strokeRing(cx, cy, 16, 2.5, r, g, b, 0.95, 0, Math.PI * 1.4);
      c.strokeRing(cx, cy, 9, 2.5, 0, 240, 255, 0.95, Math.PI, Math.PI * 2.4);
      c.fillCircle(cx, cy, 3.5, 255, 255, 255, 1);
    } else if (spec.motif === 'lens') {
      c.strokeRing(cx, cy, 15, 3, r, g, b, 0.95);
      c.fillCircle(cx, cy, 8, r, g, b, 0.65);
      c.fillCircle(cx - 3, cy - 3, 3, 255, 255, 255, 0.95);
    } else if (spec.motif === 'star' || spec.motif === 'trophy') {
      c.fillPoly([[cx, cy - 17], [cx + 5, cy - 4], [cx + 18, cy - 4], [cx + 7, cy + 4], [cx + 11, cy + 17], [cx, cy + 9], [cx - 11, cy + 17], [cx - 7, cy + 4], [cx - 18, cy - 4], [cx - 5, cy - 4]], r, g, b, 0.95);
    } else if (spec.motif === 'hex') {
      const hex = [];
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        hex.push([cx + Math.cos(a) * 16, cy + Math.sin(a) * 16]);
      }
      c.fillPoly(hex, r, g, b, 0.9);
      c.fillCircle(cx, cy, 5, 255, 255, 255, 0.95);
    } else if (spec.motif === 'eye') {
      c.fillPoly([[cx - 18, cy], [cx, cy - 11], [cx + 18, cy], [cx, cy + 11]], r, g, b, 0.92);
      c.fillCircle(cx, cy, 6, 15, 23, 42, 1);
      c.fillCircle(cx, cy, 3, 255, 255, 255, 1);
    } else if (spec.motif === 'bars') {
      c.drawLine(cx - 12, cy + 14, cx - 12, cy + 2, 5, r, g, b, 0.95);
      c.drawLine(cx, cy + 14, cx, cy - 12, 5, 0, 240, 255, 0.95);
      c.drawLine(cx + 12, cy + 14, cx + 12, cy - 4, 5, r, g, b, 0.95);
    } else { // gear
      c.strokeRing(cx, cy, 11, 4.5, r, g, b, 0.95);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        c.drawLine(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, cx + Math.cos(a) * 18, cy + Math.sin(a) * 18, 3.5, r, g, b, 0.95);
      }
    }

    writeRgbaPng(path.join(ROOT, `assets/icons/hq/${spec.name}.png`), c.width, c.height, c.buf);
  }
}

generateCitadelCoreAtlas();
generatePowerupsAtlas();
generateProjectilesAtlas();
generateHqIcons();
console.log('Generated AAA Citadel, Powerup, Projectile atlases and 15 HQ icons.');
