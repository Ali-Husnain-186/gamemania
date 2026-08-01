/**
 * Export image keys for scripts/catalog/fetch-images.mjs
 * Run: npx tsx database/prisma/export-image-keys.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCatalogImageKeys } from './catalog-data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keys = getCatalogImageKeys();
const out = path.join(__dirname, 'catalog-image-keys.json');
fs.writeFileSync(out, JSON.stringify(keys, null, 2));
console.log('Wrote', keys.length, 'keys to', out);
