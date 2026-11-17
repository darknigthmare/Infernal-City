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
        } else if (d <= radius + 0.75) {
          const edge = Math.max(0, 1 - (d - (radius - 0.5)) / 1.25);
          this.blendPixel(cx + dx, cy + dy, r, g, b, a * edge);
        }
      }
    }
  }

  strokeRing(cx, cy, radius, thickness, r, g, b, a = 1, startAngle = 0, endAngle = Math.PI * 2) {
    const outer = radius + thickness / 2;
    const inner = Math.max(0, radius - thickness / 2);
    const rCeil = Math.ceil(outer) + 1;
    let span = endAngle - startAngle;
    while (span < 0) span += Math.PI * 2;
    const full = span >= Math.PI * 1.999;

    for (let dy = -rCeil; dy <= rCeil; dy++) {
      for (let dx = -rCeil; dx <= rCeil; dx++) {
        const d = Math.hypot(dx, dy);
        if (d < inner - 1 || d > outer + 1) continue;
        if (!full) {
          let ang = Math.atan2(dy, dx) - startAngle;
          while (ang < 0) ang += Math.PI * 2;
          while (ang >= Math.PI * 2) ang -= Math.PI * 2;
          if (ang > span) continue;
        }
        const distFromMid = Math.abs(d - radius);
        const halfT = thickness / 2;
        const alpha = distFromMid <= halfT ? 1 : Math.max(0, 1 - (distFromMid - halfT));
        this.blendPixel(cx + dx, cy + dy, r, g, b, a * alpha);
      }
    }
  }

  drawLine(x1, y1, x2, y2, thickness, r, g, b, a = 1) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return;
    const steps = Math.ceil(len * 1.5);
    const rad = Math.max(0.6, thickness / 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.fillCircle(x1 + dx * t, y1 + dy * t, rad, r, g, b, a);
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
    const x0 = Math.floor(minX), x1 = Math.ceil(maxX);
    const y0 = Math.floor(minY), y1 = Math.ceil(maxY);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i];
          const [xj, yj] = points[j];
          const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-6) + xi);
          if (intersect) inside = !inside;
        }
        if (inside) this.blendPixel(x, y, r, g, b, a);
      }
    }
  }

  strokePoly(points, thickness, r, g, b, a = 1) {
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      this.drawLine(x1, y1, x2, y2, thickness, r, g, b, a);
    }
  }
}

function regularPoly(cx, cy, radius, sides, offsetAngle = 0) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = offsetAngle + (i * Math.PI * 2 / sides);
    pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  return pts;
}

// 1. Grand Citadel Bastion Fortress Atlas (2048x512, 8x2 cells of 256x256)
function generateCitadelBastionAtlas() {
  const cell = 256;
  const cols = 8;
  const rows = 2;
  const c = new Canvas2D(cell * cols, cell * rows);

  for (let row = 0; row < rows; row++) {
    const overdrive = row === 1;
    const [pr, pg, pb] = overdrive ? [245, 158, 11] : [0, 240, 255];
    const [sr, sg, sb] = overdrive ? [255, 42, 95] : [56, 189, 248];

    for (let col = 0; col < cols; col++) {
      const t = col / cols;
      const cx = (col * cell) + (cell / 2);
      const cy = (row * cell) + (cell / 2);
      const spin = t * Math.PI * 2;
      const pulse = 1 + 0.08 * Math.sin(spin * 2);

      // Ambient Haven foundation aura
      c.fillGlow(cx, cy, 120 * pulse, pr, pg, pb, overdrive ? 0.28 : 0.22);

      // Outer 8-sided fortified plaza skirt
      const outerOct = regularPoly(cx, cy, 112, 8, Math.PI / 8);
      c.fillPoly(outerOct, 10, 15, 29, 0.96);
      c.strokePoly(outerOct, 3.2, pr, pg, pb, 0.55);

      // 8 heavy armored bastion buttresses + glowing emitter pylons
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI / 4) + (Math.PI / 8);
        const ix = cx + Math.cos(a) * 62;
        const iy = cy + Math.sin(a) * 62;
        const ox = cx + Math.cos(a) * 106;
        const oy = cy + Math.sin(a) * 106;
        c.drawLine(ix, iy, ox, oy, 11, 22, 32, 54, 0.98);
        c.drawLine(ix, iy, ox, oy, 3, sr, sg, sb, 0.52);
        c.fillCircle(ox, oy, 6.5, 15, 23, 42, 1);
        c.fillGlow(ox, oy, 12, pr, pg, pb, 0.55);
        c.fillCircle(ox, oy, 3.2, pr, pg, pb, 0.95);
      }

      // Stepped inner citadel deck
      const midOct = regularPoly(cx, cy, 80, 8, 0);
      c.fillPoly(midOct, 17, 25, 46, 0.98);
      c.strokePoly(midOct, 2.2, sr, sg, sb, 0.65);

      // 4 cardinal causeway bridges / defensive ramparts
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2;
        const bx = cx + Math.cos(a) * 95;
        const by = cy + Math.sin(a) * 95;
        c.drawLine(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44, bx, by, 14, 30, 41, 59, 0.96);
        c.drawLine(cx + Math.cos(a) * 52, cy + Math.sin(a) * 52, bx, by, 2.5, pr, pg, pb, 0.85);
      }

      // Rotating energy conduits around command spire
      c.strokeRing(cx, cy, 66, 2.4, pr, pg, pb, 0.72, spin, spin + Math.PI * 0.65);
      c.strokeRing(cx, cy, 66, 2.4, pr, pg, pb, 0.72, spin + Math.PI, spin + Math.PI * 1.65);
      c.strokeRing(cx, cy, 48, 2.2, sr, sg, sb, 0.8, -spin, -spin + Math.PI * 1.15);

      // Central Heroine Command Spire Pedestal
      c.fillCircle(cx, cy, 34, 10, 16, 30, 1);
      c.strokeRing(cx, cy, 34, 2.6, pr, pg, pb, 0.92);
      c.fillGlow(cx, cy, 28 * pulse, pr, pg, pb, 0.45);
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/citadel/citadel-bastion-atlas.png'), c.width, c.height, c.buf);
}

// 2. Animated Citadel Energy Shield Dome Atlas (2048x512, 8x2 cells of 256x256)
function generateCitadelShieldAtlas() {
  const cell = 256;
  const cols = 8;
  const rows = 2;
  const c = new Canvas2D(cell * cols, cell * rows);

  for (let row = 0; row < rows; row++) {
    const alert = row === 1;
    const [pr, pg, pb] = alert ? [255, 68, 102] : [0, 240, 255];
    const [sr, sg, sb] = alert ? [245, 158, 11] : [103, 232, 249];

    for (let col = 0; col < cols; col++) {
      const t = col / cols;
      const cx = (col * cell) + (cell / 2);
      const cy = (row * cell) + (cell / 2);
      const spin = t * Math.PI * 2;
      const pulse = 1 + 0.04 * Math.sin(spin * 2);
      const rad = 116 * pulse;

      // Soft perimeter forcefield halo
      c.strokeRing(cx, cy, rad, 10, pr, pg, pb, alert ? 0.24 : 0.16);
      c.strokeRing(cx, cy, rad, 3.2, sr, sg, sb, alert ? 0.88 : 0.72);
      c.strokeRing(cx, cy, rad - 8, 1.5, pr, pg, pb, 0.42, spin, spin + Math.PI * 0.8);
      c.strokeRing(cx, cy, rad - 8, 1.5, pr, pg, pb, 0.42, spin + Math.PI, spin + Math.PI * 1.8);

      // Rotating hexagonal geodesic lattice nodes along dome rim
      const hex = regularPoly(cx, cy, rad - 4, 6, spin * 0.25);
      c.strokePoly(hex, 1.4, pr, pg, pb, 0.24);
      for (const [hx, hy] of hex) {
        c.fillGlow(hx, hy, 14, sr, sg, sb, 0.45);
        c.fillCircle(hx, hy, 3, 255, 255, 255, 0.88);
      }

      // Orbiting defense chevrons
      for (let k = 0; k < 4; k++) {
        const a = spin + (k * Math.PI / 2);
        c.strokeRing(cx, cy, rad + 4, 2.2, sr, sg, sb, 0.65, a - 0.18, a + 0.18);
      }
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/citadel/citadel-shield-atlas.png'), c.width, c.height, c.buf);
}

// 3. Animated Map Props Atlas (1024x512, 8x4 cells of 128x128)
// Row 0: Plasma Brazier, Row 1: Haven Radar Pylon, Row 2: Shield Obelisk, Row 3: Searchlight Turret
function generateAnimatedPropsAtlas() {
  const cell = 128;
  const cols = 8;
  const rows = 4;
  const c = new Canvas2D(cell * cols, cell * rows);

  for (let col = 0; col < cols; col++) {
    const t = col / cols;
    const phase = t * Math.PI * 2;

    // Row 0: Gothic Plasma Brazier
    {
      const cx = (col * cell) + 64;
      const cy = 64;
      const flicker = 1 + 0.18 * Math.sin(phase * 2);
      c.fillGlow(cx, cy, 44 * flicker, 255, 90, 42, 0.42);
      c.fillPoly(regularPoly(cx, cy + 4, 26, 6, Math.PI / 6), 24, 32, 52, 0.96);
      c.strokePoly(regularPoly(cx, cy + 4, 26, 6, Math.PI / 6), 2, 245, 158, 11, 0.72);
      c.fillCircle(cx, cy - 2, 14 * flicker, 255, 100, 45, 0.92);
      c.fillCircle(cx + Math.sin(phase) * 3, cy - 8, 8 * flicker, 255, 220, 120, 0.95);
      // Rising sparks
      const sy = cy - 16 - ((t * 24) % 24);
      c.fillCircle(cx + Math.cos(phase * 2) * 8, sy, 2.4, 255, 200, 90, 0.85);
    }

    // Row 1: Haven Radar / Comms Pylon
    {
      const cx = (col * cell) + 64;
      const cy = cell + 64;
      c.fillGlow(cx, cy, 42, 0, 240, 255, 0.25);
      c.fillPoly(regularPoly(cx, cy, 24, 8, Math.PI / 8), 15, 23, 42, 0.96);
      c.strokeRing(cx, cy, 30, 1.8, 0, 240, 255, 0.35 + 0.35 * Math.sin(phase), 0, Math.PI * 2);
      const sx = cx + Math.cos(phase) * 26;
      const sy = cy + Math.sin(phase) * 26;
      c.drawLine(cx, cy, sx, sy, 3.2, 0, 240, 255, 0.95);
      c.fillCircle(cx, cy, 7, 103, 232, 249, 0.96);
    }

    // Row 2: Shield Relay Obelisk
    {
      const cx = (col * cell) + 64;
      const cy = (2 * cell) + 64;
      const bob = Math.sin(phase) * 4;
      c.fillGlow(cx, cy, 44, 56, 189, 248, 0.35);
      c.fillPoly(regularPoly(cx, cy + 6, 24, 4, 0), 18, 28, 48, 0.96);
      c.strokeRing(cx, cy, 32, 2, 56, 189, 248, 0.72, phase, phase + Math.PI * 1.1);
      c.fillPoly([
        [cx, cy - 22 + bob],
        [cx + 12, cy + bob],
        [cx, cy + 16 + bob],
        [cx - 12, cy + bob]
      ], 0, 240, 255, 0.92);
      c.fillCircle(cx, cy - 2 + bob, 4, 255, 255, 255, 0.96);
    }

    // Row 3: Siege Searchlight Tower
    {
      const cx = (col * cell) + 64;
      const cy = (3 * cell) + 64;
      const sweep = Math.sin(phase) * 0.7;
      c.fillPoly(regularPoly(cx, cy, 22, 6, 0), 20, 28, 45, 0.96);
      c.strokePoly(regularPoly(cx, cy, 22, 6, 0), 1.8, 148, 163, 184, 0.6);
      const bx = cx + Math.cos(sweep) * 44;
      const by = cy + Math.sin(sweep) * 44;
      c.drawLine(cx, cy, bx, by, 14, 186, 230, 253, 0.18);
      c.drawLine(cx, cy, bx, by, 4, 224, 242, 254, 0.65);
      c.fillCircle(cx, cy, 8, 224, 242, 254, 0.95);
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/environment/props-animated-atlas.png'), c.width, c.height, c.buf);
}

// 4. Outer-Arena Architectural Structures Atlas (1024x512, 4x2 cells of 256x256)
function generateOuterCityStructuresAtlas() {
  const cell = 256;
  const cols = 4;
  const rows = 2;
  const c = new Canvas2D(cell * cols, cell * rows);

  for (let col = 0; col < cols; col++) {
    // Row 0: Haven Friendly Outer Bastion / City Architecture
    {
      const cx = (col * cell) + 128;
      const cy = 128;
      c.fillGlow(cx, cy, 98, 0, 240, 255, 0.2);
      const base = regularPoly(cx, cy, 92, 6 + (col % 2) * 2, Math.PI / 8);
      c.fillPoly(base, 12, 19, 36, 0.95);
      c.strokePoly(base, 3, 56, 189, 248, 0.55);

      const roof = regularPoly(cx, cy - 8, 56, 4 + col, Math.PI / 4);
      c.fillPoly(roof, 24, 37, 64, 0.98);
      c.strokePoly(roof, 2, 0, 240, 255, 0.78);

      // Glowing beacon windows
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI / 2) + (col * 0.35);
        const wx = cx + Math.cos(a) * 68;
        const wy = cy + Math.sin(a) * 68;
        c.fillCircle(wx, wy, 5, 0, 240, 255, 0.85);
      }
      c.fillCircle(cx, cy - 8, 11, 103, 232, 249, 0.92);
    }

    // Row 1: Infernal Outer Siege Monolith / Ruined Spire
    {
      const cx = (col * cell) + 128;
      const cy = cell + 128;
      c.fillGlow(cx, cy, 96, 255, 42, 95, 0.24);
      const jagged = [];
      const spikes = 8 + (col % 2) * 2;
      for (let i = 0; i < spikes; i++) {
        const a = i * Math.PI * 2 / spikes;
        const r = i % 2 === 0 ? 96 : 56;
        jagged.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      c.fillPoly(jagged, 24, 12, 24, 0.95);
      c.strokePoly(jagged, 2.6, 255, 42, 95, 0.72);
      c.fillGlow(cx, cy, 34, 245, 158, 11, 0.45);
      c.fillCircle(cx, cy, 12, 255, 90, 60, 0.94);
    }
  }

  writeRgbaPng(path.join(ROOT, 'assets/animations/environment/outer-city-structures-atlas.png'), c.width, c.height, c.buf);
}

generateCitadelBastionAtlas();
generateCitadelShieldAtlas();
generateAnimatedPropsAtlas();
generateOuterCityStructuresAtlas();
console.log('Generated citadel-bastion-atlas.png, citadel-shield-atlas.png, props-animated-atlas.png, outer-city-structures-atlas.png');
