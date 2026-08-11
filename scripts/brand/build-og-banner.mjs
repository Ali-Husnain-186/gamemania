/**
 * Builds a crisp 1200×630 OG/share banner from the high-res logo.
 * Usage (from repo root): node scripts/brand/build-og-banner.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const frontendBrand = path.join(root, 'frontend/public/brand');

const W = 1200;
const H = 630;
const logoPath = path.join(frontendBrand, 'game-mania-logo.png');
const outPath = path.join(frontendBrand, 'og-share-hd.png');
const outAlias = path.join(frontendBrand, 'og-share-banner.png');

/** Make near-white pixels transparent so the circular logo sits cleanly on dark bg. */
async function logoOnTransparent(size) {
  const { data, info } = await sharp(logoPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Outside the cyan circle is white / off-white
    if (r > 245 && g > 245 && b > 245) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

const bg = await sharp({
  create: {
    width: W,
    height: H,
    channels: 3,
    background: { r: 10, g: 16, b: 22 },
  },
})
  .png()
  .toBuffer();

const logoSize = 380;
const logo = await logoOnTransparent(logoSize);

const titleSvg = Buffer.from(`
<svg width="${W}" height="90" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="58" text-anchor="middle"
    font-family="Arial Black, Impact, Arial, Helvetica, sans-serif"
    font-size="50" font-weight="800" letter-spacing="10" fill="#FFFFFF">GAMEMANIA UK</text>
</svg>`);

const title = await sharp(titleSvg).png().toBuffer();

const logoTop = Math.round((H - logoSize - 96) / 2);
const logoLeft = Math.round((W - logoSize) / 2);
const titleTop = logoTop + logoSize + 12;

const banner = await sharp(bg)
  .composite([
    { input: logo, top: logoTop, left: logoLeft },
    { input: title, top: titleTop, left: 0 },
  ])
  .png({ compressionLevel: 4 })
  .toBuffer();

await fs.promises.writeFile(outPath, banner);
await fs.promises.writeFile(outAlias, banner);

const meta = await sharp(outPath).metadata();
console.log(`OK ${outPath} ${meta.width}x${meta.height} (${fs.statSync(outPath).size} bytes)`);
console.log(`OK alias ${outAlias}`);
