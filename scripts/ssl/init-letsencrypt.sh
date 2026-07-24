#!/usr/bin/env bash
# Let's Encrypt init for GAME-MANIA (native Nginx — no Docker).
# Single-site: apex + www only (API and admin are path-based).
# Prerequisites: DNS pointing to this VPS, Nginx installed, ports 80/443 open.
#
# Usage:
#   DOMAIN=yourdomain.com CERTBOT_EMAIL=you@example.com bash scripts/ssl/init-letsencrypt.sh
set -euo pipefail

DOMAIN="${DOMAIN:-YOUR_DOMAIN}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"

if [[ "${DOMAIN}" == "YOUR_DOMAIN" ]]; then
  echo "Set DOMAIN=yourdomain.com before running this script."
  exit 1
fi

sudo mkdir -p /var/www/certbot

sudo certbot certonly --webroot -w /var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "${DOMAIN}" -d "www.${DOMAIN}"

sudo nginx -t
sudo systemctl reload nginx

echo "Certificates issued for ${DOMAIN} and www.${DOMAIN}. Nginx reloaded."
echo "Renewal: certbot renew (timer usually installed with certbot)."
