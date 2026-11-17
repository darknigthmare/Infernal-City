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

const TOWER_SPECS = [
  { id: 'vulcan_turret', color: [0, 240, 255], motif: 'gatling' },
  { id: 'plasma_mortar', color: [168, 85, 247], motif: 'orb' },
  { id: 'railgun_pylon', color: [56, 189, 248], motif: 'rail' },
  { id: 'flame_trap', color: [255, 85, 42], motif: 'flame' },
  { id: 'tesla_spire', color: [96, 165, 250], motif: 'bolt' },
  { id: 'cryo_cannon', color: [103, 232, 249], motif: 'crystal' },
  { id: 'acid_trap', color: [16, 185, 129], motif: 'drop' },
  { id: 'laser_drone', color: [56, 189, 248], motif: 'drone' },
  { id: 'landmine', color: [245, 158, 11], motif: 'mine' },
  { id: 'aegis_barrier', color: [34, 211, 238], motif: 'shield' },
  { id: 'gravity_well', color: [168, 85, 247], motif: 'vortex' },
  { id: 'missile_pod', color: [249, 115, 22], motif: 'missile' },
  { id: 'bio_siphon', color: [236, 72, 153], motif: 'needle' },
  { id: 'magnet_drone', color: [192, 132, 252], motif: 'magnet' },
  { id: 'sawblade_turret', color: [226, 232, 240], motif: 'saw' },
  { id: 'emp_tower', color: [0, 240, 255], motif: 'pulse' },
  { id: 'orbital_beam', color: [250, 204, 21], motif: 'orbital' },
  { id: 'napalm_mine', color: [255, 42, 95], motif: 'napalm' },
  { id: 'blood_shrine', color: [236, 72, 153], motif: 'chalice' },
  { id: 'sonic_cannon', color: [245, 158, 11], motif: 'wave' }
];

const WEAPON_SPECS = [
  { id: 'vulcan', color: [0, 240, 255], motif: 'gatling' },
  { id: 'plasma', color: [168, 85, 247], motif: 'orb' },
  { id: 'railgun', color: [56, 189, 248], motif: 'rail' },
  { id: 'flamethrower', color: [255, 42, 95], motif: 'flame' }
];

function drawMotif(c, spec, cx = 32, cy = 32) {
  const [r, g, b] = spec.color;
  c.fillGlow(cx, cy, 28, r, g, b, 0.3);
  c.fillCircle(cx, cy, 23, 12, 18, 34, 0.94);
  c.strokeRing(cx, cy, 23, 1.8, r, g, b, 0.78);

  switch (spec.motif) {
    case 'gatling':
      c.drawLine(cx - 10, cy + 8, cx + 12, cy - 10, 3.2, 226, 232, 240, 1);
      c.drawLine(cx - 6, cy + 12, cx + 15, cy - 5, 3.2, r, g, b, 1);
      c.fillCircle(cx - 10, cy + 10, 5.5, 30, 41, 59, 1);
      break;
    case 'orb':
      c.fillGlow(cx, cy, 14, r, g, b, 0.9);
      c.fillCircle(cx, cy, 9, r, g, b, 0.95);
      c.fillCircle(cx - 2, cy - 2, 3.5, 255, 255, 255, 0.95);
      break;
    case 'rail':
      c.drawLine(cx - 14, cy + 12, cx + 14, cy - 12, 3.5, 226, 232, 240, 1);
      c.drawLine(cx - 11, cy + 15, cx + 17, cy - 9, 2, r, g, b, 0.95);
      c.fillCircle(cx + 15, cy - 13, 4, 255, 255, 255, 0.95);
      break;
    case 'flame':
      c.fillPoly([[cx, cy - 15], [cx + 10, cy + 2], [cx + 6, cy + 13], [cx - 6, cy + 13], [cx - 10, cy + 2]], r, g, b, 0.95);
      c.fillPoly([[cx, cy - 5], [cx + 5, cy + 5], [cx, cy + 11], [cx - 5, cy + 5]], 254, 243, 199, 0.95);
      break;
    case 'bolt':
      c.fillPoly([[cx + 3, cy - 14], [cx - 7, cy + 1], [cx, cy + 1], [cx - 3, cy + 14], [cx + 8, cy - 1], [cx + 1, cy - 1]], r, g, b, 1);
      break;
    case 'crystal':
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3;
        c.drawLine(cx, cy, cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, 2.2, 224, 242, 254, 0.95);
      }
      c.fillCircle(cx, cy, 4, r, g, b, 1);
      break;
    case 'drop':
      c.fillPoly([[cx, cy - 14], [cx + 10, cy + 4], [cx, cy + 14], [cx - 10, cy + 4]], r, g, b, 0.95);
      c.fillCircle(cx - 2, cy + 4, 3, 255, 255, 255, 0.75);
      break;
    case 'drone':
      c.drawLine(cx - 14, cy - 6, cx + 14, cy - 6, 3, r, g, b, 0.95);
      c.fillCircle(cx, cy + 2, 7, 226, 232, 240, 0.95);
      c.fillCircle(cx, cy + 2, 3, r, g, b, 1);
      break;
    case 'mine':
    case 'napalm':
      c.fillCircle(cx, cy, 10, 30, 41, 59, 1);
      c.strokeRing(cx, cy, 10, 2, r, g, b, 0.95);
      c.fillCircle(cx, cy, 4.5, r, g, b, 1);
      break;
    case 'shield':
      c.fillPoly([[cx, cy - 14], [cx + 12, cy - 6], [cx + 9, cy + 8], [cx, cy + 15], [cx - 9, cy + 8], [cx - 12, cy - 6]], r, g, b, 0.9);
      c.fillCircle(cx, cy, 3.5, 255, 255, 255, 0.9);
      break;
    case 'vortex':
      c.strokeRing(cx, cy, 13, 2.4, r, g, b, 0.95, 0, Math.PI * 1.3);
      c.strokeRing(cx, cy, 7, 2.4, 0, 240, 255, 0.95, Math.PI, Math.PI * 2.3);
      c.fillCircle(cx, cy, 2.5, 255, 255, 255, 1);
      break;
    case 'missile':
      c.fillPoly([[cx + 12, cy - 12], [cx + 4, cy + 6], [cx - 6, cy - 4]], r, g, b, 0.98);
      c.drawLine(cx - 11, cy + 11, cx - 2, cy + 2, 3, 254, 243, 199, 0.95);
      break;
    case 'needle':
      c.drawLine(cx - 11, cy + 11, cx + 11, cy - 11, 3.5, r, g, b, 0.95);
      c.fillCircle(cx - 8, cy + 8, 5, 244, 114, 182, 0.95);
      break;
    case 'magnet':
      c.strokeRing(cx, cy + 1, 10, 3.8, r, g, b, 1, Math.PI, Math.PI * 2);
      c.drawLine(cx - 10, cy + 1, cx - 10, cy + 10, 3.8, 226, 232, 240, 1);
      c.drawLine(cx + 10, cy + 1, cx + 10, cy + 10, 3.8, 226, 232, 240, 1);
      break;
    case 'saw':
      for (let t = 0; t < 8; t++) {
        const a = t * Math.PI / 4;
        c.drawLine(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, 2.4, r, g, b, 0.95);
      }
      c.fillCircle(cx, cy, 8, 15, 23, 42, 1);
      c.strokeRing(cx, cy, 7, 2, 0, 240, 255, 0.95);
      break;
    case 'pulse':
      c.strokeRing(cx, cy, 13, 2, r, g, b, 0.8);
      c.strokeRing(cx, cy, 7, 2, r, g, b, 0.95);
      c.fillCircle(cx, cy, 3, 255, 255, 255, 1);
      break;
    case 'orbital':
      c.drawLine(cx, cy - 15, cx, cy + 15, 4, r, g, b, 0.95);
      c.drawLine(cx, cy - 15, cx, cy + 15, 1.8, 255, 255, 255, 0.95);
      c.strokeRing(cx, cy + 10, 9, 1.8, r, g, b, 0.85);
      break;
    case 'chalice':
      c.fillPoly([[cx - 9, cy - 10], [cx + 9, cy - 10], [cx + 4, cy + 2], [cx - 4, cy + 2]], r, g, b, 0.95);
      c.drawLine(cx, cy + 2, cx, cy + 12, 3, r, g, b, 0.95);
      c.drawLine(cx - 7, cy + 12, cx + 7, cy + 12, 3, r, g, b, 0.95);
      break;
    case 'wave':
      c.strokeRing(cx - 4, cy, 8, 2.2, r, g, b, 0.95, -Math.PI * 0.4, Math.PI * 0.4);
      c.strokeRing(cx - 4, cy, 14, 2.2, r, g, b, 0.8, -Math.PI * 0.4, Math.PI * 0.4);
      c.fillCircle(cx - 7, cy, 3.5, 255, 255, 255, 0.95);
      break;
  }
}

for (const spec of TOWER_SPECS) {
  const c = new Canvas2D(64, 64);
  drawMotif(c, spec);
  writeRgbaPng(path.join(ROOT, `assets/icons/towers/${spec.id}.png`), c.width, c.height, c.buf);
}

for (const spec of WEAPON_SPECS) {
  const c = new Canvas2D(64, 64);
  drawMotif(c, spec);
  writeRgbaPng(path.join(ROOT, `assets/icons/weapons/${spec.id}.png`), c.width, c.height, c.buf);
}

console.log('Generated 20 tower icons and 4 weapon icons.');
