#!/usr/bin/env node
/**
 * Amazon/CeX-style flat retail cases:
 * - Games: keep original cover art; wrap with official platform chrome
 *   (PS5 white bar, Xbox Series green bars, PS2/PS3 black headers).
 * - Hardware: product photo on light plate + optional model strip.
 *
 * Does NOT scrape CeX/Amazon. Uses local catalog art only.
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

/** Official retail header/footer chrome only — cover art is left unchanged. */
function buildHeaderSvg(platform, boxW, headerH) {
  if (platform === 'PS5') {
    return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <!-- PlayStation family mark (simplified) -->
  <g transform="translate(22,${Math.round(headerH * 0.22)})">
    <circle cx="18" cy="18" r="16" fill="none" stroke="#000" stroke-width="2.5"/>
    <text x="18" y="24" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
      font-size="13" font-weight="900" fill="#000">PS</text>
  </g>
  <text x="64" y="${Math.round(headerH * 0.66)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="40" font-weight="900" fill="#000000" letter-spacing="1">PS5</text>
</svg>`);
  }
  if (platform === 'PS4') {
    return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#003087"/>
  <text x="28" y="${Math.round(headerH * 0.66)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="38" font-weight="900" fill="#ffffff" letter-spacing="1">PS4</text>
</svg>`);
  }
  if (platform === 'PS3') {
    return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0a0a0a"/>
  <text x="24" y="${Math.round(headerH * 0.64)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="34" font-weight="900" fill="#ffffff">PS3</text>
  <text x="${boxW - 24}" y="${Math.round(headerH * 0.58)}" text-anchor="end"
    font-family="Arial, Helvetica, sans-serif"
    font-size="13" font-weight="600" fill="#cccccc" letter-spacing="0.5">PlayStation Network</text>
</svg>`);
  }
  if (platform === 'PS2') {
    return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000000"/>
  <text x="22" y="${Math.round(headerH * 0.62)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="28" font-weight="900" fill="#ffffff">PlayStation 2</text>
  <!-- Multicolour PS mark (approximate) -->
  <g transform="translate(${boxW - 86},${Math.round(headerH * 0.2)})">
    <circle cx="28" cy="28" r="26" fill="#111" stroke="#333" stroke-width="1"/>
    <text x="16" y="24" font-family="Arial Black, Arial, sans-serif" font-size="14" fill="#e60012">P</text>
    <text x="28" y="34" font-family="Arial Black, Arial, sans-serif" font-size="14" fill="#ffcc00">S</text>
    <circle cx="14" cy="40" r="3" fill="#00a651"/>
    <circle cx="42" cy="18" r="3" fill="#0072bc"/>
  </g>
</svg>`);
  }
  if (platform === 'XBOX') {
    return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#107c10"/>
  <!-- Xbox sphere mark -->
  <circle cx="40" cy="${headerH / 2}" r="20" fill="#ffffff"/>
  <path d="M28 ${headerH / 2 - 2} Q40 ${headerH / 2 - 18} 52 ${headerH / 2 - 2}
           Q40 ${headerH / 2 + 16} 28 ${headerH / 2 - 2} Z" fill="#107c10"/>
  <text x="${boxW - 28}" y="${Math.round(headerH * 0.62)}" text-anchor="end"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="22" font-weight="700" fill="#ffffff" letter-spacing="1.5">XBOX SERIES X</text>
</svg>`);
  }
  if (platform === 'SWITCH' || platform === 'SWITCH2') {
    const label = platform === 'SWITCH2' ? 'Nintendo Switch 2' : 'Nintendo Switch';
    return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e60012"/>
  <text x="28" y="${Math.round(headerH * 0.64)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="26" font-weight="900" fill="#ffffff">${label}</text>
</svg>`);
  }
  return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#222222"/>
  <text x="28" y="${Math.round(headerH * 0.64)}"
    font-family="Arial Black, Arial, sans-serif" font-size="32" font-weight="900" fill="#fff">GAME</text>
</svg>`);
}

function buildFooterSvg(platform, boxW, footerH) {
  if (platform === 'XBOX') {
    return Buffer.from(`
<svg width="${boxW}" height="${footerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#107c10"/>
  <text x="24" y="${Math.round(footerH * 0.62)}"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="14" font-weight="600" fill="#ffffff" letter-spacing="0.4">GAME DISC  |  Requires: Xbox Subscription &amp; Internet</text>
</svg>`);
  }
  if (platform === 'PS2') {
    return Buffer.from(`
<svg width="${boxW}" height="${footerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="transparent"/>
  <rect x="${boxW - 72}" y="8" width="52" height="28" rx="2" fill="#ffffff"/>
  <text x="${boxW - 46}" y="28" text-anchor="middle"
    font-family="Arial Black, Arial, sans-serif" font-size="14" font-weight="900" fill="#000">PAL</text>
</svg>`);
  }
  return null;
}

/**
 * Flat boxed front: original cover art only in art region + official chrome.
 */
async function buildGameBoxFlat(coverPath, platform, outPath) {
  const boxW = 620;
  const boxH = 860;
  const headerH = platform === 'XBOX' || platform === 'PS5' ? 92 : 88;
  const footerH = platform === 'XBOX' ? 52 : platform === 'PS2' ? 40 : 0;
  const left = Math.round((SIZE - boxW) / 2);
  const top = Math.round((SIZE - boxH) / 2);
  const artW = boxW;
  const artH = boxH - headerH - footerH;

  // Cover art only — no filters that invent "AI plastic" cases
  const cover = await sharp(coverPath)
    .resize(artW, artH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 96 })
    .toBuffer();

  const headerSvg = buildHeaderSvg(platform, boxW, headerH);
  const footerSvg = footerH ? buildFooterSvg(platform, boxW, footerH) : null;

  const frame = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <defs>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect x="${left}" y="${top}" width="${boxW}" height="${boxH}" rx="3" ry="3" fill="#ffffff" filter="url(#soft)"/>
</svg>`);

  const layers = [
    { input: headerSvg, left, top },
    { input: cover, left, top: top + headerH },
  ];
  if (footerSvg) {
    layers.push({ input: footerSvg, left, top: top + headerH + artH });
  }

  await sharp(frame).composite(layers).jpeg({ quality: 95 }).toFile(outPath);
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
  <text x="500" y="40" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff">${labelText}</text>
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
    // Prefer colour-fixed / primary sources over old showcases and SVG placeholders
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
      // Controllers: only keep colour-fixed + showcase (avoid wrong multi-colour galleries)
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
