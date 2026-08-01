# Catalog images (HQ)

## Approach

| Priority | Source            | Best for                                                | Key?                    |
| -------- | ----------------- | ------------------------------------------------------- | ----------------------- |
| 1        | **IGDB** (Twitch) | Exact game covers + screenshots (`cover_big` / `1080p`) | Free Client ID + Secret |
| 2        | **Steam CDN**     | High-quality `library_600x900` + hero art               | No                      |
| 3        | **Wikipedia**     | Console exclusives + hardware product photos            | No                      |

Images are **downloaded** into `frontend/public/catalog/` (2–4 per SKU family), then
`node scripts/catalog/build-showcase.mjs` builds **white-background showcase** primaries:

- **Games** → physical case mockup with platform banner (PS5 / PS4 / Xbox / Switch)
- **Hardware** → product cutout on white (Amazon / CeX style)

Do **not** scrape competitor shops (CeX, Amazon, etc.).

## Free IGDB (recommended for exclusives)

1. Twitch account + 2FA
2. [Twitch apps](https://dev.twitch.tv/console/apps) → Confidential app → Client Secret
3. Run:

```bash
export IGDB_CLIENT_ID='...'
export IGDB_CLIENT_SECRET='...'
FORCE_REFETCH=1 node scripts/catalog/fetch-images.mjs
npm run db:seed
```

## Without IGDB (Steam + Wikipedia)

```bash
npx tsx database/prisma/export-image-keys.ts
FORCE_REFETCH=1 node scripts/catalog/fetch-images.mjs
npm run db:seed
```

## Live (VPS)

```bash
cd /var/www/gamemania
GH_TOKEN='YOUR_TOKEN' bash scripts/deploy/update.sh

export IGDB_CLIENT_ID='...'          # optional but best
export IGDB_CLIENT_SECRET='...'
FORCE_REFETCH=1 node scripts/catalog/fetch-images.mjs

cd backend && npm run prisma:seed
su - deploy -c 'pm2 restart all --update-env'
```
