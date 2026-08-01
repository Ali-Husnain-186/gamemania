#!/usr/bin/env node
/**
 * Fetch catalog images (RAWG for games) and write database/prisma/catalog-images.json
 * Hardware keys get local SVG placeholders under frontend/public/catalog/.
 *
 * Usage:
 *   node scripts/catalog/fetch-images.mjs
 *   RAWG_API_KEY=xxx node scripts/catalog/fetch-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'database/prisma/catalog-images.json');
const KEYS_FILE = path.join(ROOT, 'database/prisma/catalog-image-keys.json');
const PUBLIC_CATALOG = path.join(ROOT, 'frontend/public/catalog');

function hardwareFolder(key) {
  if (key.startsWith('cable-')) return 'cables';
  if (key.includes('dualsense') || key.includes('dualshock') || key.includes('joycon')) {
    return 'controllers';
  }
  return 'consoles';
}

function svgFor(key, n) {
  const tones = ['#0f172a', '#1e293b', '#172554'];
  const accents = ['#22d3ee', '#38bdf8', '#67e8f9'];
  const bg = tones[n % tones.length];
  const fg = accents[n % accents.length];
  const label = key.replace(/-/g, ' ').slice(0, 36);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="${bg}"/>
  <rect x="80" y="80" width="640" height="640" rx="24" fill="none" stroke="${fg}" stroke-width="4" opacity="0.35"/>
  <text x="400" y="390" text-anchor="middle" fill="${fg}" font-family="Segoe UI, Arial, sans-serif" font-size="28">${label}</text>
  <text x="400" y="430" text-anchor="middle" fill="#94a3b8" font-family="Segoe UI, Arial, sans-serif" font-size="18">GameMania UK · ${n + 1}/3</text>
</svg>`;
}

function ensureHardwareImages(key) {
  const folder = hardwareFolder(key);
  const dir = path.join(PUBLIC_CATALOG, folder);
  fs.mkdirSync(dir, { recursive: true });
  const imgs = [];
  for (let n = 0; n < 3; n += 1) {
    const file = `${key}-${n + 1}.svg`;
    const abs = path.join(dir, file);
    if (!fs.existsSync(abs)) {
      fs.writeFileSync(abs, svgFor(key, n));
    }
    imgs.push({
      url: `/catalog/${folder}/${file}`,
      altText: key,
      isPrimary: n === 0,
      sortOrder: n,
      publicId: null,
    });
  }
  return imgs;
}

function placeholder(key, n) {
  const label = encodeURIComponent(key.slice(0, 28));
  const colors = ['0f172a/22d3ee', '1e1b4b/f472b6', '14532d/86efac', '431407/fdba74'];
  const c = colors[n % colors.length];
  return `https://placehold.co/800x800/${c}?text=${label}+${n + 1}`;
}

function defaultGameImages(key) {
  return [0, 1, 2].map((n) => ({
    url: placeholder(key, n),
    altText: key,
    isPrimary: n === 0,
    sortOrder: n,
  }));
}

async function rawgSearch(name, key) {
  const url = new URL('https://api.rawg.io/api/games');
  url.searchParams.set('key', key);
  url.searchParams.set('search', name);
  url.searchParams.set('page_size', '1');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG search ${res.status}`);
  const json = await res.json();
  return json.results?.[0] ?? null;
}

async function rawgScreenshots(id, key) {
  const url = new URL(`https://api.rawg.io/api/games/${id}/screenshots`);
  url.searchParams.set('key', key);
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results ?? [])
    .slice(0, 2)
    .map((s) => s.image)
    .filter(Boolean);
}

async function main() {
  let existing = {};
  if (fs.existsSync(OUT)) {
    existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  }

  let keys = [];
  if (fs.existsSync(KEYS_FILE)) {
    keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  } else {
    keys = Object.keys(existing);
  }

  const apiKey = (process.env.RAWG_API_KEY ?? '').trim();
  const out = { ...existing };
  const force = Boolean(process.env.FORCE_REFETCH);

  for (const key of keys) {
    const isGame = key.includes('-game-');

    if (!force && out[key]?.length >= 2) {
      const allLocalOrOk = out[key].every(
        (img) =>
          typeof img.url === 'string' &&
          (img.url.startsWith('/catalog/') ||
            img.url.includes('rawg') ||
            img.url.includes('cloudinary') ||
            img.url.includes('media.rawg.io') ||
            img.url.includes('placehold.co')),
      );
      if (allLocalOrOk && (isGame || out[key][0].url.startsWith('/catalog/'))) {
        continue;
      }
    }

    if (!isGame) {
      out[key] = ensureHardwareImages(key);
      console.log('hardware', key);
      continue;
    }

    if (apiKey) {
      try {
        const searchName = key
          .replace(/^(ps5|ps4|ps3|ps2|xbox_series|switch2?)-game-/, '')
          .replace(/-/g, ' ');
        const game = await rawgSearch(searchName, apiKey);
        await new Promise((r) => setTimeout(r, 350));
        if (game) {
          const shots = await rawgScreenshots(game.id, apiKey);
          await new Promise((r) => setTimeout(r, 350));
          const urls = [game.background_image, ...shots].filter(Boolean).slice(0, 3);
          if (urls.length) {
            out[key] = urls.map((url, n) => ({
              url,
              altText: game.name || key,
              isPrimary: n === 0,
              sortOrder: n,
              publicId: null,
            }));
            console.log('RAWG', key, '→', urls.length, 'images');
            continue;
          }
        }
      } catch (err) {
        console.warn('RAWG fail', key, err.message);
      }
    }

    out[key] = defaultGameImages(key);
    console.log('placeholder', key);
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('Wrote', OUT, Object.keys(out).length, 'keys');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
