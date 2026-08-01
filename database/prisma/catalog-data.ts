/**
 * GameMania UK bulk catalog definitions.
 * New + Used expand into separate Product rows in seed.
 * Prices are UK market estimates in pence — edit in admin as needed.
 */

export type CatalogCondition = 'NEW' | 'PRE_OWNED_GOOD';

export type CatalogProductDef = {
  sku: string;
  slug: string;
  name: string;
  categorySlug: string;
  brandSlug: string;
  platform: string;
  condition: CatalogCondition;
  price: number;
  tradeInCashPence: number;
  tradeInCreditPence: number;
  shortDescription: string;
  description: string;
  imageKey: string;
  quantity: number;
  isFeatured?: boolean;
};

type Family = {
  key: string;
  name: string;
  categorySlug: string;
  brandSlug: string;
  platform: string;
  shortDescription: string;
  description?: string;
  newPrice: number;
  usedPrice: number;
  tradeInCash: number;
  tradeInCredit: number;
  bothConditions?: boolean;
  /** Used-only (e.g. PS2/PS3 games — no sealed New stock) */
  usedOnly?: boolean;
  featured?: boolean;
  qtyNew?: number;
  qtyUsed?: number;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function expandFamily(f: Family): CatalogProductDef[] {
  const base = slugify(f.key);
  const both = f.bothConditions !== false;
  const desc =
    f.description ??
    `${f.name} available at GameMania UK. Genuine stock with a 3-month warranty.`;
  const rows: CatalogProductDef[] = [];

  const make = (condition: CatalogCondition, price: number, qty: number): CatalogProductDef => {
    const tag = condition === 'NEW' ? 'NEW' : 'USED';
    const label = condition === 'NEW' ? 'New' : 'Used';
    return {
      sku: `GM-${f.platform}-${base}-${tag}`.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
      slug: `${base}-${tag.toLowerCase()}`,
      name: `${f.name} (${label})`,
      categorySlug: f.categorySlug,
      brandSlug: f.brandSlug,
      platform: f.platform,
      condition,
      price,
      tradeInCashPence: f.tradeInCash,
      tradeInCreditPence: f.tradeInCredit,
      shortDescription: f.shortDescription,
      description: desc,
      imageKey: f.key,
      quantity: qty,
      isFeatured: f.featured && condition === 'NEW',
    };
  };

  if (f.usedOnly) {
    rows.push(make('PRE_OWNED_GOOD', f.usedPrice, f.qtyUsed ?? 5));
    return rows;
  }

  rows.push(make('NEW', f.newPrice, f.qtyNew ?? 8));
  if (both) rows.push(make('PRE_OWNED_GOOD', f.usedPrice, f.qtyUsed ?? 5));
  return rows;
}

const CONSOLES: Family[] = [
  {
    key: 'ps5-slim-disc',
    name: 'PlayStation 5 Slim Disc Edition Console',
    categorySlug: 'playstation-consoles',
    brandSlug: 'sony',
    platform: 'PS5',
    shortDescription: 'PS5 Slim disc edition console.',
    newPrice: 44999,
    usedPrice: 34999,
    tradeInCash: 22000,
    tradeInCredit: 25000,
    featured: true,
  },
  {
    key: 'ps5-slim-digital',
    name: 'PlayStation 5 Slim Digital Edition Console',
    categorySlug: 'playstation-consoles',
    brandSlug: 'sony',
    platform: 'PS5',
    shortDescription: 'PS5 Slim digital edition console.',
    newPrice: 38999,
    usedPrice: 29999,
    tradeInCash: 18000,
    tradeInCredit: 21000,
  },
  {
    key: 'ps5-original-disc',
    name: 'PlayStation 5 Disc Edition Console (Original)',
    categorySlug: 'playstation-consoles',
    brandSlug: 'sony',
    platform: 'PS5',
    shortDescription: 'Original PS5 disc (fat) model.',
    newPrice: 42999,
    usedPrice: 31999,
    tradeInCash: 20000,
    tradeInCredit: 23000,
  },
  {
    key: 'ps5-original-digital',
    name: 'PlayStation 5 Digital Edition Console (Original)',
    categorySlug: 'playstation-consoles',
    brandSlug: 'sony',
    platform: 'PS5',
    shortDescription: 'Original PS5 digital (fat) model.',
    newPrice: 36999,
    usedPrice: 27999,
    tradeInCash: 16000,
    tradeInCredit: 19000,
  },
  {
    key: 'ps4-console',
    name: 'PlayStation 4 Console',
    categorySlug: 'playstation-consoles',
    brandSlug: 'sony',
    platform: 'PS4',
    shortDescription: 'PlayStation 4 console.',
    newPrice: 19999,
    usedPrice: 12999,
    tradeInCash: 6000,
    tradeInCredit: 7500,
  },
  {
    key: 'ps3-console',
    name: 'PlayStation 3 Console',
    categorySlug: 'playstation-consoles',
    brandSlug: 'sony',
    platform: 'PS3',
    shortDescription: 'PlayStation 3 console.',
    newPrice: 12999,
    usedPrice: 6999,
    tradeInCash: 2500,
    tradeInCredit: 3200,
  },
  {
    key: 'ps2-console',
    name: 'PlayStation 2 Console',
    categorySlug: 'playstation-consoles',
    brandSlug: 'sony',
    platform: 'PS2',
    shortDescription: 'PlayStation 2 console.',
    newPrice: 9999,
    usedPrice: 4999,
    tradeInCash: 1500,
    tradeInCredit: 2000,
  },
  {
    key: 'xbox-series-x',
    name: 'Xbox Series X Console',
    categorySlug: 'xbox-consoles',
    brandSlug: 'microsoft',
    platform: 'XBOX_SERIES',
    shortDescription: 'Xbox Series X console.',
    newPrice: 44999,
    usedPrice: 33999,
    tradeInCash: 21000,
    tradeInCredit: 24000,
    featured: true,
  },
  {
    key: 'xbox-series-s',
    name: 'Xbox Series S Console',
    categorySlug: 'xbox-consoles',
    brandSlug: 'microsoft',
    platform: 'XBOX_SERIES',
    shortDescription: 'Xbox Series S console.',
    newPrice: 24999,
    usedPrice: 17999,
    tradeInCash: 10000,
    tradeInCredit: 12000,
  },
  {
    key: 'switch-oled',
    name: 'Nintendo Switch OLED Console',
    categorySlug: 'nintendo-consoles',
    brandSlug: 'nintendo',
    platform: 'SWITCH',
    shortDescription: 'Nintendo Switch OLED console.',
    newPrice: 30999,
    usedPrice: 22999,
    tradeInCash: 14000,
    tradeInCredit: 16500,
    featured: true,
  },
  {
    key: 'switch-oled-mario',
    name: 'Nintendo Switch OLED Mario Edition Console',
    categorySlug: 'nintendo-consoles',
    brandSlug: 'nintendo',
    platform: 'SWITCH',
    shortDescription: 'Switch OLED Mario special edition.',
    newPrice: 32999,
    usedPrice: 24999,
    tradeInCash: 15000,
    tradeInCredit: 17500,
  },
  {
    key: 'switch-oled-zelda',
    name: 'Nintendo Switch OLED Zelda Edition Console',
    categorySlug: 'nintendo-consoles',
    brandSlug: 'nintendo',
    platform: 'SWITCH',
    shortDescription: 'Switch OLED Zelda special edition.',
    newPrice: 32999,
    usedPrice: 24999,
    tradeInCash: 15000,
    tradeInCredit: 17500,
  },
  {
    key: 'switch-2-console',
    name: 'Nintendo Switch 2 Console',
    categorySlug: 'nintendo-consoles',
    brandSlug: 'nintendo',
    platform: 'SWITCH2',
    shortDescription: 'Nintendo Switch 2 console.',
    newPrice: 39999,
    usedPrice: 32999,
    tradeInCash: 20000,
    tradeInCredit: 23000,
    featured: true,
  },
];

function gameFamily(
  name: string,
  platform: string,
  categorySlug: string,
  brandSlug: string,
  newPrice: number,
  usedPrice: number,
  opts?: { usedOnly?: boolean },
): Family {
  return {
    key: `${platform.toLowerCase()}-game-${slugify(name)}`,
    name,
    categorySlug,
    brandSlug,
    platform,
    shortDescription: `${name} for ${platform.replace('_', ' ')}.`,
    newPrice,
    usedPrice,
    tradeInCash: Math.round(usedPrice * 0.35),
    tradeInCredit: Math.round(usedPrice * 0.42),
    usedOnly: opts?.usedOnly,
  };
}

const PS5_GAMES = [
  'EA Sports FC 26',
  'Call of Duty: Black Ops 7',
  'Call of Duty: Black Ops 6',
  'Grand Theft Auto V (PS5)',
  'Hogwarts Legacy',
  "Marvel's Spider-Man 2",
  "Marvel's Wolverine",
  'God of War Ragnarök',
  'The Last of Us Part I',
  'The Last of Us Part II Remastered',
  'Horizon Forbidden West',
  'Gran Turismo 7',
  'Elden Ring',
  'Mortal Kombat 1',
  "Assassin's Creed Shadows",
  'Resident Evil 4 Remake',
  'Final Fantasy VII Rebirth',
  'Silent Hill 2 Remake',
  'Dragon Ball: Sparking! ZERO',
  'Helldivers 2',
].map((n, i) =>
  gameFamily(n, 'PS5', 'playstation-5-games', 'sony', 5499 - (i % 5) * 200, 3299 - (i % 5) * 100),
);

const PS4_GAMES = [
  'FIFA 23',
  'EA Sports FC 24',
  'Grand Theft Auto V',
  'Red Dead Redemption 2',
  'Call of Duty: Modern Warfare',
  'Call of Duty: Black Ops Cold War',
  'Call of Duty: Modern Warfare II',
  "Marvel's Spider-Man",
  'God of War',
  'The Last of Us Remastered',
  'The Last of Us Part II',
  'Horizon Zero Dawn',
  'Horizon Forbidden West',
  'Ghost of Tsushima',
  'Uncharted 4: A Thief’s End',
  'Minecraft PS4 Edition',
  'Gran Turismo Sport',
  'Resident Evil Village',
  "Assassin's Creed Valhalla",
  'Hogwarts Legacy',
].map((n, i) =>
  gameFamily(n, 'PS4', 'playstation-4-games', 'sony', 2499 - (i % 4) * 100, 1299 - (i % 4) * 50),
);

const XBOX_GAMES = [
  'EA Sports FC 26',
  'Call of Duty: Black Ops 6',
  'Call of Duty: Modern Warfare III',
  'Grand Theft Auto V',
  'Hogwarts Legacy',
  'Forza Horizon 5',
  'Halo Infinite',
  'Starfield',
  'Red Dead Redemption 2',
  'Cyberpunk 2077',
  "Assassin's Creed Shadows",
  "Assassin's Creed Valhalla",
  'Mortal Kombat 1',
  'Elden Ring',
  'Minecraft',
  'Resident Evil 4 Remake',
  'WWE 2K26',
  'WWE 2K25',
  'NBA 2K26',
  'Hogwarts Legacy (Xbox)',
].map((n, i) =>
  gameFamily(
    n,
    'XBOX_SERIES',
    'xbox-games',
    'microsoft',
    4999 - (i % 5) * 200,
    2999 - (i % 5) * 100,
  ),
);

const PS3_GAMES = [
  'Grand Theft Auto V',
  'Red Dead Redemption',
  'Call of Duty: Black Ops',
  'Call of Duty: Modern Warfare 2',
  'Call of Duty: Modern Warfare 3',
  'FIFA 19',
  'FIFA 18',
  'The Last of Us',
  'Uncharted 2: Among Thieves',
  "Uncharted 3: Drake's Deception",
  'Gran Turismo 6',
  'Skyrim',
  'Minecraft PS3 Edition',
  'Batman Arkham City',
  'Batman Arkham Asylum',
  'God of War III',
  'Metal Gear Solid 4',
  'LittleBigPlanet 2',
  'Far Cry 3',
  "Assassin's Creed IV Black Flag",
].map((n, i) =>
  gameFamily(n, 'PS3', 'playstation-3-games', 'sony', 1499 - (i % 3) * 100, 799 - (i % 3) * 50, {
    usedOnly: true,
  }),
);

const PS2_GAMES = [
  'Grand Theft Auto: San Andreas',
  'Grand Theft Auto: Vice City',
  'Grand Theft Auto III',
  'Gran Turismo 4',
  'Gran Turismo 3',
  'FIFA 14',
  'FIFA 13',
  'Call of Duty: World at War Final Fronts',
  'Call of Duty 3',
  'Need for Speed Underground 2',
  'Need for Speed Most Wanted',
  'Need for Speed Carbon',
  'Spider-Man 2 (2004)',
  "WWE SmackDown! Here Comes The Pain",
  'WWE SmackDown vs Raw 2007',
  'God of War',
  'God of War II',
  'Tekken 5',
  'Kingdom Hearts',
  'Resident Evil 4',
].map((n, i) =>
  gameFamily(n, 'PS2', 'playstation-2-games', 'sony', 1999 - (i % 4) * 100, 999 - (i % 4) * 50, {
    usedOnly: true,
  }),
);

const SWITCH_GAMES = [
  'The Legend of Zelda: Tears of the Kingdom',
  'The Legend of Zelda: Breath of the Wild',
  'Mario Kart 8 Deluxe',
  'Super Mario Odyssey',
  'Super Smash Bros. Ultimate',
  'Animal Crossing: New Horizons',
  'Pokémon Scarlet',
  'Pokémon Violet',
  'Nintendo Switch Sports',
  'Luigi’s Mansion 3',
  'Super Mario Party',
  'Splatoon 3',
  'Metroid Dread',
  'Fire Emblem: Three Houses',
  'Xenoblade Chronicles 3',
].map((n, i) =>
  gameFamily(n, 'SWITCH', 'nintendo-switch-games', 'nintendo', 4499 - (i % 5) * 200, 2999 - (i % 5) * 150),
);

const SWITCH2_GAMES = [
  'Mario Kart World',
  'The Legend of Zelda: Breath of the Wild (Switch 2 Edition)',
  'The Legend of Zelda: Tears of the Kingdom (Switch 2 Edition)',
  'Nintendo Switch 2 Welcome Tour',
  'Kirby and the Forgotten Land – Nintendo Switch 2 Edition',
  'Super Mario Party Jamboree – Nintendo Switch 2 Edition',
  'Metroid Prime 4: Beyond',
  'Donkey Kong Bananza',
  'Pokémon Legends: Z-A',
  'Mario Tennis Fever',
].map((n, i) =>
  gameFamily(
    n,
    'SWITCH2',
    'nintendo-switch-2-games',
    'nintendo',
    5499 - (i % 4) * 200,
    3999 - (i % 4) * 150,
  ),
);

const DUALSENSE_COLOURS = [
  'White',
  'Midnight Black',
  'Cosmic Red',
  'Starlight Blue',
  'Galactic Purple',
  'Nova Pink',
  'Volcanic Red',
  'Cobalt Blue',
  'Sterling Silver',
  'Chroma Teal',
  'Chroma Indigo',
];

const DUALSHOCK_COLOURS = ['Black', 'White', 'Red'];

const JOYCON_COLOURS = [
  'Blue/Red',
  'Black',
  'White',
  'Other Official Colours',
];

const ACCESSORIES: Family[] = [
  ...DUALSENSE_COLOURS.map((c) => ({
    key: `dualsense-${slugify(c)}`,
    name: `PlayStation 5 DualSense Controller – ${c}`,
    categorySlug: 'playstation-accessories',
    brandSlug: 'sony',
    platform: 'PS5',
    shortDescription: `DualSense wireless controller (${c}).`,
    newPrice: 6499,
    usedPrice: 3999,
    tradeInCash: 1500,
    tradeInCredit: 1900,
  })),
  ...DUALSHOCK_COLOURS.map((c) => ({
    key: `dualshock4-${slugify(c)}`,
    name: `PlayStation 4 DualShock Controller – ${c}`,
    categorySlug: 'playstation-accessories',
    brandSlug: 'sony',
    platform: 'PS4',
    shortDescription: `PS4 DualShock 4 controller (${c}).`,
    newPrice: 4499,
    usedPrice: 2499,
    tradeInCash: 800,
    tradeInCredit: 1100,
  })),
  ...JOYCON_COLOURS.map((c) => ({
    key: `switch2-joycon-${slugify(c)}`,
    name: `Nintendo Switch 2 Joy-Con Controllers – ${c}`,
    categorySlug: 'nintendo-accessories',
    brandSlug: 'nintendo',
    platform: 'SWITCH2',
    shortDescription: `Switch 2 Joy-Con pair (${c}).`,
    newPrice: 7999,
    usedPrice: 5499,
    tradeInCash: 2000,
    tradeInCredit: 2500,
  })),
  {
    key: 'cable-figure-8',
    name: 'Figure 8 Power Cable',
    categorySlug: 'cables',
    brandSlug: 'sony',
    platform: 'PS5',
    shortDescription: 'Figure-8 (C7) power cable for consoles and devices.',
    newPrice: 799,
    usedPrice: 499,
    tradeInCash: 0,
    tradeInCredit: 0,
    bothConditions: false,
  },
  {
    key: 'cable-hdmi',
    name: 'HDMI Cable',
    categorySlug: 'cables',
    brandSlug: 'sony',
    platform: 'PS5',
    shortDescription: 'High-speed HDMI cable for consoles and TVs.',
    newPrice: 999,
    usedPrice: 599,
    tradeInCash: 0,
    tradeInCredit: 0,
    bothConditions: false,
  },
  {
    key: 'cable-usbc',
    name: 'USB-C Cable',
    categorySlug: 'cables',
    brandSlug: 'sony',
    platform: 'PS5',
    shortDescription: 'USB-C charging / data cable.',
    newPrice: 899,
    usedPrice: 499,
    tradeInCash: 0,
    tradeInCredit: 0,
    bothConditions: false,
  },
];

export const CATALOG_CATEGORY_CHILDREN: Array<{
  name: string;
  slug: string;
  parentSlug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
}> = [
  {
    name: 'PlayStation Consoles',
    slug: 'playstation-consoles',
    parentSlug: 'game-consoles',
    description: 'PS5, PS4, PS3 and PS2 consoles',
    imageUrl: '/brand/playstation.png',
    sortOrder: 1,
  },
  {
    name: 'Xbox Consoles',
    slug: 'xbox-consoles',
    parentSlug: 'game-consoles',
    description: 'Xbox Series X and Series S',
    imageUrl: '/brand/pcgames.png',
    sortOrder: 2,
  },
  {
    name: 'Nintendo Consoles',
    slug: 'nintendo-consoles',
    parentSlug: 'game-consoles',
    description: 'Switch OLED and Switch 2',
    imageUrl: '/brand/nintendo.png',
    sortOrder: 3,
  },
  {
    name: 'PlayStation 5 Games',
    slug: 'playstation-5-games',
    parentSlug: 'video-games',
    description: 'Top PS5 titles — new and used',
    imageUrl: '/brand/playstation.png',
    sortOrder: 1,
  },
  {
    name: 'PlayStation 4 Games',
    slug: 'playstation-4-games',
    parentSlug: 'video-games',
    description: 'Top PS4 titles — new and used',
    imageUrl: '/brand/playstation.png',
    sortOrder: 2,
  },
  {
    name: 'PlayStation 3 Games',
    slug: 'playstation-3-games',
    parentSlug: 'video-games',
    description: 'Classic PS3 favourites',
    imageUrl: '/brand/retrogames.png',
    sortOrder: 3,
  },
  {
    name: 'PlayStation 2 Games',
    slug: 'playstation-2-games',
    parentSlug: 'video-games',
    description: 'Retro PS2 classics',
    imageUrl: '/brand/retrogames.png',
    sortOrder: 4,
  },
  {
    name: 'Xbox Games',
    slug: 'xbox-games',
    parentSlug: 'video-games',
    description: 'Xbox Series X/S and Xbox One titles',
    imageUrl: '/brand/pcgames.png',
    sortOrder: 5,
  },
  {
    name: 'Nintendo Switch Games',
    slug: 'nintendo-switch-games',
    parentSlug: 'video-games',
    description: 'Top Switch titles — new and used',
    imageUrl: '/brand/nintendo.png',
    sortOrder: 6,
  },
  {
    name: 'Nintendo Switch 2 Games',
    slug: 'nintendo-switch-2-games',
    parentSlug: 'video-games',
    description: 'Switch 2 games — new and used',
    imageUrl: '/brand/nintendo.png',
    sortOrder: 7,
  },
  {
    name: 'PlayStation Accessories',
    slug: 'playstation-accessories',
    parentSlug: 'accessories',
    description: 'DualSense, DualShock and more',
    imageUrl: '/brand/wireless-controller.png',
    sortOrder: 1,
  },
  {
    name: 'Nintendo Accessories',
    slug: 'nintendo-accessories',
    parentSlug: 'accessories',
    description: 'Joy-Con and Nintendo gear',
    imageUrl: '/brand/nintendo.png',
    sortOrder: 2,
  },
  {
    name: 'Cables',
    slug: 'cables',
    parentSlug: 'accessories',
    description: 'HDMI, USB-C and figure-8 power cables',
    imageUrl: '/brand/accessories.png',
    sortOrder: 3,
  },
];

export function getAllCatalogProducts(): CatalogProductDef[] {
  return [
    ...CONSOLES,
    ...PS5_GAMES,
    ...PS4_GAMES,
    ...XBOX_GAMES,
    ...PS3_GAMES,
    ...PS2_GAMES,
    ...SWITCH_GAMES,
    ...SWITCH2_GAMES,
    ...ACCESSORIES,
  ].flatMap(expandFamily);
}

/** Unique image keys for the fetch pipeline */
export function getCatalogImageKeys(): string[] {
  return [...new Set(getAllCatalogProducts().map((p) => p.imageKey))];
}
