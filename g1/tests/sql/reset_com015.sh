#!/usr/bin/env bash
# 001–015 no banco DESCARTÁVEL local (015 = correção da forma de pagamento).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com014.sh" "${1:-}"
psql "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/015_corrigir_forma_pagamento.sql"
echo "015 aplicado"
