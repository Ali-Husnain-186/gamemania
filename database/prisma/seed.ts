import { PrismaClient, CouponType, ProductCondition, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { CATALOG_CATEGORY_CHILDREN, getAllCatalogProducts } from './catalog-data';

const prisma = new PrismaClient();

type SeedImage = {
  url: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
  publicId?: string | null;
};

function loadCatalogImages(): Record<string, SeedImage[]> {
  try {
    const file = path.join(__dirname, 'catalog-images.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, SeedImage[]>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function imagesForKey(key: string, name: string, map: Record<string, SeedImage[]>): SeedImage[] {
  const aliases: Record<string, string> = {
    'switch2-game-the-legend-of-zelda-tears-of-the-kingdom-switch-2-edition':
      'switch-game-the-legend-of-zelda-tears-of-the-kingdom',
    'switch2-game-the-legend-of-zelda-breath-of-the-wild-switch-2-edition':
      'switch-game-the-legend-of-zelda-breath-of-the-wild',
  };
  const found = map[key] ?? (aliases[key] ? map[aliases[key]] : undefined);
  if (found?.length) return found.slice(0, 4);
  const label = encodeURIComponent(name.slice(0, 24));
  return [0, 1, 2].map((n) => ({
    url: `https://placehold.co/800x800/0f172a/22d3ee?text=${label}+${n + 1}`,
    altText: name,
    isPrimary: n === 0,
    sortOrder: n,
  }));
}

async function main() {
  console.log('Seeding GAME-MANIA...');

  const permissions = [
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'customers:read',
    'customers:write',
    'trade:read',
    'trade:write',
    'coupons:write',
    'reviews:write',
    'cms:write',
    'users:write',
    'roles:write',
    'settings:write',
    'reports:read',
    'shipping:write',
    'inventory:write',
    'notifications:write',
    'audit:read',
  ];

  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: code },
    });
  }

  const allPerms = await prisma.permission.findMany();

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER', description: 'Storefront customer' },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: { name: 'STAFF', description: 'Operations staff' },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Store administrator' },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', description: 'Full system access' },
  });

  const staffCodes = [
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'customers:read',
    'trade:read',
    'trade:write',
    'inventory:write',
    'reviews:write',
  ];

  async function syncRolePerms(roleId: string, codes: string[] | 'ALL') {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    const selected = codes === 'ALL' ? allPerms : allPerms.filter((p) => codes.includes(p.code));
    for (const p of selected) {
      await prisma.rolePermission.create({
        data: { roleId, permissionId: p.id },
      });
    }
  }

  await syncRolePerms(staffRole.id, staffCodes);
  await syncRolePerms(adminRole.id, 'ALL');
  await syncRolePerms(superAdminRole.id, 'ALL');

  const adminPasswordHash = await bcrypt.hash('Private08!', 12);
  const customerPasswordHash = await bcrypt.hash('ChangeMe123!', 12);

  // Primary staff account (admin panel only — no storefront shopping UX)
  await prisma.user.upsert({
    where: { email: 'info@gamemaniauk.co.uk' },
    update: {
      passwordHash: adminPasswordHash,
      firstName: 'Info',
      lastName: 'Admin',
      emailVerified: new Date(),
      roleId: superAdminRole.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'info@gamemaniauk.co.uk',
      passwordHash: adminPasswordHash,
      firstName: 'Info',
      lastName: 'Admin',
      emailVerified: new Date(),
      roleId: superAdminRole.id,
    },
  });

  // Retire legacy seed admin (soft-delete so related rows stay intact)
  await prisma.user.updateMany({
    where: { email: 'admin@gamemania.com' },
    data: { deletedAt: new Date(), isActive: false },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@gamemania.com' },
    update: {},
    create: {
      email: 'demo@gamemania.com',
      passwordHash: customerPasswordHash,
      firstName: 'Demo',
      lastName: 'Player',
      emailVerified: new Date(),
      roleId: customerRole.id,
      rewardPoints: 250,
      storeCredit: 0,
    },
  });

  const existingAddress = await prisma.address.findFirst({
    where: { userId: demoUser.id, isDefault: true },
  });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: demoUser.id,
        label: 'Home',
        fullName: 'Demo Player',
        line1: '12 High Street',
        city: 'Manchester',
        county: 'Greater Manchester',
        postcode: 'M1 1AE',
        country: 'GB',
        phone: '+447700900123',
        isDefault: true,
      },
    });
  }

  // Shipping: under £60 → £3.95; £60+ → free
  await prisma.shippingRule.deleteMany({});
  await prisma.shippingRule.createMany({
    data: [
      {
        name: 'Standard UK under £60',
        description: 'Flat rate for orders under the free threshold',
        minOrderAmount: 0,
        maxOrderAmount: 5999,
        rate: 395,
        country: 'GB',
        isActive: true,
        priority: 10,
      },
      {
        name: 'Free UK shipping £60+',
        description: 'Free shipping for orders £60 and above',
        minOrderAmount: 6000,
        maxOrderAmount: null,
        rate: 0,
        country: 'GB',
        isActive: true,
        priority: 20,
      },
    ],
  });

  await prisma.setting.upsert({
    where: { key: 'store.name' },
    update: { value: 'GameMania UK' },
    create: { key: 'store.name', value: 'GameMania UK', group: 'general' },
  });
  await prisma.setting.upsert({
    where: { key: 'shipping.free_threshold_pence' },
    update: { value: 6000 },
    create: { key: 'shipping.free_threshold_pence', value: 6000, group: 'shipping' },
  });
  await prisma.setting.upsert({
    where: { key: 'loyalty.points_per_pound' },
    update: { value: 1 },
    create: { key: 'loyalty.points_per_pound', value: 1, group: 'loyalty' },
  });

  // Featured storefront categories
  const categoryDefs = [
    {
      name: 'Game Consoles',
      slug: 'game-consoles',
      description: 'PlayStation, Nintendo, Xbox and more',
      imageUrl: '/brand/playstation.png',
      sortOrder: 1,
    },
    {
      name: 'Video Games',
      slug: 'video-games',
      description: 'New and pre-owned games for every platform',
      imageUrl: '/brand/pcgames.png',
      sortOrder: 2,
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Controllers, headsets, cables and more',
      imageUrl: '/brand/accessories.png',
      sortOrder: 3,
    },
  ] as const;

  const categoriesBySlug: Record<string, { id: string }> = {};
  for (const def of categoryDefs) {
    const row = await prisma.category.upsert({
      where: { slug: def.slug },
      update: {
        name: def.name,
        description: def.description,
        imageUrl: def.imageUrl,
        sortOrder: def.sortOrder,
        isActive: true,
      },
      create: {
        name: def.name,
        slug: def.slug,
        description: def.description,
        imageUrl: def.imageUrl,
        sortOrder: def.sortOrder,
        isActive: true,
      },
    });
    categoriesBySlug[def.slug] = row;
  }

  // Hide legacy platform taxonomy — shop uses Video Games + platform filter instead
  await prisma.category.updateMany({
    where: {
      slug: {
        in: ['games', 'consoles', 'playstation', 'nintendo', 'pc-gaming', 'retro', 'controllers'],
      },
    },
    data: { isActive: false },
  });

  const gameConsoles = categoriesBySlug['game-consoles']!;
  const videoGames = categoriesBySlug['video-games']!;
  const accessories = categoriesBySlug.accessories!;

  // Remap any products still on legacy categories
  const legacy = await prisma.category.findMany({
    where: {
      slug: { in: ['playstation', 'nintendo', 'pc-gaming', 'retro', 'controllers', 'games', 'consoles'] },
    },
  });
  for (const cat of legacy) {
    const targetId =
      cat.slug === 'controllers' || cat.slug === 'accessories'
        ? accessories.id
        : cat.slug === 'consoles'
          ? gameConsoles.id
          : videoGames.id;
    await prisma.product.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: targetId },
    });
  }

  const sony = await prisma.brand.upsert({
    where: { slug: 'sony' },
    update: {},
    create: { name: 'Sony', slug: 'sony' },
  });

  const nintendo = await prisma.brand.upsert({
    where: { slug: 'nintendo' },
    update: {},
    create: { name: 'Nintendo', slug: 'nintendo' },
  });

  const microsoft = await prisma.brand.upsert({
    where: { slug: 'microsoft' },
    update: { isActive: true },
    create: { name: 'Microsoft', slug: 'microsoft' },
  });

  for (const child of CATALOG_CATEGORY_CHILDREN) {
    const parent = categoriesBySlug[child.parentSlug];
    if (!parent) continue;
    const row = await prisma.category.upsert({
      where: { slug: child.slug },
      update: {
        name: child.name,
        description: child.description,
        imageUrl: child.imageUrl,
        sortOrder: child.sortOrder,
        isActive: true,
        parentId: parent.id,
      },
      create: {
        name: child.name,
        slug: child.slug,
        description: child.description,
        imageUrl: child.imageUrl,
        sortOrder: child.sortOrder,
        isActive: true,
        parentId: parent.id,
      },
    });
    categoriesBySlug[child.slug] = row;
  }

  const brandsBySlug: Record<string, { id: string }> = {
    sony,
    nintendo,
    microsoft,
  };

  const imageMap = loadCatalogImages();
  const catalogProducts = getAllCatalogProducts();
  let catalogUpserts = 0;

  for (const item of catalogProducts) {
    const category = categoriesBySlug[item.categorySlug];
    const brand = brandsBySlug[item.brandSlug];
    if (!category || !brand) {
      console.warn('Skip catalog row (missing category/brand):', item.sku);
      continue;
    }

    const imgs = imagesForKey(item.imageKey, item.name, imageMap);
    const condition =
      item.condition === 'NEW' ? ProductCondition.NEW : ProductCondition.PRE_OWNED_GOOD;

    const existing = await prisma.product.findUnique({ where: { sku: item.sku } });
    if (existing) {
      await prisma.product.update({
        where: { sku: item.sku },
        data: {
          name: item.name,
          slug: item.slug,
          shortDescription: item.shortDescription,
          description: item.description,
          price: item.price,
          categoryId: category.id,
          brandId: brand.id,
          platform: item.platform,
          condition,
          status: ProductStatus.ACTIVE,
          deletedAt: null,
          isFeatured: Boolean(item.isFeatured),
          isPreorder: Boolean(item.isPreorder),
          tradeInCashPence: item.tradeInCashPence,
          tradeInCreditPence: item.tradeInCreditPence,
          inventory: {
            upsert: {
              create: { quantity: item.quantity, reserved: 0, lowStockThreshold: 2 },
              update: { quantity: item.quantity },
            },
          },
        },
      });
      await prisma.productImage.deleteMany({ where: { productId: existing.id } });
      await prisma.productImage.createMany({
        data: imgs.map((img, i) => ({
          productId: existing.id,
          url: img.url,
          publicId: img.publicId ?? null,
          altText: img.altText ?? item.name,
          isPrimary: img.isPrimary ?? i === 0,
          sortOrder: img.sortOrder ?? i,
        })),
      });
    } else {
      await prisma.product.create({
        data: {
          name: item.name,
          slug: item.slug,
          sku: item.sku,
          shortDescription: item.shortDescription,
          description: item.description,
          price: item.price,
          categoryId: category.id,
          brandId: brand.id,
          platform: item.platform,
          condition,
          status: ProductStatus.ACTIVE,
          isFeatured: Boolean(item.isFeatured),
          isPreorder: Boolean(item.isPreorder),
          tradeInCashPence: item.tradeInCashPence,
          tradeInCreditPence: item.tradeInCreditPence,
          inventory: { create: { quantity: item.quantity, reserved: 0, lowStockThreshold: 2 } },
          images: {
            create: imgs.map((img, i) => ({
              url: img.url,
              publicId: img.publicId ?? null,
              altText: img.altText ?? item.name,
              isPrimary: img.isPrimary ?? i === 0,
              sortOrder: img.sortOrder ?? i,
            })),
          },
        },
      });
    }
    catalogUpserts += 1;
  }
  console.log(`Catalog products upserted: ${catalogUpserts}`);

  // Soft-remove GM catalog SKUs that are no longer in catalog-data (wrong New/Used pairs, etc.)
  const keepSkus = new Set(catalogProducts.map((p) => p.sku));
  const keepSlugs = new Set(catalogProducts.map((p) => p.slug));
  const DEMO_SKUS = [
    'GM-PS5-DEMO-001',
    'GM-SWITCH-DEMO-001',
    'GM-PS5-CONSOLE-001',
    'GM-CTRL-DUALSENSE-001',
    'GM-MS1LNMRU',
  ];
  const orphaned = await prisma.product.findMany({
    where: {
      deletedAt: null,
      sku: { startsWith: 'GM-' },
      NOT: { sku: { in: [...keepSkus, ...DEMO_SKUS] } },
    },
    select: { id: true, sku: true },
  });
  if (orphaned.length) {
    await prisma.product.updateMany({
      where: { id: { in: orphaned.map((o) => o.id) } },
      data: { status: ProductStatus.DRAFT, deletedAt: new Date() },
    });
    console.log(`Retired ${orphaned.length} obsolete catalog SKU(s).`);
  }

  // Extra safety: retire any leftover New/Used twin rows when a single listing exists
  const activeCatalog = await prisma.product.findMany({
    where: { deletedAt: null, status: ProductStatus.ACTIVE, sku: { startsWith: 'GM-' } },
    select: { id: true, name: true, slug: true, sku: true, platform: true, condition: true },
  });
  const groups = new Map<string, typeof activeCatalog>();
  for (const row of activeCatalog) {
    const baseName = row.name.replace(/\s*\((New|Used)\)\s*$/i, '').trim().toLowerCase();
    const key = `${baseName}|${row.platform ?? ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const twinIds: string[] = [];
  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    // Prefer keep SKU/slug that matches current catalog; else prefer NEW; else first
    const preferred =
      rows.find((r) => keepSkus.has(r.sku) || keepSlugs.has(r.slug)) ??
      rows.find((r) => r.condition === ProductCondition.NEW) ??
      rows[0];
    for (const r of rows) {
      if (r.id !== preferred.id) twinIds.push(r.id);
    }
  }
  if (twinIds.length) {
    await prisma.product.updateMany({
      where: { id: { in: twinIds } },
      data: { status: ProductStatus.DRAFT, deletedAt: new Date() },
    });
    console.log(`Retired ${twinIds.length} duplicate New/Used twin product(s).`);
  }

  // Backfill trade-in prices on any older rows still missing them
  const missingTradeIn = await prisma.product.findMany({
    where: {
      OR: [{ tradeInCashPence: null }, { tradeInCreditPence: null }],
    },
    select: { id: true, price: true, tradeInCashPence: true, tradeInCreditPence: true },
  });
  for (const row of missingTradeIn) {
    const cash = row.tradeInCashPence ?? Math.max(100, Math.floor(row.price * 0.35));
    const credit = row.tradeInCreditPence ?? Math.max(100, Math.floor(row.price * 0.4));
    await prisma.product.update({
      where: { id: row.id },
      data: { tradeInCashPence: cash, tradeInCreditPence: credit },
    });
  }
  if (missingTradeIn.length) {
    console.log(`Backfilled trade-in prices on ${missingTradeIn.length} product(s).`);
  }

  const sampleProduct = await prisma.product.upsert({
    where: { sku: 'GM-PS5-DEMO-001' },
    update: {
      categoryId: categoriesBySlug['playstation-5-games']?.id ?? videoGames.id,
      tradeInCashPence: 1500,
      tradeInCreditPence: 1800,
    },
    create: {
      name: 'Demo Adventure — PS5',
      slug: 'demo-adventure-ps5',
      sku: 'GM-PS5-DEMO-001',
      shortDescription: 'Sample catalog product for local development.',
      description: 'This is a seeded demo product used to verify catalog APIs and storefront wiring.',
      price: 5499,
      compareAtPrice: 5999,
      categoryId: categoriesBySlug['playstation-5-games']?.id ?? videoGames.id,
      brandId: sony.id,
      platform: 'PS5',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      tradeInCashPence: 1500,
      tradeInCreditPence: 1800,
      inventory: { create: { quantity: 25, reserved: 0, lowStockThreshold: 5 } },
      images: {
        create: [
          {
            url: 'https://placehold.co/800x800/0f172a/22d3ee?text=GAME-MANIA',
            altText: 'Demo Adventure PS5',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { sku: 'GM-NSW-DEMO-001' },
    update: {
      categoryId: categoriesBySlug['nintendo-consoles']?.id ?? videoGames.id,
      tradeInCashPence: 1200,
      tradeInCreditPence: 1500,
    },
    create: {
      name: 'Demo Kart Deluxe — Switch',
      slug: 'demo-kart-deluxe-switch',
      sku: 'GM-NSW-DEMO-001',
      shortDescription: 'Second sample product for filters and listing.',
      description: 'Seeded Switch title for development.',
      price: 4499,
      categoryId: categoriesBySlug['nintendo-consoles']?.id ?? videoGames.id,
      brandId: nintendo.id,
      platform: 'SWITCH',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE,
      tradeInCashPence: 1200,
      tradeInCreditPence: 1500,
      inventory: { create: { quantity: 40, reserved: 0 } },
      images: {
        create: [
          {
            url: 'https://placehold.co/800x800/14532d/86efac?text=Switch',
            altText: 'Demo Kart Switch',
            isPrimary: true,
          },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { sku: 'GM-PS5-CONSOLE-001' },
    update: {
      categoryId: categoriesBySlug['playstation-consoles']?.id ?? gameConsoles.id,
      tradeInCashPence: 22000,
      tradeInCreditPence: 25000,
    },
    create: {
      name: 'PlayStation 5 Console (Demo)',
      slug: 'playstation-5-console-demo',
      sku: 'GM-PS5-CONSOLE-001',
      shortDescription: 'Demo console SKU for high-value shipping tests.',
      description: 'Seeded console product.',
      price: 47999,
      categoryId: categoriesBySlug['playstation-consoles']?.id ?? gameConsoles.id,
      brandId: sony.id,
      platform: 'PS5',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE,
      tradeInCashPence: 22000,
      tradeInCreditPence: 25000,
      inventory: { create: { quantity: 8, reserved: 0, lowStockThreshold: 2 } },
      images: {
        create: [
          {
            url: '/catalog/consoles/ps5-slim-disc-1.svg',
            altText: 'PlayStation 5 Console (Demo)',
            isPrimary: true,
            sortOrder: 0,
          },
          {
            url: '/catalog/consoles/ps5-slim-disc-2.svg',
            altText: 'PlayStation 5 Console (Demo)',
            isPrimary: false,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  // Ensure demo console always has gallery images
  const demoConsole = await prisma.product.findUnique({
    where: { sku: 'GM-PS5-CONSOLE-001' },
    include: { images: true },
  });
  if (demoConsole && demoConsole.images.length === 0) {
    await prisma.productImage.createMany({
      data: [
        {
          productId: demoConsole.id,
          url: '/catalog/consoles/ps5-slim-disc-1.svg',
          altText: 'PlayStation 5 Console (Demo)',
          isPrimary: true,
          sortOrder: 0,
        },
        {
          productId: demoConsole.id,
          url: '/catalog/consoles/ps5-slim-disc-2.svg',
          altText: 'PlayStation 5 Console (Demo)',
          isPrimary: false,
          sortOrder: 1,
        },
      ],
    });
  }

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrderAmount: 2000,
      usageLimit: 1000,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'GAMEMANIA10' },
    update: { isActive: true, value: 10, type: CouponType.PERCENTAGE },
    create: {
      code: 'GAMEMANIA10',
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrderAmount: 0,
      usageLimit: 10000,
      isActive: true,
    },
  });

  // Trade-in catalog — upsert options so re-seed never duplicates storage/condition rows
  type TradeOptSeed = {
    storage: string;
    condition: ProductCondition;
    baseCashPence: number;
    baseCreditPence: number;
  };
  type TradeModelSeed = { name: string; slug: string; options: TradeOptSeed[] };
  type TradeDeviceSeed = { name: string; slug: string; models: TradeModelSeed[] };
  type TradeConsoleSeed = { name: string; slug: string; devices: TradeDeviceSeed[] };

  const condOpts = (
    storage: string,
    excellent: [number, number],
    good: [number, number],
    fair: [number, number],
  ): TradeOptSeed[] => [
    {
      storage,
      condition: ProductCondition.PRE_OWNED_EXCELLENT,
      baseCashPence: excellent[0],
      baseCreditPence: excellent[1],
    },
    {
      storage,
      condition: ProductCondition.PRE_OWNED_GOOD,
      baseCashPence: good[0],
      baseCreditPence: good[1],
    },
    {
      storage,
      condition: ProductCondition.PRE_OWNED_FAIR,
      baseCashPence: fair[0],
      baseCreditPence: fair[1],
    },
  ];

  const ps5StorageOpts = (baseCash: number, baseCredit: number): TradeOptSeed[] => [
    ...condOpts(
      '825GB',
      [baseCash, baseCredit],
      [baseCash - 3000, baseCredit - 3500],
      [baseCash - 7000, baseCredit - 8000],
    ),
    ...condOpts(
      '1TB',
      [baseCash + 2000, baseCredit + 2500],
      [baseCash - 1000, baseCredit - 1000],
      [baseCash - 5000, baseCredit - 5500],
    ),
    ...condOpts(
      '2TB',
      [baseCash + 5000, baseCredit + 6000],
      [baseCash + 2000, baseCredit + 2500],
      [baseCash - 2000, baseCredit - 2000],
    ),
  ];

  const TRADE_SEED: TradeConsoleSeed[] = [
    {
      name: 'PlayStation',
      slug: 'playstation',
      devices: [
        {
          name: 'PlayStation 5',
          slug: 'ps5',
          models: [
            { name: 'PS5 Slim Disc', slug: 'ps5-slim-disc', options: ps5StorageOpts(28000, 32000) },
            { name: 'PS5 Slim Digital', slug: 'ps5-slim-digital', options: ps5StorageOpts(24000, 27500) },
            {
              name: 'PS5 Original Disc',
              slug: 'ps5-original-disc',
              options: ps5StorageOpts(26000, 30000),
            },
            {
              name: 'PS5 Original Digital',
              slug: 'ps5-original-digital',
              options: ps5StorageOpts(22000, 25500),
            },
          ],
        },
        {
          name: 'PlayStation 4',
          slug: 'ps4',
          models: [
            {
              name: 'PS4 Slim',
              slug: 'ps4-slim',
              options: [
                ...condOpts('500GB', [7000, 8500], [5500, 6800], [4000, 5000]),
                ...condOpts('1TB', [8500, 10000], [7000, 8500], [5000, 6200]),
              ],
            },
            {
              name: 'PS4 Pro',
              slug: 'ps4-pro',
              options: [
                ...condOpts('1TB', [11000, 13000], [9000, 11000], [7000, 8500]),
                ...condOpts('2TB', [13000, 15000], [10500, 12500], [8000, 9500]),
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'Xbox',
      slug: 'xbox',
      devices: [
        {
          name: 'Xbox Series',
          slug: 'xbox-series',
          models: [
            {
              name: 'Xbox Series S',
              slug: 'xbox-series-s',
              options: [
                ...condOpts('512GB', [14000, 16500], [11500, 13500], [8500, 10000]),
                ...condOpts('1TB', [16500, 19000], [14000, 16500], [10500, 12500]),
              ],
            },
            {
              name: 'Xbox Series X',
              slug: 'xbox-series-x',
              options: [
                ...condOpts('1TB', [22000, 25500], [18500, 21500], [14500, 17000]),
                ...condOpts('2TB', [25000, 29000], [21000, 24500], [16500, 19500]),
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'Nintendo',
      slug: 'nintendo',
      devices: [
        {
          name: 'Nintendo Switch',
          slug: 'switch',
          models: [
            {
              name: 'Switch OLED',
              slug: 'switch-oled',
              options: condOpts('64GB', [16000, 18500], [14000, 16000], [11000, 13000]),
            },
          ],
        },
        {
          name: 'Nintendo Switch 2',
          slug: 'switch-2',
          models: [
            {
              name: 'Switch 2 Console',
              slug: 'switch-2-console',
              options: condOpts('256GB', [28000, 32000], [25000, 28500], [21000, 24000]),
            },
          ],
        },
      ],
    },
  ];

  const keepConsoleSlugs = new Set(TRADE_SEED.map((c) => c.slug));
  const keepDeviceSlugs = new Set(TRADE_SEED.flatMap((c) => c.devices.map((d) => d.slug)));
  const keepModelSlugs = new Set(
    TRADE_SEED.flatMap((c) => c.devices.flatMap((d) => d.models.map((m) => m.slug))),
  );

  async function upsertTradeOption(modelId: string, opt: TradeOptSeed) {
    const existing = await prisma.tradeModelOption.findFirst({
      where: {
        modelId,
        storage: opt.storage,
        condition: opt.condition,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      await prisma.tradeModelOption.update({
        where: { id: existing.id },
        data: {
          baseCashPence: opt.baseCashPence,
          baseCreditPence: opt.baseCreditPence,
          isActive: true,
        },
      });
      // Soft-deactivate any duplicate rows for the same storage/condition
      await prisma.tradeModelOption.updateMany({
        where: {
          modelId,
          storage: opt.storage,
          condition: opt.condition,
          id: { not: existing.id },
        },
        data: { isActive: false },
      });
      return;
    }

    await prisma.tradeModelOption.create({
      data: {
        modelId,
        storage: opt.storage,
        condition: opt.condition,
        baseCashPence: opt.baseCashPence,
        baseCreditPence: opt.baseCreditPence,
        isActive: true,
      },
    });
  }

  for (const consoleDef of TRADE_SEED) {
    const consoleRow = await prisma.tradeConsole.upsert({
      where: { slug: consoleDef.slug },
      update: { name: consoleDef.name, isActive: true },
      create: { name: consoleDef.name, slug: consoleDef.slug, isActive: true },
    });

    for (const deviceDef of consoleDef.devices) {
      const deviceRow = await prisma.tradeDevice.upsert({
        where: { consoleId_slug: { consoleId: consoleRow.id, slug: deviceDef.slug } },
        update: { name: deviceDef.name, isActive: true },
        create: {
          consoleId: consoleRow.id,
          name: deviceDef.name,
          slug: deviceDef.slug,
          isActive: true,
        },
      });

      for (const modelDef of deviceDef.models) {
        const modelRow = await prisma.tradeModel.upsert({
          where: { deviceId_slug: { deviceId: deviceRow.id, slug: modelDef.slug } },
          update: { name: modelDef.name, isActive: true },
          create: {
            deviceId: deviceRow.id,
            name: modelDef.name,
            slug: modelDef.slug,
            isActive: true,
          },
        });

        const keepKeys = new Set(modelDef.options.map((o) => `${o.storage}::${o.condition}`));
        for (const opt of modelDef.options) {
          await upsertTradeOption(modelRow.id, opt);
        }

        const existingOpts = await prisma.tradeModelOption.findMany({
          where: { modelId: modelRow.id },
        });
        for (const row of existingOpts) {
          if (!keepKeys.has(`${row.storage}::${row.condition}`)) {
            await prisma.tradeModelOption.update({
              where: { id: row.id },
              data: { isActive: false },
            });
          }
        }
      }
    }
  }

  // Hide legacy trade rows no longer in the catalog (e.g. old generic PS5 Disc)
  for (const m of await prisma.tradeModel.findMany({ select: { id: true, slug: true } })) {
    if (!keepModelSlugs.has(m.slug)) {
      await prisma.tradeModel.update({ where: { id: m.id }, data: { isActive: false } });
    }
  }
  for (const d of await prisma.tradeDevice.findMany({ select: { id: true, slug: true } })) {
    if (!keepDeviceSlugs.has(d.slug)) {
      await prisma.tradeDevice.update({ where: { id: d.id }, data: { isActive: false } });
    }
  }
  for (const c of await prisma.tradeConsole.findMany({ select: { id: true, slug: true } })) {
    if (!keepConsoleSlugs.has(c.slug)) {
      await prisma.tradeConsole.update({ where: { id: c.id }, data: { isActive: false } });
    }
  }

  console.log(
    `Trade-in catalog: ${TRADE_SEED.length} consoles, ${keepDeviceSlugs.size} devices, ${keepModelSlugs.size} models`,
  );

  await prisma.cmsPage.upsert({
    where: { slug: 'about' },
    update: {
      title: 'About GameMania UK',
      content:
        'GameMania UK is an independent UK gaming retailer — games, consoles, accessories and trade-ins.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    create: {
      title: 'About GameMania UK',
      slug: 'about',
      content:
        'GameMania UK is an independent UK gaming retailer — games, consoles, accessories and trade-ins.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const faqContent = `Q: What warranty do you offer?
A: All products purchased from GAMEMANIA UK include a 3-month warranty from the date of delivery. This warranty covers manufacturing faults and defects that occur under normal use.

Q: How does free UK delivery work?
A: We offer free UK delivery on all orders over £60. For orders below this amount, shipping costs will be calculated automatically at checkout.

Q: Can I trade in games and consoles?
A: Yes. You can trade in consoles through our Trade-In page. For games, simply select “Trade to Us” on eligible product pages where a trade-in price is displayed. You can choose to receive either cash or store credit, and we’ll provide a free pre-paid postage label for you to send your items to us.

Q: How do I use a coupon?
A: Enter your coupon code at checkout before completing your purchase. For example, GAMEMANIA10 can be used to receive 10% off during eligible promotions.

Q: How long does delivery take?
A: Most UK orders are dispatched within 1–2 working days.`;

  await prisma.cmsPage.upsert({
    where: { slug: 'faq' },
    update: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      title: 'FAQ',
      content: faqContent,
    },
    create: {
      title: 'FAQ',
      slug: 'faq',
      content: faqContent,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'contact' },
    update: {
      content: 'Email Info@gamemaniauk.co.uk or use the Contact form. Trade-in quotes are available on the Trade-In page.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    create: {
      title: 'Contact',
      slug: 'contact',
      content: 'Email Info@gamemaniauk.co.uk or use the Contact form. Trade-in quotes are available on the Trade-In page.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const lastUpdated = '1 August 2026';

  const termsContent = `Last Updated: ${lastUpdated}

Welcome to GameMania UK.

By accessing or using our website, you agree to these Terms & Conditions.

1. About Us
GameMania UK is an independent UK retailer specialising in New Video Games, Pre-Owned Video Games, Games Consoles, Gaming Accessories, and Trade-In Services.

2. Orders
All orders are subject to acceptance and product availability. GameMania UK reserves the right to cancel or refuse any order where stock is unavailable, pricing errors occur, fraud is suspected, or payment cannot be authorised. If payment has already been taken, a full refund will be issued.

3. Pricing
All prices shown are in Pounds Sterling (£). Prices include VAT where applicable. Prices may change without notice.

4. Product Information
We make every effort to ensure product descriptions and images are accurate. However, colours and images may vary slightly depending on your device. Used products may show signs of previous use unless otherwise stated.

5. Condition of Pre-Owned Products
All pre-owned consoles and accessories are professionally tested, cleaned and inspected before dispatch to ensure they are fully functional. Any cosmetic imperfections will be reflected in the product description where relevant.

6. Delivery
Estimated delivery times are provided for guidance only. Ownership of goods passes to the customer upon delivery. Customers should inspect deliveries promptly and report any issues as soon as possible.

7. Returns
Your statutory rights under UK consumer law are not affected. If you wish to return an item, please contact us before sending it back. Items must be returned in accordance with our Returns Policy. Faulty products will be repaired, replaced or refunded where required by law.

8. Trade-In Service
Trade-in quotations provided online are estimates only. Final valuations are subject to inspection upon receipt and may be adjusted based on cosmetic condition, functionality, missing accessories and authenticity. Customers may choose to accept or decline any revised valuation. GameMania UK reserves the right to refuse counterfeit, stolen or prohibited items.

9. Intellectual Property
All content on this website, including logos, images, graphics, product descriptions and website design, is the property of GameMania UK unless otherwise stated. No content may be copied or reproduced without written permission.

10. Website Use
You agree not to use the website unlawfully, attempt to gain unauthorised access, upload malicious software, or misuse our services.

11. Limitation of Liability
Nothing within these Terms excludes liability where it cannot legally be excluded under the laws of England and Wales. To the fullest extent permitted by law, GameMania UK’s liability shall be limited to the value of the products purchased.

12. Governing Law
These Terms & Conditions are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.

13. Contact Us
GameMania UK
Website: www.gamemaniaauk.co.uk
Email: Info@gamemaniauk.co.uk`;

  const privacyContent = `Last Updated: ${lastUpdated}

Welcome to GameMania UK (“we”, “our”, “us”). We are committed to protecting your privacy and ensuring your personal information is handled securely and responsibly.

This Privacy Policy explains how we collect, use and protect your personal information when you visit www.gamemaniaauk.co.uk or purchase products from us.

Who We Are
GameMania UK is an independent UK gaming retailer specialising in New & Pre-Owned Video Games, Games Consoles, Gaming Accessories and Trade-In Services.

If you have any questions regarding this Privacy Policy, please contact us at:
Email: Info@gamemania.co.uk

Information We Collect
Personal Information: Full Name, Billing Address, Delivery Address, Email Address, Telephone Number.
Order Information: Products purchased, Order history, Trade-in requests, Delivery information.
Payment Information: Payments are securely processed through trusted third-party payment providers. GameMania UK never stores your full payment card details.
Website Information: IP Address, Browser Type, Device Information, Pages Visited, Time Spent on Website, Cookies.

How We Use Your Information
We use your information to process orders, deliver purchases, process trade-in requests, verify payments, prevent fraud, improve our website, provide customer support, comply with legal obligations, and send promotional emails only where you have opted in.

Marketing
If you choose to receive marketing communications, we may occasionally send updates regarding new game releases, trade-in promotions, exclusive discounts, special offers and gaming news. You can unsubscribe at any time using the link within any marketing email.

Cookies
GameMania UK uses cookies to improve your browsing experience, remember preferences, improve performance, understand visitor behaviour, measure traffic and improve security. You can disable cookies through your browser settings at any time.

Sharing Your Information
We never sell your personal information. Your information may only be shared with trusted third parties where necessary, including payment providers, delivery companies, website hosting providers, fraud prevention agencies, and legal authorities where required by law.

Keeping Your Information Safe
We use appropriate technical and organisational measures to protect your information against unauthorised access, loss, misuse and disclosure. While no online service can guarantee absolute security, we continually work to protect your personal information.

Your Rights
Under UK GDPR you have the right to request access to your personal information, correct inaccurate information, request deletion of your data, restrict processing, object to marketing, and request a copy of your data.
To exercise these rights, please contact: support@gamemaniaauk.co.uk

Changes to This Policy
We may update this Privacy Policy from time to time. Any changes will be published on this page.

Contact Us
GameMania UK
Website: www.gamemaniaauk.co.uk
Email: Info@gamemania.co.uk`;

  const returnsContent = `Last Updated: ${lastUpdated}

Returns Policy — GameMania UK

Your statutory rights under UK consumer law are not affected.

Contact us before returning any item. Faulty products will be repaired, replaced or refunded where required by law.

Pre-owned items must be returned in the same condition you received them, with original packaging where possible.

For full details see our Terms & Conditions, or email Info@gamemaniauk.co.uk.`;

  const shippingContent = `Last Updated: ${lastUpdated}

Shipping Policy — GameMania UK

We offer free UK delivery on orders over £60. Below that amount, shipping is calculated at checkout.

Most UK orders are dispatched within 1–2 working days after payment clears.

Delivery times are estimates only. You will receive tracking where available.

For questions, contact Info@gamemaniauk.co.uk.`;

  for (const page of [
    { slug: 'terms', title: 'Terms & Conditions', content: termsContent },
    { slug: 'privacy', title: 'Privacy Policy', content: privacyContent },
    { slug: 'returns', title: 'Returns Policy', content: returnsContent },
    { slug: 'shipping', title: 'Shipping Policy', content: shippingContent },
  ]) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        content: page.content,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      create: {
        title: page.title,
        slug: page.slug,
        content: page.content,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  await prisma.setting.upsert({
    where: { key: 'social.links' },
    update: {
      value: [],
    },
    create: {
      key: 'social.links',
      group: 'social',
      value: [],
    },
  });

  const dualSense = await prisma.product.upsert({
    where: { sku: 'GM-CTRL-DUALSENSE-001' },
    update: {
      categoryId: categoriesBySlug['playstation-accessories']?.id ?? accessories.id,
      tradeInCashPence: 1500,
      tradeInCreditPence: 1900,
    },
    create: {
      name: 'DualSense Wireless Controller (Demo)',
      slug: 'dualsense-wireless-controller-demo',
      sku: 'GM-CTRL-DUALSENSE-001',
      shortDescription: 'Accessory SKU for cart and free-shipping tests.',
      description: 'Seeded accessory product.',
      price: 6499,
      categoryId: categoriesBySlug['playstation-accessories']?.id ?? accessories.id,
      brandId: sony.id,
      platform: 'PS5',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      tradeInCashPence: 1500,
      tradeInCreditPence: 1900,
      inventory: { create: { quantity: 50, reserved: 0, lowStockThreshold: 5 } },
      images: {
        create: [
          {
            url: 'https://placehold.co/800x800/1e293b/38bdf8?text=DualSense',
            altText: 'DualSense controller',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const switchDemo = await prisma.product.findUnique({ where: { sku: 'GM-NSW-DEMO-001' } });
  const ps5Console = await prisma.product.findUnique({ where: { sku: 'GM-PS5-CONSOLE-001' } });

  const reviewCustomers = [
    {
      email: 'alex.m@example.com',
      firstName: 'Alex',
      lastName: 'Morgan',
      city: 'Manchester',
    },
    {
      email: 'priya.s@example.com',
      firstName: 'Priya',
      lastName: 'Shah',
      city: 'London',
    },
    {
      email: 'jordan.t@example.com',
      firstName: 'Jordan',
      lastName: 'Taylor',
      city: 'Birmingham',
    },
    {
      email: 'samira.k@example.com',
      firstName: 'Samira',
      lastName: 'Khan',
      city: 'Leeds',
    },
    {
      email: 'chris.w@example.com',
      firstName: 'Chris',
      lastName: 'Walker',
      city: 'Bristol',
    },
  ];

  const seededReviewers = [];
  for (const c of reviewCustomers) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        firstName: c.firstName,
        lastName: c.lastName,
        isActive: true,
        deletedAt: null,
        roleId: customerRole.id,
      },
      create: {
        email: c.email,
        passwordHash: customerPasswordHash,
        firstName: c.firstName,
        lastName: c.lastName,
        emailVerified: new Date(),
        roleId: customerRole.id,
      },
    });
    seededReviewers.push({ ...user, city: c.city });
  }

  const reviewTargets = [
    {
      user: seededReviewers[0]!,
      productId: sampleProduct.id,
      rating: 5,
      title: 'Sealed and fast',
      body: 'Fast delivery and the game arrived sealed. Checkout was smooth and the trade-in quote was fair.',
    },
    {
      user: seededReviewers[1]!,
      productId: dualSense.id,
      rating: 5,
      title: 'Great accessory range',
      body: 'Loved the range of consoles and accessories. Support replied quickly when I needed help.',
    },
    {
      user: seededReviewers[2]!,
      productId: ps5Console?.id ?? sampleProduct.id,
      rating: 5,
      title: 'Trade-in then upgrade',
      body: 'Traded in my old PS4 games for store credit and picked up new releases the same week.',
    },
    {
      user: seededReviewers[3]!,
      productId: switchDemo?.id ?? sampleProduct.id,
      rating: 4,
      title: 'Promo code worked',
      body: 'Clean site, genuine products, and GAMEMANIA10 actually worked. Will shop again.',
    },
    {
      user: seededReviewers[4]!,
      productId: dualSense.id,
      rating: 5,
      title: 'Solid UK shop',
      body: 'Packaging was perfect and tracking updates were clear. Happy to recommend GAME MANIA.',
    },
  ];

  // Avoid unique collisions when reseeding: clear demo review set first
  await prisma.review.deleteMany({
    where: {
      user: { email: { in: reviewCustomers.map((c) => c.email) } },
    },
  });

  for (const r of reviewTargets) {
    await prisma.review.create({
      data: {
        userId: r.user.id,
        productId: r.productId,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: 'APPROVED',
      },
    });
  }

  console.log('Seed complete.');
  console.log('Admin (panel only): Info@gamemaniauk.co.uk / Private08!');
  console.log('Customer: demo@gamemania.com / ChangeMe123!');
  console.log(`Sample product slug: ${sampleProduct.slug}`);
  console.log(`Seeded ${reviewTargets.length} approved customer reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
