#!/usr/bin/env node
/**
 * Controller + PS5 Slim product photos.
 * - DualShock 4 / DualSense: real product photos from Wikimedia Commons when available
 *   (correct shell colours), recolour fallback with accurate official paint values.
 * - Does not scrape Amazon / CeX product pages (short amzn.eu links blocked by policy).
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

function commons(filename, width = 1600) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

/** Product plate: white bg, controller filled cleanly. */
async function toProductPlate(srcPath, outPath) {
  ensureDir(path.dirname(outPath));
  // Flatten transparency to white; fit inside square like retailer packshots
  await sharp(srcPath)
    .rotate()
    .resize(1400, 1400, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 94 })
    .toFile(outPath);
}

/**
 * Recolour dark/mid body; preserve white BG + high-chroma buttons.
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
    if (r > 232 && g > 232 && b > 232) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    if (chroma > 48 && lum > 0.12 && lum < 0.92) continue;

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
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 94 })
    .toFile(outPath);
}

function findBase(pref, fallbacks) {
  for (const p of [pref, ...fallbacks]) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

// Accurate official DualShock 4 paint (Jet Black / Glacier White / Magma Red)
const DUALSHOCK_TARGETS = {
  black: { r: 24, g: 24, b: 26, lift: 1 },
  white: { r: 236, g: 236, b: 238, lift: 1.22 },
  red: { r: 196, g: 28, b: 42, lift: 1.08 },
};

// DualSense limited/mainline colours
const DUALSENSE_TARGETS = {
  white: { r: 245, g: 245, b: 247, lift: 1.2 },
  'midnight-black': { r: 18, g: 18, b: 20, lift: 1 },
  'cosmic-red': { r: 168, g: 35, b: 48, lift: 1.08 },
  'starlight-blue': { r: 118, g: 152, b: 188, lift: 1.12 },
  'galactic-purple': { r: 95, g: 70, b: 130, lift: 1.1 },
  'nova-pink': { r: 228, g: 140, b: 172, lift: 1.15 },
  'volcanic-red': { r: 140, g: 28, b: 36, lift: 1.05 },
  'cobalt-blue': { r: 36, g: 82, b: 158, lift: 1.1 },
  'sterling-silver': { r: 180, g: 184, b: 190, lift: 1.15 },
  'chroma-teal': { r: 55, g: 150, b: 148, lift: 1.12 },
  'chroma-indigo': { r: 70, g: 58, b: 125, lift: 1.12 },
};

/** Best-effort real product photos (Wikimedia) for DualShock colours. */
const DS4_COMMONS = {
  black: [
    'DualShock 4.jpg',
    'PlayStation 4 DualShock 4 Controller.jpg',
    'Sony-DualShock-4-Controller.jpg',
  ],
  white: [
    'DualShock_4_Glacier_White.jpg',
    'PS4 Dualshock 4 Glacier White.jpg',
    'White DualShock 4.png',
  ],
  red: [
    'DualShock 4 Magma Red.jpg',
    'DualShock4 Magma Red.png',
    'Red DualShock 4.png',
  ],
};

const DUALSENSE_COMMONS = {
  white: ['DualSense.jpg', 'PS5 DualSense controller.png', 'PlayStation 5 DualSense.jpg'],
  'midnight-black': [
    'DualSense Midnight Black.jpg',
    'Black DualSense controller.jpg',
    'PS5 DualSense black.png',
  ],
  'cosmic-red': ['DualSense Cosmic Red.jpg', 'Red DualSense.png'],
  'starlight-blue': ['DualSense Starlight Blue.jpg'],
  'galactic-purple': ['DualSense Galactic Purple.jpg'],
  'nova-pink': ['DualSense Nova Pink.jpg'],
  'volcanic-red': ['DualSense Volcanic Red.jpg'],
  'cobalt-blue': ['DualSense Cobalt Blue.jpg'],
  'sterling-silver': ['DualSense Sterling Silver.jpg'],
  'chroma-teal': ['DualSense Chroma Teal.jpg'],
  'chroma-indigo': ['DualSense Chroma Indigo.jpg'],
};

async function tryCommonsPlate(keyOut, filenames) {
  const tmp = path.join(CTRL, `_dl-${keyOut}.bin`);
  const finalOut = path.join(CTRL, `${keyOut}-fixed.jpg`);
  for (const file of filenames) {
    try {
      await download(commons(file), tmp);
      await toProductPlate(tmp, finalOut);
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
      console.log(`✓ ${keyOut} photo ← Commons:${file}`);
      return finalOut;
    } catch {
      // next
    }
  }
  try {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  } catch {
    /* ignore */
  }
  return null;
}

async function tryDownloadSlim() {
  const candidates = {
    'ps5-slim-disc': [
      'PlayStation 5 Slim with DualSense and cover.png',
      'PS5 Slim disc edition.png',
      'PlayStation 5 Slim.jpg',
    ],
    'ps5-slim-digital': [
      'PlayStation 5 Slim Digital Edition.png',
      'PS5 Slim digital edition.png',
      'PS5DigitalEdition.png',
    ],
  };

  for (const [key, files] of Object.entries(candidates)) {
    const dest = path.join(CONS, `${key}-fixed.jpg`);
    let ok = false;
    for (const file of files) {
      try {
        const tmp = path.join(CONS, `_dl-${key}.bin`);
        await download(commons(file), tmp);
        await toProductPlate(tmp, dest);
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* ignore */
        }
        console.log(`✓ slim photo ${key} ← ${file}`);
        ok = true;
        break;
      } catch {
        // next
      }
    }
    if (!ok) {
      const existing = [1, 2]
        .map((n) => path.join(CONS, `${key}-${n}.png`))
        .concat([path.join(CONS, `${key}-1.jpg`)])
        .find((p) => fs.existsSync(p));
      if (existing) {
        const base = await sharp(existing)
          .resize(1400, 1400, { fit: 'inside' })
          .flatten({ background: '#ffffff' })
          .toBuffer();
        const meta = await sharp(base).metadata();
        const w = meta.width || 1000;
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

  // Prefer authentic DualShock colour product photos
  const ds4BaseBlack = findBase(path.join(CTRL, 'dualshock4-black-1.jpg'), [
    path.join(CTRL, 'dualshock4-black-2.jpg'),
  ]);

  for (const [name, colour] of Object.entries(DUALSHOCK_TARGETS)) {
    const key = `dualshock4-${name}`;
    const out = path.join(CTRL, `${key}-fixed.jpg`);
    const photo = await tryCommonsPlate(key, DS4_COMMONS[name] || []);
    if (!photo) {
      const base =
        name === 'black'
          ? ds4BaseBlack
          : findBase(path.join(CTRL, `dualshock4-${name}-1.jpg`), [
              path.join(CTRL, `dualshock4-${name}-3.jpg`),
              ds4BaseBlack,
            ]);
      if (!base) {
        console.log(`✗ ${key} no source`);
        continue;
      }
      if (name === 'black' && base) {
        await toProductPlate(base, out);
        console.log(`✓ ${key} plate from local black`);
      } else {
        await recolourController(ds4BaseBlack || base, out, colour);
        console.log(`✓ ${key} recolour (fallback)`);
      }
    }
    pushMapPrimary(map, key, `/catalog/controllers/${key}-fixed.jpg`, `PS4 DualShock ${name}`);
  }

  // DualSense — Commons colour photo or recolour from white/black base
  const dsWhiteLocal = findBase(path.join(CTRL, 'dualsense-white-1.png'), [
    path.join(CTRL, 'dualsense-white-1.jpg'),
    path.join(CTRL, 'dualsense-white-2.png'),
    path.join(CTRL, 'dualsense-white-3.png'),
  ]);
  const dsBlackLocal = findBase(path.join(CTRL, 'dualsense-midnight-black-1.png'), [
    path.join(CTRL, 'dualsense-midnight-black-1.jpg'),
    path.join(CTRL, 'dualsense-midnight-black-3.png'),
  ]);

  // Install a clean white DualSense plate first from Commons
  let whitePlate = path.join(CTRL, 'dualsense-white-fixed.jpg');
  const whitePhoto = await tryCommonsPlate('dualsense-white', DUALSENSE_COMMONS.white);
  if (!whitePhoto && dsWhiteLocal) {
    await toProductPlate(dsWhiteLocal, whitePlate);
    console.log('✓ dualsense-white plate from local');
  }
  whitePlate = fs.existsSync(whitePlate) ? whitePlate : dsWhiteLocal;

  let blackPlate = path.join(CTRL, 'dualsense-midnight-black-fixed.jpg');
  const blackPhoto = await tryCommonsPlate(
    'dualsense-midnight-black',
    DUALSENSE_COMMONS['midnight-black'],
  );
  if (!blackPhoto && dsBlackLocal) {
    await toProductPlate(dsBlackLocal, blackPlate);
    console.log('✓ dualsense-midnight-black plate from local');
  } else if (!blackPhoto && whitePlate) {
    await recolourController(whitePlate, blackPlate, DUALSENSE_TARGETS['midnight-black']);
    console.log('✓ dualsense-midnight-black recolour');
  }
  blackPlate = fs.existsSync(blackPlate) ? blackPlate : dsBlackLocal;

  for (const [name, colour] of Object.entries(DUALSENSE_TARGETS)) {
    const key = `dualsense-${name}`;
    if (name === 'white' || name === 'midnight-black') {
      const p = path.join(CTRL, `${key}-fixed.jpg`);
      if (fs.existsSync(p)) {
        pushMapPrimary(map, key, `/catalog/controllers/${key}-fixed.jpg`, `DualSense ${name}`);
      }
      continue;
    }

    const out = path.join(CTRL, `${key}-fixed.jpg`);
    const photo = await tryCommonsPlate(key, DUALSENSE_COMMONS[name] || []);
    if (!photo) {
      const base =
        name === 'volcanic-red' ? blackPlate || whitePlate : whitePlate || blackPlate;
      if (!base) {
        console.log(`✗ ${key} no base`);
        continue;
      }
      await recolourController(base, out, colour);
      console.log(`✓ ${key} recolour (colour-matched)`);
    }
    pushMapPrimary(map, key, `/catalog/controllers/${key}-fixed.jpg`, `DualSense ${name}`);
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
