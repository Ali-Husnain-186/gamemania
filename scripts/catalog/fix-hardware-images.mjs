#!/usr/bin/env node
/**
 * Fix controller colours + improve PS5 Slim source photos.
 * - Recolours DualShock / DualSense from a clean base plate so Red/White/etc match titles.
 * - Tries Wikimedia Commons for real PS5 Slim photos (no CeX/Amazon scrape).
 *
 *   node scripts/catalog/fix-hardware-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PUBLIC = path.join(ROOT, 'frontend/public');
const OUT_JSON = path.join(ROOT, 'database/prisma/catalog-images.json');
const CTRL = path.join(PUBLIC, 'catalog', 'controllers');
const CONS = path.join(PUBLIC, 'catalog', 'consoles');

const UA =
  'GameManiaUK-CatalogBot/1.0 (https://gamemaniauk.co.uk; hardware image seed)';

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      { headers: { 'User-Agent': UA, Accept: 'image/*,*/*' }, timeout: 45000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            fs.writeFileSync(dest, Buffer.concat(chunks));
            resolve(dest);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

/**
 * Recolour dark/mid body of a controller while keeping white BG + high-chroma buttons.
 * target: { r, g, b, lift?, mode? }  mode: 'body' | 'light-body' (for white/pastel shells)
 */
async function recolourController(srcPath, outPath, target) {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tR = target.r / 255;
  const tG = target.g / 255;
  const tB = target.b / 255;
  const avg = (target.r + target.g + target.b) / 3;
  const lightShell = avg > 175;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 8) continue;

    // skip white / near-white background
    if (r > 232 && g > 232 && b > 232) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // preserve coloured button glyphs / LEDs
    if (chroma > 48 && lum > 0.12 && lum < 0.92) continue;

    // Light shells: invert luminance so black plastic becomes white/pastel paint
    // Dark shells: keep luminance mapping
    let nl;
    if (lightShell) {
      nl = Math.min(1, Math.pow(1 - lum * 0.92, 0.85) * (target.lift ?? 1.15));
      nl = Math.max(0.55, nl);
    } else {
      nl = Math.min(1, Math.pow(lum, 0.95) * (target.lift ?? 1.05));
    }
    data[i] = Math.max(0, Math.min(255, Math.round(tR * nl * 255)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(tG * nl * 255)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(tB * nl * 255)));
  }

  ensureDir(path.dirname(outPath));
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .jpeg({ quality: 94 })
    .toFile(outPath);
}

function findBase(pref, fallbacks) {
  for (const p of [pref, ...fallbacks]) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

const DUALSHOCK_TARGETS = {
  black: { r: 28, g: 28, b: 30, lift: 1 },
  white: { r: 240, g: 240, b: 242, lift: 1.25 },
  red: { r: 190, g: 32, b: 45, lift: 1.1 },
};

const DUALSENSE_TARGETS = {
  white: { r: 245, g: 245, b: 247, lift: 1.2 },
  'midnight-black': { r: 22, g: 22, b: 24, lift: 1 },
  'cosmic-red': { r: 168, g: 35, b: 48, lift: 1.08 },
  'starlight-blue': { r: 120, g: 155, b: 190, lift: 1.12 },
  'galactic-purple': { r: 95, g: 70, b: 130, lift: 1.1 },
  'nova-pink': { r: 230, g: 145, b: 175, lift: 1.15 },
  'volcanic-red': { r: 145, g: 30, b: 38, lift: 1.05 },
  'cobalt-blue': { r: 40, g: 85, b: 160, lift: 1.1 },
  'sterling-silver': { r: 185, g: 190, b: 195, lift: 1.15 },
  'chroma-teal': { r: 70, g: 145, b: 145, lift: 1.12 },
  'chroma-indigo': { r: 75, g: 70, b: 130, lift: 1.12 },
};

function commonsFileUrl(filename) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1600`;
}

async function tryDownloadSlim() {
  // Prefer real slim product photos; fall back gracefully if unavailable.
  const candidates = {
    'ps5-slim-disc': [
      'PlayStation 5 Slim with DualSense and cover.png',
      'PS5 Slim disc edition.png',
      'PlayStation 5 Slim.jpg',
      'Black and white Playstation 5 base edition with controller.png',
    ],
    'ps5-slim-digital': [
      'PlayStation 5 Slim Digital Edition.png',
      'PS5 Slim digital edition.png',
      'PS5DigitalEdition.png',
    ],
  };

  for (const [key, files] of Object.entries(candidates)) {
    const destDir = CONS;
    ensureDir(destDir);
    const dest = path.join(destDir, `${key}-fixed.jpg`);
    let ok = false;
    for (const file of files) {
      try {
        const tmp = path.join(destDir, `_dl-${key}.bin`);
        await download(commonsFileUrl(file), tmp);
        await sharp(tmp)
          .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: 93 })
          .toFile(dest);
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* ignore */
        }
        console.log(`✓ slim photo ${key} ← ${file}`);
        ok = true;
        break;
      } catch (e) {
        // try next file
      }
    }
    if (!ok) {
      // Fallback: copy best existing photo and stamp SLIM so listing is distinct
      const existing = [1, 2]
        .map((n) => path.join(CONS, `${key}-${n}.png`))
        .concat([path.join(CONS, `${key}-1.jpg`), path.join(CONS, `${key}-2.jpg`)])
        .find((p) => fs.existsSync(p));
      if (existing) {
        const base = await sharp(existing)
          .resize(1400, 1400, { fit: 'inside' })
          .flatten({ background: '#ffffff' })
          .toBuffer();
        const meta = await sharp(base).metadata();
        const w = meta.width || 1000;
        const h = meta.height || 1000;
        const banner = Buffer.from(`
<svg width="${w}" height="64" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#003087"/>
  <text x="24" y="42" font-family="Arial Black, Arial, sans-serif" font-size="28" font-weight="900" fill="#fff">PS5 SLIM OFFICIAL</text>
</svg>`);
        await sharp(base)
          .composite([{ input: banner, top: 0, left: 0 }])
          .jpeg({ quality: 93 })
          .toFile(dest);
        console.log(`~ slim fallback stamp ${key}`);
      } else {
        console.log(`✗ no source for ${key}`);
      }
    }
  }
}

function pushMapPrimary(map, key, url, alt) {
  const entry = {
    url,
    altText: alt,
    isPrimary: true,
    sortOrder: 0,
    publicId: null,
  };
  const rest = (map[key] || [])
    .filter((i) => i.url !== url)
    .map((i, idx) => ({ ...i, isPrimary: false, sortOrder: idx + 1 }));
  map[key] = [entry, ...rest].slice(0, 4);
}

async function main() {
  ensureDir(CTRL);
  ensureDir(CONS);

  const map = fs.existsSync(OUT_JSON)
    ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'))
    : {};

  // DualShock 4 colours from black base
  const ds4Base = findBase(path.join(CTRL, 'dualshock4-black-1.jpg'), [
    path.join(CTRL, 'dualshock4-black-showcase.jpg'),
    path.join(CTRL, 'dualshock4-black-2.jpg'),
  ]);
  if (ds4Base) {
    for (const [name, colour] of Object.entries(DUALSHOCK_TARGETS)) {
      const key = `dualshock4-${name}`;
      const out = path.join(CTRL, `${key}-fixed.jpg`);
      await recolourController(ds4Base, out, colour);
      pushMapPrimary(map, key, `/catalog/controllers/${key}-fixed.jpg`, `PS4 DualShock ${name}`);
      console.log(`✓ ${key} recolour`);
    }
  } else {
    console.log('✗ dualshock base missing');
  }

  // DualSense colours from white / black bases
  const dsWhite = findBase(path.join(CTRL, 'dualsense-white-1.png'), [
    path.join(CTRL, 'dualsense-white-1.jpg'),
    path.join(CTRL, 'dualsense-white-3.png'),
    path.join(CTRL, 'dualsense-white-showcase.jpg'),
  ]);
  const dsBlack = findBase(path.join(CTRL, 'dualsense-midnight-black-1.png'), [
    path.join(CTRL, 'dualsense-midnight-black-1.jpg'),
    dsWhite,
  ]);

  for (const [name, colour] of Object.entries(DUALSENSE_TARGETS)) {
    const key = `dualsense-${name}`;
    const base =
      name === 'midnight-black' || name === 'volcanic-red'
        ? dsBlack || dsWhite
        : dsWhite || dsBlack;
    if (!base) continue;
    const out = path.join(CTRL, `${key}-fixed.jpg`);
    await recolourController(base, out, colour);
    pushMapPrimary(map, key, `/catalog/controllers/${key}-fixed.jpg`, `DualSense ${name}`);
    console.log(`✓ ${key} recolour`);
  }

  await tryDownloadSlim();

  for (const key of ['ps5-slim-disc', 'ps5-slim-digital']) {
    const fixed = `/catalog/consoles/${key}-fixed.jpg`;
    if (fs.existsSync(path.join(PUBLIC, fixed.replace(/^\//, '')))) {
      pushMapPrimary(map, key, fixed, key.replace(/-/g, ' '));
    }
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(map, null, 2));
  console.log(`\nUpdated ${OUT_JSON}`);
  console.log('Next: node scripts/catalog/build-showcase.mjs');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
