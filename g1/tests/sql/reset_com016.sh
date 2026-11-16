#!/usr/bin/env bash
# 001–016 no banco DESCARTÁVEL local (016 = canal do aviso e fila de WhatsApp).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com015.sh" "${1:-}"
psql "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/016_aviso_whatsapp.sql"
echo "016 aplicado"
