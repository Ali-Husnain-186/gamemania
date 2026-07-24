# Hostinger KVM 1 — Ubuntu 24.04 first boot

Run these commands on the VPS (Hostinger web terminal or SSH) after selecting **Plain OS → Ubuntu 24.04 LTS**.

Replace `YOUR_DOMAIN`, `YOUR_GITHUB_USER`, and passwords before use.

## 1. System update + 2 GB swap (required on KVM 1)

```bash
sudo apt update && sudo apt upgrade -y

sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

## 2. Packages: Nginx, PostgreSQL, Node 20, PM2, Git

```bash
sudo apt install -y nginx postgresql postgresql-contrib git curl ufw

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
node -v   # expect v20.x
```

## 3. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

## 4. PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER gamemania WITH PASSWORD 'USE_A_STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE gamemania OWNER gamemania;"
```

## 5. Deploy user + app directory

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /var/www/gamemania /var/www/certbot
sudo chown -R deploy:deploy /var/www/gamemania
```

Allow `deploy` to run PM2/nginx reload without password prompts if needed later; for first install, use `sudo` as shown below.

## 6. GitHub deploy key (VPS → clone private repo)

```bash
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy ssh-keygen -t ed25519 -C "gamemania-vps" -f /home/deploy/.ssh/id_ed25519 -N ""
sudo -u deploy cat /home/deploy/.ssh/id_ed25519.pub
```

Add the **public** key in GitHub → repo → **Settings → Deploy keys** (read-only).

Then:

```bash
# Accept GitHub host key once
sudo -u deploy ssh -o StrictHostKeyChecking=accept-new -T git@github.com || true

sudo -u deploy git clone git@github.com:YOUR_GITHUB_USER/GAME-MANIA.git /var/www/gamemania
```

If the directory is not empty, clone into a temp folder and move files, or `rm -rf /var/www/gamemania/*` first (careful).

## 7. Production env files (never commit)

```bash
sudo -u deploy nano /var/www/gamemania/backend/.env
sudo -u deploy nano /var/www/gamemania/frontend/.env.local
```

**backend/.env** (minimum):

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://gamemania:USE_A_STRONG_PASSWORD@localhost:5432/gamemania?schema=public
JWT_ACCESS_SECRET=long_random_32plus_chars_here!!!!!
JWT_REFRESH_SECRET=another_long_random_32plus_chars!!
FRONTEND_URL=https://YOUR_DOMAIN
ADMIN_URL=https://YOUR_DOMAIN/admin
CORS_ORIGINS=https://YOUR_DOMAIN
COOKIE_DOMAIN=YOUR_DOMAIN
GOOGLE_CALLBACK_URL=https://YOUR_DOMAIN/api/v1/auth/google/callback
```

**frontend/.env.local**:

```env
NEXT_PUBLIC_API_URL=https://YOUR_DOMAIN/api/v1
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
```

## 8. First build, migrate, seed, PM2

```bash
cd /var/www/gamemania
sudo -u deploy bash -lc 'cd /var/www/gamemania && npm ci && npm run db:generate && npm run build --workspace=backend && npm run build --workspace=frontend'
sudo -u deploy bash -lc 'cd /var/www/gamemania && npm run prisma:deploy --workspace=backend && npm run prisma:seed --workspace=backend'
sudo -u deploy bash -lc 'cd /var/www/gamemania && mkdir -p logs && pm2 start deploy/pm2/ecosystem.config.js --env production && pm2 save'
# Run the command printed by:
pm2 startup
```

## 9. Nginx + SSL

1. DNS: A records for `@` and `www` → VPS public IP.
2. Edit `deploy/nginx/conf.d/gamemania.conf` and replace every `YOUR_DOMAIN`.
3. Install site config:

```bash
sudo cp /var/www/gamemania/deploy/nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp /var/www/gamemania/deploy/nginx/conf.d/gamemania.conf /etc/nginx/conf.d/gamemania.conf
# Or keep distro nginx.conf and only copy conf.d — ensure limit_req_zone api_limit exists (see deploy/nginx/nginx.conf)
sudo nginx -t
sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

## 10. Smoke test

```bash
curl -sS https://YOUR_DOMAIN/api/v1/health
pm2 status
SITE_URL=https://YOUR_DOMAIN bash /var/www/gamemania/scripts/deploy/smoke-check.sh
```

Browser:

- `https://YOUR_DOMAIN` — store
- `https://YOUR_DOMAIN/admin` — redirect to login, then staff dashboard
- Login `Info@gamemaniauk.co.uk` / `Private08!` → admin (panel only)
- Login `demo@gamemania.com` / `ChangeMe123!` → account only (no admin)

## 11. GitHub Actions auto-deploy key

On your PC, generate a **second** key for Actions → VPS SSH:

```powershell
ssh-keygen -t ed25519 -C "github-actions-deploy" -f gamemania_actions -N ""
```

Append `gamemania_actions.pub` to `/home/deploy/.ssh/authorized_keys` on the VPS.

GitHub → **Settings → Secrets and variables → Actions**:

| Secret        | Value                                       |
| ------------- | ------------------------------------------- |
| `VPS_HOST`    | VPS IP                                      |
| `VPS_USER`    | `deploy`                                    |
| `VPS_SSH_KEY` | contents of `gamemania_actions` private key |
| `VPS_PORT`    | `22`                                        |

Push to `main` triggers deploy (see `.github/workflows/deploy.yml`).

## Manual redeploy

```bash
cd /var/www/gamemania
bash scripts/deploy/update.sh
```

## If `next build` runs out of memory

Confirm swap is on (`free -h`). If it still fails, upgrade Hostinger to **KVM 2** (8 GB RAM).
