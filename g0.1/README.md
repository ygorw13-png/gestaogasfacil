# G0.1 v2 — pacote consolidado

## STATUS ÚNICO: NÃO PRONTO PARA PRODUÇÃO — INCOMPLETO E BLOQUEADO

Este README substitui o README anterior (que citava "50 testes"). Aquele texto está obsoleto e não faz parte deste pacote.

Bloqueios que impedem qualquer indicação de "pronto":
1. Os três candidatos administrativos (`_shared/g01-admin.ts`, `create-user/index.ts`, `manage-user/index.ts`) existem apenas no ambiente isolado (draft). Não há mecanismo, a partir da conversa principal, para ler arquivos de um draft sem aceitá-lo — e aceitar está proibido nesta etapa. Por isso o código **não está incluído**; apenas os hashes informados pelo draft (ver abaixo) estão registrados, sem conferência possível.
2. Validação pelo gateway padrão e em navegador/celular no ambiente isolado não foi concluída (gateway retornou 503; ver ISOLATED_VALIDATION.md §3).
3. O provisionamento de colaboradores precisa de redesenho aprovado (PROVISIONING_PROPOSAL.md). Nada foi reescrito.

Produção: nenhuma alteração, migração, publicação ou aceite de draft.

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
- [ ] Backup recente confirmado e plano de reversão (migração inversa + funções anteriores) testado no ambiente isolado.
- [ ] Aprovação explícita de produção, separada desta etapa.
