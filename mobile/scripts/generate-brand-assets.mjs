#!/usr/bin/env node
/**
 * Membuat ikon aplikasi dan splash SEMENTARA Tovv dari geometri wordmark (src/components/brand/wordmark.tsx).
 * Rasterisasi analitik + supersampling 4×4, encoder PNG memakai zlib bawaan Node. Deterministik; tanpa
 * dependensi gambar. Jalankan: node scripts/generate-brand-assets.mjs
 * Provenance: aset dibuat oleh skrip ini (bukan aset pihak ketiga). Ganti saat logo Tovv resmi tersedia.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const NAVY = [8, 42, 86];
const WHITE = [255, 255, 255];
const SKY = [25, 184, 242];

// Geometri wordmark (viewBox 0 0 98 40), sama dengan komponen Wordmark.
const T = [[[4, 4], [11, 4], [11, 14], [18, 14], [18, 20.5], [11, 20.5], [11, 36], [4, 36], [4, 20.5], [0, 20.5], [0, 14], [4, 14]]];
const V = (dx) => [[[47 + dx, 14], [54.5 + dx, 14], [59 + dx, 27.5], [63.5 + dx, 14], [71 + dx, 14], [62.6 + dx, 36], [55.4 + dx, 36]]];
const ring = { cx: 33, cy: 25, ro: 11, ri: 4.75 };

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** shapes: { kind:'poly'|'ring', ..., color } dalam koordinat wordmark; transform: px → wordmark. */
function render(w, h, bg, shapes, map) {
  const px = Buffer.alloc(w * h * 4);
  const S = 4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const [u, v] = map(x + (sx + 0.5) / S, y + (sy + 0.5) / S);
          let c = null;
          for (const s of shapes) {
            const hit = s.kind === 'ring'
              ? (() => { const d = Math.hypot(u - s.cx, v - s.cy); return d <= s.ro && d >= s.ri; })()
              : s.polys.some((p) => inPoly(u, v, p));
            if (hit) c = s.color;
          }
          if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; }
          else if (bg) { r += bg[0]; g += bg[1]; b += bg[2]; a += 255; }
        }
      }
      const n = S * S;
      const i = (y * w + x) * 4;
      const alpha = a / n;
      px[i + 3] = Math.round(alpha);
      // Warna tidak dipremultiply: bagi dengan cakupan agar tepi tidak menggelap.
      const cov = a / 255 || 1;
      px[i] = Math.round(r / cov);
      px[i + 1] = Math.round(g / cov);
      px[i + 2] = Math.round(b / cov);
    }
  }
  return px;
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function png(w, h, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** Tanda "vv": dua chevron; dipakai untuk ikon persegi. Pusat chevron ±(47..97, 14..36). */
function markShapes(first, second) {
  return [
    { kind: 'poly', polys: V(0), color: first },
    { kind: 'poly', polys: V(26), color: second },
  ];
}

function squareMap(size, scaleFrac) {
  // Bounding box mark: x 47..97 (50), y 14..36 (22). Skala agar lebar = scaleFrac × size.
  const k = (size * scaleFrac) / 50;
  const ox = (size - 50 * k) / 2;
  const oy = (size - 22 * k) / 2;
  return (x, y) => [47 + (x - ox) / k, 14 + (y - oy) / k];
}

const out = (name, w, h, data) => {
  writeFileSync(join(OUT, name), png(w, h, data));
  console.log(`tulis ${name} ${w}×${h}`);
};

const ICON = 1024;
out('icon.png', ICON, ICON, render(ICON, ICON, NAVY, markShapes(WHITE, SKY), squareMap(ICON, 0.62)));
out('android-icon-foreground.png', 1024, 1024, render(1024, 1024, null, markShapes(WHITE, SKY), squareMap(1024, 0.42)));
out('android-icon-monochrome.png', 1024, 1024, render(1024, 1024, null, markShapes(WHITE, WHITE), squareMap(1024, 0.42)));
out('favicon.png', 48, 48, render(48, 48, NAVY, markShapes(WHITE, SKY), squareMap(48, 0.7)));
// Splash: wordmark lengkap putih + vv kedua biru muda, latar transparan (warna latar diatur app.json).
const SW = 784, SH = 320;
const k = SW / 98;
out('splash-icon.png', SW, SH, render(SW, SH, null, [
  { kind: 'poly', polys: T, color: WHITE },
  { kind: 'ring', ...ring, color: WHITE },
  { kind: 'poly', polys: V(0), color: WHITE },
  { kind: 'poly', polys: V(26), color: SKY },
], (x, y) => [x / k, y / k]));
