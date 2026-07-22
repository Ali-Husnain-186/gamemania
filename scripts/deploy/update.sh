#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

git pull --ff-only
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile full build
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile full up -d
docker compose exec backend npx prisma migrate deploy --schema ./database/prisma/schema.prisma
echo "Deploy update complete."
