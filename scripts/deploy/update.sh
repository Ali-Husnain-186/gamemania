#!/usr/bin/env bash
# Production update on Hostinger Ubuntu VPS (no Docker).
# Single-site: backend API + frontend (includes /admin).
# Run from repo root on the server as the deploy user.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

git pull --ff-only

npm ci
npm run db:generate
npm run build --workspace=backend
npm run build --workspace=frontend

npm run prisma:deploy --workspace=backend

mkdir -p logs
pm2 startOrReload deploy/pm2/ecosystem.config.js --env production
pm2 save

echo "Deploy update complete (PM2 + Prisma). Targets: site + /admin + /api/v1"
