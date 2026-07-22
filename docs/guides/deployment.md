# GAME-MANIA — Production Deployment (Hostinger Ubuntu VPS)

**No Docker.** Stack: Node.js LTS, PM2, Nginx, PostgreSQL, Let's Encrypt.

## Targets

| Host | Process |
|------|---------|
| gamemania.com | Next.js storefront (PM2 → :3000) |
| admin.gamemania.com | Next.js admin (PM2 → :3001) |
| api.gamemania.com | Express API (PM2 → :5000) |

## Server prerequisites

```bash
# Node 20 LTS via nodesource or nvm
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx
sudo npm i -g pm2
```

Create PostgreSQL role/database and set production env files on the VPS (never commit secrets).

## Nginx

Copy configs from `deploy/nginx/` into `/etc/nginx/` (or symlink `conf.d/gamemania.conf`). Upstream targets are `127.0.0.1:3000|3001|5000`.

## SSL

```bash
sudo mkdir -p /var/www/certbot
# Point DNS A records first, then:
bash scripts/ssl/init-letsencrypt.sh
```

## App deploy

```bash
git clone <repo> /var/www/gamemania
cd /var/www/gamemania
# configure production .env files
bash scripts/deploy/update.sh
pm2 startup
pm2 save
```

## Backups

```bash
bash scripts/deploy/backup-db.sh
```

Schedule via cron (daily). Store off-box copies.

## Monitoring

- `pm2 status` / `pm2 logs`
- Nginx access/error logs
- Optional: Uptime robot on `/api/v1/health`

Full ops notes will expand under `docs/deployment/` in later phases.
