#!/usr/bin/env bash
# Production update on Hostinger Ubuntu VPS (no Docker).
# Single-site: backend API + frontend (includes /admin).
# Run from repo root as root or deploy user.
#
# Usage:
#   GH_TOKEN=ghp_xxx bash scripts/deploy/update.sh
#   # or with working SSH deploy key:
#   bash scripts/deploy/update.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Pulling latest main"
if [[ -n "${GH_TOKEN:-}" ]]; then
  git fetch "https://Ali-Husnain-186:${GH_TOKEN}@github.com/Ali-Husnain-186/gamemania.git" main
  git reset --hard FETCH_HEAD
else
  git fetch origin main
  git reset --hard origin/main
fi

git log -1 --oneline

echo "==> Installing + building"
npm ci
npm run db:generate
npm run build --workspace=backend
npm run build --workspace=frontend

echo "==> Database migrate"
npm run prisma:deploy --workspace=backend

echo "==> Restart PM2"
mkdir -p logs
if [[ "$(id -un)" == "root" ]]; then
  su - deploy -c "cd /var/www/gamemania && pm2 startOrReload deploy/pm2/ecosystem.config.js --env production && pm2 save"
else
  pm2 startOrReload deploy/pm2/ecosystem.config.js --env production
  pm2 save
fi

echo "==> Health check"
sleep 4
curl -sS https://gamemaniaauk.co.uk/api/v1/health || curl -sS http://127.0.0.1:5000/api/v1/health
echo
echo "Deploy complete → https://gamemaniaauk.co.uk"
