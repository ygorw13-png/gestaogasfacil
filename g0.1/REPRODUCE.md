# G0.1 v2 — reprodução local (somente equipe técnica)

Não executar contra produção. Não copiar `.env`, tokens ou dados reais. A cópia frontend deve conter `src`, `public`, configurações e dependências da versão registrada, nunca `.git` ou credenciais. Sobrepor `candidate/src` à cópia, não ao projeto ativo. Logs da entrega foram gerados pelo agente; estes comandos permitem revisão técnica.

## Frontend completo

```bash
# Na cópia descartável do frontend, não em /dev-server:
bun run build
tsgo --noEmit -p tsconfig.app.json
./node_modules/.bin/vitest run src/contexts/AuthContext.test.tsx src/contexts/auth.test.tsx src/pages/auth/Login.test.tsx
```

Executado em `/tmp/g0.1-v2/frontend`. Build e TypeScript terminaram com exit 0. Build avisou chunks acima de 500 kB, sem erro. Testes existentes adaptados: 8 aprovados. Nenhum teste de screenshot/copy foi adicionado como regra de negócio.

## Banco mínimo fictício + testes candidatos

```bash
# Criar cluster NOVO, pertencente a usuário não root, sem PG* de produção:
initdb -D /tmp/g0-test/pgdata -A trust -U g0test
pg_ctl -D /tmp/g0-test/pgdata -l /tmp/g0-test/postgres.log -o '-p 55439 -h 127.0.0.1' start
psql 'postgresql://g0test@127.0.0.1:55439/postgres?sslmode=disable' -X -v ON_ERROR_STOP=1 -f g0.1/tests/bootstrap.sql -f g0.1/sql/001_profile_verification.sql
./node_modules/.bin/vitest run --config g0.1/tests/vitest.config.ts
pg_ctl -D /tmp/g0-test/pgdata stop -m fast
```

O caminho do pacote deve ser montado como `g0.1/` no projeto de revisão para preservar caminhos da configuração. `bootstrap.sql` destina-se exclusivamente a um cluster vazio local fictício. Não é esquema completo, não exporta/replica produção e não deve ser executado no draft Cloud.

## Endpoints candidatos

```bash
deno check g0.1/candidate/supabase/functions/get_user_profile/index.ts g0.1/candidate/supabase/functions/create_profile/index.ts
```

## Versões observadas

| Ferramenta | Versão |
|---|---|
| Node | 22.23.4 |
| Bun | 1.4.4 |
| Deno | 2.8.3 |
| PostgreSQL local | 17.11 |
| React | 18.3.1 |
| Vite | 5.4.6 |
| TypeScript instalado | 5.6.2 |
| tsgo usado | 7.0.0-dev.20260707.2 |
| Vitest | 1.6.1 |
| Cliente Cloud | 2.106.2 |
| TanStack Query | 5.56.2 |
| Testing Library React | 16.3.2 |
| Vite React SWC | 3.7.0 |
| Vite PWA | 1.3.0 |

Verificação TypeScript executada por `tsgo` disponível no ambiente, não por `tsc`; a versão exata do compilador usado deve constar no log de versões da entrega.

## Limite da reprodução

Os 59 testes candidatos + 8 legados locais não são 67 testes hospedados. Os testes de sessão e endpoints usam serviços simulados; PostgreSQL valida RPC/triggers/grants no esquema mínimo real local. Validação completa de Auth/gateway/create-user/manage-user exige o draft isolado com gateway funcional. Não substituir por gravações em produção.
## Integração real (Auth v2.197.0 + PostgREST + esquema completo, só loopback)
1. Baixe `auth-v2.197.0-x86.tar.gz` da release oficial `supabase/auth`; `nix build nixpkgs#postgrest`.
2. Cluster novo (usuário sem privilégio): `initdb -D /tmp/iso/pg -A trust -U postgres`; `pg_ctl ... -o "-p 55440 -h 127.0.0.1" start`. Remova variáveis `PG*` do shell.
3. Crie papéis `anon`, `authenticated`, `service_role`, `authenticator`, `supabase_auth_admin` e o schema `auth` do dono `supabase_auth_admin`; schema `extensions` com `pgcrypto`; `CREATE PUBLICATION supabase_realtime`.
4. Inicie o Auth (aplica as próprias migrações) com segredo JWT gerado localmente; aplique `supabase/migrations/*.sql` (cada um com `psql -1`) e `g0.1/sql/001_profile_verification.sql`.
5. Crie a tabela/gatilho de auditoria `public.iso_auth_audit` em `auth.users` (apenas no ambiente isolado; usado por L03/L04).
6. Inicie PostgREST (porta 53000) e `deno run -A tests/integration/gateway.ts` (porta 58000) com `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` locais e **sem** `G01_CREATE_BANNED_VALIDATED`.
7. `ISO_PG_URL=postgres://postgres@127.0.0.1:55440/postgres deno test -A tests/integration/live.test.ts` — o teste recusa executar fora de 127.0.0.1.
