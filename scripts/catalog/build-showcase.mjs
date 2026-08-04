#!/usr/bin/env node
/**
 * Retail packshot cases for GameMania UK games.
 *
 * PlayStation: official UK Blu-ray / DVD outer-case frames
 * (same packshot style used by UK shops for physical PS stock:
 *  PS5 translucent blue BD case, PS4 blue BD, PS3 black BD, PS2 black DVD).
 * Cover ART is our local art only — never redrawn or scraped from competitors.
 *
 * Xbox Series: translucent green plastic outer case (Series X/S retail packshot).
 *
 * Does NOT scrape The Game Collection, CeX, or Amazon product images.
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
const CASE_DIR = path.join(PUBLIC, 'catalog', '_case-shells');

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

function isPlayStation(platform) {
  return platform === 'PS5' || platform === 'PS4' || platform === 'PS3' || platform === 'PS2';
}

/** Case plastic colour (UK retail packshot style). */
function casePlastic(platform) {
  switch (platform) {
    case 'PS5':
      // Translucent cobalt Blu-ray style
      return { deep: '#0a2a6e', mid: '#0e4db5', light: '#3d7fe0', tint: '#1a5fd0' };
    case 'PS4':
      return { deep: '#001a4d', mid: '#002b7a', light: '#1a4fad', tint: '#003791' };
    case 'PS3':
      return { deep: '#0a0a0a', mid: '#1a1a1a', light: '#333333', tint: '#121212' };
    case 'PS2':
      return { deep: '#050505', mid: '#141414', light: '#2a2a2a', tint: '#0d0d0d' };
    default:
      return { deep: '#111', mid: '#222', light: '#444', tint: '#1a1a1a' };
  }
}

function playstationFamilyMarkSvg(cx, cy, scale = 1) {
  return `
  <g transform="translate(${cx},${cy}) scale(${scale})">
    <path d="M-11 16 L-11 -12 Q-11 -20 -1 -20 Q10 -20 10 -9 Q10 0 -1 0 L-3 0 L-3 16 Z" fill="#e60012"/>
    <path d="M1 -4 Q15 -4 15 7 Q15 18 1 18" fill="none" stroke="#ffc20e" stroke-width="5.2" stroke-linecap="round"/>
    <path d="M-1 2 Q13 2 13 12 Q13 22 -1 22" fill="none" stroke="#00a651" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M-3 8 Q11 8 11 16 Q11 24 -3 24" fill="none" stroke="#0072ce" stroke-width="4.2" stroke-linecap="round"/>
  </g>`;
}

function xboxSphereSvg(cx, cy, r) {
  return `
  <g transform="translate(${cx},${cy})">
    <circle r="${r}" fill="#ffffff"/>
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

/**
 * Official insert header printed on the sleeve (inside the outer case window).
 */
function buildInsertHeaderSvg(platform, w, h) {
  if (platform === 'PS5') {
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <circle cx="34" cy="${h / 2}" r="15" fill="none" stroke="#000" stroke-width="2.4"/>
  <text x="34" y="${h / 2 + 5}" text-anchor="middle"
    font-family="Arial Black, Arial, sans-serif" font-size="11" font-weight="900" fill="#000">PS</text>
  <text x="58" y="${Math.round(h * 0.68)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="36" font-weight="900" fill="#000" letter-spacing="1.5">PS5</text>
</svg>`);
  }
  if (platform === 'PS4') {
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#003087"/>
  <text x="22" y="${Math.round(h * 0.66)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="32" font-weight="900" fill="#fff" letter-spacing="1">PS4</text>
</svg>`);
  }
  if (platform === 'PS3') {
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0a0a0a"/>
  <text x="20" y="${Math.round(h * 0.64)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="30" font-weight="900" fill="#fff">PS3</text>
  <text x="${w - 18}" y="${Math.round(h * 0.58)}" text-anchor="end"
    font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#ccc">PlayStation Network</text>
</svg>`);
  }
  if (platform === 'PS2') {
    const mid = h / 2;
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000000"/>
  <text x="16" y="${mid + 7}" font-family="Arial, Helvetica, sans-serif"
    font-size="22" font-weight="700" fill="#fff">PlayStation</text>
  <text x="164" y="${mid + 10}" font-family="Arial Black, Arial, sans-serif"
    font-size="30" font-weight="900" fill="#000" stroke="#fff" stroke-width="2"
    paint-order="stroke fill">2</text>
  ${playstationFamilyMarkSvg(w - 40, mid + 2, 0.95)}
</svg>`);
  }
  if (platform === 'XBOX') {
    const mid = h / 2;
    return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#107c10"/>
  ${xboxSphereSvg(34, mid, 16)}
  <text x="${w - 18}" y="${mid + 7}" text-anchor="end"
    font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700"
    fill="#fff" letter-spacing="2">XBOX SERIES X</text>
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

function buildXboxFooter(w, h) {
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#107c10"/>
  <text x="${w / 2}" y="${Math.round(h * 0.64)}" text-anchor="middle"
    font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="600"
    fill="#fff" letter-spacing="0.5">GAME DISC  |  Requires: Xbox Subscription &amp; Internet</text>
</svg>`);
}

/**
 * Outer PlayStation retail case shell (plastic body + spine + glossy edges).
 * Matches the packshot language UK shops use for physical PS cases —
 * not a website screenshot scrape.
 */
function playstationOuterCaseSvg(platform, caseX, caseY, caseW, caseH, spineW, faceX, faceY, faceW, faceH) {
  const c = casePlastic(platform);
  const spineLabel =
    platform === 'PS5'
      ? 'PS5'
      : platform === 'PS4'
        ? 'PS4'
        : platform === 'PS3'
          ? 'PS3'
          : 'PS2';
  const spineText =
    platform === 'PS2'
      ? 'PlayStation®2'
      : platform === 'PS5'
        ? 'PlayStation®5'
        : platform === 'PS4'
          ? 'PlayStation®4'
          : 'PlayStation®3';

  // Blu-ray badge on PS3/PS4/PS5 plastic top rail
  const showBluRay = platform === 'PS5' || platform === 'PS4' || platform === 'PS3';

  return Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="plast" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.light}" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="${c.mid}" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="${c.deep}" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="spineG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${c.deep}"/>
      <stop offset="40%" stop-color="${c.mid}"/>
      <stop offset="100%" stop-color="${c.light}" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="drop" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Page plate -->
  <rect width="100%" height="100%" fill="#f4f5f7"/>

  <!-- Outer plastic shell -->
  <rect x="${caseX}" y="${caseY}" width="${caseW}" height="${caseH}" rx="6" ry="6"
    fill="url(#plast)" filter="url(#drop)"/>

  <!-- Spine (left thickness) -->
  <rect x="${caseX}" y="${caseY}" width="${spineW}" height="${caseH}" rx="6" ry="6" fill="url(#spineG)"/>
  <rect x="${caseX + spineW - 4}" y="${caseY}" width="4" height="${caseH}" fill="#000" opacity="0.18"/>

  <!-- Spine wordmark (vertical) -->
  <text x="${caseX + spineW / 2}" y="${caseY + caseH / 2}"
    transform="rotate(-90 ${caseX + spineW / 2} ${caseY + caseH / 2})"
    text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
    font-size="13" font-weight="700" fill="#ffffff" letter-spacing="2" opacity="0.92">${spineText}</text>

  <!-- Face window rim (where cover sits) -->
  <rect x="${faceX - 3}" y="${faceY - 3}" width="${faceW + 6}" height="${faceH + 6}"
    rx="2" fill="${c.deep}" opacity="0.5"/>
  <rect x="${faceX - 1}" y="${faceY - 1}" width="${faceW + 2}" height="${faceH + 2}"
    rx="1" fill="#0a0a0a"/>

  ${
    showBluRay
      ? `
  <!-- Blu-ray style top mark on plastic (right of spine, above face) -->
  <g transform="translate(${faceX + faceW - 88}, ${caseY + 10})">
    <rect width="78" height="18" rx="2" fill="#000" opacity="0.35"/>
    <text x="39" y="13" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
      font-size="10" font-weight="700" fill="#9ec5ff" letter-spacing="0.5">Blu-ray Disc™</text>
  </g>`
      : ''
  }

  <!-- Soft plastic sheen on outer rims only (does not sit on insert art) -->
  <rect x="${caseX}" y="${caseY}" width="${caseW}" height="${caseH}" rx="6" fill="url(#gloss)"/>
  <!-- Clear face hole so insert shows through sheen -->
  <rect x="${faceX}" y="${faceY}" width="${faceW}" height="${faceH}" fill="#f4f5f7"/>
</svg>`);
}

/**
 * PlayStation packshot: plastic outer case + official insert (header + original cover).
 */
async function buildPlayStationPackshot(coverPath, platform, outPath) {
  // Geometry: centered BD-style case
  const spineW = platform === 'PS2' ? 52 : 48;
  const caseW = 620;
  const caseH = platform === 'PS2' ? 820 : 840;
  const caseX = Math.round((SIZE - caseW) / 2);
  const caseY = Math.round((SIZE - caseH) / 2);

  // Insert face inset from case plastic edges
  const facePad = 14;
  const faceTopPad = platform === 'PS2' ? 18 : 36; // room for Blu-ray mark
  const faceX = caseX + spineW + facePad;
  const faceY = caseY + faceTopPad;
  const faceW = caseW - spineW - facePad * 2 - 10;
  const faceH = caseH - faceTopPad - facePad - 12;

  const headerH =
    platform === 'PS5' ? 78 : platform === 'PS2' ? 72 : platform === 'PS4' ? 74 : 70;
  const artH = faceH - headerH;
  const artW = faceW;

  const cover = await sharp(coverPath)
    .resize(artW, artH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 96 })
    .toBuffer();

  const header = buildInsertHeaderSvg(platform, faceW, headerH);

  // Full insert surface (header + art) then placed into case face
  const insertCanvas = await sharp({
    create: {
      width: faceW,
      height: faceH,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([
      { input: header, left: 0, top: 0 },
      { input: cover, left: 0, top: headerH },
    ])
    .jpeg({ quality: 96 })
    .toBuffer();

  // PS2 PAL badge on insert (top-right under header)
  let insertFinal = insertCanvas;
  if (platform === 'PS2') {
    const pal = Buffer.from(`
<svg width="${faceW}" height="${faceH}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${faceW - 58}" y="${headerH + 10}" width="48" height="26" fill="#fff"/>
  <text x="${faceW - 34}" y="${headerH + 28}" text-anchor="middle"
    font-family="Arial Black, Arial, sans-serif" font-size="13" font-weight="900" fill="#000">PAL</text>
</svg>`);
    insertFinal = await sharp(insertCanvas)
      .composite([{ input: pal, left: 0, top: 0 }])
      .jpeg({ quality: 96 })
      .toBuffer();
  }

  const shell = playstationOuterCaseSvg(
    platform,
    caseX,
    caseY,
    caseW,
    caseH,
    spineW,
    faceX,
    faceY,
    faceW,
    faceH,
  );

  // Light glint on left spine only (mask so art stays clean)
  const spineGloss = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${caseX}" y="${caseY}" width="${spineW}" height="${caseH}" fill="url(#sg)"/>
</svg>`);

  await sharp(shell)
    .composite([
      { input: insertFinal, left: faceX, top: faceY },
      { input: spineGloss, left: 0, top: 0 },
    ])
    .jpeg({ quality: 95 })
    .toFile(outPath);
}

/**
 * Xbox Series X/S packshot: translucent green plastic outer case + insert
 * (header + cover art + green GAME DISC footer) — same retail packshot style as PS.
 */
async function buildXboxSeriesSleeve(coverPath, outPath) {
  const deep = '#0a4a0a';
  const mid = '#107c10';
  const light = '#28a828';
  const spineW = 48;
  const caseW = 620;
  const caseH = 840;
  const caseX = Math.round((SIZE - caseW) / 2);
  const caseY = Math.round((SIZE - caseH) / 2);

  const facePad = 14;
  const faceTopPad = 28;
  const faceX = caseX + spineW + facePad;
  const faceY = caseY + faceTopPad;
  const faceW = caseW - spineW - facePad * 2 - 10;
  const faceH = caseH - faceTopPad - facePad - 12;

  const headerH = 70;
  const footerH = 44;
  const artH = faceH - headerH - footerH;
  const artW = faceW;

  const cover = await sharp(coverPath)
    .resize(artW, artH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 96 })
    .toBuffer();

  const header = buildInsertHeaderSvg('XBOX', faceW, headerH);
  const footer = buildXboxFooter(faceW, footerH);

  const insert = await sharp({
    create: {
      width: faceW,
      height: faceH,
      channels: 3,
      background: { r: 16, g: 124, b: 16 },
    },
  })
    .composite([
      { input: header, left: 0, top: 0 },
      { input: cover, left: 0, top: headerH },
      { input: footer, left: 0, top: headerH + artH },
    ])
    .jpeg({ quality: 96 })
    .toBuffer();

  const shell = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="xplast" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${light}" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="${mid}" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="${deep}" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="xspine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${deep}"/>
      <stop offset="45%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${light}" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="xgloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="xdrop" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="#f4f5f7"/>

  <!-- Outer green plastic -->
  <rect x="${caseX}" y="${caseY}" width="${caseW}" height="${caseH}" rx="6" ry="6"
    fill="url(#xplast)" filter="url(#xdrop)"/>

  <!-- Spine -->
  <rect x="${caseX}" y="${caseY}" width="${spineW}" height="${caseH}" rx="6" ry="6" fill="url(#xspine)"/>
  <rect x="${caseX + spineW - 4}" y="${caseY}" width="4" height="${caseH}" fill="#000" opacity="0.2"/>
  <text x="${caseX + spineW / 2}" y="${caseY + caseH / 2}"
    transform="rotate(-90 ${caseX + spineW / 2} ${caseY + caseH / 2})"
    text-anchor="middle" font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="14" font-weight="700" fill="#ffffff" letter-spacing="3">XBOX</text>

  <!-- Face window rim -->
  <rect x="${faceX - 3}" y="${faceY - 3}" width="${faceW + 6}" height="${faceH + 6}"
    rx="2" fill="${deep}" opacity="0.55"/>
  <rect x="${faceX - 1}" y="${faceY - 1}" width="${faceW + 2}" height="${faceH + 2}"
    rx="1" fill="#061a06"/>

  <!-- Disc format mark on plastic rail -->
  <g transform="translate(${faceX + faceW - 92}, ${caseY + 8})">
    <rect width="84" height="16" rx="2" fill="#000" opacity="0.28"/>
    <text x="42" y="12" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
      font-size="9" font-weight="700" fill="#b8f0b8" letter-spacing="0.4">GAME DISC</text>
  </g>

  <rect x="${caseX}" y="${caseY}" width="${caseW}" height="${caseH}" rx="6" fill="url(#xgloss)"/>
  <rect x="${faceX}" y="${faceY}" width="${faceW}" height="${faceH}" fill="#f4f5f7"/>
</svg>`);

  const spineGloss = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="xsg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${caseX}" y="${caseY}" width="${spineW}" height="${caseH}" fill="url(#xsg)"/>
</svg>`);

  await sharp(shell)
    .composite([
      { input: insert, left: faceX, top: faceY },
      { input: spineGloss, left: 0, top: 0 },
    ])
    .jpeg({ quality: 95 })
    .toFile(outPath);
}

/** Switch / generic flat insert. */
async function buildGenericBox(coverPath, platform, outPath) {
  const boxW = 600;
  const boxH = 840;
  const headerH = 78;
  const left = Math.round((SIZE - boxW) / 2);
  const top = Math.round((SIZE - boxH) / 2);
  const artW = boxW;
  const artH = boxH - headerH;

  const cover = await sharp(coverPath)
    .resize(artW, artH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 96 })
    .toBuffer();
  const header = buildInsertHeaderSvg(platform, boxW, headerH);

  const frame = Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f1f3"/>
  <defs>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="12" flood-color="#000" flood-opacity="0.14"/>
    </filter>
  </defs>
  <rect x="${left}" y="${top}" width="${boxW}" height="${boxH}" rx="3" fill="#fff" filter="url(#soft)"/>
</svg>`);

  await sharp(frame)
    .composite([
      { input: header, left, top },
      { input: cover, left, top: top + headerH },
    ])
    .jpeg({ quality: 95 })
    .toFile(outPath);
}

async function buildGameBox(coverPath, platform, outPath) {
  if (isPlayStation(platform)) {
    return buildPlayStationPackshot(coverPath, platform, outPath);
  }
  if (platform === 'XBOX') {
    return buildXboxSeriesSleeve(coverPath, outPath);
  }
  return buildGenericBox(coverPath, platform, outPath);
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
  fs.mkdirSync(CASE_DIR, { recursive: true });

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
        await buildGameBox(srcPath, platformFromKey(key), outPath);
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
