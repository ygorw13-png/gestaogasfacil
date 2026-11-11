#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com010.sh" "${1:-}"
psql "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/011_reversao_controlada.sql"
echo "011 aplicado"
