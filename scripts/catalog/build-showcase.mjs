#!/usr/bin/env node
/**
 * Amazon/CeX-style flat retail images (no 3D plastic AI cases):
 * - Games: official cover + platform brand bar (PS5 / PS4 / Xbox / Switch / PS2)
 * - Hardware: product cutout on white
 *
 * Does NOT scrape CeX/Amazon. Uses local catalog art.
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

function platformFromKey(key) {
  if (key.startsWith('ps5-') || key.includes('dualsense')) return 'PS5';
  if (key.startsWith('ps4-') || key.includes('dualshock')) return 'PS4';
  if (key.startsWith('ps3-')) return 'PS3';
  if (key.startsWith('ps2-')) return 'PS2';
  if (key.startsWith('xbox')) return 'XBOX';
  if (key.startsWith('switch2') || key.includes('switch-2') || key.includes('joycon')) return 'SWITCH2';
  if (key.startsWith('switch')) return 'SWITCH';
  return 'GAME';
}

function isGameKey(key) {
  return key.includes('-game-');
}

function localPathFromUrl(url) {
  if (!url?.startsWith('/catalog/')) return null;
  const abs = path.join(PUBLIC, url.replace(/^\//, ''));
  return fs.existsSync(abs) ? abs : null;
}

function platformTheme(platform) {
  switch (platform) {
    case 'PS5':
      return { header: '#ffffff', text: '#000000', label: 'PS5', sub: '' };
    case 'PS4':
      return { header: '#003087', text: '#ffffff', label: 'PS4', sub: '' };
    case 'PS3':
      return { header: '#1a1a1a', text: '#ffffff', label: 'PS3', sub: '' };
    case 'PS2':
      return { header: '#000000', text: '#ffffff', label: 'PlayStation.2', sub: '' };
    case 'XBOX':
      return { header: '#107c10', text: '#ffffff', label: 'XBOX SERIES X|S', sub: '' };
    case 'SWITCH':
      return { header: '#e60012', text: '#ffffff', label: 'Nintendo Switch', sub: '' };
    case 'SWITCH2':
      return { header: '#e60012', text: '#ffffff', label: 'Nintendo Switch 2', sub: '' };
    default:
      return { header: '#222222', text: '#ffffff', label: 'GAME', sub: '' };
  }
}

/**
 * Flat boxed front like CeX list photos:
 * pure white canvas + rectangular insert (platform brand bar + cover art).
 * No plastic case depth / 3D lighting.
 */
async function buildGameBoxFlat(coverPath, platform, outPath) {
  const theme = platformTheme(platform);
  const boxW = 620;
  const boxH = 860;
  const headerH = platform === 'PS5' || platform === 'PS4' ? 96 : 88;
  const left = Math.round((SIZE - boxW) / 2);
  const top = Math.round((SIZE - boxH) / 2);
  const artW = boxW;
  const artH = boxH - headerH;

  const cover = await sharp(coverPath)
    .resize(artW, artH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 95 })
    .toBuffer();

  const fontSize =
    theme.label.length > 14 ? 26 : theme.label.length > 8 ? 32 : platform === 'PS5' ? 44 : 38;

  const headerSvg = Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${theme.header}"/>
  <text x="28" y="${Math.round(headerH * 0.64)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${fontSize}" font-weight="900"
    fill="${theme.text}" letter-spacing="0.5">${theme.label}</text>
</svg>`);

  // Soft outer edge only (no 3D plastic) — keeps product legible on cards
  const frame = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <defs>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect x="${left}" y="${top}" width="${boxW}" height="${boxH}" rx="4" ry="4" fill="#ffffff" filter="url(#soft)"/>
</svg>`);

  await sharp(frame)
    .composite([
      { input: headerSvg, left, top },
      { input: cover, left, top: top + headerH },
    ])
    .jpeg({ quality: 95 })
    .toFile(outPath);
}

async function buildHardwareWhite(srcPath, outPath, labelText = '') {
  const maxH = labelText ? Math.round(SIZE * 0.72) : Math.round(SIZE * 0.86);
  const resized = await sharp(srcPath)
    .resize(Math.round(SIZE * 0.86), maxH, {
      fit: 'contain',
      background: { r: 243, g: 244, b: 246, alpha: 1 },
    })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const left = Math.round((SIZE - (meta.width || 0)) / 2);
  const top = Math.round((SIZE - (meta.height || 0)) / 2) - (labelText ? 36 : 0);

  const layers = [{ input: resized, left, top }];
  if (labelText) {
    const badge = Buffer.from(`
<svg width="${SIZE}" height="64" xmlns="http://www.w3.org/2000/svg">
  <rect x="140" y="6" width="720" height="50" rx="10" fill="#0f172a"/>
  <text x="500" y="40" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#ffffff">${labelText}</text>
</svg>`);
    layers.push({ input: badge, left: 0, top: SIZE - 78 });
  }

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background: { r: 243, g: 244, b: 246 },
    },
  })
    .composite(layers)
    .jpeg({ quality: 94 })
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
        await buildGameBoxFlat(srcPath, platformFromKey(key), outPath);
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
      console.log(`✓ ${key} (${platformFromKey(key)})`);
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
