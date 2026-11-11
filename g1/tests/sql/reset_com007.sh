#!/usr/bin/env bash
# Recria do zero o banco DESCARTÁVEL local (127.0.0.1:55450) com 002..007 e dados fictícios.
# Uso: G1DB=/home/usuario/g1db bash g1/tests/sql/reset_com007.sh [com_abertura]
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com006.sh" "${1:-}"
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/007_carga_telas.sql"
echo "007 aplicado"
