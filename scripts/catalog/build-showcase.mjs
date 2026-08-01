#!/usr/bin/env node
/**
 * Build Amazon/CeX-style catalog showcase images:
 * - Games: physical case mockup with platform banner on white background
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

function caseTheme(platform) {
  switch (platform) {
    case 'PS5':
      return {
        header: '#ffffff',
        headerText: '#003087',
        spine: '#0070d1',
        body: '#111827',
        label: 'PS5',
      };
    case 'PS4':
      return {
        header: '#003087',
        headerText: '#ffffff',
        spine: '#000000',
        body: '#0b1220',
        label: 'PS4',
      };
    case 'PS3':
      return {
        header: '#1a1a1a',
        headerText: '#ffffff',
        spine: '#666666',
        body: '#111111',
        label: 'PS3',
      };
    case 'PS2':
      return {
        header: '#000000',
        headerText: '#ffffff',
        spine: '#1e3a8a',
        body: '#0a0a0a',
        label: 'PS2',
      };
    case 'XBOX':
      return {
        header: '#107c10',
        headerText: '#ffffff',
        spine: '#0b5a0b',
        body: '#111111',
        label: 'XBOX',
      };
    case 'SWITCH':
    case 'SWITCH2':
      return {
        header: '#e60012',
        headerText: '#ffffff',
        spine: '#0a84ff',
        body: '#111111',
        label: platform === 'SWITCH2' ? 'SWITCH 2' : 'SWITCH',
      };
    default:
      return {
        header: '#222222',
        headerText: '#ffffff',
        spine: '#444444',
        body: '#111111',
        label: 'GAME',
      };
  }
}

async function buildGameCase(coverPath, platform, outPath) {
  const theme = caseTheme(platform);
  // Retail Blu-ray / game-case proportions (Amazon-style front face)
  const caseW = 560;
  const caseH = 780;
  const left = Math.round((SIZE - caseW) / 2) - 8;
  const top = Math.round((SIZE - caseH) / 2);
  const depth = 22;
  const headerH = platform === 'PS5' || platform === 'PS4' ? 92 : 84;
  const artPad = 8;
  const artX = left + artPad;
  const artY = top + headerH + artPad;
  const artW = caseW - artPad * 2;
  const artH = caseH - headerH - artPad * 2 - 18;

  const cover = await sharp(coverPath)
    .resize(artW, artH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 92 })
    .toBuffer();

  const caseFill =
    platform === 'PS5'
      ? '#1a6fd4'
      : platform === 'PS4'
        ? '#0b2a6b'
        : platform === 'XBOX'
          ? '#0e7a0e'
          : platform.startsWith('SWITCH')
            ? '#e8e8e8'
            : '#1f2937';

  const svg = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <defs>
    <linearGradient id="plastic" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${caseFill}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${caseFill}" stop-opacity="0.75"/>
    </linearGradient>
    <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="8" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
  </defs>
  <!-- Case depth / side -->
  <g filter="url(#shadow)">
    <polygon points="${left + caseW},${top} ${left + caseW + depth},${top + 10} ${left + caseW + depth},${top + caseH + 10} ${left + caseW},${top + caseH}" fill="${caseFill}" opacity="0.55"/>
    <rect x="${left}" y="${top}" width="${caseW}" height="${caseH}" rx="6" ry="6" fill="url(#plastic)"/>
    <!-- Platform header strip -->
    <rect x="${left}" y="${top}" width="${caseW}" height="${headerH}" fill="${theme.header}"/>
    <text x="${left + 28}" y="${top + Math.round(headerH * 0.62)}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="${platform === 'SWITCH2' ? 28 : 36}" font-weight="800" fill="${theme.headerText}" letter-spacing="1">${theme.label}</text>
    <!-- Inner tray -->
    <rect x="${left + 4}" y="${top + headerH}" width="${caseW - 8}" height="${caseH - headerH - 4}" fill="#0a0a0a"/>
  </g>
</svg>`);

  await sharp(svg)
    .composite([{ input: cover, left: artX, top: artY }])
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
      existing.find((i) => localPathFromUrl(i.url) && !String(i.url).includes('-showcase'))?.url ??
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
        await buildGameCase(srcPath, platformFromKey(key), outPath);
      } else {
        await buildHardwareWhite(srcPath, outPath, hardwareLabel(key));
      }

      const showcase = {
        url: relUrl(outPath),
        altText: `${key.replace(/-/g, ' ')} product showcase`,
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

  // Keep Switch 2 Zelda editions aliased to base Switch covers (already case-styled)
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
