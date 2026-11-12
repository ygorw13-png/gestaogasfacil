#!/usr/bin/env bash
# 001–012 no banco DESCARTÁVEL local + um segundo entregador FICTÍCIO na empresa A (testes de reatribuição).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
bash "$ROOT/g1/tests/sql/reset_com011.sh" "${1:-}"
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/012_fluxo_entregas.sql"
psql "$U" -XAq -v ON_ERROR_STOP=1 <<'SQL'
SET session_replication_role = replica;
INSERT INTO auth.users(id,email) VALUES ('a0000000-0000-4000-8000-0000000000f2','entregador2.a@ficticio.test') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles(id,name,role,organization_id,ativo) VALUES
 ('a0000000-0000-4000-8000-0000000000f2','Entregador Dois A','entregador','0a000000-0000-4000-8000-000000000000',true) ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles(user_id,role) VALUES ('a0000000-0000-4000-8000-0000000000f2','entregador') ON CONFLICT DO NOTHING;
SET session_replication_role = origin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
SQL
echo "012 aplicado"
