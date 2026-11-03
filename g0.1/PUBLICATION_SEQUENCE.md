# G0.1 — Menor publicação possível (proposta; requer aprovação explícita de produção)

**Aviso:** depois desta publicação, desativar um usuário **não interrompe imediatamente** o acesso de um token já emitido às tabelas operacionais (pedidos, estoque, portaria, financeiro, clientes etc.). Esse token continua válido por até 1 h. Nesse período, `get_my_org` e as 52 políticas aceitam o token. A desativação bloqueia de imediato só o novo login, a renovação de sessão, as funções administrativas e `set_user_role`.

## Pré-condições (todas obrigatórias)
1. Validação no gateway gerenciado concluída em draft isolado (`MANAGED_GATEWAY_RESULTS.md`).
2. Backup confirmado e nenhum incidente ou manutenção do Cloud em andamento.
3. A versão do Auth de produção ainda é v2.197.0. Se tiver mudado, repetir L03 antes de qualquer passo.
4. Hashes conferidos com `SHA256SUMS`.

## Princípio da transição (revisado)
As ações administrativas ficam protegidas em **todos** os estados intermediários. Por isso, os endpoints administrativos antigos são **substituídos primeiro** e nunca restaurados. Os candidatos validam o admin (ativo, papel canônico, mesma empresa) no próprio código, sem depender do SQL novo. Nenhuma versão antiga de `create-user`, `manage-user`, `set_user_role` ou das guardas é mantida como contingência.

## Sequência
| Passo | O que | Por que nesta ordem | Contenção se falhar |
|---|---|---|---|
| 1 | Implantar `manage-user` e `create-user` candidatas (sem `G01_CREATE_BANNED_VALIDATED`) | Fecha imediatamente os endpoints antigos. Funcionam com o esquema atual: usam colunas existentes e chamam `set_user_role` com o JWT do admin já verificado | Se a implantação falhar, **remover/desativar** as funções (as ações administrativas ficam indisponíveis), nunca reimplantar as antigas. O cadastro de colaborador responde 503 desde aqui |
| 2 | Aplicar `sql/001_profile_verification.sql`, logo em seguida | Fecha o caminho direto ao `set_user_role` antigo, que a tela atual chama via RPC, e as gravações de perfil/papel pelo cliente | Corrigir avançando; não restaurar funções ou permissões antigas |
| 3 | Implantar `get_user_profile` e `create_profile` candidatas | Dependem de `g0_recover_own_profile` (passo 2) | Se falharem, o login fica bloqueado (fail-closed). Corrigir a função; não reabrir a gravação de perfil pelo cliente |
| 4 | Publicar o frontend candidato de perfil/sessão | Depende de 2 e 3 | Voltar ao frontend anterior só com 1–3 mantidos; ele pode exibir erros, mas sem ganho de privilégio |
| 5 | Testes de fumaça em produção com conta própria: login de admin e de entregador, desativar e reativar um usuário de teste, cadastro → 503 | — | Contenção do passo correspondente |

Janela entre os passos 1 e 2: a tela administrativa atual pode chamar diretamente o `set_user_role` antigo. Por isso, o passo 2 entra na mesma janela de manutenção, sem intervalo. Entre os passos 2 e 4, o cadastro pelo frontend antigo e a recriação automática de perfil falham de modo fechado: nenhum privilégio é concedido e o usuário vê erro.

Observação de plataforma: no Lovable Cloud, uma função colocada em `supabase/functions/` é implantada automaticamente e o frontend é publicado à parte. Assim, a ordem acima pode ser executada passo a passo, com conferência entre eles.

## Funcionalidades temporariamente indisponíveis
- Cadastro de colaborador (até a decisão sobre a flag e a empresa extra).
- Recriação automática de perfil ausente: passa a exigir revisão administrativa.

## Fora desta publicação (não ampliado)
Redesenho do provisionamento (empresa extra) e revisão de `get_my_org` e das políticas operacionais para checar `ativo`.
