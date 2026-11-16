#!/usr/bin/env bash
# 001–018 no banco DESCARTÁVEL local (018 = provedor Aplicativo do PC para avisos de WhatsApp).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com017.sh" "${1:-}"
psql "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/018_whatsapp_desktop.sql"
echo "018 aplicado"
