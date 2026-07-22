#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d_%H%M%S)
OUT_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$OUT_DIR"
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-gamemania}" "${POSTGRES_DB:-gamemania}" \
  | gzip > "$OUT_DIR/gamemania_$STAMP.sql.gz"
echo "Backup written to $OUT_DIR/gamemania_$STAMP.sql.gz"
