#!/usr/bin/env node
/**
 * Flat retail game cases for GameMania UK.
 * - Keep original cover art untouched (no AI case redesign of the artwork itself).
 * - Wrap with official-style platform chrome matching real UK retail sleeves:
 *   Xbox Series X: green dual bars + sphere logo + GAME DISC footer + green border
 *   PS2: black header "PlayStation 2" + multicolour PS mark + PAL plate
 *   PS5 / PS4 / PS3 / Switch similarly
 * - Hardware: product photo on white + optional model strip
 *
 * Does NOT scrape CeX/Amazon.
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

/** Classic PlayStation family mark (multicolour) — PS2 header right. */
function playstationFamilyMarkSvg(cx, cy, scale = 1) {
  return `
  <g transform="translate(${cx},${cy}) scale(${scale})">
    <!-- Red P -->
    <path d="M-11 16 L-11 -12 Q-11 -20 -1 -20 Q10 -20 10 -9 Q10 0 -1 0 L-3 0 L-3 16 Z" fill="#e60012"/>
    <!-- Yellow/green/blue S strokes (iconic mark) -->
    <path d="M1 -4 Q15 -4 15 7 Q15 18 1 18" fill="none" stroke="#ffc20e" stroke-width="5.2" stroke-linecap="round"/>
    <path d="M-1 2 Q13 2 13 12 Q13 22 -1 22" fill="none" stroke="#00a651" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M-3 8 Q11 8 11 16 Q11 24 -3 24" fill="none" stroke="#0072ce" stroke-width="4.2" stroke-linecap="round"/>
  </g>`;
}

/** White Xbox sphere for green Series X header bar. */
function xboxSphereSvg(cx, cy, r) {
  return `
  <g transform="translate(${cx},${cy})">
    <circle r="${r}" fill="#ffffff"/>
    <!-- Green sphere / X-like core (retail look) -->
    <path fill="#107c10" d="
      M 0 ${-r * 0.78}
      C ${r * 0.5} ${-r * 0.5}, ${r * 0.82} ${-r * 0.08}, ${r * 0.7} ${r * 0.3}
      C ${r * 0.32} ${r * 0.1}, ${-r * 0.08} ${r * 0.08}, ${-r * 0.4} ${r * 0.34}
      C ${-r * 0.7} ${-r * 0.02}, ${-r * 0.52} ${-r * 0.52}, 0 ${-r * 0.78}
      Z"/>
    <path fill="#107c10" d="
      M ${-r * 0.68} ${r * 0.08}
      C ${-r * 0.32} ${r * 0.38}, ${r * 0.12} ${r * 0.56}, ${r * 0.52} ${r * 0.6}
      C ${r * 0.4} ${r * 0.78}, ${r * 0.18} ${r * 0.88}, 0 ${r * 0.88}
      C ${-r * 0.38} ${r * 0.88}, ${-r * 0.66} ${r * 0.62}, ${-r * 0.68} ${r * 0.08}
      Z"/>
  </g>`;
}

function buildHeaderSvg(platform, boxW, headerH) {
  if (platform === 'PS5') {
    return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <circle cx="38" cy="${headerH / 2}" r="18" fill="none" stroke="#000000" stroke-width="2.6"/>
  <text x="38" y="${headerH / 2 + 6}" text-anchor="middle"
    font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="12" font-weight="900" fill="#000">PS</text>
  <text x="68" y="${Math.round(headerH * 0.68)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="42" font-weight="900" fill="#000000" letter-spacing="2">PS5</text>
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
    font-size="36" font-weight="900" fill="#ffffff" letter-spacing="1">PS3</text>
  <text x="${boxW - 24}" y="${Math.round(headerH * 0.58)}" text-anchor="end"
    font-family="Arial, Helvetica, sans-serif"
    font-size="12" font-weight="600" fill="#c8c8c8" letter-spacing="0.6">PlayStation Network</text>
</svg>`);
  }
  if (platform === 'PS2') {
    // Official UK/EU print: black bar · PlayStation wordmark + outlined 2 · multicolour PS
    const mid = headerH / 2;
    return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000000"/>
  <text x="20" y="${mid + 8}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="25" font-weight="700" fill="#ffffff">PlayStation</text>
  <text x="188" y="${mid + 11}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="34" font-weight="900" fill="#000000" stroke="#ffffff" stroke-width="2.2"
    paint-order="stroke fill">2</text>
  ${playstationFamilyMarkSvg(boxW - 46, mid + 2, 1.08)}
</svg>`);
  }
  if (platform === 'XBOX') {
    // Official Xbox Series X sleeve: green bar · white sphere left · XBOX SERIES X right
    const mid = headerH / 2;
    return Buffer.from(`
<svg width="${boxW}" height="${headerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#107c10"/>
  ${xboxSphereSvg(38, mid, 19)}
  <text x="${boxW - 22}" y="${mid + 8}" text-anchor="end"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="22" font-weight="700" fill="#ffffff" letter-spacing="2.4">XBOX SERIES X</text>
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
    // Exact retail wording
    return Buffer.from(`
<svg width="${boxW}" height="${footerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#107c10"/>
  <text x="${boxW / 2}" y="${Math.round(footerH * 0.64)}" text-anchor="middle"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="13" font-weight="600" fill="#ffffff" letter-spacing="0.55">GAME DISC  |  Requires: Xbox Subscription &amp; Internet</text>
</svg>`);
  }
  return null;
}

/** PAL plate — retail PS2 placement under header on the right of the art face. */
function buildPs2PalOverlay(boxW, artH) {
  const w = 56;
  const h = 30;
  const x = boxW - w - 12;
  const y = 10;
  return Buffer.from(`
<svg width="${boxW}" height="${artH}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>
  <text x="${x + w / 2}" y="${y + 21}" text-anchor="middle"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="15" font-weight="900" fill="#000000" letter-spacing="1.2">PAL</text>
</svg>`);
}

/**
 * Original cover art + official chrome only (no 3D plastic / AI case body).
 */
async function buildGameBoxFlat(coverPath, platform, outPath) {
  const boxW = 620;
  const boxH = 860;
  const headerH =
    platform === 'XBOX' ? 76 : platform === 'PS2' ? 78 : platform === 'PS5' ? 90 : 86;
  const footerH = platform === 'XBOX' ? 48 : 0;
  const borderW = platform === 'XBOX' ? 8 : 0;
  const left = Math.round((SIZE - boxW) / 2);
  const top = Math.round((SIZE - boxH) / 2);

  // Inner art region
  const artLeft = left + borderW;
  const artTop = top + (platform === 'XBOX' ? borderW + headerH : headerH);
  const artW = boxW - borderW * 2;
  const artH =
    platform === 'XBOX'
      ? boxH - borderW * 2 - headerH - footerH
      : boxH - headerH - footerH;

  const cover = await sharp(coverPath)
    .resize(artW, artH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 96 })
    .toBuffer();

  const chromeW = platform === 'XBOX' ? boxW - borderW * 2 : boxW;
  const headerSvg = buildHeaderSvg(platform, chromeW, headerH);
  const footerSvg = footerH ? buildFooterSvg(platform, chromeW, footerH) : null;

  const caseFill = platform === 'XBOX' ? '#107c10' : '#ffffff';
  const frame = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f1f3"/>
  <defs>
    <filter id="soft" x="-12%" y="-12%" width="124%" height="124%">
      <feDropShadow dx="0" dy="5" stdDeviation="14" flood-color="#000000" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect x="${left}" y="${top}" width="${boxW}" height="${boxH}" rx="2" ry="2"
    fill="${caseFill}" filter="url(#soft)"/>
</svg>`);

  const layers = [];

  if (platform === 'XBOX') {
    layers.push({ input: headerSvg, left: left + borderW, top: top + borderW });
    layers.push({ input: cover, left: artLeft, top: artTop });
    if (footerSvg) {
      layers.push({
        input: footerSvg,
        left: left + borderW,
        top: top + boxH - borderW - footerH,
      });
    }
  } else {
    layers.push({ input: headerSvg, left, top });
    layers.push({ input: cover, left, top: artTop });
    if (platform === 'PS2') {
      layers.push({
        input: buildPs2PalOverlay(boxW, artH),
        left,
        top: artTop,
      });
    }
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
