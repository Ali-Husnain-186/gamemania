# Run on Hostinger VPS as root — fix live shop/API + Nginx

set -e
cd /var/www/gamemania

# 1) Confirm frontend env (must be IP:8080, not localhost)
sudo -u deploy tee /var/www/gamemania/frontend/.env.local >/dev/null <<'EOF'
NEXT_PUBLIC_API_URL=http://168.231.113.138:8080/api/v1
NEXT_PUBLIC_SITE_URL=http://168.231.113.138:8080
EOF

# 2) Disable standalone mode so `next start` works with PM2
sudo -u deploy tee /var/www/gamemania/frontend/next.config.ts >/dev/null <<'EOF'
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
EOF

# 3) Rebuild frontend with correct public API URL
sudo -u deploy bash -lc 'cd /var/www/gamemania && npm run build --workspace=frontend'

# 4) Restart apps cleanly
su - deploy -c 'cd /var/www/gamemania && pm2 delete all || true'
su - deploy -c 'cd /var/www/gamemania && mkdir -p logs && pm2 start deploy/pm2/ecosystem.config.js --env production && pm2 save'
sleep 4
su - deploy -c 'pm2 status'

# 5) Fix Nginx (reload failed earlier — use restart after test)
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager | head -n 15

# 6) Open firewall
sudo ufw allow OpenSSH
sudo ufw allow 8080/tcp
sudo ufw --force enable
sudo ufw status

# 7) Verify
curl -sS http://127.0.0.1:5000/api/v1/health
echo
curl -sS -o /dev/null -w "front3000:%{http_code}\n" http://127.0.0.1:3000/
curl -sS http://127.0.0.1:8080/api/v1/health
echo
curl -sS 'http://127.0.0.1:8080/api/v1/products?limit=1' | head -c 300
echo
