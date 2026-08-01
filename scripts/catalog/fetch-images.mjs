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
    pages: [],
    files: [
      'Black and white Playstation 5 base edition with controller.png',
      'PlayStation 5 and DualSense (2).jpg',
    ],
    filesOnly: true,
  },
  'ps5-slim-digital': {
    pages: [],
    files: [
      'PS5DigitalEdition.png',
      'PS5Digitalprerefined.jpg',
    ],
    filesOnly: true,
  },
  'ps5-original-disc': {
    pages: [],
    files: [
      'Black and white Playstation 5 base edition with controller.png',
      'PlayStation 5 and DualSense with transparent background.png',
    ],
    filesOnly: true,
  },
  'ps5-original-digital': {
    pages: [],
    files: ['PS5DigitalEdition.png', 'PS5Digitalprerefined.jpg'],
    filesOnly: true,
  },
  'ps4-console': {
    pages: [],
    files: [
      'PlayStation 4 Slim 8504.jpg',
      'The PlayStation 4. (9021900367).jpg',
      'DualShock 4.jpg',
    ],
    filesOnly: true,
  },
  'ps3-console': {
    pages: [],
    files: [
      'Sony-PlayStation-3-CECHA01-Console-BR.jpg',
      'DualShock3-in-Hand.jpg',
    ],
    filesOnly: true,
  },
  'ps2-console': {
    pages: [],
    files: [
      'Sony-PlayStation-2-70001-Console-BR.jpg',
      'PS2-Fat-Console-Back-Ntwrk.jpg',
    ],
    filesOnly: true,
  },
  'xbox-series-x': {
    pages: [],
    files: ['Xbox Series X.png', 'Xbox_Series_X_console.png'],
    filesOnly: true,
  },
  'xbox-series-s': {
    pages: [],
    files: ['Xbox Series S.png', 'Xbox_Series_S.png'],
    filesOnly: true,
  },
  'switch-oled': {
    pages: [],
    files: [
      'Nintendo-Switch-wJoyCons-BlRd-Standing-FL.jpg',
      'Nintendo-Switch-Console-Docked-wJoyConRB.jpg',
      'Nintendo-Switch-Console-Bare-FL-B.jpg',
    ],
    filesOnly: true,
  },
  'switch-oled-mario': {
    pages: [],
    files: [
      'Nintendo-Switch-wJoyCons-BlRd-Standing-FL.jpg',
      'Nintendo-Switch-Console-Docked-wJoyConRB.jpg',
    ],
    filesOnly: true,
  },
  'switch-oled-zelda': {
    pages: [],
    files: [
      'Nintendo-Switch-wJoyCons-BlRd-Standing-FL.jpg',
      'Nintendo-Switch-Console-Docked-wJoyConRB.jpg',
    ],
    filesOnly: true,
  },
  'switch-2-console': {
    pages: ['Nintendo Switch 2'],
    files: [
      'Nintendo Switch 2 in mode "handheld".png',
      'Dreifaltigkeit der Nintendo Switch (2) 20250606 HOF5608 RAW-Export.png',
    ],
    filesOnly: true,
  },
  'dualsense-white': {
    pages: ['DualSense'],
    files: [
      'Playstation DualSense Controller.png',
      'PlayStation 5 and DualSense with transparent background.png',
    ],
    filesOnly: true,
  },
  'dualsense-midnight-black': {
    pages: ['DualSense'],
    files: [
      'Playstation 5 DualSense controller in Midnight Black, 2026-02-07 (front).jpg',
      'Playstation 5 DualSense controller in Midnight Black, 2026-02-07 (rear).jpg',
    ],
    filesOnly: true,
  },
  'dualsense-cosmic-red': {
    pages: ['DualSense'],
    files: [
      'InclusiveGameLab PS5-Controller CC-BY-SA 02.jpg',
      'Playstation DualSense Controller.png',
    ],
    filesOnly: true,
  },
  'dualsense-starlight-blue': {
    pages: ['DualSense'],
    files: [
      'DualSense Wireless Controller Cobalt Blue.jpg',
      'Playstation DualSense Controller.png',
    ],
    filesOnly: true,
  },
  'dualsense-galactic-purple': {
    pages: ['DualSense'],
    files: [
      'DualSense Controller Chroma Pearl.jpg',
      'Playstation DualSense Controller.png',
    ],
    filesOnly: true,
  },
  'dualsense-nova-pink': {
    pages: ['DualSense'],
    files: [
      'DualSense Controller Chroma Pearl.jpg',
      'Playstation DualSense Controller.png',
    ],
    filesOnly: true,
  },
  'dualsense-volcanic-red': {
    pages: ['DualSense'],
    files: [
      'InclusiveGameLab PS5-Controller CC-BY-SA 02.jpg',
      'Playstation DualSense Controller.png',
    ],
    filesOnly: true,
  },
  'dualsense-cobalt-blue': {
    pages: ['DualSense'],
    files: [
      'DualSense Wireless Controller Cobalt Blue.jpg',
      'Playstation DualSense Controller.png',
    ],
    filesOnly: true,
  },
  'dualsense-sterling-silver': {
    pages: ['DualSense'],
    files: [
      'DualSense Controller Chroma Pearl.jpg',
      'Playstation DualSense Controller.png',
    ],
    filesOnly: true,
  },
  'dualsense-chroma-teal': {
    pages: ['DualSense'],
    files: [
      'DualSense Controller Chroma Pearl.jpg',
      'DualSense Wireless Controller Cobalt Blue.jpg',
    ],
    filesOnly: true,
  },
  'dualsense-chroma-indigo': {
    pages: ['DualSense'],
    files: [
      'DualSense Controller Chroma Pearl.jpg',
      'DualSense Wireless Controller Cobalt Blue.jpg',
    ],
    filesOnly: true,
  },
  'dualshock4-black': {
    pages: ['DualShock'],
    files: ['DualShock 4.jpg', 'DualShock 4 Side Profile.jpg', 'DualShock4-Controller.jpg'],
    filesOnly: true,
  },
  'dualshock4-white': {
    pages: ['DualShock'],
    files: ['DualShock 4.jpg', 'DualShock 4 Side Profile.jpg', 'DualShock4-Controller.jpg'],
    filesOnly: true,
  },
  'dualshock4-red': {
    pages: ['DualShock'],
    files: ['DualShock 4.jpg', 'DualShock 4 Side Profile.jpg', 'DualShock4-Controller.jpg'],
    filesOnly: true,
  },
  'switch2-joycon-blue-red': {
    pages: ['Joy-Con', 'Nintendo Switch'],
    files: ['Nintendo-Switch-wJoyConRB.jpg', 'Joy-Con.jpg'],
    filesOnly: true,
  },
  'switch2-joycon-black': {
    pages: ['Joy-Con', 'Nintendo Switch'],
    files: ['Nintendo-Switch-wJoyConRB.jpg', 'Joy-Con.jpg'],
    filesOnly: true,
  },
  'switch2-joycon-white': {
    pages: ['Joy-Con', 'Nintendo Switch'],
    files: ['Nintendo-Switch-wJoyConRB.jpg', 'Joy-Con.jpg'],
    filesOnly: true,
  },
  'switch2-joycon-other-official-colours': {
    pages: ['Joy-Con', 'Nintendo Switch'],
    files: ['Nintendo-Switch-wJoyConRB.jpg', 'Joy-Con.jpg'],
    filesOnly: true,
  },
  // Curated product photos only — avoid connector diagrams / SVG icons
  'cable-hdmi': {
    pages: [],
    files: ['HDMI CableEnd 02.jpg', 'HDMI CableEnd.jpg', 'MicroHDMI CableEnd.jpg'],
    filesOnly: true,
  },
  'cable-usbc': {
    pages: [],
    files: [
      'CAB-25579-USB-C-Extension-Cable-with-Power-Switch-Feature.jpg',
      'CAB-25579-USB-C-Extension-Cable-with-Power-Switch-Top.jpg',
      'CAB-25579-USB-C-Extension-Cable-with-Power-Switch-Detail.jpg',
    ],
    filesOnly: true,
  },
  'cable-figure-8': {
    pages: [],
    files: [
      'Connection cable CEE 7-16 to IEC 60320 C7.jpg',
      'Connector IEC-60320-C7.jpg',
      'IEC 60320 C7 connector.jpg',
      'Shortened IEC 60320 C7 connection.jpg',
    ],
    filesOnly: true,
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
  const related = rows.find((r) => namesRelated(name, r.name || '')) ?? null;
  return related || (namesRelated(name, rows[0].name || '') ? rows[0] : null);
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

function namesRelated(query, resultName) {
  const stop = new Set([
    'the',
    'and',
    'for',
    'edition',
    'remake',
    'remastered',
    'part',
    'volume',
    'game',
    'video',
  ]);
  const tokens = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stop.has(w));
  const q = tokens(query);
  const r = new Set(tokens(resultName));
  if (!q.length || !r.size) return false;
  const hits = q.filter((w) => [...r].some((x) => x === w || x.includes(w) || w.includes(x)));
  return hits.length >= Math.min(2, q.length);
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

/** Exact Steam app IDs — avoids unrelated search hits */
const STEAM_APP_IDS = {
  'ps5-game-elden-ring': 1245620,
  'ps5-game-helldivers-2': 553850,
  'ps5-game-hogwarts-legacy': 990080,
  'ps5-game-god-of-war-ragnar-k': 2322010,
  'ps5-game-gran-turismo-7': 1300510,
  'ps5-game-silent-hill-2-remake': 2124490,
  'ps5-game-dragon-ball-sparking-zero': 1790600,
  'ps5-game-mortal-kombat-1': 1971870,
  'ps5-game-assassins-creed-shadows': 3159330,
  'ps4-game-red-dead-redemption-2': 1174180,
  'ps4-game-god-of-war': 1593500,
  'ps4-game-ghost-of-tsushima': 2215430,
  'xbox_series-game-forza-horizon-5': 1551360,
  'xbox_series-game-starfield': 1716740,
  'xbox_series-game-halo-infinite': 1240440,
  'xbox_series-game-cyberpunk-2077': 1091500,
  'switch-game-the-legend-of-zelda-tears-of-the-kingdom': null, // not on Steam
  'ps2-game-spider-man-2-2004': null,
};

const SEARCH_OVERRIDES = {
  'ps5-game-silent-hill-2-remake': 'SILENT HILL 2',
  'ps5-game-gran-turismo-7': 'Gran Turismo 7',
  'ps5-game-marvels-wolverine': "Marvel's Wolverine",
  'ps5-game-god-of-war-ragnar-k': 'God of War Ragnarok',
  'ps3-game-gran-turismo-6': 'Gran Turismo 6',
  'ps2-game-gran-turismo-4': 'Gran Turismo 4',
  'ps2-game-gran-turismo-3': 'Gran Turismo 3 A-Spec',
  'ps2-game-spider-man-2-2004': 'Spider-Man 2 2004',
  'ps3-game-fifa-19': 'FIFA 19',
  'ps3-game-minecraft-ps3-edition': 'Minecraft',
  'ps2-game-wwe-smackdown-here-comes-the-pain': 'WWE SmackDown Here Comes the Pain',
  'ps2-game-kingdom-hearts': 'Kingdom Hearts',
  'switch-game-luigi-s-mansion-3': "Luigi's Mansion 3",
};

const WIKI_TITLE_OVERRIDES = {
  'ps2-game-spider-man-2-2004': 'Spider-Man 2 (2004 video game)',
  'ps5-game-marvels-spider-man-2': "Marvel's Spider-Man 2",
  'ps5-game-marvels-wolverine': "Marvel's Wolverine",
  'ps4-game-marvels-spider-man': "Marvel's Spider-Man (2018 video game)",
  'ps3-game-the-last-of-us': 'The Last of Us',
  'ps2-game-god-of-war': 'God of War (2005 video game)',
  'ps2-game-god-of-war-ii': 'God of War II',
  'ps4-game-god-of-war': 'God of War (2018 video game)',
  'switch-game-the-legend-of-zelda-tears-of-the-kingdom':
    'The Legend of Zelda: Tears of the Kingdom',
  'switch-game-the-legend-of-zelda-breath-of-the-wild':
    'The Legend of Zelda: Breath of the Wild',
  'cable-hdmi': 'HDMI',
  'cable-usbc': 'USB-C',
  'cable-figure-8': 'IEC 60320',
};

/** Prefer exact cover/box art files — never developer headshots */
const WIKI_FILE_OVERRIDES = {
  'switch-game-the-legend-of-zelda-tears-of-the-kingdom': [
    'The Legend of Zelda Tears of the Kingdom cover.jpg',
    'Tears of the kingdom contraptions.jpg',
  ],
  'switch-game-the-legend-of-zelda-breath-of-the-wild': [
    'The Legend of Zelda Breath of the Wild.jpg',
    'Breath of the Wild paraglide.jpg',
    'Climbing in BotW.jpg',
  ],
  'switch-game-mario-kart-8-deluxe': ['Mario Kart 8 Deluxe NA box art.jpg', 'Mario Kart 8 Deluxe.jpg'],
  'switch-game-super-mario-odyssey': ['Super Mario Odyssey.jpg', 'SuperMarioOdyssey.jpg'],
  'switch-game-super-smash-bros-ultimate': [
    'Super Smash Bros. Ultimate.jpg',
    'Super Smash Bros Ultimate.jpg',
  ],
  'switch-game-animal-crossing-new-horizons': [
    'Animal Crossing New Horizons.jpg',
    'Animal Crossing New Horizons Gameplay.jpg',
  ],
  'switch-game-metroid-dread': ['Metroid Dread.jpg', 'Metroid Dread cover art.jpg'],
  'switch-game-splatoon-3': ['Splatoon 3.jpg', 'Splatoon 3 cover art.jpg'],
  'switch-game-pok-mon-scarlet': [
    'Pokémon Scarlet and Violet banner.png',
    'Pokemon Scarlet and Violet Concept Artwork.webp',
    'Tera Raid Battle.jpg',
  ],
  'switch-game-pok-mon-violet': [
    'Pokémon Scarlet and Violet banner.png',
    'Pokemon Scarlet and Violet Concept Artwork.webp',
    'Tera Raid Battle.jpg',
  ],
  'switch2-game-mario-kart-world': [
    'Mario Kart World Cover Artwork.png',
    'Mario Kart World Knockout Tour.jpeg',
  ],
  'switch2-game-donkey-kong-bananza': [
    'Donkey Kong Bananza updated box art.png',
    'Donkey Kong Bananza Screenshot.jpg',
  ],
  'switch2-game-metroid-prime-4-beyond': [
    'Metroid Prime 4 Beyond cover art.png',
    'Prime4Gameplay.png',
  ],
  'switch-game-luigi-s-mansion-3': ["Luigi's Mansion 3.jpg"],
  'switch-game-super-mario-odyssey': [
    'Super Mario Odyssey.jpg',
    'Super Mario Odyssey, Cascade Kingdom.png',
    'Super Mario Odyssey, Seaside Kingdom.png',
  ],
  'switch-game-super-smash-bros-ultimate': [
    'Super Smash Bros. Ultimate.jpg',
    'Super Smash Bros. Ultimate gameplay.jpg',
  ],
};

/** Switch 2 editions reuse the base Switch title art when no separate cover exists */
const IMAGE_ALIASES = {
  'switch2-game-the-legend-of-zelda-tears-of-the-kingdom-switch-2-edition':
    'switch-game-the-legend-of-zelda-tears-of-the-kingdom',
  'switch2-game-the-legend-of-zelda-breath-of-the-wild-switch-2-edition':
    'switch-game-the-legend-of-zelda-breath-of-the-wild',
};

const BAD_WIKI_FILE =
  /logo|icon|symbol|flag|map|svg|ambox|commons|portrait|headshot|cropped|aonuma|miyamoto|iwata|sakurai|koizumi|hayashida|eguchi|nogami|masuda|sheeran|yoasobi|toby fox|developer|interview|selfie|staff|presenter|cebit|game developers|gdc |e3|gamescom|photo of|person with|people |signature|autograph|qr code|wikidata|booth|conference|region map|españa|portugal|momotar/i;

const GOOD_WIKI_FILE =
  /cover|box\s?art|key\s?art|artwork|packaging|game cover|na box|eu box|official|banner|promo|packshot/i;

function scoreWikiFile(fileName, gameName) {
  const f = fileName.toLowerCase();
  if (BAD_WIKI_FILE.test(f)) return -100;
  let score = 0;
  if (GOOD_WIKI_FILE.test(f)) score += 50;
  const tokens = gameName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'for', 'edition', 'game', 'video'].includes(w));
  const hits = tokens.filter((t) => f.includes(t)).length;
  score += hits * 10;
  if (/screenshot|gameplay|paraglide|climbing|contraption|raid|kingdom/i.test(f)) score += 4;
  if (score < 10) return -1;
  return score;
}

async function imagesFromSteam(key) {
  const name = searchNameFromKey(key);
  const appId = STEAM_APP_IDS[key];
  if (appId) {
    return finalizeImages(key, `games/${key}`, steamImages(appId), name);
  }
  if (appId === null) return null;

  const preferred = SEARCH_OVERRIDES[key];
  const queries = [
    preferred,
    name,
    name.replace(/remake|remastered|part i+|edition|\(\d+\)/gi, '').trim(),
    name.split(' ').slice(0, 4).join(' '),
  ].filter(Boolean);

  let app = null;
  for (const q of queries) {
    const found = await steamSearch(q);
    await sleep(250);
    if (found && namesRelated(q, found.name)) {
      app = found;
      break;
    }
  }
  if (!app) return null;

  const urls = steamImages(app.id);
  return finalizeImages(key, `games/${key}`, urls, app.name || name);
}

/* -------------------- Wikipedia -------------------- */

async function wikiPageImages(title, gameName = '') {
  const api = new URL('https://en.wikipedia.org/w/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('titles', title);
  api.searchParams.set('prop', 'images');
  api.searchParams.set('imlimit', '50');
  api.searchParams.set('format', 'json');
  api.searchParams.set('redirects', '1');
  api.searchParams.set('origin', '*');

  const res = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const json = await res.json();
  const page = Object.values(json.query?.pages || {})[0];
  if (!page || page.missing != null) return [];

  const files = (page.images || [])
    .map((i) => i.title?.replace(/^File:/i, ''))
    .filter(Boolean)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => ({ file: f, score: scoreWikiFile(f, gameName || title) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  return files.slice(0, 10).map((x) => wikiFileUrl(x.file, 1400));
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
  const forcedFiles = WIKI_FILE_OVERRIDES[key];
  if (forcedFiles?.length) {
    const urls = forcedFiles.map((f) => wikiFileUrl(f, 1400));
    const imgs = await finalizeImages(key, `games/${key}`, urls, name);
    if (imgs?.length) return imgs;
  }

  const forced = WIKI_TITLE_OVERRIDES[key];
  const titles = forced
    ? [forced]
    : await wikiSearchTitle(`${name} (video game)`);
  if (!forced) await sleep(200);
  const more = forced ? [] : await wikiSearchTitle(name);
  if (!forced) await sleep(200);
  const tryTitles = [
    ...new Set([forced, `${name} (video game)`, name, ...titles, ...more].filter(Boolean)),
  ];

  const urls = [];
  for (const t of tryTitles.slice(0, 4)) {
    const found = await wikiPageImages(t, name);
    await sleep(300);
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

  // Colour DualSense variants without a curated entry fall back to white DualSense
  if (key.startsWith('dualsense-') && !HARDWARE_WIKI[key]) {
    Object.assign(cfg, HARDWARE_WIKI['dualsense-white']);
  }

  const urls = [];
  for (const f of cfg.files || []) {
    urls.push(wikiFileUrl(f, 1600));
  }
  if (!cfg.filesOnly) {
    for (const page of cfg.pages || []) {
      const found = await wikiPageImages(page);
      await sleep(350);
      for (const u of found) {
        if (!urls.includes(u)) urls.push(u);
      }
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
  if (IMAGE_ALIASES[key] && IMAGE_ALIASES[key] !== key) {
    return null; // filled from alias after source key is ready
  }
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

function applyAliases(out) {
  for (const [alias, source] of Object.entries(IMAGE_ALIASES)) {
    if (alias === source) continue;
    if (out[source]?.length) {
      out[alias] = out[source].map((img, i) => ({
        ...img,
        altText: alias.replace(/-/g, ' '),
        isPrimary: i === 0,
        sortOrder: i,
      }));
    }
  }
  return out;
}

async function main() {
  const allKeys = fs.existsSync(KEYS_FILE)
    ? JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'))
    : [];
  const only = (process.env.ONLY_KEYS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const keys = only.length ? allKeys.filter((k) => only.includes(k)) : allKeys;
  let existing = {};
  if (fs.existsSync(OUT)) existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));

  const force = Boolean(process.env.FORCE_REFETCH);
  const hasIgdb = Boolean(
    (process.env.IGDB_CLIENT_ID ?? '').trim() &&
      (process.env.IGDB_CLIENT_SECRET ?? '').trim(),
  );
  console.log(
    `Keys: ${keys.length}/${allKeys.length} | IGDB: ${hasIgdb ? 'yes' : 'no'} | Steam+Wikipedia: yes | FORCE: ${force}`,
  );

  const out = { ...existing };
  let ok = 0;
  let fail = 0;

  for (const key of keys) {
    if (IMAGE_ALIASES[key] && IMAGE_ALIASES[key] !== key) {
      continue;
    }
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

  fs.writeFileSync(OUT, JSON.stringify(applyAliases(out), null, 2));
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
