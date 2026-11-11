#!/usr/bin/env bash
# Reinicia só os DADOS do banco descartável (001–010, sem abertura) e roda o teste de navegador 010.
# Pressupõe PostgREST, gateway e app isolado já ligados (lab_reset.sh com010) e a cópia construída (build_iso_fe.sh).
set -euo pipefail
unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PGSSLMODE
export LANG=C.UTF-8 LC_ALL=C.UTF-8
ROOT=$(cd "$(dirname "$0")/../../.." && pwd); U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
G1DB=/tmp/g1db bash "$ROOT/g1/tests/sql/reset_com010.sh" >/tmp/lab_reset.log 2>&1
psql "$U" -XAq -v ON_ERROR_STOP=1 -f "$ROOT/g1/tests/browser/seed_010.sql"
psql "$U" -XAqc "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticator') THEN CREATE ROLE authenticator LOGIN NOINHERIT; END IF; END \$\$; GRANT anon, authenticated TO authenticator;"
pkill -x postgrest 2>/dev/null || true; sleep 1
(cd /root/iso && setsid nohup /root/pgrst-bin/bin/postgrest pgrst.conf > /root/iso/pgrst.log 2>&1 < /dev/null &)
for i in $(seq 1 20); do curl -sf -o /dev/null http://127.0.0.1:53000/ && break; sleep 1; done
cd "$ROOT/g1/tests/browser" && python3 g1_010_browser.py
