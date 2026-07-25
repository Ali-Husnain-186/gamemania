#!/usr/bin/env bash
# Run on VPS as root AFTER DNS A records point to this server.
# Domain: gamemania.tech
set -euo pipefail

DOMAIN=gamemania.tech
APP=/var/www/gamemania
IP_HINT=168.231.113.138

echo "==> 1) Pull latest code"
su - deploy -c "cd $APP && git fetch origin main && git reset --hard origin/main && git log -1 --oneline"

echo "==> 2) Frontend env (HTTPS)"
sudo -u deploy tee "$APP/frontend/.env.local" >/dev/null <<EOF
NEXT_PUBLIC_API_URL=https://${DOMAIN}/api/v1
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
EOF

echo "==> 3) Backend env URLs"
sudo -u deploy sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=https://${DOMAIN}|" "$APP/backend/.env"
sudo -u deploy sed -i "s|^ADMIN_URL=.*|ADMIN_URL=https://${DOMAIN}/admin|" "$APP/backend/.env"
sudo -u deploy sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}|" "$APP/backend/.env"
sudo -u deploy sed -i "s|^COOKIE_DOMAIN=.*|COOKIE_DOMAIN=${DOMAIN}|" "$APP/backend/.env"
if grep -q '^GOOGLE_CALLBACK_URL=' "$APP/backend/.env"; then
  sudo -u deploy sed -i "s|^GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=https://${DOMAIN}/api/v1/auth/google/callback|" "$APP/backend/.env"
else
  echo "GOOGLE_CALLBACK_URL=https://${DOMAIN}/api/v1/auth/google/callback" | sudo -u deploy tee -a "$APP/backend/.env" >/dev/null
fi

echo "==> 4) Nginx site for ${DOMAIN} (HTTP first — Certbot upgrades to HTTPS)"
mkdir -p /var/www/certbot
cp "$APP/deploy/nginx/conf.d/gamemania.conf" /etc/nginx/conf.d/gamemania.conf
# Ensure api_limit zone exists (from deploy/nginx/nginx.conf http{} block)
if ! grep -q 'limit_req_zone.*api_limit' /etc/nginx/nginx.conf; then
  echo "WARN: add to http{} in /etc/nginx/nginx.conf:"
  echo '  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;'
fi
nginx -t
systemctl reload nginx

echo "==> 5) Firewall: 80 + 443 + SSH"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true
ufw status

echo "==> 6) Install Certbot + get SSL (requires DNS already pointing here)"
apt-get update -y
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "info@${DOMAIN}" --redirect || {
  echo "Certbot failed. Check DNS: dig +short $DOMAIN  (must be $IP_HINT)"
  exit 1
}

echo "==> 7) Build apps"
sudo -u deploy bash -lc "cd $APP && npm ci && npm run db:generate && npm run build --workspace=backend && npm run build --workspace=frontend"
su - deploy -c "cd $APP && pm2 restart all --update-env || (mkdir -p logs && pm2 start deploy/pm2/ecosystem.config.js --env production && pm2 save)"

sleep 6
echo "==> 8) Verify"
curl -sS "https://${DOMAIN}/api/v1/health"; echo
curl -sS -o /dev/null -w "home:%{http_code}\n" "https://${DOMAIN}/"
curl -sS "https://${DOMAIN}/api/v1/products?limit=1" | head -c 200; echo
echo "DONE → https://${DOMAIN}"
