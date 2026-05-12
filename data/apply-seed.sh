#!/usr/bin/env bash
# Apply data/seed.sql to the portfolio_db container.
# Use on a fresh DB only (after `docker compose up -d --build` with RUN_SEED=0,
# or after wiping the volume with `docker compose down -v`).
#
# Usage: ./data/apply-seed.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/seed.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "seed.sql not found at $SQL_FILE" >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q '^portfolio_db$'; then
  echo "portfolio_db container is not running. Start it first: docker compose up -d db backend" >&2
  exit 1
fi

echo "Applying $(wc -l < "$SQL_FILE") lines of seed.sql to portfolio_db…"
docker exec -i portfolio_db psql -U portfolio -d portfolio_dashboard -v ON_ERROR_STOP=1 < "$SQL_FILE"

echo
echo "Row counts after seed:"
docker exec portfolio_db psql -U portfolio -d portfolio_dashboard -At -c "
SELECT 'users',              count(*) FROM users
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'weekly_status', count(*) FROM weekly_status
UNION ALL SELECT 'risk_issues', count(*) FROM risk_issues
UNION ALL SELECT 'csat', count(*) FROM csat
UNION ALL SELECT 'resources', count(*) FROM resources
UNION ALL SELECT 'resource_weeks', count(*) FROM resource_weeks
UNION ALL SELECT 'metric_definitions', count(*) FROM metric_definitions;
"
echo "Done."
