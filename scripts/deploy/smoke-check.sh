#!/usr/bin/env bash
# Post-deploy smoke checks for single-site GAME-MANIA.
# Usage: SITE_URL=https://YOUR_DOMAIN bash scripts/deploy/smoke-check.sh
set -euo pipefail

SITE_URL="${SITE_URL:-http://127.0.0.1:3000}"
API_HEALTH="${SITE_URL%/}/api/v1/health"

echo "Checking storefront: ${SITE_URL}"
curl -fsS -o /dev/null -w "storefront HTTP %{http_code}\n" "${SITE_URL}/" || {
  echo "Storefront check failed (is Nginx/Next running?)"
  exit 1
}

echo "Checking API health: ${API_HEALTH}"
BODY="$(curl -fsS "${API_HEALTH}")"
echo "${BODY}" | grep -q '"status":"ok"' || echo "${BODY}" | grep -q '"status": "ok"' || {
  echo "Health payload unexpected: ${BODY}"
  exit 1
}
echo "API health OK"

echo "Checking /admin redirects unauthenticated users (expect 307/302 to login)"
ADMIN_CODE="$(curl -sS -o /dev/null -w "%{http_code}" "${SITE_URL%/}/admin" || true)"
echo "admin HTTP ${ADMIN_CODE}"

echo "Smoke checks finished. Manually verify:"
echo "  1) Login Info@gamemaniauk.co.uk / Private08! → /admin dashboard only"
echo "  2) Login demo@gamemania.com → no admin access"
