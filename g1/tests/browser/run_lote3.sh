#!/usr/bin/env bash
# Recria o banco descartável local, religa o PostgREST local e roda o teste de navegador do lote 3.
# Pressupõe: PostgREST em /root/pgrst-bin, gateway local /root/iso/gw.ts (58000) e app isolado em localhost:8091.
set -uo pipefail
unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PGSSLMODE
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
G1DB=/root/g1db bash "$ROOT/g1/tests/sql/reset_com004.sh" >/dev/null 2>&1
psql "$U" -XAqc "CREATE ROLE authenticator LOGIN NOINHERIT; GRANT anon, authenticated TO authenticator;"
psql "$U" -XAq -f "$ROOT/g1/tests/browser/seed_lote3.sql"
P=$(pgrep -x postgrest); [ -n "$P" ] && kill $P; sleep 1
(cd /root/iso && setsid /root/pgrst-bin/bin/postgrest pgrst.conf > pgrst.log 2>&1 < /dev/null &)
sleep 4
python3 "$ROOT/g1/tests/browser/g1_lote3_browser.py"
