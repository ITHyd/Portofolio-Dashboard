#!/usr/bin/env bash
set -e

# Wait for the database to accept connections.
python - <<'PY'
import os, time, sys
import psycopg
url = os.environ["DATABASE_URL"].replace("+psycopg", "")
for i in range(60):
    try:
        with psycopg.connect(url, connect_timeout=2) as _:
            print("DB reachable.")
            sys.exit(0)
    except Exception as e:
        print(f"DB not ready ({e}); retry {i+1}/60")
        time.sleep(2)
print("DB never became reachable.")
sys.exit(1)
PY

echo "Running Alembic migrations..."
alembic upgrade head

if [ "${RUN_SEED:-1}" = "1" ]; then
  echo "Running seed (idempotent)..."
  python seed.py || echo "Seed failed but continuing."
fi

exec "$@"
