#!/usr/bin/env bash
# Fix shop products: browser must call /api/v1 (same origin), NOT localhost:5000
set -euo pipefail
cd /var/www/gamemania

sudo -u deploy tee frontend/.env.local >/dev/null <<'EOF'
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_SITE_URL=http://168.231.113.138:8080
EOF

# CORS for cookie/auth flows
if grep -q '^CORS_ORIGINS=' backend/.env; then
  sudo -u deploy sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=http://168.231.113.138:8080|' backend/.env
else
  echo 'CORS_ORIGINS=http://168.231.113.138:8080' | sudo -u deploy tee -a backend/.env >/dev/null
fi

# Patch client API base (critical)
sudo -u deploy tee frontend/src/lib/api.getApiUrl.patch.js >/dev/null <<'EOF'
// marker only
EOF
sudo -u deploy python3 - <<'PY'
from pathlib import Path
p = Path('/var/www/gamemania/frontend/src/lib/api.ts')
text = p.read_text()
if 'export function getApiUrl' not in text:
    # prepend replacement of first line const API_URL = ...
    old = "const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';"
    new = '''
export function getApiUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\\/$/, '');
  if (typeof window !== 'undefined') {
    if (!configured || /localhost|127\\.0\\.0\\.1/i.test(configured)) return '/api/v1';
    return configured;
  }
  if (configured && !configured.startsWith('/')) return configured;
  return (process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:5000/api/v1').replace(/\\/$/, '');
}
'''.strip()
    if old in text:
        text = text.replace(old, new, 1)
        text = text.replace('`${API_URL}${path}`', '`${getApiUrl()}${path}`')
        p.write_text(text)
        print('patched api.ts')
    else:
        print('api.ts shape unexpected — pull latest from git')
        raise SystemExit(1)
else:
    print('getApiUrl already present')
PY

# remove standalone warning
sudo -u deploy bash -lc "cd /var/www/gamemania/frontend && sed -i \"/output: 'standalone'/d\" next.config.ts || true"

sudo -u deploy bash -lc 'cd /var/www/gamemania && npm run build --workspace=frontend'
su - deploy -c 'pm2 restart all --update-env'
sleep 5

echo "OK — hard refresh shop and filter Network for: products"
curl -sS 'http://127.0.0.1:8080/api/v1/products?limit=1' | head -c 200
echo
