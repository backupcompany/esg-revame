#!/usr/bin/env bash
# Apply deploy/postgres/*.sql in name order. Files are idempotent (IF NOT EXISTS).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
export PGPASSWORD="${SQL_PASSWORD:?SQL_PASSWORD missing}"
host="${SQL_HOST:-localhost}"
port="${SQL_PORT:-5432}"
user="${SQL_USER:?}"
db="${SQL_DB_NAME:?}"
psql=(psql -h "$host" -p "$port" -U "$user" -d "$db" -v ON_ERROR_STOP=1 -q)

"${psql[@]}" -f "$ROOT/deploy/postgres/000_schema_migrations.sql"
"${psql[@]}" -c "INSERT INTO schema_migrations (filename) VALUES ('000_schema_migrations.sql') ON CONFLICT (filename) DO NOTHING;"

for f in "$ROOT"/deploy/postgres/*.sql; do
  name="$(basename "$f")"
  [[ "$name" == "000_schema_migrations.sql" ]] && continue
  already="$("${psql[@]}" -tAc "SELECT 1 FROM schema_migrations WHERE filename = '$name'")"
  if [[ "$already" == "1" ]]; then
    echo "skip $name"
    continue
  fi
  echo "apply $name"
  "${psql[@]}" -f "$f"
  "${psql[@]}" -c "INSERT INTO schema_migrations (filename) VALUES ('$name');"
done
echo "ok"
