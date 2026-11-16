#!/usr/bin/env bash
# 001–017 no banco DESCARTÁVEL local (017 = agregados: retirada sem preço, por conta e acerto).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com016.sh" "${1:-}"
psql "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/017_agregados.sql"
echo "017 aplicado"
