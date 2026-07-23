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

  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@gamemania.com' },
    update: {},
    create: {
      email: 'admin@gamemania.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      emailVerified: new Date(),
      roleId: superAdminRole.id,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@gamemania.com' },
    update: {},
    create: {
      email: 'demo@gamemania.com',
      passwordHash,
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

  const games = await prisma.category.upsert({
    where: { slug: 'games' },
    update: {},
    create: {
      name: 'Games',
      slug: 'games',
      description: 'Physical and digital-ready game titles',
      sortOrder: 1,
    },
  });

  const consoles = await prisma.category.upsert({
    where: { slug: 'consoles' },
    update: {},
    create: {
      name: 'Consoles',
      slug: 'consoles',
      description: 'Gaming consoles and bundles',
      sortOrder: 2,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Controllers, headsets, and more',
      sortOrder: 3,
    },
  });

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
    update: {},
    create: {
      name: 'Demo Adventure — PS5',
      slug: 'demo-adventure-ps5',
      sku: 'GM-PS5-DEMO-001',
      shortDescription: 'Sample catalog product for local development.',
      description: 'This is a seeded demo product used to verify catalog APIs and storefront wiring.',
      price: 5499,
      compareAtPrice: 5999,
      categoryId: games.id,
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
    update: {},
    create: {
      name: 'Demo Kart Deluxe — Switch',
      slug: 'demo-kart-deluxe-switch',
      sku: 'GM-NSW-DEMO-001',
      shortDescription: 'Second sample product for filters and listing.',
      description: 'Seeded Switch title for development.',
      price: 4499,
      categoryId: games.id,
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
    update: {},
    create: {
      name: 'PlayStation 5 Console (Demo)',
      slug: 'playstation-5-console-demo',
      sku: 'GM-PS5-CONSOLE-001',
      shortDescription: 'Demo console SKU for high-value shipping tests.',
      description: 'Seeded console product.',
      price: 47999,
      categoryId: consoles.id,
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
    update: {},
    create: {
      title: 'FAQ',
      slug: 'faq',
      content: 'Frequently asked questions will be managed from the admin CMS.',
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

  await prisma.product.upsert({
    where: { sku: 'GM-CTRL-DUALSENSE-001' },
    update: {},
    create: {
      name: 'DualSense Wireless Controller (Demo)',
      slug: 'dualsense-wireless-controller-demo',
      sku: 'GM-CTRL-DUALSENSE-001',
      shortDescription: 'Accessory SKU for cart and free-shipping tests.',
      description: 'Seeded accessory product.',
      price: 6499,
      categoryId: (await prisma.category.findUnique({ where: { slug: 'accessories' } }))!.id,
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

  console.log('Seed complete.');
  console.log('Admin: admin@gamemania.com / ChangeMe123!');
  console.log('Customer: demo@gamemania.com / ChangeMe123!');
  console.log(`Sample product slug: ${sampleProduct.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
