#!/usr/bin/env node
/**
 * Retail face packshots matching official outer-case chrome:
 *  PS5 – translucent cobalt rim + white bar (PS mark + PS5)
 *  PS4 – translucent blue rim + blue PS4 bar
 *  PS3 – black bar (PS + PS3 | PlayStation Network) + thin red rule
 *  PS2 – bright blue rim + black “PlayStation.2” bar + multicolour mark + PAL
 *  Xbox Series – green rim + green bar (sphere + XBOX SERIES X|S)
 *
 * Cover art is local only. No competitor / marketplace scrape.
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

/** Official-style PS circle monogram (black) used on retail PS5 sleeves. */
function psMarkBlack(cx, cy, s = 1) {
  return `
  <g transform="translate(${cx},${cy}) scale(${s})">
    <circle cx="0" cy="0" r="16" fill="none" stroke="#111" stroke-width="2.6"/>
    <text x="0" y="5" text-anchor="middle"
      font-family="Arial Black, Arial, sans-serif" font-size="12" font-weight="900" fill="#111">PS</text>
  </g>`;
}

/** Multicolour Family mark — PS2 right of header. */
function psFamilyColour(cx, cy, scale = 1) {
  return `
  <g transform="translate(${cx},${cy}) scale(${scale})">
    <path d="M-12 17 L-12 -13 Q-12 -21 -2 -21 Q9 -21 9 -10 Q9 -1 -2 -1 L-4 -1 L-4 17 Z" fill="#e60012"/>
    <path d="M0 -5 Q14 -5 14 6 Q14 17 0 17" fill="none" stroke="#ffc20e" stroke-width="5" stroke-linecap="round"/>
    <path d="M-2 1 Q12 1 12 11 Q12 21 -2 21" fill="none" stroke="#00a651" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M-4 7 Q10 7 10 15 Q10 23 -4 23" fill="none" stroke="#0072ce" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

/** White PS circle monogram (PS3 / PS4 dark headers). */
function psMarkWhite(cx, cy, s = 1) {
  return `
  <g transform="translate(${cx},${cy}) scale(${s})">
    <circle cx="0" cy="0" r="15" fill="none" stroke="#fff" stroke-width="2.4"/>
    <text x="0" y="5" text-anchor="middle"
      font-family="Arial Black, Arial, sans-serif" font-size="11" font-weight="900" fill="#fff">PS</text>
  </g>`;
}

function xboxSphere(cx, cy, r) {
  return `
  <g transform="translate(${cx},${cy})">
    <circle r="${r}" fill="#ffffff"/>
    <path fill="#107c10" d="
      M 0 ${-r * 0.78}
      C ${r * 0.5} ${-r * 0.5}, ${r * 0.82} ${-r * 0.08}, ${r * 0.7} ${r * 0.3}
      C ${r * 0.32} ${r * 0.1}, ${-r * 0.08} ${r * 0.08}, ${-r * 0.4} ${r * 0.34}
      C ${-r * 0.7} ${-r * 0.02}, ${-r * 0.52} ${-r * 0.52}, 0 ${-r * 0.78} Z"/>
    <path fill="#107c10" d="
      M ${-r * 0.68} ${r * 0.08}
      C ${-r * 0.32} ${r * 0.38}, ${r * 0.12} ${r * 0.56}, ${r * 0.52} ${r * 0.6}
      C ${r * 0.4} ${r * 0.78}, ${r * 0.18} ${r * 0.88}, 0 ${r * 0.88}
      C ${-r * 0.38} ${r * 0.88}, ${-r * 0.66} ${r * 0.62}, ${-r * 0.68} ${r * 0.08} Z"/>
  </g>`;
}

function psnGlobe(cx, cy, r = 10) {
  return `
  <g transform="translate(${cx},${cy})">
    <circle r="${r}" fill="none" stroke="#4da3ff" stroke-width="1.6"/>
    <ellipse cx="0" cy="0" rx="${r * 0.45}" ry="${r}" fill="none" stroke="#4da3ff" stroke-width="1.2"/>
    <path d="M ${-r} 0 H ${r}" stroke="#4da3ff" stroke-width="1.2" fill="none"/>
    <path d="M ${-r * 0.85} ${-r * 0.4} H ${r * 0.85}" stroke="#4da3ff" stroke-width="1" fill="none"/>
    <path d="M ${-r * 0.85} ${r * 0.4} H ${r * 0.85}" stroke="#4da3ff" stroke-width="1" fill="none"/>
  </g>`;
}

function headerSvg(platform, w, h) {
  if (platform === 'PS5') {
    // Ref Image 1 — solid white bar, black PS mark left, PS5 wordmark
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${psMarkBlack(38, h / 2, 0.95)}
  <text x="68" y="${Math.round(h * 0.66)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${Math.round(h * 0.42)}" font-weight="900" fill="#111"
    letter-spacing="1">PS5</text>
</svg>`);
  }
  if (platform === 'PS4') {
    // Official PS4 chrome — deep blue bar, white PS mark + PS4
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#003087"/>
  ${psMarkWhite(34, h / 2, 0.85)}
  <text x="62" y="${Math.round(h * 0.66)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${Math.round(h * 0.4)}" font-weight="900" fill="#fff"
    letter-spacing="1">PS4</text>
</svg>`);
  }
  if (platform === 'PS3') {
    // Ref Image 3 — black bar, PS + PS3 left, PSN right, red rule below drawn separately
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0a0a0a"/>
  ${psMarkWhite(30, h / 2 - 1, 0.72)}
  <text x="54" y="${Math.round(h * 0.64)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${Math.round(h * 0.38)}" font-weight="900" fill="#fff">PS3</text>
  ${psnGlobe(w - 158, h / 2, 9)}
  <text x="${w - 14}" y="${Math.round(h * 0.58)}" text-anchor="end"
    font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#e8e8e8">PlayStation®Network</text>
</svg>`);
  }
  if (platform === 'PS2') {
    // Ref Image 2/4 — black “PlayStation.2” + multicolour mark
    const mid = h / 2;
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000000"/>
  <text x="16" y="${mid + 8}"
    font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" fill="#fff">PlayStation</text>
  <text x="155" y="${mid + 9}"
    font-family="Arial Black, Arial, sans-serif" font-size="28" font-weight="900"
    fill="#000" stroke="#fff" stroke-width="2.2" paint-order="stroke fill">.2</text>
  ${psFamilyColour(w - 42, mid + 1, 1)}
</svg>`);
  }
  if (platform === 'XBOX') {
    // Ref Image 5 — green bar, white sphere left, XBOX SERIES X|S right
    const mid = h / 2;
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#107c10"/>
  ${xboxSphere(32, mid, 15)}
  <text x="${w - 16}" y="${mid + 7}" text-anchor="end"
    font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="17" font-weight="700"
    fill="#fff" letter-spacing="1.5">XBOX SERIES X|S</text>
</svg>`);
  }
  if (platform === 'SWITCH' || platform === 'SWITCH2') {
    const label = platform === 'SWITCH2' ? 'Nintendo Switch 2' : 'Nintendo Switch';
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e60012"/>
  <text x="20" y="${Math.round(h * 0.64)}"
    font-family="Arial Black, Arial, sans-serif" font-size="22" font-weight="900" fill="#fff">${label}</text>
</svg>`);
  }
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#222"/><text x="20" y="40" fill="#fff" font-size="24">GAME</text>
</svg>`);
}

/**
 * Front-face retail case using official top bars from frontend/public/images
 * (ps5-top, ps4-top, ps3-top, playstaion2-top, XBOX-sereis-top).
 */
async function platformTopBar(platform) {
  const file =
    platform === 'PS5'
      ? 'ps5-top.png'
      : platform === 'PS4'
        ? 'ps4-top.png'
        : platform === 'PS3'
          ? 'ps3-top.png'
          : platform === 'PS2'
            ? 'playstaion2-top.png'
            : platform === 'XBOX'
              ? 'XBOX-sereis-top.png'
              : null;
  if (!file) return null;
  const abs = path.join(PUBLIC, 'images', file);
  return fs.existsSync(abs) ? abs : null;
}

async function buildRetailFace(coverPath, platform, outPath) {
  const caseW = 620;
  const caseH = 880;
  const left = Math.round((SIZE - caseW) / 2);
  const top = Math.round((SIZE - caseH) / 2);

  let rim = 14;
  let rimColor = '#1a56c4';
  let rimDeep = '#0b2f78';
  let headerH = 92;
  let redRule = 0;

  switch (platform) {
    case 'PS5':
      rim = 16;
      rimColor = '#1e6fe0';
      rimDeep = '#0a3d9c';
      headerH = 96;
      break;
    case 'PS4':
      rim = 16;
      rimColor = '#1a5fd0';
      rimDeep = '#003087';
      headerH = 88;
      break;
    case 'PS3':
      rim = 10;
      rimColor = '#1a1a1a';
      rimDeep = '#000000';
      headerH = 78;
      redRule = 4;
      break;
    case 'PS2':
      rim = 18;
      rimColor = '#0072ce';
      rimDeep = '#004a8c';
      headerH = 72;
      break;
    case 'XBOX':
      rim = 16;
      rimColor = '#107c10';
      rimDeep = '#0a520a';
      headerH = 72;
      break;
    case 'SWITCH':
    case 'SWITCH2':
      rim = 10;
      rimColor = '#e60012';
      rimDeep = '#b0000e';
      headerH = 72;
      break;
    default:
      rim = 10;
      rimColor = '#333';
      rimDeep = '#111';
      headerH = 70;
  }

  const faceX = left + rim;
  const faceY = top + rim;
  const faceW = caseW - rim * 2;
  const faceH = caseH - rim * 2;

  // Prefer client-supplied official top bar PNGs
  const topPath = await platformTopBar(platform);
  let headerBuf = null;
  if (topPath) {
    const meta = await sharp(topPath).metadata();
    const srcW = meta.width || 1200;
    const srcH = meta.height || 120;
    headerH = Math.max(56, Math.round(faceW * (srcH / srcW)));
    headerBuf = await sharp(topPath)
      .resize(faceW, headerH, { fit: 'fill' })
      .png()
      .toBuffer();
    // Official bars already include accents (e.g. PS3 red rule)
    redRule = 0;
  } else {
    headerBuf = headerSvg(platform, faceW, headerH);
  }

  const artH = faceH - headerH - redRule;
  const artW = faceW;

  const cover = await sharp(coverPath)
    .resize(artW, artH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 96 })
    .toBuffer();

  const layers = [
    { input: headerBuf, left: faceX, top: faceY },
    { input: cover, left: faceX, top: faceY + headerH + redRule },
  ];

  if (redRule > 0) {
    const rule = Buffer.from(`
<svg width="${faceW}" height="${redRule}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e10600"/>
</svg>`);
    layers.splice(1, 0, { input: rule, left: faceX, top: faceY + headerH });
  }

  if (platform === 'PS2' && !topPath) {
    const pal = Buffer.from(`
<svg width="${faceW}" height="${artH}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${faceW - 56}" y="10" width="46" height="24" fill="#fff"/>
  <text x="${faceW - 33}" y="27" text-anchor="middle"
    font-family="Arial Black, Arial, sans-serif" font-size="13" font-weight="900" fill="#000">PAL</text>
</svg>`);
    layers.push({ input: pal, left: faceX, top: faceY + headerH + redRule });
  }

  const shell = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rimG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${rimColor}"/>
      <stop offset="55%" stop-color="${rimDeep}"/>
      <stop offset="100%" stop-color="${rimColor}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.28"/>
      <stop offset="40%" stop-color="#fff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="drop" x="-12%" y="-12%" width="124%" height="124%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#f0f1f3"/>
  <rect x="${left}" y="${top}" width="${caseW}" height="${caseH}" rx="4" ry="4"
    fill="url(#rimG)" filter="url(#drop)"/>
  <rect x="${faceX}" y="${faceY}" width="${faceW}" height="${faceH}" fill="#0a0a0a"/>
  <rect x="${left}" y="${top}" width="${caseW}" height="${caseH}" rx="4" fill="url(#shine)"/>
  <rect x="${faceX}" y="${faceY}" width="${faceW}" height="${faceH}" fill="#0a0a0a"/>
</svg>`);

  await sharp(shell)
    .composite(layers)
    .jpeg({ quality: 95 })
    .toFile(outPath);
}

async function buildHardwareWhite(srcPath, outPath, labelText = '') {
  const maxH = labelText ? Math.round(SIZE * 0.72) : Math.round(SIZE * 0.86);
  const resized = await sharp(srcPath)
    .resize(Math.round(SIZE * 0.86), maxH, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const left = Math.round((SIZE - (meta.width || 0)) / 2);
  const top = Math.round((SIZE - (meta.height || 0)) / 2) - (labelText ? 36 : 0);
  const layers = [{ input: resized, left, top }];
  if (labelText) {
    const badge = Buffer.from(`
<svg width="${SIZE}" height="64" xmlns="http://www.w3.org/2000/svg">
  <rect x="120" y="6" width="760" height="50" rx="10" fill="#0f172a"/>
  <text x="500" y="40" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
    font-size="22" font-weight="700" fill="#ffffff">${labelText}</text>
</svg>`);
    layers.push({ input: badge, left: 0, top: SIZE - 78 });
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
    .jpeg({ quality: 94 })
    .toFile(outPath);
}

function hardwareLabel(key) {
  if (key === 'ps5-slim-disc') return 'PS5 Slim · Disc Edition';
  if (key === 'ps5-slim-digital') return 'PS5 Slim · Digital Edition';
  if (key === 'ps5-original-disc') return 'PS5 Original · Disc Edition';
  if (key === 'ps5-original-digital') return 'PS5 Original · Digital Edition';
  if (key.startsWith('dualsense-')) {
    return key
      .replace('dualsense-', 'DualSense · ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (key.startsWith('dualshock4-')) {
    return key
      .replace('dualshock4-', 'DualShock 4 · ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
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
          (String(i.url).includes('-fixed') || /\.(jpe?g|png|webp)$/i.test(String(i.url))) &&
          !/\.svg$/i.test(String(i.url)),
      )?.url ??
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
        await buildRetailFace(srcPath, platformFromKey(key), outPath);
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
      let rest = existing
        .filter((i) => i.url !== showcase.url)
        .map((i, idx) => ({ ...i, isPrimary: false, sortOrder: idx + 1 }));
      if (key.includes('dualsense') || key.includes('dualshock')) {
        rest = rest
          .filter(
            (i) =>
              String(i.url).includes('-fixed') ||
              (String(i.url).includes(key) && !String(i.url).includes('showcase')),
          )
          .slice(0, 2)
          .map((i, idx) => ({ ...i, isPrimary: false, sortOrder: idx + 1 }));
      }
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
