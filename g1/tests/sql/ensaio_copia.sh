#!/usr/bin/env bash
# Restaura uma cópia CSV das tabelas públicas num banco DESCARTÁVEL local (127.0.0.1:55450, banco "ensaio")
# para provar que a cópia é recuperável e ensaiar a sequência 001–010 sem tocar no Cloud.
# Uso: bash g1/tests/sql/ensaio_copia.sh /pasta/com/csv [aplicar]
# A pasta de CSV fica FORA do repositório (contém dados reais). Nunca aponta para produção.
set -euo pipefail
unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PGSSLMODE
CSV=$1; ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
B="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
U="postgresql://postgres@127.0.0.1:55450/ensaio?sslmode=disable"
psql "$B" -XAqc "DROP DATABASE IF EXISTS ensaio" -c "CREATE DATABASE ensaio"
psql "$U" -XAq -v ON_ERROR_STOP=1 <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth; CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}', banned_until timestamptz, created_at timestamptz DEFAULT now());
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $f$ SELECT nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub','')::uuid $f$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $f$ SELECT current_setting('request.jwt.claims', true)::jsonb->>'role' $f$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $f$ SELECT coalesce(current_setting('request.jwt.claims', true),'{}')::jsonb $f$;
GRANT USAGE ON SCHEMA auth, public, extensions TO anon, authenticated, service_role;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN CREATE PUBLICATION supabase_realtime; END IF; END $$;
SQL
for f in "$ROOT"/supabase/migrations/*.sql; do
  psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -c "SET search_path=public,extensions" -f "$f" >/dev/null 2>>/tmp/ensaio_migr.err || echo "aviso: $f" >&2
done
# Contas: só os IDs referenciados (o Auth real não é copiado; senhas não são lidas).
{ echo "SET session_replication_role = replica;"
  for f in "$CSV"/*.csv; do t=$(basename "$f" .csv); cols=$(head -1 "$f")
    echo "\\copy public.$t ($cols) from '$f' with (format csv, header true)"; done
  echo "INSERT INTO auth.users(id) SELECT id FROM public.profiles ON CONFLICT DO NOTHING;"
} > /tmp/ensaio_load.sql
psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f /tmp/ensaio_load.sql
echo "cópia restaurada"
if [ "${2:-}" = aplicar ]; then
  for f in g0.1/sql/001_profile_verification.sql g1/candidate/sql/002_isolamento_inativos.sql g1/candidate/sql/003_permissoes_carga.sql \
           g1/candidate/sql/004_integracao_telas.sql g1/candidate/sql/005_tipo_venda_idempotencia.sql g1/candidate/sql/006_saldo_portaria.sql \
           g1/candidate/sql/007_carga_telas.sql g1/candidate/sql/008_recebimentos_acerto.sql g1/candidate/sql/009_venda_saldo_portaria.sql \
           g1/candidate/sql/010_protecoes_lote4.sql; do
    psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/$f" >/dev/null 2>/tmp/ensaio_apply.err || { echo "FALHOU $f"; cat /tmp/ensaio_apply.err; exit 1; }
    echo "aplicado $(basename $f)"
  done
fi
