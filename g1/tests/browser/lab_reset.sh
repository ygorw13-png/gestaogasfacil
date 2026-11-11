#!/usr/bin/env bash
# Recria o banco DESCARTÁVEL (com010 = 001–010; com005/com004 históricos) e (re)liga PostgREST, gateway e a cópia isolada do app — tudo em 127.0.0.1.
# Uso: bash g1/tests/browser/lab_reset.sh [com005] [seed.sql ...]
# Pressupõe: /root/pgrst-bin/bin/postgrest, /root/iso/secret, /root/iso/pgrst.conf, cópia do app construída em /tmp/iso-dist.
set -uo pipefail
unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PGSSLMODE
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
MODE=${1:-com011}; shift || true
# com011 = 001–011 com abertura fictícia do dia (atual). com010 = 001–010. com005/com004 = históricos.
case "$MODE" in
  com011) G1DB=/tmp/g1db bash "$ROOT/g1/tests/sql/reset_com011.sh" com_abertura >/tmp/lab_reset.log 2>&1 || { echo "reset falhou"; tail /tmp/lab_reset.log; exit 1; } ;;
  com010) G1DB=/tmp/g1db bash "$ROOT/g1/tests/sql/reset_com010.sh" >/tmp/lab_reset.log 2>&1 || { echo "reset falhou"; tail /tmp/lab_reset.log; exit 1; } ;;
  com005) G1DB=/tmp/g1db bash "$ROOT/g1/tests/sql/reset_com005.sh" >/dev/null 2>&1 ;;
  *) G1DB=/tmp/g1db bash "$ROOT/g1/tests/sql/reset_com004.sh" >/dev/null 2>&1 ;;
esac
psql "$U" -XAqc "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticator') THEN CREATE ROLE authenticator LOGIN NOINHERIT; END IF; END \$\$; GRANT anon, authenticated TO authenticator;"
for s in "$@"; do psql "$U" -XAq -v ON_ERROR_STOP=1 -f "$s" || { echo "seed falhou: $s"; exit 1; }; done
pkill -x postgrest 2>/dev/null; sleep 1
cd /root/iso
nohup setsid /root/pgrst-bin/bin/postgrest pgrst.conf > /root/iso/pgrst.log 2>&1 < /dev/null &
curl -s -o /dev/null http://127.0.0.1:58000/rest/v1/ || nohup setsid deno run -A "$ROOT/g1/tests/browser/gateway_isolado.ts" > /root/iso/gw.log 2>&1 < /dev/null &
curl -sf -o /dev/null http://127.0.0.1:8091/ || nohup setsid python3 "$ROOT/g1/tests/browser/spa_server.py" /tmp/iso-dist > /root/iso/spa.log 2>&1 < /dev/null &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:53000/ >/dev/null && curl -s -o /dev/null http://127.0.0.1:58000/rest/v1/ && curl -sf http://127.0.0.1:8091/ >/dev/null && break; sleep 1; done
echo "laboratório pronto ($MODE): banco 55450, PostgREST 53000, gateway 58000, app 8091"
