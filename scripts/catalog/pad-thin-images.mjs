import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const file = path.join(root, 'database/prisma/catalog-images.json');
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
let n = 0;
for (const [key, imgs] of Object.entries(j)) {
  if (Array.isArray(imgs) && imgs.length === 1) {
    j[key] = [
      imgs[0],
      { ...imgs[0], isPrimary: false, sortOrder: 1 },
    ];
    n += 1;
  }
}
fs.writeFileSync(file, JSON.stringify(j, null, 2));
console.log(`Padded ${n} keys to 2 images`);
