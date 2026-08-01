import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const products = await p.product.findMany({
    where: { deletedAt: null, status: 'ACTIVE', sku: { startsWith: 'GM-' } },
    select: {
      sku: true,
      slug: true,
      name: true,
      condition: true,
      platform: true,
      category: { select: { slug: true } },
      images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  });

  const byBase = {};
  for (const prod of products) {
    const base = prod.slug.replace(/-new$|-used$/, '');
    byBase[base] = byBase[base] || [];
    byBase[base].push(prod);
  }

  const singles = Object.entries(byBase)
    .filter(([, a]) => a.length === 1)
    .map(([b, a]) => ({ base: b, cond: a[0].condition, name: a[0].name, plat: a[0].platform }));

  const pairs = Object.entries(byBase).filter(([, a]) => a.length >= 2).length;
  const ps2ps3New = products.filter(
    (x) => (x.platform === 'PS2' || x.platform === 'PS3') && x.condition === 'NEW',
  );
  const cables = products.filter((x) => x.category?.slug === 'cables');

  console.log(
    JSON.stringify(
      {
        total: products.length,
        families: Object.keys(byBase).length,
        pairs,
        singleCount: singles.length,
        singlesSample: singles.slice(0, 20),
        ps2ps3New: ps2ps3New.map((x) => x.sku),
        cables: cables.map((c) => ({ n: c.name, c: c.condition })),
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
