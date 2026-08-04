#!/usr/bin/env node
/**
 * Build Amazon/CeX-style flat catalog showcase images:
 * - Games: official cover art on pure white (no 3D plastic case mockups)
 * - Hardware: product cutout centered on white background
 *
 * Does NOT scrape competitor sites (CeX/Amazon). Uses existing local catalog art.
 *
 *   node scripts/catalog/build-showcase.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PUBLIC = path.join(ROOT, 'frontend/public');
const OUT_JSON = path.join(ROOT, 'database/prisma/catalog-images.json');
const KEYS_FILE = path.join(ROOT, 'database/prisma/catalog-image-keys.json');

const SIZE = 1000;

function isGameKey(key) {
  return key.includes('-game-');
}

function localPathFromUrl(url) {
  if (!url?.startsWith('/catalog/')) return null;
  const abs = path.join(PUBLIC, url.replace(/^\//, ''));
  return fs.existsSync(abs) ? abs : null;
}

/** Flat retail front: cover only on pure white — CeX/Amazon list-style shot */
async function buildFlatRetail(srcPath, outPath) {
  const pad = Math.round(SIZE * 0.08);
  const max = SIZE - pad * 2;
  const resized = await sharp(srcPath)
    .resize(max, max, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const left = Math.round((SIZE - (meta.width || 0)) / 2);
  const top = Math.round((SIZE - (meta.height || 0)) / 2);

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: resized, left, top }])
    .jpeg({ quality: 93 })
    .toFile(outPath);
}

async function buildHardwareWhite(srcPath, outPath, labelText = '') {
  const maxH = labelText ? Math.round(SIZE * 0.72) : Math.round(SIZE * 0.82);
  const resized = await sharp(srcPath)
    .resize(Math.round(SIZE * 0.82), maxH, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const left = Math.round((SIZE - (meta.width || 0)) / 2);
  const top = Math.round((SIZE - (meta.height || 0)) / 2) - (labelText ? 40 : 0);

  const layers = [{ input: resized, left, top }];
  if (labelText) {
    const badge = Buffer.from(`
<svg width="${SIZE}" height="70" xmlns="http://www.w3.org/2000/svg">
  <rect x="120" y="8" width="760" height="54" rx="12" fill="#0f172a"/>
  <text x="500" y="44" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff">${labelText}</text>
</svg>`);
    layers.push({ input: badge, left: 0, top: SIZE - 90 });
  }

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(layers)
    .jpeg({ quality: 92 })
    .toFile(outPath);
}

function hardwareLabel(key) {
  if (key === 'ps5-slim-disc') return 'PS5 Slim · Disc Edition';
  if (key === 'ps5-slim-digital') return 'PS5 Slim · Digital Edition';
  if (key === 'ps5-original-disc') return 'PS5 Original · Disc Edition';
  if (key === 'ps5-original-digital') return 'PS5 Original · Digital Edition';
  return '';
}

function relUrl(absPath) {
  return '/' + path.relative(PUBLIC, absPath).split(path.sep).join('/');
}

async function main() {
  const keys = fs.existsSync(KEYS_FILE)
    ? JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'))
    : [];
  const map = fs.existsSync(OUT_JSON)
    ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'))
    : {};

  const only = (process.env.ONLY_KEYS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const list = only.length ? keys.filter((k) => only.includes(k)) : keys;

  let ok = 0;
  let fail = 0;

  for (const key of list) {
    const existing = map[key] || [];
    const srcUrl =
      existing.find(
        (i) =>
          localPathFromUrl(i.url) &&
          !String(i.url).includes('-showcase') &&
          !/\.svg$/i.test(String(i.url)),
      )?.url ??
      existing.find((i) => localPathFromUrl(i.url) && !/\.svg$/i.test(String(i.url)))?.url ??
      existing.find((i) => localPathFromUrl(i.url))?.url;
    const srcPath = localPathFromUrl(srcUrl);
    if (!srcPath) {
      console.log(`skip ${key} (no local source)`);
      fail += 1;
      continue;
    }

    const folder = isGameKey(key)
      ? path.join(PUBLIC, 'catalog', 'games', key)
      : path.join(
          PUBLIC,
          'catalog',
          key.startsWith('cable-')
            ? 'cables'
            : key.includes('dualsense') || key.includes('dualshock') || key.includes('joycon')
              ? 'controllers'
              : 'consoles',
        );
    fs.mkdirSync(folder, { recursive: true });
    const outPath = path.join(folder, `${key}-showcase.jpg`);

    try {
      if (isGameKey(key)) {
        await buildFlatRetail(srcPath, outPath);
      } else {
        await buildHardwareWhite(srcPath, outPath, hardwareLabel(key));
      }

      const showcase = {
        url: relUrl(outPath),
        altText: `${key.replace(/-/g, ' ')} retail image`,
        isPrimary: true,
        sortOrder: 0,
        publicId: null,
      };
      const rest = existing
        .filter((i) => i.url !== showcase.url)
        .map((i, idx) => ({ ...i, isPrimary: false, sortOrder: idx + 1 }));
      map[key] = [showcase, ...rest].slice(0, 4);
      console.log(`✓ ${key}`);
      ok += 1;
    } catch (err) {
      console.log(`✗ ${key}`, err.message);
      fail += 1;
    }
  }

  const aliases = {
    'switch2-game-the-legend-of-zelda-tears-of-the-kingdom-switch-2-edition':
      'switch-game-the-legend-of-zelda-tears-of-the-kingdom',
    'switch2-game-the-legend-of-zelda-breath-of-the-wild-switch-2-edition':
      'switch-game-the-legend-of-zelda-breath-of-the-wild',
  };
  for (const [alias, source] of Object.entries(aliases)) {
    if (map[source]?.length) {
      map[alias] = map[source].map((img, i) => ({
        ...img,
        altText: alias.replace(/-/g, ' '),
        isPrimary: i === 0,
        sortOrder: i,
      }));
    }
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(map, null, 2));
  console.log(`\nShowcase done. OK=${ok} fail=${fail}`);
  console.log(`Wrote ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
