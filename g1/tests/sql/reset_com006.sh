#!/usr/bin/env bash
# Recria do zero o banco DESCARTÁVEL local (127.0.0.1:55450) com 002+003+004+005+006 e dados fictícios.
# Nunca aponta para produção. Uso: G1DB=/home/usuario/g1db bash g1/tests/sql/reset_com006.sh
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com005.sh"
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/006_saldo_portaria.sql"
echo "006 aplicado"
# Opcional: "com_abertura" registra a abertura FICTÍCIA do dia da empresa A (100 cheios por produto), para rodar
# as suítes anteriores (004/005/permissões), escritas antes da exigência de abertura e saldo na transferência.
if [ "${1:-}" = com_abertura ]; then
  psql "$U" -XAq -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO movimentacoes_portaria(organization_id,tipo,produto,delta_cheios,delta_vazios,delta_emprestados,registrado_por,registrado_por_nome,observacoes,data_operacao)
SELECT '0a000000-0000-4000-8000-000000000000','abertura',p,100,0,0,'a0000000-0000-4000-8000-00000000000b','Fixture','Abertura fictícia (teste)',data_operacional()
FROM unnest(ARRAY['P13','P20','P45','agua']) p;
SQL
  echo "abertura fictícia registrada"
fi
