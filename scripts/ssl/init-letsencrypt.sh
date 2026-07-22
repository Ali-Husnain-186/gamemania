#!/usr/bin/env bash
# Let's Encrypt init for GAME-MANIA (native Nginx — no Docker).
# Prerequisites: DNS pointing to this VPS, Nginx installed, ports 80/443 open.
set -euo pipefail

DOMAINS=(-d gamemania.com -d www.gamemania.com -d admin.gamemania.com -d api.gamemania.com)
EMAIL="${CERTBOT_EMAIL:-admin@gamemania.com}"

sudo certbot certonly --webroot -w /var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  "${DOMAINS[@]}"

sudo nginx -t
sudo systemctl reload nginx

echo "Certificates issued. Nginx reloaded."
echo "Renewal: certbot renew (timer usually installed with certbot)."
