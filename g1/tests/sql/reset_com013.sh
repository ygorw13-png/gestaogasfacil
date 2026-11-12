#!/usr/bin/env bash
# 001–013 no banco DESCARTÁVEL local (013 = bloqueio do fechamento total sem limite de antiguidade).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com012.sh" "${1:-}"
psql "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/013_bloqueio_fechamento_sem_limite.sql"
echo "013 aplicado"
