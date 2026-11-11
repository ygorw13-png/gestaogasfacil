#!/usr/bin/env bash
# Recria do zero o banco DESCARTÁVEL local (127.0.0.1:55450) com 002+003+004 e dados fictícios.
# Nunca aponta para produção. Uso: G1DB=/root/g1db bash g1/tests/sql/reset_com004.sh
set -euo pipefail
unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PGSSLMODE
export G1DB=${G1DB:-/root/g1db}; ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
setpriv --reuid 1000 --regid 1000 --clear-groups pg_ctl -D "$G1DB/pg" stop -m fast >/dev/null 2>&1 || true
rm -rf "$G1DB"
bash "$ROOT/g1/tests/sql/setup_cluster.sh" com003
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
psql "$U" -XAq -v ON_ERROR_STOP=1 -f "$ROOT/g1/tests/sql/fixtures.sql" >/dev/null
psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/004_integracao_telas.sql"
echo "004 aplicado"
