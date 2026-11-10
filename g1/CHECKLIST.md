# G1 — Checklist único do plano de melhorias (Etapa 0)

Base: auditoria funcional de 04/11/2026 (`gasfacil_auditoria_funcional_v1.md`) + trabalho G0.1.
Regras vigentes: só Lovable Cloud; produção intocada sem revisão prévia; registros preservados; nada inventado.

## Estado publicado vs candidatos

- **Publicado (produção):** código em `src/`, `supabase/functions/` e as 30 migrations. As 52 policies operacionais seguem amplas (CRUD por empresa, sem papel). `get_my_org()` não verifica `ativo`.
- **Candidato G0.1 (não publicado):** `g0.1/candidate/` — perfil/sessão, funções administrativas (`_shared/g01-admin-core.ts`, `create-user`, `manage-user`), SQL de privilégios. Status: **NÃO PRONTO PARA PRODUÇÃO** (`g0.1/README.md`).
- **Validação G0.1:** isolada real 21/21 (`INTEGRATION_RESULTS.md`); mocks 68/68; navegador isolado 14/14 (`BROWSER_RESULTS.md`); **gateway gerenciado do Cloud: não verificado** — o draft "G0.1 gateway gerenciado" validou apenas a cópia local do gateway, não o gateway hospedado. Aceitar esse draft aplicaria a migration dele em produção: não aceitar.
- **Cadastro administrativo de colaboradores:** permanece desabilitado (`G01_CREATE_BANNED_VALIDATED` desligada) até validação no gateway gerenciado.

## Correções de conclusões imprecisas da auditoria

1. **Promissórias:** a comparação por `client_id` não comprova ausência de título — notas podem ter sido criadas manualmente para o mesmo cliente. O que está comprovado: não existe vínculo por `order_id` (o vínculo é textual em `notes`), logo a reconciliação exata é impossível hoje. Classificação correta: **não reconciliável com segurança**, não "46 dívidas perdidas".
2. **Venda de balcão:** pode legitimamente não ter `client_id` nem `delivery_person` (cliente avulso, sem entrega). Os 126 pedidos sem `client_id` e 120 sem entregador são **esperados para balcão**, não necessariamente falha.
3. **Agendamento:** ausência de `pg_cron` nas migrations não comprova ausência de agendamento — pode existir agendamento externo ou no painel do Cloud. `fechamento-portaria-automatico` e `send-push` têm código mas **execução não comprovada** (pendente de verificação).

## Etapas, dependências e situação

| Etapa | Conteúdo | Depende de | Situação |
|---|---|---|---|
| 0 | Consolidar base (este documento) | — | **Concluída** |
| 1 | Eliminar informações fictícias | — | **Implementada e validada** (11 testes + 26 verificações no navegador com backend fictício; `g1/RELATORIO_LOTE1.md`) |
| 2 | Segurança no banco/backend | — | 002 testado 27/27; **003 por papel testado 69/69** + contenção 16/16; nada aplicado; depende das telas usarem as ações controladas (`g1/RELATORIO_LOTE2.md`) |
| 3 | Fluxo operacional | — | Decisões 1, 11, 15 **aprovadas**; próximas indispensáveis A–D em `DECISOES_OPERACIONAIS.md` |
| 4 | Vendas e estoque consistentes (transações, vínculos, idempotência) | 3 | **Candidatos 004 + 005 + telas** testados (SQL 40/40, 43/43, contenção 22/22; navegador isolado 14/14 + 17/17); não aplicados (`g1/RELATORIO_LOTE3.md`, `g1/RELATORIO_LOTE4.md`) |
| 5 | Carga e acerto do entregador | 3, 4 | Carga e transferência prontas no candidato; tela de acerto pendente |
| 6 | Fiado, recebimentos e caixa | 3 | Recebimento de promissória e painel prontos no candidato; estorno aguarda decisão B |
| 7 | Cascos e parceiros | 4 | Pendente (decisão 13); com as ações controladas, venda "a acertar" para agregado/ponto é recusada sem gravar |
| 8 | Datas (America/Bahia), pagamentos, comissões, offline | 3, 4 | Fila offline: gravação direta antiga bloqueada (lote 4); datas e pagamentos pendentes |
| 9 | Compras, fornecedores e custos | Método de custo (decisão) | Pendente |
| 10 | Relatórios e configurações | 4, 6, 9 | Parcialmente iniciada (relatório Excel real na Etapa 1) |
| 11 | Auditoria e conferência do histórico | 4, 6, 7 | Pendente |
| 12 | Validação e entrega em ambiente isolado | Todas | Pendente |

## Etapa 1 — o que foi implementado neste lote (preview apenas, sem migração)

| Problema (auditoria) | Correção | Arquivos |
|---|---|---|
| E1 — indicadores administrativos fixos (R$ 42.580, 87%, 24 usuários) | Substituídos por consultas reais (vendas/pedidos de hoje, receita do mês, usuários por papel); conversão e lucro exibem "Não disponível" com explicação | `OverviewStats.tsx`, `FinanceMetrics.tsx`, `UsersOverview.tsx` |
| E2 — Excel com vendas aleatórias e margem 55% | Gerador reescrito: vendas diárias e produtos reais de `orders`; custo/margem/crescimento como "Não disponível (custos não registrados)"; recomendações inventadas removidas | `reportDataGenerator.ts`, `reportUtils.ts`, `utils/reportUtils.ts`, `utils/sheetGenerator.ts`, `utils/reportTypes.ts` |
| Simulação de espera de 1s no relatório | Removida | `QuickActions.tsx` |
| E4 — cobradores fictícios | Lista passa a vir de `colaboradores` ativos | `useCollectors.ts` (novo), `Promissory.tsx` |
| E5 — formulário de sistema pré-preenchido com dados fictícios | Campos iniciam vazios | `SystemConfiguration.tsx` |
| E8 — zero configurado virava padrão (estoque mínimo, taxa de entrega, imposto) | `??` no lugar de `\|\|`: zero é preservado | `useStockConfiguration.ts`, `useMinStockLevels.ts`, `DeliverySettings.tsx`, `FinanceSettings.tsx` |
| E6 — fechamento parcial dividia tudo por dois | Parcial agora registra retrato fiel dos totais, sem alterar valores em aberto | `useCashierClosing.ts` |
| E9 — pedido confirmado/limpo/impresso antes de gravar, com ID falso | Gravação confirmada antes de fechar, limpar e imprimir; recibo usa o ID real retornado | `useOrderMutations.ts`, `Orders.tsx`, `NewOrderForm.tsx` |
| E7 — erro de consulta do dashboard virava zero | Erros propagados; tela distingue falha de ausência | `useDashboardData.ts` |

**Não feito neste lote (registrado para etapas seguintes):** relatórios de rota demonstrativos (`RouteReports`, componente órfão sem rota ativa — remoção segura na Etapa 10); `mockData.ts` de promissórias (sem uso após esta correção — remoção na Etapa 10); badges de "não implementado" nas configurações sem efeito (Etapa 10); unificação de códigos de pagamento (Etapa 8); RLS e backend (Etapa 2, candidata).

## Validação de 04/11 — correções adicionais (preview apenas)

Valor do pedido não é mais multiplicado pela quantidade no painel/Excel; painel mostra "indisponível" em falha; avisos das telas voltaram a aparecer; "Nova Promissória" não quebra mais; fechamento do dia grava a divisão por forma de pagamento relida no corte; estoque mínimo passa a ser salvo e lido por produto. Detalhes em `g1/RELATORIO_LOTE1.md`.

## Pendências registradas

- Gateway gerenciado do Cloud: **não verificado** (G0.1). Publicação continua dependendo disso.
- `/entrance/cashier` quebrado (fora dos menus) — Etapa 10. Fuso horário do "hoje" — Etapa 8.

## Contenção

Todas as mudanças deste lote são de frontend (preview). Nenhuma migration foi aplicada, nenhuma função foi implantada, nenhum dado foi alterado. Para reverter qualquer item, basta reverter o arquivo correspondente — não há efeitos colaterais no banco.
