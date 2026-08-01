import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const total = await p.product.count({ where: { sku: { startsWith: 'GM-' } } });
  const used = await p.product.count({
    where: { sku: { startsWith: 'GM-' }, condition: 'PRE_OWNED_GOOD' },
  });
  const neu = await p.product.count({
    where: { sku: { startsWith: 'GM-' }, condition: 'NEW' },
  });
  const withImgs = await p.product.count({
    where: { sku: { startsWith: 'GM-' }, images: { some: {} } },
  });
  const missingTrade = await p.product.findMany({
    where: {
      sku: { startsWith: 'GM-' },
      OR: [{ tradeInCashPence: null }, { tradeInCreditPence: null }],
    },
    select: { sku: true, slug: true },
  });
  const noImgs = await p.product.findMany({
    where: { sku: { startsWith: 'GM-' }, images: { none: {} } },
    select: { sku: true, slug: true },
  });
  const sampleSkus = await p.product.findMany({
    where: { sku: { startsWith: 'GM-' }, NOT: { sku: { contains: 'DEMO' } } },
    select: { sku: true, name: true, condition: true },
    take: 8,
    orderBy: { sku: 'asc' },
  });
  const sample = await p.product.findFirst({
    where: { sku: sampleSkus[0]?.sku ?? 'none' },
    include: { images: true, category: true },
  });
  const childCats = await p.category.findMany({
    where: { parentId: { not: null } },
    select: { slug: true, name: true },
  });

  console.log(
    JSON.stringify(
      {
        total,
        used,
        neu,
        withImgs,
        missingTrade,
        noImgs,
        childCats: childCats.length,
        sampleSkus,
        sample: sample && {
          sku: sample.sku,
          imgs: sample.images.length,
          cat: sample.category?.slug,
          trade: [sample.tradeInCashPence, sample.tradeInCreditPence],
          condition: sample.condition,
          imageHosts: sample.images.map((i) => {
            try {
              return i.url.startsWith('/') ? 'local' : new URL(i.url).hostname;
            } catch {
              return i.url.slice(0, 40);
            }
          }),
        },
      },
      null,
      2,
    ),
  );
}

main()
  .finally(() => p.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
