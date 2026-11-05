# G1 — Lote 2: permissões por papel, carga do entregador, venda a prazo (04/11/2026)

**Status: CANDIDATO.** Nada aplicado no Cloud, nada publicado, nenhum draft aceito. Testado só em PostgreSQL 17.11 descartável (127.0.0.1:55450), recriado do zero pelas 30 migrações do projeto (43 tabelas, 52 regras — iguais ao Cloud) + G0.1 001 + G1 002, com dados fictícios.

## Arquivos

| Arquivo | O que é |
|---|---|
| `g1/candidate/sql/003_permissoes_carga.sql` | Matriz por papel (decisão 15), carga (decisão 1), venda a prazo (decisão 11). Substitui o rascunho anterior |
| `g1/candidate/sql/003_contencao.sql` | Contingência de produção que **mantém os bloqueios** (ver abaixo) |
| `g1/tests/sql/run_permissoes.py` | 69 verificações por ação, incluindo concorrência real com duas conexões |
| `g1/tests/sql/run_contencao.py` | 16 verificações da contenção |
| `g1/tests/sql/setup_cluster.sh` | Recria o banco descartável (o anterior se perdeu num reinício do ambiente) |
| `src/lib/orderMetrics.ts` → `summarizeFlow` | Separa pendentes, concluídas, recebido, a receber |
| `src/pages/dashboard/...OverviewStats.tsx`, `useDashboardData.ts` | Painel mostra o fluxo do dia; "a receber" usa o saldo (valor − pago) |
| `src/lib/__tests__/g1-etapa1.test.tsx` | +4 testes da regra de venda a prazo (15/15) |

## O que o 003 faz

**Papéis (no banco, valendo para chamadas diretas e funções):**
- Operador e admin: pedidos, clientes, promissórias, despesas, rotas, revendas etc. — ler, criar, alterar. **Ninguém apaga** histórico (nenhuma regra de exclusão).
- Portaria, movimentos de carga e recebimentos: só leitura direta; gravação por função.
- Fechamento de caixa: operador cria e lê; não altera depois.
- Configurações: alterar só admin; operador lê entrega/estoque/financeiro/sistema; entregador lê entrega/sistema; segurança e notificações só admin.
- Colaboradores, comissões, frota, lembretes, tarefas, modelos: só admin. Operador vê cobradores pela função `listar_cobradores` (só ID, nome, situação).
- Entregador: lê só pedidos com `delivery_person_id` = ele; lê e cadastra clientes; lê a própria carga, os próprios recebimentos e acertos. Nenhuma gravação direta em pedido.

**Guardas:** gravação direta não altera preço, quantidade, empresa, autor, carga; não cancela; não reabre pedido concluído; não quita promissória. Isso só acontece dentro das ações controladas.

**Ações controladas** (validam empresa, conta ativa, papel, atribuição, campos e transição; travam o registro; aceitam chave contra reenvio):
- `atribuir_entrega` (operador, por ID do entregador) · `entregador_aceitar_entrega` (assigned→delivering) · `entregador_recusar_entrega` (com motivo, volta para a fila) · `entregador_concluir_entrega` (delivering→completed, consome a carga, registra pagamento)
- `entregador_venda_rua` (cria a venda concluída, consome a carga)
- `carga_saida` (operador: portaria → carga, **não é venda**) · `carga_devolver` (carga → portaria; entregador só a própria)
- `receber_promissoria` (parcial ou total; histórico em `recebimentos`) · `admin_corrigir_pedido` (preço/status, motivo obrigatório, histórico em `auditoria_correcoes`)

**Estrutura nova (só acrescenta):** colunas `orders.delivery_person_id`, `orders.carga_id`, `promissory_notes.order_id` (vazias nos registros antigos — sem vínculo por nome); tabelas `cargas`, `carga_movimentos`, `recebimentos`, `acoes_idempotentes`, `auditoria_correcoes`; tipos `saida_carga`/`retorno_carga` na portaria.

**Venda a prazo:** gera promissória ligada ao pedido e **nenhum** recebimento → não entra no dinheiro do caixa. Recebimento parcial grava cada pagamento e mantém o saldo.

## Resultados

| Suíte | Resultado |
|---|---|
| Segurança 002 (antes do 003) | 27/27 |
| 003 aplicado 2× (idempotente) | aplicado sem erro |
| Permissões por ação (003) | **69/69** — admin 9, operador 24, a prazo 5, entregador 26, inativos/internas 3, concorrência 2 |
| Segurança 002 com 003 | 26/27 — a única diferença é **intencional**: o entregador não lê mais todos os pedidos da empresa |
| Contenção | **16/16** |
| 003 reaplicado após contenção | 69/69 |
| Testes do app (fluxo do dia + lote 1) | 15/15 |

Concorrência real: duas vendas simultâneas de 2 botijões com carga de 3 → só uma passa, saldo 1. Mesma chave enviada duas vezes ao mesmo tempo → uma venda só.

Dois defeitos achados pelos próprios testes e corrigidos antes do resultado final: (1) a permissão de movimentar portaria deixava o entregador passar quando a marcação interna não existia na conexão; (2) a portaria recusava os tipos novos de transferência de carga.

## Contingência (não é rollback)

`003_contencao.sql` só serve se o app atual do entregador parar após o 003. Ele devolve ao entregador a leitura dos pedidos da empresa, a atualização de status e a venda na rua diretas, como o app faz hoje. **Mantém** isolamento entre empresas, bloqueio de inativos, sem exclusão, sem alterar preço/cancelar/reabrir, portaria só por operador, financeiro fechado ao entregador, colaboradores só admin. Desfaz-se reaplicando o 003. O `002_rollback.sql` fica marcado **só para laboratório**: se o 002 bloquear alguém legítimo, a correção é reativar o cadastro, não reabrir as regras.

## Pendências e dependências

- **O app atual ainda grava direto.** Com o 003 sozinho, o app do entregador (aceitar/recusar/concluir/venda na rua), a atribuição por nome, a lista de cobradores, o recebimento de promissória e as correções de preço/cancelamento do administrador **param**. A próxima etapa é a versão das telas que chama as ações controladas; até lá, o 003 só pode ir junto com a contenção, ou esperar.
- Fila offline do app deve enviar a mesma chave em cada reenvio (as funções já aceitam).
- Saldo da portaria não é conferido antes da saída para carga (só da carga). Depende de como "saldo da portaria" do dia será tratado (fuso horário, Etapa 8).
- Cancelamento pelo admin não devolve estoque nem desfaz recebimento (decisão B).
- Gateway hospedado do Cloud (G0.1): continua **não verificado**.
- Painel: o fluxo do dia foi verificado só por testes automáticos com dados fictícios; não foi conferido no navegador nem com dados reais.
