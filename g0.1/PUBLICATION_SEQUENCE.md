# G0.1 — Menor publicação possível (proposta; requer aprovação explícita de produção)

**Aviso:** depois desta publicação, desativar um usuário **não interrompe imediatamente** o acesso de um token já emitido às tabelas operacionais (pedidos, estoque, portaria, financeiro, clientes etc.). Esse token continua válido por até 1 h. Nesse período, `get_my_org` e as 52 políticas aceitam o token. A desativação bloqueia de imediato só o novo login, a renovação de sessão, as funções administrativas e `set_user_role`.

## Pré-condições (todas obrigatórias)
1. Verificação no gateway gerenciado concluída (BROWSER_RESULTS.md, seção "Como verificar").
2. Backup confirmado e a manutenção do Cloud encerrada.
3. A versão do Auth de produção ainda é v2.197.0. Se tiver mudado, repetir L03 antes de qualquer passo.
4. Hashes conferidos com `SHA256SUMS`.

## Sequência
| Passo | O que | Depende de | Contenção se falhar |
|---|---|---|---|
| 1 | Aplicar `sql/001_profile_verification.sql` como migração | pré-condições | Não restaurar as versões antigas de `set_user_role`/guardas. Manter as revogações e corrigir avançando. Se o app quebrar no login, seguir para o passo 2 (o frontend atual depende do INSERT em `profiles`, agora revogado) |
| 2 | Implantar `get_user_profile` e `create_profile` candidatas | 1 (`g0_recover_own_profile`) | Se falharem, o login fica bloqueado (fail-closed). Corrigir a função; não reabrir a gravação de perfil pelo cliente |
| 3 | Publicar o frontend candidato de perfil/sessão | 1, 2 | Republicar a versão anterior do frontend só se 1–2 continuarem ativos; o frontend antigo pode falhar ao criar perfil, mas sem ganho de privilégio |
| 4 | Implantar `manage-user` candidata | 1 (`set_user_role` novo) | Se falhar, desativar a ação na tela. Não voltar à função antiga |
| 5 | Implantar `create-user` candidata com `G01_CREATE_BANNED_VALIDATED` **ausente** | 1 | **Cadastro de colaboradores fica temporariamente indisponível** (503, nenhuma conta criada) |
| 6 | Testes de fumaça em produção com conta própria: login de admin e de entregador, desativar e reativar um usuário de teste | 1–5 | Seguir a contenção do passo correspondente |

Os passos 1 a 3 formam um bloco: o 1 sem o 2 e o 3 pode impedir logins de quem não tem perfil. Os passos 4 e 5 só dependem do 1 e podem vir depois.

## Funcionalidades temporariamente indisponíveis
- Cadastro de colaborador (até a decisão sobre a flag e a empresa extra).
- Recriação automática de perfil ausente: passa a exigir revisão administrativa.

## Fora desta publicação (não ampliado)
Redesenho do provisionamento (empresa extra) e revisão de `get_my_org` e das políticas operacionais para checar `ativo`.
