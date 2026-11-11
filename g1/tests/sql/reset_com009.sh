#!/usr/bin/env bash
# Banco descartável local com 001..009; nunca aponta para produção.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com008.sh" "${1:-}"
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/009_venda_saldo_portaria.sql"
echo "009 aplicado"
