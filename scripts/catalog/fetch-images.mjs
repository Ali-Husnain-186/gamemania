#!/usr/bin/env node
/**
 * High-quality catalog images for GameMania UK.
 *
 * Priority for games:
 *  1) IGDB (Twitch) — cover_big / 1080p + screenshots  [IGDB_CLIENT_ID + IGDB_CLIENT_SECRET]
 *  2) Steam Store CDN — library_600x900 + hero + header (no key)
 *  3) Wikipedia page / file images (no key)
 *
 * Hardware: Wikipedia + curated Special:FilePath downloads (no competitor scrapes).
 * All successful images are saved under frontend/public/catalog/…
 *
 *   FORCE_REFETCH=1 node scripts/catalog/fetch-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'database/prisma/catalog-images.json');
const KEYS_FILE = path.join(ROOT, 'database/prisma/catalog-image-keys.json');
const PUBLIC_CATALOG = path.join(ROOT, 'frontend/public/catalog');
const UA =
  'GameManiaUK-CatalogBot/1.0 (https://gamemaniaauk.co.uk; catalog image seed; contact@gamemaniaauk.co.uk)';

const PLATFORM_IGDB = {
  ps5: 167,
  ps4: 48,
  ps3: 9,
  ps2: 8,
  xbox_series: 169,
  switch: 130,
  switch2: 130,
};

/** Wikipedia titles / file names for hardware families */
const HARDWARE_WIKI = {
  'ps5-slim-disc': {
    pages: ['PlayStation 5', 'PlayStation 5 Slim'],
    files: [
      'Black and white Playstation 5 base edition with controller.png',
      'PlayStation 5 and DualSense with transparent background.png',
      'PS5DigitalEdition.png',
    ],
  },
  'ps5-slim-digital': {
    pages: ['PlayStation 5', 'PlayStation 5 Digital Edition'],
    files: [
      'PS5DigitalEdition.png',
      'PlayStation 5 and DualSense with transparent background.png',
    ],
  },
  'ps5-original-disc': {
    pages: ['PlayStation 5'],
    files: [
      'Black and white Playstation 5 base edition with controller.png',
      'PlayStation 5 and DualSense with transparent background.png',
      'PlayStation 5 and DualSense (2).jpg',
    ],
  },
  'ps5-original-digital': {
    pages: ['PlayStation 5 Digital Edition', 'PlayStation 5'],
    files: ['PS5DigitalEdition.png', 'PlayStation 5 and DualSense with transparent background.png'],
  },
  'ps4-console': {
    pages: ['PlayStation 4'],
    files: ['PS4-Console-wDualshock4.jpg', 'Sony-PlayStation-4-PS4-Console-wDualShock4.jpg'],
  },
  'ps3-console': {
    pages: ['PlayStation 3'],
    files: ['PS3 Console and Game Controllers.jpg', 'PlayStation_3_and_DualShock_3.jpg'],
  },
  'ps2-console': {
    pages: ['PlayStation 2'],
    files: ['PlayStation 2.png', 'PS2-Slim-Console.png'],
  },
  'xbox-series-x': {
    pages: ['Xbox Series X and Series S'],
    files: ['Xbox Series X.png', 'Xbox_Series_X_console.png'],
  },
  'xbox-series-s': {
    pages: ['Xbox Series X and Series S'],
    files: ['Xbox Series S.png', 'Xbox_Series_S.png'],
  },
  'switch-oled': {
    pages: ['Nintendo Switch'],
    files: ['Nintendo Switch OLED model.jpg', 'Nintendo-Switch-wJoyConRB.jpg'],
  },
  'switch-oled-mario': {
    pages: ['Nintendo Switch'],
    files: ['Nintendo Switch OLED model.jpg', 'Nintendo-Switch-wJoyConRB.jpg'],
  },
  'switch-oled-zelda': {
    pages: ['Nintendo Switch'],
    files: ['Nintendo Switch OLED model.jpg', 'Nintendo-Switch-wJoyConRB.jpg'],
  },
  'switch-2-console': {
    pages: ['Nintendo Switch 2', 'Nintendo Switch'],
    files: ['Nintendo Switch OLED model.jpg', 'Nintendo-Switch-wJoyConRB.jpg'],
  },
  'dualsense-white': {
    pages: ['DualSense', 'DualShock'],
    files: [
      'Playstation DualSense Controller.png',
      'DualSense Edge Controller.jpg',
      'PlayStation 5 and DualSense with transparent background.png',
    ],
  },
  'dualsense-midnight-black': {
    pages: ['DualSense', 'DualShock'],
    files: [
      'Playstation DualSense Controller.png',
      'DualSense Edge Controller.jpg',
      'PlayStation 5 and DualSense with transparent background.png',
    ],
  },
  'dualshock4-black': {
    pages: ['DualShock'],
    files: ['DualShock 4.jpg', 'DualShock 4 Side Profile.jpg', 'DualShock4-Controller.jpg'],
  },
  'dualshock4-white': {
    pages: ['DualShock'],
    files: ['DualShock 4.jpg', 'DualShock 4 Side Profile.jpg', 'DualShock4-Controller.jpg'],
  },
  'dualshock4-red': {
    pages: ['DualShock'],
    files: ['DualShock 4.jpg', 'DualShock 4 Side Profile.jpg', 'DualShock4-Controller.jpg'],
  },
  'switch2-joycon-blue-red': {
    pages: ['Joy-Con', 'Nintendo Switch'],
    files: ['Nintendo-Switch-wJoyConRB.jpg', 'Joy-Con.jpg'],
  },
  'switch2-joycon-black': {
    pages: ['Joy-Con', 'Nintendo Switch'],
    files: ['Nintendo-Switch-wJoyConRB.jpg', 'Joy-Con.jpg'],
  },
  'switch2-joycon-white': {
    pages: ['Joy-Con', 'Nintendo Switch'],
    files: ['Nintendo-Switch-wJoyConRB.jpg', 'Joy-Con.jpg'],
  },
  'switch2-joycon-other-official-colours': {
    pages: ['Joy-Con', 'Nintendo Switch'],
    files: ['Nintendo-Switch-wJoyConRB.jpg', 'Joy-Con.jpg'],
  },
  'cable-hdmi': {
    pages: ['HDMI'],
    files: ['HDMI connector.jpg', 'HDMI_Connector.jpg'],
  },
  'cable-usbc': {
    pages: ['USB-C'],
    files: ['USB Type-C plug.svg', 'USB-C.jpg'],
  },
  'cable-figure-8': {
    pages: ['IEC 60320'],
    files: ['IEC 60320 C7.svg', 'C7 connector.jpg'],
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isGameKey(key) {
  return key.includes('-game-');
}

function hardwareFolder(key) {
  if (key.startsWith('cable-')) return 'cables';
  if (key.includes('dualsense') || key.includes('dualshock') || key.includes('joycon')) {
    return 'controllers';
  }
  return 'consoles';
}

function searchNameFromKey(key) {
  return key
    .replace(/^(ps5|ps4|ps3|ps2|xbox_series|switch2?)-game-/, '')
    .replace(/-/g, ' ')
    .replace(/\bps5\b/gi, '')
    .replace(/\bps4\b/gi, '')
    .replace(/\bxbox\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function platformFromKey(key) {
  const m = key.match(/^(ps5|ps4|ps3|ps2|xbox_series|switch2?)/);
  return m ? m[1] : null;
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'image/*,*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, contentType: res.headers.get('content-type') || '', finalUrl: res.url };
}

function extFrom(contentType, url) {
  if (contentType.includes('png') || url.includes('.png')) return 'png';
  if (contentType.includes('webp') || url.includes('.webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('svg') || url.includes('.svg')) return 'svg';
  return 'jpg';
}

async function saveLocal(relDir, basename, sourceUrl) {
  const dir = path.join(PUBLIC_CATALOG, relDir);
  fs.mkdirSync(dir, { recursive: true });
  const { buf, contentType, finalUrl } = await fetchBuffer(sourceUrl);
  if (buf.length < 1500) throw new Error('image too small');
  const ext = extFrom(contentType, finalUrl || sourceUrl);
  if (ext === 'svg') throw new Error('skip svg');
  const file = `${basename}.${ext}`;
  fs.writeFileSync(path.join(dir, file), buf);
  return `/catalog/${relDir}/${file}`;
}

async function cloudinaryUpload(localPath, publicId) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return null;

  const crypto = await import('crypto');
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'gamemania/catalog';
  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${secret}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(localPath)]), path.basename(localPath));
  form.append('api_key', key);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('public_id', publicId);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) return null;
  const json = await res.json();
  return { url: json.secure_url, publicId: json.public_id };
}

async function finalizeImages(key, folder, remoteUrls, altText) {
  const out = [];
  const uniq = [...new Set(remoteUrls.filter(Boolean))];
  for (let i = 0; i < uniq.length && out.length < 4; i += 1) {
    const basename = `${key}-${out.length + 1}`;
    try {
      const localUrl = await saveLocal(folder, basename, uniq[i]);
      const abs = path.join(PUBLIC_CATALOG, folder, path.basename(localUrl));
      let finalUrl = localUrl;
      let publicId = null;
      const up = await cloudinaryUpload(abs, `catalog/${key}-${out.length + 1}`);
      if (up) {
        finalUrl = up.url;
        publicId = up.publicId;
      }
      out.push({
        url: finalUrl,
        altText,
        isPrimary: out.length === 0,
        sortOrder: out.length,
        publicId,
      });
      await sleep(150);
    } catch (err) {
      // continue
    }
  }
  return out;
}

function wikiFileUrl(fileTitle, width = 1600) {
  const name = encodeURIComponent(fileTitle.replace(/^File:/i, '').replace(/ /g, '_'));
  return `https://en.wikipedia.org/wiki/Special:FilePath/${name}?width=${width}`;
}

/* -------------------- IGDB -------------------- */

let igdbToken = null;

async function getIgdbToken() {
  const clientId = (process.env.IGDB_CLIENT_ID ?? '').trim();
  const clientSecret = (process.env.IGDB_CLIENT_SECRET ?? '').trim();
  if (!clientId || !clientSecret) return null;
  if (igdbToken) return { clientId, token: igdbToken };

  const url = new URL('https://id.twitch.tv/oauth2/token');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);
  url.searchParams.set('grant_type', 'client_credentials');
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`IGDB token ${res.status}`);
  const json = await res.json();
  igdbToken = json.access_token;
  return { clientId, token: igdbToken };
}

function igdbImage(imageId, size = '1080p') {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

async function igdbSearchGame(name, platformKey) {
  const auth = await getIgdbToken();
  if (!auth) return null;

  const platformId = platformKey ? PLATFORM_IGDB[platformKey] : null;
  const q = name.replace(/"/g, '');
  let body = `search "${q}"; fields name,cover.image_id,screenshots.image_id,artworks.image_id; limit 5;`;
  if (platformId) {
    body = `search "${q}"; fields name,cover.image_id,screenshots.image_id,artworks.image_id; where platforms = (${platformId}); limit 5;`;
  }

  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': auth.clientId,
      Authorization: `Bearer ${auth.token}`,
      Accept: 'application/json',
      'User-Agent': UA,
    },
    body,
  });
  if (!res.ok) {
    if (platformId) return igdbSearchGame(name, null);
    return null;
  }
  const rows = await res.json();
  if (!rows?.length) {
    if (platformId) return igdbSearchGame(name, null);
    return null;
  }
  return rows[0];
}

async function imagesFromIgdb(key) {
  const name = searchNameFromKey(key);
  const game = await igdbSearchGame(name, platformFromKey(key));
  await sleep(300);
  if (!game) return null;

  const urls = [];
  const coverId =
    typeof game.cover === 'object' ? game.cover?.image_id : null;
  if (coverId) {
    urls.push(igdbImage(coverId, 'cover_big'));
    urls.push(igdbImage(coverId, '1080p'));
  }
  for (const shot of game.screenshots ?? []) {
    if (shot?.image_id) urls.push(igdbImage(shot.image_id, '1080p'));
  }
  for (const art of game.artworks ?? []) {
    if (art?.image_id) urls.push(igdbImage(art.image_id, '1080p'));
  }
  if (!urls.length) return null;
  return finalizeImages(key, `games/${key}`, urls, game.name || name);
}

/* -------------------- Steam -------------------- */

async function steamSearch(name) {
  const url = new URL('https://store.steampowered.com/api/storesearch/');
  url.searchParams.set('term', name);
  url.searchParams.set('l', 'english');
  url.searchParams.set('cc', 'GB');
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const json = await res.json();
  const item = (json.items ?? []).find((i) => i.type === 'app' && i.id);
  return item ?? null;
}

function steamImages(appId) {
  const base = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}`;
  return [
    `${base}/library_600x900.jpg`,
    `${base}/library_hero.jpg`,
    `${base}/header.jpg`,
    `${base}/capsule_616x353.jpg`,
  ];
}

async function imagesFromSteam(key) {
  const name = searchNameFromKey(key);
  // Prefer cleaner Steam queries for noisy catalog names
  const overrides = {
    'ps5-game-silent-hill-2-remake': 'SILENT HILL 2',
    'ps5-game-gran-turismo-7': 'Gran Turismo 7',
    'ps5-game-marvels-wolverine': 'Marvel Wolverine',
    'ps3-game-gran-turismo-6': 'Gran Turismo 6',
    'ps2-game-gran-turismo-4': 'Gran Turismo 4',
    'ps2-game-gran-turismo-3': 'Gran Turismo 3',
    'ps3-game-fifa-19': 'FIFA 19',
    'ps3-game-minecraft-ps3-edition': 'Minecraft',
    'xbox_series-game-wwe-2k26': 'WWE 2K25',
    'xbox_series-game-nba-2k26': 'NBA 2K25',
    'ps2-game-wwe-smackdown-here-comes-the-pain': 'WWE SmackDown Here Comes the Pain',
  };
  const preferred = overrides[key];
  const queries = [
    preferred,
    name,
    name.replace(/remake|remastered|part i+|edition/gi, '').trim(),
    name.split(' ').slice(0, 4).join(' '),
  ].filter(Boolean);

  let app = null;
  for (const q of queries) {
    app = await steamSearch(q);
    await sleep(250);
    if (app) break;
  }
  if (!app) return null;

  const urls = steamImages(app.id);
  return finalizeImages(key, `games/${key}`, urls, app.name || name);
}

/* -------------------- Wikipedia -------------------- */

async function wikiPageImages(title) {
  const api = new URL('https://en.wikipedia.org/w/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('titles', title);
  api.searchParams.set('prop', 'pageimages|images');
  api.searchParams.set('piprop', 'original|thumbnail');
  api.searchParams.set('pithumbsize', '1200');
  api.searchParams.set('imlimit', '40');
  api.searchParams.set('format', 'json');
  api.searchParams.set('redirects', '1');
  api.searchParams.set('origin', '*');

  const res = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const json = await res.json();
  const page = Object.values(json.query?.pages || {})[0];
  if (!page || page.missing != null) return [];

  const urls = [];
  if (page.original?.source) urls.push(page.original.source);
  if (page.thumbnail?.source) urls.push(page.thumbnail.source);

  const files = (page.images || [])
    .map((i) => i.title?.replace(/^File:/i, ''))
    .filter(Boolean)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .filter((f) => !/logo|icon|symbol|flag|map|svg|ambox|commons/i.test(f));

  for (const f of files.slice(0, 8)) {
    urls.push(wikiFileUrl(f, 1400));
  }
  return [...new Set(urls)];
}

async function wikiSearchTitle(query) {
  const api = new URL('https://en.wikipedia.org/w/api.php');
  api.searchParams.set('action', 'opensearch');
  api.searchParams.set('search', query);
  api.searchParams.set('limit', '5');
  api.searchParams.set('namespace', '0');
  api.searchParams.set('format', 'json');
  api.searchParams.set('origin', '*');
  const res = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const json = await res.json();
  return json[1] || [];
}

async function imagesFromWikipediaGame(key) {
  const name = searchNameFromKey(key);
  const titles = await wikiSearchTitle(`${name} (video game)`);
  await sleep(200);
  const more = await wikiSearchTitle(name);
  await sleep(200);
  const tryTitles = [...new Set([`${name} (video game)`, name, ...titles, ...more])];

  const urls = [];
  for (const t of tryTitles.slice(0, 4)) {
    const found = await wikiPageImages(t);
    await sleep(250);
    for (const u of found) {
      if (!urls.includes(u)) urls.push(u);
    }
    if (urls.length >= 4) break;
  }
  if (!urls.length) return null;
  return finalizeImages(key, `games/${key}`, urls, name);
}

async function imagesFromHardware(key) {
  const cfg = HARDWARE_WIKI[key] || {
    pages: [key.replace(/-/g, ' ')],
    files: [],
  };

  // Colour DualSense variants reuse DualSense photos
  if (key.startsWith('dualsense-') && !HARDWARE_WIKI[key]) {
    Object.assign(cfg, HARDWARE_WIKI['dualsense-white']);
  }

  const urls = [];
  for (const f of cfg.files || []) {
    urls.push(wikiFileUrl(f, 1600));
  }
  for (const page of cfg.pages || []) {
    const found = await wikiPageImages(page);
    await sleep(250);
    for (const u of found) {
      if (!urls.includes(u)) urls.push(u);
    }
  }
  if (!urls.length) return null;
  return finalizeImages(key, hardwareFolder(key), urls, key);
}

function looksGood(imgs) {
  if (!imgs?.length || imgs.length < 2) return false;
  return imgs.every(
    (i) =>
      typeof i.url === 'string' &&
      !i.url.includes('placehold.co') &&
      !i.url.endsWith('.svg'),
  );
}

async function resolveKey(key) {
  if (isGameKey(key)) {
    const hasIgdb = Boolean(
      (process.env.IGDB_CLIENT_ID ?? '').trim() &&
        (process.env.IGDB_CLIENT_SECRET ?? '').trim(),
    );
    if (hasIgdb) {
      const igdb = await imagesFromIgdb(key);
      if (igdb?.length >= 2) return igdb;
    }
    const steam = await imagesFromSteam(key);
    if (steam?.length >= 2) return steam;
    const wiki = await imagesFromWikipediaGame(key);
    if (wiki?.length >= 1) return wiki;
    return steam || wiki || null;
  }
  return imagesFromHardware(key);
}

async function main() {
  const keys = fs.existsSync(KEYS_FILE)
    ? JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'))
    : [];
  let existing = {};
  if (fs.existsSync(OUT)) existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));

  const force = Boolean(process.env.FORCE_REFETCH);
  const hasIgdb = Boolean(
    (process.env.IGDB_CLIENT_ID ?? '').trim() &&
      (process.env.IGDB_CLIENT_SECRET ?? '').trim(),
  );
  console.log(
    `Keys: ${keys.length} | IGDB: ${hasIgdb ? 'yes' : 'no'} | Steam+Wikipedia: yes | FORCE: ${force}`,
  );

  const out = { ...existing };
  let ok = 0;
  let fail = 0;

  for (const key of keys) {
    if (!force && looksGood(out[key])) {
      ok += 1;
      continue;
    }
    process.stdout.write(`→ ${key} … `);
    try {
      const imgs = await resolveKey(key);
      if (imgs?.length) {
        out[key] = imgs.slice(0, 4);
        console.log(`${imgs.length} imgs`);
        ok += 1;
      } else {
        console.log('NO MATCH');
        fail += 1;
      }
    } catch (err) {
      console.log('ERR', err.message);
      fail += 1;
    }
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${OUT}\nOK: ${ok}  failed: ${fail}`);
  if (!hasIgdb) {
    console.log(`
For even better covers (esp. console exclusives), add free Twitch/IGDB keys:
  IGDB_CLIENT_ID=… IGDB_CLIENT_SECRET=… FORCE_REFETCH=1 node scripts/catalog/fetch-images.mjs
https://api-docs.igdb.com/
`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
