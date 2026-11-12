#!/usr/bin/env bash
# Regressão das suítes anteriores sobre 001–012 (banco DESCARTÁVEL recriado antes de cada suíte).
# Uso: G1DB=/tmp/g1db bash g1/tests/sql/run_regressao012.sh   (resumo em /tmp/regressao012.txt)
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd); U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
export LANG=C.UTF-8 LC_ALL=C.UTF-8 G1DB=${G1DB:-/tmp/g1db}
: > /tmp/regressao012.txt
roda() { modo=$1; shift; bash "$ROOT/g1/tests/sql/reset_com012.sh" $modo >/tmp/reset_reg.log 2>&1 || { echo "reset falhou ($*)" >> /tmp/regressao012.txt; return; }
  echo "== $* ($modo)" >> /tmp/regressao012.txt; env "${ENVV:-X=1}" python3 "$@" "$U" com012 2>&1 | grep -E "FAIL|[0-9]+/[0-9]+\s*$" >> /tmp/regressao012.txt; }
roda com_abertura "$ROOT/g1/tests/sql/run_entregas012.py"
roda com_abertura "$ROOT/g1/tests/sql/run_reversao011.py"
roda com_abertura "$ROOT/g1/tests/sql/run_caminhos010.py"
roda com_abertura "$ROOT/g1/tests/sql/run_acerto008.py"
roda "" "$ROOT/g1/tests/sql/run_regressao010.py"
roda com_abertura "$ROOT/g1/tests/sql/run_integracao.py"
ENVV=G1_004=1 roda com_abertura "$ROOT/g1/tests/sql/run_permissoes.py"
roda com_abertura "$ROOT/g1/tests/sql/run_security.py"
roda "" "$ROOT/g1/tests/sql/run_carga007.py"
roda "" "$ROOT/g1/tests/sql/run_portaria006.py"
echo FIM >> /tmp/regressao012.txt
