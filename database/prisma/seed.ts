import { PrismaClient, CouponType, ProductCondition, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    update: { value: 'GAME-MANIA' },
    create: { key: 'store.name', value: 'GAME-MANIA', group: 'general' },
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

  // Featured storefront categories (keep home + admin product dropdown in sync)
  const categoryDefs = [
    {
      name: 'PlayStation',
      slug: 'playstation',
      description: 'PS5, PS4 and PlayStation gear',
      imageUrl: '/brand/playstation.png',
      sortOrder: 1,
    },
    {
      name: 'Nintendo',
      slug: 'nintendo',
      description: 'Switch and Nintendo classics',
      imageUrl: '/brand/nintendo.png',
      sortOrder: 2,
    },
    {
      name: 'PC Gaming',
      slug: 'pc-gaming',
      description: 'PC games and gaming hardware',
      imageUrl: '/brand/pcgames.png',
      sortOrder: 3,
    },
    {
      name: 'Retro',
      slug: 'retro',
      description: 'Retro consoles and classic titles',
      imageUrl: '/brand/retrogames.png',
      sortOrder: 4,
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Headsets, cables, and more',
      imageUrl: '/brand/accessories.png',
      sortOrder: 5,
    },
    {
      name: 'Controllers',
      slug: 'controllers',
      description: 'Wireless and wired controllers',
      imageUrl: '/brand/wireless-controller.png',
      sortOrder: 6,
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

  // Hide legacy taxonomy that no longer appears on the storefront
  await prisma.category.updateMany({
    where: { slug: { in: ['games', 'consoles'] } },
    data: { isActive: false },
  });

  const playstation = categoriesBySlug.playstation;
  const nintendoCat = categoriesBySlug.nintendo;
  const controllers = categoriesBySlug.controllers;

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

  const sampleProduct = await prisma.product.upsert({
    where: { sku: 'GM-PS5-DEMO-001' },
    update: { categoryId: playstation.id },
    create: {
      name: 'Demo Adventure — PS5',
      slug: 'demo-adventure-ps5',
      sku: 'GM-PS5-DEMO-001',
      shortDescription: 'Sample catalog product for local development.',
      description: 'This is a seeded demo product used to verify catalog APIs and storefront wiring.',
      price: 5499,
      compareAtPrice: 5999,
      categoryId: playstation.id,
      brandId: sony.id,
      platform: 'PS5',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
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
    update: { categoryId: nintendoCat.id },
    create: {
      name: 'Demo Kart Deluxe — Switch',
      slug: 'demo-kart-deluxe-switch',
      sku: 'GM-NSW-DEMO-001',
      shortDescription: 'Second sample product for filters and listing.',
      description: 'Seeded Switch title for development.',
      price: 4499,
      categoryId: nintendoCat.id,
      brandId: nintendo.id,
      platform: 'SWITCH',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE,
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
    update: { categoryId: playstation.id },
    create: {
      name: 'PlayStation 5 Console (Demo)',
      slug: 'playstation-5-console-demo',
      sku: 'GM-PS5-CONSOLE-001',
      shortDescription: 'Demo console SKU for high-value shipping tests.',
      description: 'Seeded console product.',
      price: 47999,
      categoryId: playstation.id,
      brandId: sony.id,
      platform: 'PS5',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE,
      inventory: { create: { quantity: 8, reserved: 0, lowStockThreshold: 2 } },
    },
  });

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

  // Trade-in sample tree
  const ps = await prisma.tradeConsole.upsert({
    where: { slug: 'playstation' },
    update: {},
    create: { name: 'PlayStation', slug: 'playstation' },
  });

  const ps5 = await prisma.tradeDevice.upsert({
    where: { consoleId_slug: { consoleId: ps.id, slug: 'ps5' } },
    update: {},
    create: { consoleId: ps.id, name: 'PlayStation 5', slug: 'ps5' },
  });

  const ps5Disc = await prisma.tradeModel.upsert({
    where: { deviceId_slug: { deviceId: ps5.id, slug: 'ps5-disc' } },
    update: {},
    create: { deviceId: ps5.id, name: 'PS5 Disc Edition', slug: 'ps5-disc' },
  });

  await prisma.tradeModelOption.createMany({
    data: [
      {
        modelId: ps5Disc.id,
        storage: '825GB',
        condition: ProductCondition.PRE_OWNED_EXCELLENT,
        baseCashPence: 25000,
        baseCreditPence: 28000,
      },
      {
        modelId: ps5Disc.id,
        storage: '825GB',
        condition: ProductCondition.PRE_OWNED_GOOD,
        baseCashPence: 22000,
        baseCreditPence: 24500,
      },
      {
        modelId: ps5Disc.id,
        storage: '825GB',
        condition: ProductCondition.PRE_OWNED_FAIR,
        baseCashPence: 18000,
        baseCreditPence: 20000,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      title: 'About GAME-MANIA',
      slug: 'about',
      content: 'GAME-MANIA is a premium UK gaming marketplace.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'faq' },
    update: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      content: `Q: What warranty do you offer?
A: All GAME MANIA products include a 3-month warranty from the date of delivery, covering manufacturing faults under normal use.

Q: How does free UK delivery work?
A: Orders over £60 qualify for free UK shipping. Below that, shipping is calculated at checkout.

Q: Can I trade in games and consoles?
A: Yes. Use Trade-In for consoles, or on product pages use “Trade to us” when a trade-in price is listed for games. Choose cash or store credit. We send a pre-printed postage label to our address.

Q: How do I use a coupon?
A: Enter your code at checkout (e.g. GAMEMANIA10 for 10% off when available).

Q: How long does delivery take?
A: Most UK orders ship within 1–2 working days after payment clears.

Q: How do I contact support?
A: Email us via the Contact page or reply to your order confirmation email.`,
    },
    create: {
      title: 'FAQ',
      slug: 'faq',
      content: `Q: What warranty do you offer?
A: All GAME MANIA products include a 3-month warranty from the date of delivery, covering manufacturing faults under normal use.

Q: How does free UK delivery work?
A: Orders over £60 qualify for free UK shipping. Below that, shipping is calculated at checkout.

Q: Can I trade in games and consoles?
A: Yes. Use Trade-In for consoles, or on product pages use “Trade to us” when a trade-in price is listed for games. Choose cash or store credit. We send a pre-printed postage label to our address.

Q: How do I use a coupon?
A: Enter your code at checkout (e.g. GAMEMANIA10 for 10% off when available).

Q: How long does delivery take?
A: Most UK orders ship within 1–2 working days after payment clears.

Q: How do I contact support?
A: Email us via the Contact page or reply to your order confirmation email.`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'contact' },
    update: {},
    create: {
      title: 'Contact',
      slug: 'contact',
      content: 'Email support@gamemania.com or use the trade-in wizard for console valuations.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const dualSense = await prisma.product.upsert({
    where: { sku: 'GM-CTRL-DUALSENSE-001' },
    update: { categoryId: controllers.id },
    create: {
      name: 'DualSense Wireless Controller (Demo)',
      slug: 'dualsense-wireless-controller-demo',
      sku: 'GM-CTRL-DUALSENSE-001',
      shortDescription: 'Accessory SKU for cart and free-shipping tests.',
      description: 'Seeded accessory product.',
      price: 6499,
      categoryId: controllers.id,
      brandId: sony.id,
      platform: 'PS5',
      condition: ProductCondition.NEW,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
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
