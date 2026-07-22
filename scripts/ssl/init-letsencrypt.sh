#!/usr/bin/env bash
set -euo pipefail
# Obtain Let's Encrypt certs for GAME-MANIA hostnames.
# Run on the Ubuntu VPS with DNS already pointing here.

DOMAIN="${DOMAIN:-gamemania.com}"
EMAIL="${SSL_EMAIL:-admin@gamemania.com}"

docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" -d "admin.$DOMAIN" -d "api.$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email

echo "Certificates issued. Reload nginx:"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload"
