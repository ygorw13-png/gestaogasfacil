#!/usr/bin/env bash
# Cria banco PostgreSQL DESCARTÁVEL em 127.0.0.1:55450 com a estrutura do projeto
# (supabase/migrations) + G0.1 001 + G1 002 [+ 003]. Nunca aponta para produção.
# Uso: bash g1/tests/sql/setup_cluster.sh [com003]
set -euo pipefail
unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PGSSLMODE
D=/tmp/g1db; ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
RUN="setpriv --reuid 1000 --regid 1000 --clear-groups"
mkdir -p $D/sock && chown -R 1000:1000 $D
[ -d $D/pg ] || $RUN initdb -D $D/pg -A trust -U postgres >$D/init.log
$RUN pg_ctl -D $D/pg -l $D/pg.log -o "-p 55450 -k $D/sock -h 127.0.0.1" start -w >/dev/null
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
echo "export U=\"$U\"; unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PGSSLMODE" > $D/env.sh
psql "$U" -XAq -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth; CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}', banned_until timestamptz, created_at timestamptz DEFAULT now());
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
 $f$ SELECT nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub','')::uuid $f$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
 $f$ SELECT current_setting('request.jwt.claims', true)::jsonb->>'role' $f$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
 $f$ SELECT coalesce(current_setting('request.jwt.claims', true),'{}')::jsonb $f$;
GRANT USAGE ON SCHEMA auth, public, extensions TO anon, authenticated, service_role;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN CREATE PUBLICATION supabase_realtime; END IF; END $$;
SQL
if [ "$(psql "$U" -XAtc "select count(*) from pg_tables where schemaname='public'")" = "0" ]; then
  for f in "$ROOT"/supabase/migrations/*.sql; do
    psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -c "SET search_path=public,extensions" -f "$f" >/dev/null 2>>$D/migr.err || echo "aviso: $f" >&2
  done
  psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g0.1/sql/001_profile_verification.sql" >/dev/null
  psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/002_isolamento_inativos.sql" >/dev/null
fi
[ "${1:-}" = com003 ] && psql "$U" -XAq -1 -v ON_ERROR_STOP=1 -f "$ROOT/g1/candidate/sql/003_permissoes_carga.sql" >/dev/null
cat > $D/reset2.sql <<'SQL'
SET session_replication_role = replica;
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE format('TRUNCATE public.%I CASCADE', t); END LOOP; END $$;
TRUNCATE auth.users CASCADE;
SET session_replication_role = origin;
SQL
echo "tabelas: $(psql "$U" -XAtc "select count(*) from pg_tables where schemaname='public'") políticas: $(psql "$U" -XAtc "select count(*) from pg_policies where schemaname='public'")"
