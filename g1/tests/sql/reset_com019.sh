#!/usr/bin/env bash
# 001–019 no banco DESCARTÁVEL local (019 = aviso mínimo ao entregador: número + link).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com018.sh" "${1:-}"
psql "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/019_aviso_link.sql"
echo "019 aplicado"
