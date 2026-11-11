# Mapa de gravações diretas (frontend → tabelas)

Levantado em 10/11/2026 na branch `claude/continuidade-g1-integracao-telas`, por varredura de `.from('<tabela>').insert/update/upsert/delete` e da fila offline. **Decisão** diz o que acontece com cada gravação quando o G1 for ativado (SQL 002–008 aplicados e `VITE_G1_ACOES=on`).

Legenda:
- **Ação**: já passa por ação controlada com G1 (a gravação direta só existe no caminho antigo).
- **Protegida**: continua direta, mas o banco limita por papel, empresa e conta ativa (políticas do 003) e por gatilhos (preço, status final, carga e quitação só por ação).
- **Bloqueada pelo banco**: com G1, a gravação direta falha. A tela precisa da ação, ou do botão escondido para quem não pode.
- **Revisar**: precisa de decisão ou de trabalho.

| Tabela | Onde | Operação | Decisão |
|---|---|---|---|
| `orders` | `useCashierSales`, `QuickSaleDialog`, `VendaRua`, `useMyDeliveries`, `EntregasAtrasadasAlert`, `useEditarVenda`, `useCancelarVenda`, `useOrderMutations` (atribuição e status) | insert, update | **Ação** com G1: venda, venda na rua, aceite, recusa, conclusão, atribuição, reatribuição, correção pelo admin. |
| `orders` | `useOrderMutations.handleAddOrder` (pedido novo) | insert | **Protegida**: pedido pendente pode nascer direto. Os gatilhos impedem nascer cancelado ou com carga. Reenvio protegido por id da chave (Lote 1). |
| `orders` | `useOrderMutations.handleStatusChange` (ex.: `delivering`) | update | **Protegida**: o gatilho barra cancelar, reabrir venda concluída e mudar preço. **Revisar**: o operador muda `pending`↔`delivering` direto, sem histórico. |
| `promissory_notes` | `usePromissoryNotes` (recebimento, cobrador, criação manual), `lib/promissory.ts`, `QuickSaleDialog`, `VendaRua` | insert, update | **Ação** com G1 (Lote 4). A venda a prazo gera a nota dentro da ação de venda. |
| `movimentacoes_portaria` | todas por `registrar_movimentacao_portaria` (RPC) | rpc | **Protegida**: sem política de gravação direta. A função exige operador, trava o saldo e usa a data operacional (006). |
| `clients` | `NewClientDialog`, `EditClientDialog`, `QuickClientDialog`, `SaveClientPrompt`, `ClientesRuaTab`, `CadastroRapido` (entregador) | insert, update | **Protegida**: operador cria e altera, entregador só cria (cadastro rápido). Sem exclusão. |
| `cascos_emprestados` | `useClients` | insert, update | **Protegida**. **Revisar** com a decisão 12 (comodato). |
| `fechamentos_caixa` | `useFechamentosCaixa` | insert | **Protegida**: operador cria; correção só por admin. **Revisar** com a decisão 10 (reabertura, parciais) e para somar o dinheiro dos acertos do dia. |
| `despesas` | `useDespesas` (insert/update + RPC de movimento) | insert, update | **Protegida**: operador. Sem exclusão com G1. |
| `conta_botijoes` | `useContaBotijoes` (agregado/ponto) | insert | **Protegida**. **Revisar** com a decisão 13 (revendedores). Hoje roda só depois da venda confirmada (Lote 1). |
| `pontos_revenda`, `resellers` | `usePontosRevenda`, `useResellers` | insert, update | **Protegida** (operador). |
| `trocas_cheque` | `useTrocasCheque` | insert, delete | Insert **protegido**. Delete **bloqueado pelo banco** com G1 (ninguém apaga). **Revisar**: esconder o botão de excluir. |
| `requisicoes_estoque` (`StockRequestsList`), `CylinderControl` | update/insert | **Protegida** (operador). |
| `rotas`, `rota_pontos` (`NewRouteForm`, `usePainelDoDia`) | insert, update | **Protegida**. |
| `contatos_recompra` (`Recompra`) | insert | **Protegida**. |
| `colaboradores` (`tables/colaboradores.ts`), `comissao_*` (`useComissoes`), `vehicles*` (`FleetContext`), `lembretes_manutencao`, `tarefas_mensais`, `templates_mensagem` | insert, update, delete | **Protegida (só admin)**. Delete **bloqueado pelo banco** com G1. Colaborador desativado preserva o histórico: usar `situacao`, não excluir. **Revisar**: trocar "excluir" por "desativar" nas telas que ainda mostram exclusão (ex.: veículos). |
| `configuracoes_*` (`configTablesUtils`, `stockConfig`, `useStockConfiguration`, `useStockConfig`) | insert, update, upsert, delete | **Protegida (só admin altera)**; leitura conforme o 003. |
| `push_subscriptions` | `usePushNotifications` | upsert, delete | Do próprio usuário. Fora das tabelas operacionais. |
| `profiles`, `organizations` | `useRegisterForm` (cadastro inicial) | insert, update | **Revisar com o G0.1**: o candidato 001 bloqueia os campos de papel e conta ativa. |
| `dashboard_data` | `pages/dashboard/data.ts` | insert, update | Legado. **Revisar**: o painel atual lê pedidos e recebimentos; parece sem uso. |
| genéricos (`services/supabase/crud.ts`, `hooks/supabaseCRUD`, `useTableOperations`) | qualquer | insert, update, delete | Usados só por exemplos (`docs/examples`) e testes legados. **Revisar**: candidatos a remoção. |
| fila offline (`runOrQueue`) | `VendaRua` (caminho antigo: `orders` + `promissory_notes`) | insert | Com G1, a venda na rua vai pela fila como **ação** com chave. |

## Conclusão

- Com G1, nenhuma gravação direta restante consegue mudar preço, cancelar, estornar, quitar promissória, movimentar carga ou acerto, ou apagar histórico: os gatilhos e as políticas do 003, 007 e 008 bloqueiam.
- O que segue direto é cadastro e operação de baixo risco, limitado por papel e empresa.
- Os pontos **Revisar** estão em `docs/CHECKLIST_UNICO.md`.
