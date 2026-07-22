#!/usr/bin/env bash
# Native PostgreSQL backup (no Docker).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="${BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/gamemania_${STAMP}.sql.gz"

pg_dump -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER:-gamemania}" "${POSTGRES_DB:-gamemania}" \
  | gzip > "$OUT_FILE"

echo "Backup written to $OUT_FILE"
