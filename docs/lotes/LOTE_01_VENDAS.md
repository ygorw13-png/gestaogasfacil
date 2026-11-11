# Lote 1: correção das vendas (tipo de venda, reenvio e confirmação)

Branch `claude/continuidade-g1-integracao-telas`. Nada foi publicado e nenhuma migração foi aplicada fora do banco descartável em 127.0.0.1.

## Problemas resolvidos

| # | Problema encontrado no código | Correção |
|---|---|---|
| 1 | `venda_portaria` (004) aceitava só `completo`; telas, padrão da coluna e relatórios usam `completa`. A venda rápida com "Gás completo" falhava; o caixa convertia para `completo` e gravava um valor diferente do resto do sistema. | **Canônico = `completa`.** SQL 005 normaliza a entrada (`completa`/`completo`, sem diferenciar maiúsculas e espaços) e grava só `completa`. O frontend lê `completo` histórico como `completa` (`normalizarTipoVenda`). A conversão dispersa em `useCashierSales` foi removida. |
| 2 | `entregador_venda_rua` gravava o tipo como recebido, sem validar. | Valida e normaliza igual à portaria; recusa tipo desconhecido ou ausente. |
| 3 | A mesma chave de reenvio com **outro conteúdo** devolvia o resultado da primeira operação, em silêncio. | A chave guarda o resumo (md5) do conteúdo normalizado. Mesma chave com outro conteúdo é recusada ("Chave já usada com outro conteúdo"). |
| 4 | O caixa (`useSaleForm` + `useCashierSales`) fechava o diálogo, limpava o formulário, lançava a conta de agregado/ponto e mostrava "Venda registrada" **antes** de gravar. A gravação era `fire-and-forget`, e o caminho antigo ignorava o erro do `insert`. | O envio é aguardado. Fechar, limpar, lançar agregado/ponto, atualizar indicadores e mostrar sucesso só acontecem depois da confirmação. Em falha, os dados ficam preenchidos com a mensagem na tela. |
| 5 | Chave gerada por clique, sem relação com o conteúdo. | `ControleChave` (`src/lib/g1/operacao.ts`): uma retentativa da mesma venda usa a mesma chave, e uma venda nova recebe outra. Se a resposta se perdeu e os dados mudaram, a chave não é reaproveitada nem trocada em silêncio: a tela pede uma decisão explícita ("Descartar a tentativa anterior e registrar como nova venda"). |
| 6 | Envio duplo (clique duplo, Ctrl+Enter repetido). | Trava imediata (`useRef`) em cada formulário e no hook `useOperacaoUnica`. Botão desabilitado e campos travados (`fieldset disabled`) durante o envio. O backend continua sendo a proteção real. |
| 7 | `venda_portaria` ignorava os cascos devolvidos além da quantidade e o comodato, divergindo do caminho antigo do caixa. | Novos parâmetros opcionais `_vasilhames_recebidos` e `_comodato`. Comodato registra `delta_emprestados = quantidade`, sem entrada de vazio, com movimento `venda_comodato`. A chamada antiga, com 11 argumentos, continua válida. |
| 8 | Caminho antigo (G1 desligado) sem proteção contra reenvio. | O `id` do pedido vem da chave, e o reenvio bate na chave primária (23505) e segue para o que faltou. O estoque é conferido por `referencia_id` antes de lançar, e a promissória já não duplicava (marca `[venda:id]`). Falha depois do pedido salvo mantém a chave para completar sem duplicar. |
| 9 | Criação de pedido (`NewOrderForm` → `handleAddOrder`) sem proteção contra reenvio ou envio duplo. | Mesmo mecanismo: o `id` vem da chave, e um reenvio usa o registro existente se for o mesmo pedido (confere cliente, produto, quantidade e preço). Se não for, recusa. Botão travado durante o envio. É compatível com os gatilhos do 003, que bloqueiam só pedido cancelado ou com carga na inserção direta. |
| 10 | O formulário de pedido com dois produtos marcados gravava **só o primeiro**, em silêncio. | Recusa com mensagem: um pedido por produto. |

## Arquivos

- SQL candidato: `g1/candidate/sql/005_tipo_venda_idempotencia.sql`. A numeração foi conferida: não havia 005. O "005_saldo_portaria" do HANDOFF passa a ser 006.
- Testes SQL: `g1/tests/sql/run_vendas005.py`, `g1/tests/sql/reset_com005.sh`.
- Novos: `src/lib/g1/operacao.ts`, `src/hooks/useOperacaoUnica.ts`, `src/pages/entrance/components/sale-form/RegisterSaleButton.tsx`, `src/lib/__tests__/g1-vendas-lote1.test.ts`.
- Alterados:
  - fluxo de venda: `src/lib/g1/acoes.ts` (`AcaoError` com `incerta`), `src/lib/saleTypes.ts`, `src/hooks/useCashierSales.tsx`, `src/contexts/CashierContext.tsx`, `src/pages/entrance/hooks/useSaleForm.ts`, `SaleFormContent.tsx`;
  - botão de registro: `EntranceHeader.tsx`, `DesktopSaleForm.tsx`, `MobileSaleForm.tsx`, `ClosingSalesEditor.tsx`;
  - venda rápida e pedido: `QuickSaleDialog.tsx`, `NewOrderForm.tsx`, `useOrderMutations.ts`;
  - leitura de `completo` histórico: `useVendasHoje.ts`, `useEditarVenda.ts`, `RecentSalesTable.tsx`, `MinhasEntregas.tsx`, `whatsappLinks.ts`.

## Consumidores de `tipo_venda` conferidos

- Formulários: `SaleTypeSelect`, `formTypes` (zod), `useSaleForm`, `QuickSaleDialog`, `VendaRua` e `NewOrderForm` já enviavam `completa`.
- SQL: 004 e 005. Não há `CHECK` na coluna (migração `20260806153431`, padrão `completa`).
- Estoque: movimento da portaria pela ação, ou `registrarMov` no caminho antigo.
- Relatórios: `RelatorioVasilhames` compara `!== 'recarga'` e `=== 'vasilhame'`, o que funciona para os dois valores. Recompra/WhatsApp agora normaliza.
- Impressão: `receiptPrint.ts` não usa o tipo.
- Histórico: `useVendasHoje`, `useEditarVenda` e `RecentSalesTable` normalizam; `useCancelarVenda` só testa `vasilhame`.
- Nenhum dado existente é reescrito.

## Testes executados (10/11/2026, PostgreSQL 16 em 127.0.0.1, dados fictícios)

| Suíte | Resultado | O que valida |
|---|---|---|
| `run_vendas005.py` (nova) | **37/37** | Todos os tipos na portaria e na rua, com pedido, cascos e movimentação. Comodato e cascos informados. Reenvio com o mesmo conteúdo devolve o mesmo pedido, sem duplicar pedido, estoque ou recebimento. Mesma chave com outro conteúdo é recusada e não deixa rastro. Chave nova grava nova venda. Permissões, isolamento e RLS da tabela de chaves. Concorrência de envio idêntico e de conteúdos diferentes com a mesma chave. |
| `run_integracao.py` com 005 | **40/40** | Regressão do 004. |
| `run_permissoes.py` (`G1_004=1`) com 005 | **69/69** | Regressão de permissões. |
| `run_security.py` com 005 | **26/27** | Mesma diferença intencional já registrada: o entregador lê só as próprias entregas. |
| `g1-vendas-lote1.test.ts` | **19/19** | Rodado com `node --test` e um adaptador mínimo da API do vitest (scratchpad), **não pelo vitest**. O adaptador foi conferido: acusa falhas. |
| Sintaxe TS/TSX dos 23 arquivos alterados | 0 erros | `transpileModule` do TypeScript 6.0.2 global. |

Os scripts SQL recusam qualquer URL fora de 127.0.0.1. O banco fica em `/home/claude/g1db_lab`, fora do repositório.

## Não executados e motivo

- `vitest`, `tsc` do projeto, `eslint` e `vite build`: não há `node_modules`, e a rede para instalar pacotes está bloqueada nesta sessão. Os testes React (`useSaleForm`, `QuickSaleDialog`, `NewOrderForm` com o cliente simulado) não foram escritos nem rodados por isso.
- Navegador com frontend e backend isolados: exige PostgREST, gateway e build do frontend, e nada disso está disponível aqui.
- Os 7 testes legados quebrados ainda não foram investigados (ficam para o lote de integração).

## Pendências e limitações

- **Venda para agregado/ponto a prazo sem valor**, com G1 ligado: recusada antes do envio, com mensagem. Depende da decisão sobre revendedores (preço e acerto).
- **Venda retroativa** (fechamento de dia anterior), com G1 ligado: continua recusada (decisão 6 pendente).
- A data "hoje" do caixa usa o fuso do navegador (`toLocaleDateString('sv-SE')`). Passa a `America/Bahia` no lote de datas.
- A conta de agregado/ponto (`registrarEntrega`) é uma gravação à parte, feita só depois da venda confirmada. Se ela falhar, a venda fica salva e o erro aparece na tela. Isso entra na revisão de gravações diretas.
- Ainda geram chave nova a cada clique: `receber_promissoria` (lote 4, com risco de recebimento duplicado após resposta perdida), `atribuir_entrega` (lote 3; o status impede a dupla transferência) e `VendaRua` (o servidor já recusa conteúdo diferente; a tela passa ao mesmo mecanismo no lote 3).
