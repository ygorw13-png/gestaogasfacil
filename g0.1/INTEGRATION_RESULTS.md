# G0.1 — Integração real em ambiente isolado (2026-11-03)

## 1. Ambiente (isolado, descartável, só loopback)

| Componente | Versão | Origem |
|---|---|---|
| Auth (GoTrue) | **v2.197.0** — mesma versão informada pelo `/auth/v1/health` público do Cloud (leitura apenas) | binário oficial `supabase/auth` release v2.197.0 |
| PostgreSQL | 17.11, cluster novo em 127.0.0.1:55440 | sandbox |
| PostgREST | 14.12 | nixpkgs |
| Funções | `create-user/index.ts` e `manage-user/index.ts` candidatos, executados sem alteração por `tests/integration/gateway.ts` (127.0.0.1:58000) | candidato |

Esquema: as 30 migrações de `supabase/migrations` + `g0.1/sql/001_profile_verification.sql` (SHA-256 `acc2d28f…43a8`). Antes da G0.1, a estrutura local era **idêntica** à do Cloud (consulta de leitura só de estrutura): 43 tabelas, 52 políticas, mesmos hashes de políticas (`4795b43e…`), funções (`8c7c2f5b…`) e colunas (`25e7de37…`). Nenhum dado de produção foi lido ou copiado; contas fictícias `@example.invalid`; chaves geradas localmente.

Produção: nenhuma escrita, migração, implantação ou publicação. Draft não aceito.

## 2. O que a migração G0.1 protege — lista exata

Alterados/criados:
1. `g0_recover_own_profile()` — nova; EXECUTE só para `authenticated`.
2. `REVOKE INSERT ON profiles FROM authenticated`.
3. `REVOKE INSERT, UPDATE, DELETE ON user_roles FROM authenticated, anon`.
4. `g01_guard_organization_owner()` + trigger `g01_organization_owner_guard` (BEFORE UPDATE em `organizations`): impede trocar o dono.
5. `profiles_guard_privileged_fields()` substituída (bloqueia `role`, `organization_id`, `ativo` por não-admin).
6. `set_user_role(uuid, app_role)` substituída: exige chamador ativo, admin, mesma empresa, não ele mesmo; troca papel e `profiles.role` na mesma transação.

**Não alterados** (limitações restantes):
- `get_my_org()` — não verifica `ativo`. Confirmado: retorna a empresa para token antigo de conta desativada.
- `has_role()`, `current_profile_role()`, `handle_new_user()`, `registrar_movimentacao_portaria()`.
- **Todas as 52 políticas RLS** (hash idêntico antes/depois). Pedidos, estoque, portaria, financeiro etc. continuam aceitando qualquer token válido da empresa, inclusive emitido antes da desativação, até expirar (JWT 1 h).
- `handle_new_user` continua criando empresa + perfil admin para toda conta nova (empresa extra no cadastro de colaborador; ver `PROVISIONING_LIMITATIONS.md`).

## 3. Resultados — `tests/integration/live.test.ts`: **21 de 21 passaram** (Auth, banco, RPC e políticas reais)

| # | Cenário | Resultado real |
|---|---|---|
| L01 | Login de administrador | ok; perfil admin ativo, empresa correta |
| L02 | Criação com `G01_CREATE_BANNED_VALIDATED` desligada (gateway) | 503 `CREATE_UNAVAILABLE`; nenhuma conta criada |
| L03 | Auth `createUser` com `ban_duration` | INSERT e bloqueio gravados **na mesma transação** (mesmo txid); a linha confirmada já está bloqueada; login → `user_banned` |
| L04 | Cadastro de colaborador (flag ligada só no processo de teste) | empresa A, papel `entregador`, um único papel, desbloqueado; a empresa extra do gatilho **permanece** |
| L05 | Login de entregador | ok; `get_my_org` = empresa A |
| L06 | Desativação | perfil inativo + bloqueado; novo login e refresh recusados. Token anterior: `orders` **liberado**, `get_my_org` **retorna empresa**, endpoint admin **401** |
| L07 | Reativação | login volta a funcionar |
| L08 | Troca de papel (RPC com JWT do admin) | papel e perfil consistentes |
| L09 | Recusas | outra empresa 404; autoalteração 403; não-admin 403; admin bloqueado com token antigo 401; admin inativo não bloqueado 403; `set_user_role` recusado |
| L10 | Troca de papel concorrente com desativação | ambas 200; estado final consistente (papel único = perfil, inativo, bloqueado) |
| F01 | Resposta do Auth perdida após criar | `PROVISIONING_INCOMPLETE`; conta existe **bloqueada**, perfil admin em empresa extra |
| F02 | Falha antes de gravar perfil | `PROVISIONING_INCOMPLETE`; conta bloqueada, fora da empresa A |
| F03 | Resposta do desbloqueio perdida na criação | `PROVISIONING_INCOMPLETE`, embora a conta esteja pronta |
| F04 | Resposta da desativação do perfil perdida | `DEACTIVATION_INCOMPLETE`; perfil inativo, **Auth não bloqueado: novo login possível** |
| F05 | Bloqueio falha antes do envio | `DEACTIVATION_INCOMPLETE`; perfil inativo, **login possível** |
| F06 | Resposta do bloqueio perdida | `DEACTIVATION_INCOMPLETE`, embora totalmente desativado |
| F07 | Reativação: falha antes de gravar perfil | `REACTIVATION_INCOMPLETE`; continua inativo e bloqueado |
| F08 | Reativação: desbloqueio falha | `REACTIVATION_INCOMPLETE`; perfil ativo, login ainda bloqueado |
| F09 | Reativação: resposta do desbloqueio perdida | `REACTIVATION_INCOMPLETE`, embora reativado |
| F10 | Troca de papel: resposta da RPC perdida | `ROLE_CHANGE_INCOMPLETE`; papel trocado de forma atômica |
| F11 | Troca de papel: falha antes do envio | `ROLE_CHANGE_INCOMPLETE`; papel inalterado |

As falhas F01–F11 são falhas de rede injetadas nas chamadas reais (antes do envio ou com perda da resposta depois do efeito); Auth, banco e RPC são reais. Os 68 testes com mock (`admin.test.ts`, `admin-failure.test.ts`) continuam passando e são separados destes.

## 4. Não verificado nesta etapa
- Frontend candidato de perfil/sessão em navegador contra este ambiente, e as funções `create_profile`/`get_user_profile` pelo gateway.
- O gateway gerenciado do Cloud (`verify_jwt`, limites, CORS reais). O gateway local é um proxy simples.
- Comportamento de versões futuras do Auth: L03 vale para v2.197.0.

## 5. `G01_CREATE_BANNED_VALIDATED`
Permanece **desligada** no código candidato. L03/L04 comprovam o comportamento em v2.197.0. Ligar somente na implantação aprovada, depois de reconferir a versão do Auth e repetir L03.

## 6. Menor entrega publicável com segurança (quando houver aprovação)
1. SQL G0.1 (protege só os itens do §2).
2. `manage-user` candidato (desativar, reativar, papel, senha, nome, excluir) — com mensagens de operação incompleta.
3. `create-user` candidato **com a flag desligada**: cadastro de colaborador fica **temporariamente indisponível** (503, nada criado). Alternativa após aprovação: ligar a flag, aceitando a empresa extra residual.
4. Perfil/sessão frontend: depende do item 1; requer o teste em navegador do §4 antes.

Riscos que continuam após essa entrega: token antigo de conta desativada funciona nas tabelas operacionais por até 1 h; F04/F05 podem deixar login possível com perfil inativo (mensagem pede conferência). Fechá-los exige revisar `get_my_org`/políticas — fora do escopo desta etapa.

## 7. Reproduzir
Ver comandos no final de `REPRODUCE.md` (seção "Integração real").
