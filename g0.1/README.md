# G0.1 — pacote consolidado

## STATUS ÚNICO: NÃO PRONTO PARA PRODUÇÃO

Este README substitui versões anteriores (inclusive a que citava "50 testes" e a que dizia que o código administrativo estava ausente).

- Código administrativo: nova implementação em `candidate/supabase/functions/` (os arquivos do draft antigo não são usados).
- Integração real isolada (Auth v2.197.0, banco com esquema completo, RPC e políticas reais): **21/21** — ver `INTEGRATION_RESULTS.md`.
- Testes com mock: 68/68 (separados). Perfil/sessão: 59 candidatos + 8 legados.
- Pendente antes de publicar: teste em navegador do frontend de perfil/sessão contra o ambiente isolado; aprovação explícita de produção.
- Limitações confirmadas: `get_my_org` e as 52 políticas não foram alteradas; token antigo de conta desativada funciona nas tabelas operacionais até expirar; empresa extra no cadastro.
- `G01_CREATE_BANNED_VALIDATED` desligada: cadastro de colaborador indisponível até ligar na implantação aprovada.

Produção: nenhuma alteração, migração, publicação ou aceite de draft.

> Seções abaixo são históricas; onde divergirem, valem este topo e `INTEGRATION_RESULTS.md`.

## Separação em três frentes

| Frente | Conteúdo | Situação |
|---|---|---|
| A. Perfil/sessão | `candidate/src/contexts/auth/*` (coordenador de sessão com geração compartilhada), guards, `create_profile`/`get_user_profile`, SQL de privilégios de perfil | Código e testes neste pacote. 59 testes candidatos + 8 legados passam; build e TypeScript da cópia completa passam. Falta gateway/navegador. |
| B. Admin — compatibilidade e autorização | `g01-admin.ts`, `create-user`, `manage-user` candidatos: admin ativo + empresa válida, rejeição de inativo com token antigo, checagem de erros, ações `edit`/`set_role` | Validado no draft (44 asserções reais). **Código ausente deste pacote** (bloqueio 1). |
| C. Redesenho do provisionamento | Fim da empresa extra, tratamento de falhas Auth/perfil/papel | Apenas proposta. Não implementado. |

## Dependências e entregas independentes

- **A depende de B.** O SQL de A revoga inserts diretos em perfil e escritas diretas em papéis e endurece o trigger de perfil. As funções admin atuais ignoram erros dessas escritas; publicar A sem B pode gerar "sucesso falso" ao criar/gerir colaboradores. Também a garantia "admin inativo não age" só existe com B.
- **B depende do SQL de A** (usa a RPC atômica de papel e a checagem de admin ativo).
- **A + B podem ser entregues juntas, sem C**, desde que se aceite formalmente a limitação conhecida: criação continua em várias chamadas e deixa a empresa extra. Ainda assim exigem os critérios de publicação abaixo.
- **Parte isoladamente segura:** apenas o coordenador de sessão do frontend (sem SQL), pois só restringe o cliente; não muda permissões do servidor. Mesmo assim depende de teste em navegador.
- **C depende de A + B** e de nova migração (trigger de novo usuário).

## Hashes dos candidatos administrativos (informados pelo draft, não conferidos aqui)

| Arquivo | SHA-256 |
|---|---|
| create-user/index.ts | fa33c3b10a761bcda5b41f8932b8cd1c1838eb5080b4e6aef0f69250e4e9a681 |
| manage-user/index.ts | 6af8e5f193b215afa5c68e81a4bae411124089ea603cefce449e23b1cf549e97 |
| _shared/g01-admin.ts | dc1bf27106438aa8599ed8a48c1c0a011dbd0fc899a67a0679b83ffa601b8c5a |

Como transportar sem aceitar o draft: no chat do draft, pedir "copie os três arquivos para /mnt/documents/g01_admin_candidates/ e gere o sha256sum, sem segredos". Depois, nesta conversa, conferir os hashes acima e incluir no pacote junto com os testes correspondentes (o roteiro das 44 asserções, sem o arquivo de contas, que contém segredos).

## Resultados registrados

| Verificação | Resultado |
|---|---|
| Testes candidatos (sessão, adapter, segurança SQL em Postgres 17 local fictício, integração) | 59 aprovados |
| Testes legados de auth na cópia completa | 8 aprovados |
| Build da cópia completa (`bun run build`) | OK |
| TypeScript (`tsgo --noEmit -p tsconfig.app.json`) | OK |
| Deno check dos endpoints de perfil | OK |
| Asserções reais no draft (Auth/PostgREST/esquema completo) | 44 aprovadas |
| Gateway padrão / navegador / celular | **Não executado — bloqueado** |

Comandos e versões: REPRODUCE.md. Detalhes da revisão v2: REVISION_V2.md. Relatório do draft: ISOLATED_VALIDATION.md.

## Testes exatos pendentes (gateway + navegador, ambiente isolado)

1. `GET /auth/v1/health` e `/rest/v1/` via gateway = 200.
2. `POST /functions/v1/get_user_profile` com perfil ativo = 200; perfil ausente = 404/409 sem recriar.
3. `create-user` via gateway: admin ativo = 200; colaborador comum = 403; papel `gerente` = 400.
4. `manage-user` via gateway: admin inativo com token antigo = 403; desativar → login 400; reativar → login 200; `edit` com papel embutido = 400.
5. Navegador: login → painel; logout com rede cortada mantém bloqueio; renovação de token não restaura acesso; troca de conta A→B não mostra dados de A.
6. Celular: login do entregador abre só "Minhas entregas"; conta desativada perde acesso ao recarregar.

## Critérios objetivos para publicação

- [ ] Código dos três candidatos admin no pacote, com SHA-256 iguais aos acima.
- [ ] Os 6 grupos de testes pendentes acima aprovados no ambiente isolado.
- [ ] 59 + 8 testes locais e as 44 asserções reais reexecutados sobre a versão final.
- [ ] Decisão registrada sobre C: implementado e testado, ou limitação aceita por escrito.
- [ ] Comparação do esquema de produção com o snapshot do draft (sem divergência nas tabelas profiles, user_roles, organizations e funções envolvidas).
- [ ] Backup recente confirmado e plano de contenção testado no ambiente isolado. A contenção **não** restaura funções antigas vulneráveis nem permissões amplas: em caso de problema, manter revogações e bloqueios, desativar a ação afetada (função administrativa retorna 503 controlado) e corrigir para frente com nova versão revisada.
- [ ] Aprovação explícita de produção, separada desta etapa.
