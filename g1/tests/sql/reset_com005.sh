#!/usr/bin/env bash
# Recria do zero o banco DESCARTÁVEL local (127.0.0.1:55450) com 002+003+004+005 e dados fictícios.
# Nunca aponta para produção. Uso: G1DB=/home/usuario/g1db bash g1/tests/sql/reset_com005.sh
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com004.sh"
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/005_tipo_venda_idempotencia.sql"
echo "005 aplicado"
