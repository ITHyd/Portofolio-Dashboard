#!/usr/bin/env bash
# Regenerate data/seed.sql from the currently-running portfolio_db.
# Run this after you've made changes locally and want to capture them as the
# new shippable seed.
#
# Usage: ./data/dump-seed.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${SCRIPT_DIR}/seed.sql"

if ! docker ps --format '{{.Names}}' | grep -q '^portfolio_db$'; then
  echo "portfolio_db container is not running." >&2
  exit 1
fi

docker exec portfolio_db pg_dump \
  -U portfolio -d portfolio_dashboard \
  --data-only --column-inserts --no-owner --no-privileges \
  --exclude-table=alembic_version \
  -f /tmp/seed.sql

docker cp portfolio_db:/tmp/seed.sql "$OUT"
echo "Wrote $OUT ($(wc -c < "$OUT") bytes, $(grep -c '^INSERT INTO' "$OUT") INSERT rows)."
