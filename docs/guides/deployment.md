# GAME-MANIA — Production Deployment (Hostinger Ubuntu VPS)

**No Docker.** Single site: Node.js LTS, PM2, Nginx, PostgreSQL, Let's Encrypt.

Staff admin is part of the storefront at `/admin` (roles: `STAFF` | `ADMIN` | `SUPER_ADMIN`). Seed user: `Info@gamemaniauk.co.uk` / `Private08!`. Staff accounts are redirected to `/admin` only (no storefront shopping UX).

## Targets

| Path                         | Process                                     |
| ---------------------------- | ------------------------------------------- |
| `https://YOUR_DOMAIN/`       | Next.js storefront (PM2 → :3000)            |
| `https://YOUR_DOMAIN/admin`  | Same Next.js app (role-gated)               |
| `https://YOUR_DOMAIN/api/v1` | Express API (PM2 → :5000 via Nginx `/api/`) |

## Server prerequisites

See the full first-boot runbook: [vps-bootstrap.md](./vps-bootstrap.md).

```bash
# Node 20 LTS via nodesource or nvm
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx
sudo npm i -g pm2
```

Create PostgreSQL role/database and set production env files on the VPS (never commit secrets).

## Nginx

1. Replace `YOUR_DOMAIN` in `deploy/nginx/conf.d/gamemania.conf`.
2. Copy configs into `/etc/nginx/` (or symlink `conf.d/gamemania.conf`).
3. Upstream: `/` → `127.0.0.1:3000`, `/api/` → `127.0.0.1:5000`.

## SSL

```bash
sudo mkdir -p /var/www/certbot
# Point DNS A records for @ and www first, then:
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
# or: bash scripts/ssl/init-letsencrypt.sh
```

## App deploy

```bash
git clone <repo> /var/www/gamemania
cd /var/www/gamemania
# configure production .env files (backend/.env, frontend/.env.local)
bash scripts/deploy/update.sh
pm2 startup
pm2 save
```

## Auto-deploy (GitHub → VPS)

On every push to `main`, [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) SSHs into the VPS and runs `scripts/deploy/update.sh`.

Required GitHub Actions secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`.

## Backups

```bash
bash scripts/deploy/backup-db.sh
```

Schedule via cron (daily). Store off-box copies.

## Monitoring

- `pm2 status` / `pm2 logs`
- Nginx access/error logs
- Health: `GET /api/v1/health`

## Smoke checks

- Storefront loads
- `/api/v1/health` returns ok
- Login as seed admin → `/admin`
- Login as `demo@gamemania.com` → no admin access
