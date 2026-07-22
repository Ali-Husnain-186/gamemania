# Deployment Guide (Ubuntu VPS / Hostinger)

## Target URLs

- https://gamemania.com → frontend  
- https://admin.gamemania.com → admin  
- https://api.gamemania.com → backend  

## Prerequisites

- Ubuntu 22.04+ VPS
- Domain DNS A records for `@`, `admin`, `api`
- Docker Engine + Compose plugin
- Ports 80/443 open

## 1. Server bootstrap

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# re-login
```

## 2. Clone & configure

```bash
git clone <YOUR_REPO_URL> /opt/game-mania
cd /opt/game-mania
cp .env.example .env
# fill production secrets
cp backend/.env.example backend/.env
# etc.
```

## 3. SSL certificates

```bash
chmod +x scripts/ssl/init-letsencrypt.sh
./scripts/ssl/init-letsencrypt.sh
```

Uses Certbot with webroot/nginx as documented in the script.

## 4. Launch

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 5. Migrations

```bash
docker compose exec backend npx prisma migrate deploy --schema ./database/prisma/schema.prisma
docker compose exec backend npm run prisma:seed
```

## 6. Cloudflare (recommended)

- Proxied orange-cloud for web hosts
- SSL/TLS mode: Full (strict)
- Cache static assets; bypass `/api/*`

## 7. Updates

```bash
./scripts/deploy/update.sh
```

## Rollback

Keep previous images tagged; `docker compose` can pin image digests. Database rollbacks require migration planning — backup with `pg_dump` before migrate.

## Backups

```bash
./scripts/deploy/backup-db.sh
```

Schedule via cron daily.
