/**
 * Export full catalog product details to Excel.
 * Usage: node scripts/catalog/export-products-xlsx.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

function loadCatalogFromTs() {
  const dumpTs = path.join(__dirname, '_tmp-catalog-dump.ts');
  const dumpJson = path.join(__dirname, '_tmp-catalog-dump.json');
  fs.writeFileSync(
    dumpTs,
    `
import { writeFileSync } from 'fs';
import { getAllCatalogProducts, CATALOG_CATEGORY_CHILDREN } from '../../database/prisma/catalog-data';
writeFileSync(
  ${JSON.stringify(dumpJson)},
  JSON.stringify({
    products: getAllCatalogProducts(),
    categories: CATALOG_CATEGORY_CHILDREN,
  }),
);
console.log('ok');
`,
  );

  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const r = spawnSync(npx, ['tsx', dumpTs], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    shell: true,
  });

  try {
    fs.unlinkSync(dumpTs);
  } catch {
    /* ignore */
  }

  if (r.status !== 0 || !fs.existsSync(dumpJson)) {
    console.error(r.stderr || r.stdout);
    throw new Error('Failed to dump catalog-data');
  }

  const data = JSON.parse(fs.readFileSync(dumpJson, 'utf8'));
  try {
    fs.unlinkSync(dumpJson);
  } catch {
    /* ignore */
  }
  return data;
}

function penceToGbp(p) {
  return Number((Number(p || 0) / 100).toFixed(2));
}

function conditionLabel(c) {
  if (c === 'NEW') return 'New';
  if (c === 'PRE_OWNED_GOOD') return 'Pre-owned (Good)';
  if (c === 'PRE_OWNED_EXCELLENT') return 'Pre-owned (Excellent)';
  if (c === 'PRE_OWNED_FAIR') return 'Pre-owned (Fair)';
  return c || '';
}

function main() {
  const { products, categories } = loadCatalogFromTs();
  const catBySlug = Object.fromEntries((categories || []).map((c) => [c.slug, c]));

  const imagesPath = path.join(ROOT, 'database/prisma/catalog-images.json');
  const imagesMap = fs.existsSync(imagesPath)
    ? JSON.parse(fs.readFileSync(imagesPath, 'utf8'))
    : {};

  const site = 'https://gamemaniauk.co.uk';

  const rows = products.map((p, i) => {
    const imgs = imagesMap[p.imageKey] || [];
    const primary = imgs.find((x) => x.isPrimary) || imgs[0];
    const allUrls = imgs
      .map((x) => x.url)
      .filter(Boolean)
      .map((u) => (u.startsWith('http') ? u : `${site}${u}`))
      .join(' | ');

    const cat = catBySlug[p.categorySlug];

    return {
      '#': i + 1,
      Name: p.name,
      SKU: p.sku,
      Slug: p.slug,
      'Product URL': `${site}/products/${p.slug}`,
      Platform: p.platform,
      Condition: conditionLabel(p.condition),
      Category: cat?.name || p.categorySlug,
      'Category Slug': p.categorySlug,
      Brand: p.brandSlug,
      'Price (£)': penceToGbp(p.price),
      'Price (pence)': p.price,
      'Trade-in Cash (£)': penceToGbp(p.tradeInCashPence),
      'Trade-in Cash (pence)': p.tradeInCashPence,
      'Trade-in Voucher (£)': penceToGbp(p.tradeInCreditPence),
      'Trade-in Voucher (pence)': p.tradeInCreditPence,
      Stock: p.quantity,
      Featured: p.isFeatured ? 'Yes' : 'No',
      Preorder: p.isPreorder ? 'Yes' : 'No',
      'Short Description': p.shortDescription || '',
      Description: p.description || '',
      'Image Key': p.imageKey,
      'Primary Image URL': primary?.url
        ? primary.url.startsWith('http')
          ? primary.url
          : `${site}${primary.url}`
        : '',
      'All Image URLs': allUrls,
      Status: 'ACTIVE',
      Warranty: '3 months',
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] || {}).map((key) => ({
    wch:
      key === 'Description'
        ? 50
        : key.includes('URL') || key.includes('Image')
          ? 42
          : key === 'Name'
            ? 38
            : key === 'SKU' || key === 'Slug'
              ? 34
              : 16,
  }));
  XLSX.utils.book_append_sheet(wb, ws, 'All Products');

  const byPlatform = {};
  for (const p of products) {
    byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
  }
  const summaryRows = [
    { Metric: 'Total products', Value: products.length },
    { Metric: 'Generated at (UTC)', Value: new Date().toISOString() },
    ...Object.entries(byPlatform)
      .sort((a, b) => b[1] - a[1])
      .map(([platform, count]) => ({ Metric: `Platform: ${platform}`, Value: count })),
  ];
  const wsSum = XLSX.utils.json_to_sheet(summaryRows);
  wsSum['!cols'] = [{ wch: 28 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsSum, 'Summary');

  const byCat = {};
  for (const p of products) {
    const name = catBySlug[p.categorySlug]?.name || p.categorySlug;
    byCat[name] = (byCat[name] || 0) + 1;
  }
  const catRows = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([Category, Count]) => ({ Category, Count }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), 'By Category');

  const outDir = path.join(ROOT, 'exports');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'GameMania-Product-Catalog.xlsx');
  XLSX.writeFile(wb, outPath);
  console.log(`Exported ${products.length} products → ${outPath}`);
}

main();
