#!/usr/bin/env bash
# 001–014 no banco DESCARTÁVEL local (014 = forma de pagamento com identidade própria e valor opcional).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com013.sh" "${1:-}"
psql "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/014_formas_pagamento.sql"
echo "014 aplicado"
