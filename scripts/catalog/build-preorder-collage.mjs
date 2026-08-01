#!/usr/bin/env node
/**
 * Build homepage collage for Pre-order's and Latest releases card.
 * Uses local catalog case/showcase art (Wolverine, GTA VI, FC 27).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PUBLIC = path.join(ROOT, 'frontend/public');
const OUT = path.join(PUBLIC, 'brand/preorder-latest-releases.jpg');

const CANDIDATES = [
  'catalog/games/ps5-game-marvels-wolverine/ps5-game-marvels-wolverine-showcase.jpg',
  'catalog/games/ps5-game-marvels-wolverine/ps5-game-marvels-wolverine-1.jpg',
  'catalog/games/ps5-game-grand-theft-auto-vi/ps5-game-grand-theft-auto-vi-showcase.jpg',
  'catalog/games/ps5-game-grand-theft-auto-vi/ps5-game-grand-theft-auto-vi-1.jpg',
  'catalog/games/ps5-game-ea-sports-fc-27/ps5-game-ea-sports-fc-27-showcase.jpg',
  'catalog/games/ps5-game-ea-sports-fc-27/ps5-game-ea-sports-fc-27-1.jpg',
  'catalog/games/ps5-game-ea-sports-fc-26/ps5-game-ea-sports-fc-26-showcase.jpg',
  'catalog/games/ps5-game-grand-theft-auto-v-ps5/ps5-game-grand-theft-auto-v-ps5-showcase.jpg',
];

function firstExisting(paths) {
  for (const rel of paths) {
    const abs = path.join(PUBLIC, rel);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function pickCovers() {
  const wolverine = firstExisting(CANDIDATES.filter((p) => p.includes('wolverine')));
  const gta = firstExisting(CANDIDATES.filter((p) => p.includes('grand-theft-auto-vi') || p.includes('grand-theft-auto-v')));
  const fc = firstExisting(CANDIDATES.filter((p) => p.includes('fc-27') || p.includes('fc-26')));
  return [wolverine, gta, fc].filter(Boolean);
}

async function main() {
  const covers = pickCovers();
  if (covers.length < 2) {
    console.error('Need at least 2 local game covers for collage. Found:', covers.length);
    process.exit(1);
  }

  const W = 1200;
  const H = 720;
  const pad = 28;
  const gap = 20;
  const panelW = Math.floor((W - pad * 2 - gap * (covers.length - 1)) / covers.length);
  const panelH = H - pad * 2;

  const panels = await Promise.all(
    covers.map(async (src, i) => {
      const buf = await sharp(src)
        .resize(panelW, panelH, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 90 })
        .toBuffer();
      return {
        input: buf,
        left: pad + i * (panelW + gap),
        top: pad,
      };
    }),
  );

  await sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: { r: 10, g: 16, b: 22 },
    },
  })
    .composite(panels)
    .jpeg({ quality: 92 })
    .toFile(OUT);

  console.log(`Wrote ${OUT} (${covers.length} covers)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
