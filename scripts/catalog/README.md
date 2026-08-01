# Catalog bulk seed

## Local

```bash
# 1) Export image keys + generate placeholder (or RAWG) images
cd /path/to/GAME-MANIA
npx tsx database/prisma/export-image-keys.ts
# Optional real covers:
# RAWG_API_KEY=your_key node scripts/catalog/fetch-images.mjs
# Without key, placeholders + local hardware SVGs:
node scripts/catalog/fetch-images.mjs

# 2) Seed DB (upserts categories + ~265 New/Used products)
npm run db:seed

# Optional verify
cd backend && node ../scripts/catalog/verify-seed.mjs
```

## Live (VPS after git pull / update.sh)

```bash
cd /var/www/gamemania
GH_TOKEN='YOUR_TOKEN' bash scripts/deploy/update.sh

# Enrich images (optional)
npx tsx database/prisma/export-image-keys.ts
# RAWG_API_KEY=xxx node scripts/catalog/fetch-images.mjs
node scripts/catalog/fetch-images.mjs

cd backend && npm run prisma:seed
su - deploy -c 'pm2 restart all --update-env'
```

## Notes

- New/Used are **separate products** (`condition` NEW vs PRE_OWNED_GOOD).
- Prices are UK **estimates** — edit in Admin → Products.
- Do not scrape competitor shop images; use RAWG + local `/catalog/` assets or upload via admin/Cloudinary.
- Hardware images live under `frontend/public/catalog/{consoles,controllers,cables}/`.
- Parent category shop filter includes child categories (e.g. `video-games` shows PS5 games).
