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

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function readRgbaPng(filePath) {
  const data = fs.readFileSync(filePath);
  if (data.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error(`Invalid PNG signature: ${filePath}`);
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  const idatChunks = [];
  while (offset < data.length) {
    const len = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    const payload = data.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = payload.readUInt32BE(0);
      height = payload.readUInt32BE(4);
      colorType = payload[9];
    } else if (type === 'IDAT') {
      idatChunks.push(payload);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + len;
  }
  if (colorType !== 6) throw new Error(`Expected RGBA PNG (colorType 6), got ${colorType} in ${filePath}`);
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = 4;
  const stride = width * bpp;
  const rgba = Buffer.alloc(width * height * bpp);

  for (let y = 0; y < height; y++) {
    const rowIn = y * (stride + 1);
    const filter = raw[rowIn];
    const rowOut = y * stride;
    for (let x = 0; x < stride; x++) {
      const val = raw[rowIn + 1 + x];
      const a = x >= bpp ? rgba[rowOut + x - bpp] : 0;
      const b = y > 0 ? rgba[rowOut - stride + x] : 0;
      const c = (x >= bpp && y > 0) ? rgba[rowOut - stride + x - bpp] : 0;
      let recon = val;
      if (filter === 1) recon = (val + a) & 0xff;
      else if (filter === 2) recon = (val + b) & 0xff;
      else if (filter === 3) recon = (val + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) recon = (val + paeth(a, b, c)) & 0xff;
      rgba[rowOut + x] = recon;
    }
  }
  return { width, height, rgba };
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
  const compressed = zlib.deflateSync(raw, { level: 6 });
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(filePath, png);
}

function sampleCellBilinear(src, srcW, cellW, cellH, col, row, u, v) {
  const fx = Math.max(0, Math.min(cellW - 1, u));
  const fy = Math.max(0, Math.min(cellH - 1, v));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(cellW - 1, x0 + 1);
  const y1 = Math.min(cellH - 1, y0 + 1);
  const wx = fx - x0;
  const wy = fy - y0;
  const ox = col * cellW;
  const oy = row * cellH;

  const idx00 = (((oy + y0) * srcW) + (ox + x0)) * 4;
  const idx10 = (((oy + y0) * srcW) + (ox + x1)) * 4;
  const idx01 = (((oy + y1) * srcW) + (ox + x0)) * 4;
  const idx11 = (((oy + y1) * srcW) + (ox + x1)) * 4;

  const w00 = (1 - wx) * (1 - wy);
  const w10 = wx * (1 - wy);
  const w01 = (1 - wx) * wy;
  const w11 = wx * wy;

  return [
    src[idx00] * w00 + src[idx10] * w10 + src[idx01] * w01 + src[idx11] * w11,
    src[idx00 + 1] * w00 + src[idx10 + 1] * w10 + src[idx01 + 1] * w01 + src[idx11 + 1] * w11,
    src[idx00 + 2] * w00 + src[idx10 + 2] * w10 + src[idx01 + 2] * w01 + src[idx11 + 2] * w11,
    src[idx00 + 3] * w00 + src[idx10 + 3] * w10 + src[idx01 + 3] * w01 + src[idx11 + 3] * w11
  ];
}

function upscale4x4To16x4(srcRelPath, dstRelPath, options = {}) {
  const { width, height, rgba } = readRgbaPng(path.join(ROOT, srcRelPath));
  const srcCols = 4;
  const rows = 4;
  const srcCellW = width / srcCols;   // 256
  const srcCellH = height / rows;     // 256
  const dstCols = 16;
  const dstCell = 128;                // 2048x512 crisp 16-frame strip per row
  const dstW = dstCols * dstCell;
  const dstH = rows * dstCell;
  const out = Buffer.alloc(dstW * dstH * 4);
  const scaleRatio = srcCellW / dstCell;

  for (let row = 0; row < rows; row++) {
    for (let dstCol = 0; dstCol < dstCols; dstCol++) {
      // Map 16 frames smoothly across 0 -> 1 -> 2 -> 3 -> 0 (seamless loop!)
      const phase = (dstCol / dstCols) * srcCols;
      const colA = Math.floor(phase) % srcCols;
      const colB = (colA + 1) % srcCols;
      const frac = phase - Math.floor(phase);
      // Smoothstep easing for fluid transition between keyframes
      const blend = frac * frac * (3 - 2 * frac);

      // Subtle breathing/squash-stretch curve synced to frame loop
      const pulse = Math.sin((dstCol / dstCols) * Math.PI * 2);
      const yOffset = options.bobAmp ? pulse * options.bobAmp : 0;
      const scaleY = 1 + (options.squashAmp ? pulse * options.squashAmp : 0);
      const scaleX = 1 / Math.sqrt(scaleY);

      for (let y = 0; y < dstCell; y++) {
        const sy = ((y - dstCell / 2) / scaleY + dstCell / 2 + yOffset) * scaleRatio;
        for (let x = 0; x < dstCell; x++) {
          const sx = ((x - dstCell / 2) / scaleX + dstCell / 2) * scaleRatio;
          const pA = sampleCellBilinear(rgba, width, srcCellW, srcCellH, colA, row, sx, sy);
          const pB = sampleCellBilinear(rgba, width, srcCellW, srcCellH, colB, row, sx, sy);

          const aA = pA[3] / 255;
          const aB = pB[3] / 255;
          const outAlpha = aA * (1 - blend) + aB * blend;
          const dstIdx = ((((row * dstCell) + y) * dstW) + ((dstCol * dstCell) + x)) * 4;
          if (outAlpha <= 0.002) continue;

          const r = (pA[0] * aA * (1 - blend) + pB[0] * aB * blend) / outAlpha;
          const g = (pA[1] * aA * (1 - blend) + pB[1] * aB * blend) / outAlpha;
          const b = (pA[2] * aA * (1 - blend) + pB[2] * aB * blend) / outAlpha;
          out[dstIdx] = Math.min(255, Math.round(r));
          out[dstIdx + 1] = Math.min(255, Math.round(g));
          out[dstIdx + 2] = Math.min(255, Math.round(b));
          out[dstIdx + 3] = Math.min(255, Math.round(outAlpha * 255));
        }
      }
    }
  }

  writeRgbaPng(path.join(ROOT, dstRelPath), dstW, dstH, out);
  console.log(`Generated 16x4 smooth atlas: ${dstRelPath}`);
}

const JOBS = [
  ['assets/animations/towers/tower-atlas-01.png', 'assets/animations/smooth/tower-smooth-01.png', { bobAmp: 1.5, squashAmp: 0.025 }],
  ['assets/animations/towers/tower-atlas-02.png', 'assets/animations/smooth/tower-smooth-02.png', { bobAmp: 1.5, squashAmp: 0.025 }],
  ['assets/animations/towers/tower-atlas-03.png', 'assets/animations/smooth/tower-smooth-03.png', { bobAmp: 1.5, squashAmp: 0.025 }],
  ['assets/animations/towers/tower-atlas-04.png', 'assets/animations/smooth/tower-smooth-04.png', { bobAmp: 1.5, squashAmp: 0.025 }],
  ['assets/animations/towers/tower-atlas-05.png', 'assets/animations/smooth/tower-smooth-05.png', { bobAmp: 1.5, squashAmp: 0.025 }],
  ['assets/animations/heroes/hero-atlas-01.png', 'assets/animations/smooth/hero-smooth-01.png', { bobAmp: 2.2, squashAmp: 0.03 }],
  ['assets/animations/heroes/hero-atlas-02.png', 'assets/animations/smooth/hero-smooth-02.png', { bobAmp: 2.2, squashAmp: 0.03 }],
  ['assets/animations/enemies/enemy-atlas-01.png', 'assets/animations/smooth/enemy-smooth-01.png', { bobAmp: 2.5, squashAmp: 0.045 }],
  ['assets/animations/enemies/enemy-atlas-02.png', 'assets/animations/smooth/enemy-smooth-02.png', { bobAmp: 2.5, squashAmp: 0.045 }],
  ['assets/animations/enemies/enemy-specialist-atlas.png', 'assets/animations/smooth/enemy-specialist-smooth.png', { bobAmp: 2.5, squashAmp: 0.045 }]
];

for (const [src, dst, opts] of JOBS) {
  upscale4x4To16x4(src, dst, opts);
}
