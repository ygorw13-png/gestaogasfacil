# Plano: Controle de Estoque da Portaria

## Visão geral

Implementar gestão de estoque "vivo" na portaria, com painel em tempo real, transferências auditáveis entre pátio e portaria, rastreio de comodato por cliente, e ajustes na tela de vendas e fechamento de caixa.

## 1. Banco de dados (migração)

### Nova tabela `movimentacoes_portaria`
Registra toda movimentação do dia. Saldo atual = SUM() das linhas do dia.

Colunas principais:
- `tipo`: `abertura`, `transferencia_patio_para_portaria`, `transferencia_portaria_para_patio`, `venda`, `venda_comodato`, `devolucao_vasilhame`, `fechamento`, `ajuste`
- `produto`: `P13`, `P20`, `P45`, `agua`
- `delta_cheios`, `delta_vazios`, `delta_emprestados` (inteiros, podem ser negativos)
- `cliente_id` (opcional, para comodato/devolução)
- `referencia_id` (opcional: id da venda/transferência relacionada)
- `observacoes`, `registrado_por`, `organization_id`, `criado_em`, `data_operacao` (date)

RLS: acesso por organization_id via `get_my_org()`.

### View `saldo_portaria_atual`
Calcula saldo do dia agregando movimentações por produto.

### Reutiliza `cascos_emprestados` existente
Já existe a tabela para comodato por cliente — vamos integrar.

## 2. UI — Tela de Vendas da Portaria (`EntranceSales`)

### Novo painel de estoque no topo
Cards horizontais por produto mostrando:
```
P13   Cheios: 98   Vazios: 01   Emprestados: 01   Devolvidos hoje: 01
P20   ...
Água  ...
```
Atualiza via React Query invalidation após cada operação.

### Botões de ação no painel
- "Receber do Pátio" → modal de transferência entrada
- "Enviar ao Pátio" → modal de transferência saída
- "Histórico de Movimentações" → drawer com lista do dia
- "Devolver Vasilhame" → modal com busca de cliente que tem casco emprestado

### Ajuste no `NewSaleForm`
- Destacar visualmente o campo "Valor Unitário" quando produto = gás + pagamento ∈ {Dinheiro, PIX, Crédito, Débito}: borda primary, label em destaque, ícone de cifrão
- Mostrar subtotal calculado abaixo (quantidade × valor unitário)
- Quando "loanGas" marcado → registra comodato vinculado ao cliente selecionado

## 3. Fluxos automáticos

| Ação | Movimentações geradas |
|---|---|
| Venda normal de 1 P13 | `venda`: -1 cheio, +1 vazio |
| Venda com comodato | `venda_comodato`: -1 cheio, +1 emprestado (vincula cliente) |
| Devolução de vasilhame | `devolucao_vasilhame`: +1 vazio, -1 emprestado (se cliente tinha) |
| Transferência pátio→portaria | `transferencia_patio_para_portaria`: +N cheios e/ou +M vazios |
| Transferência portaria→pátio | `transferencia_portaria_para_patio`: -N cheios e/ou -M vazios |

## 4. Fechamento de caixa

Adicionar no formulário de fechamento, por produto:
- Campo "Cheios restantes" (hoje só vazios eram implícitos)
- Validação: cheios_iniciais + transferências_entrada - vendas - transferências_saída ≈ cheios_informados (alerta se divergir)
- Ao confirmar fechamento → registra movimentação `fechamento` com snapshot final

## 5. Abertura do dia (saldo híbrido)

Ao abrir a tela de vendas pela primeira vez no dia:
- Busca último fechamento → pré-preenche cheios/vazios sugeridos
- Modal "Confirmar saldo de abertura" permite ajustar manualmente
- Registra movimentação `abertura`

## 6. Histórico

Drawer/página acessível pelo painel mostrando todas as movimentações do dia (ou filtro por data), com colunas: hora, tipo, produto, deltas, usuário, cliente (se houver), observação.

## Arquivos a criar/editar

**Criar:**
- `supabase/migrations/...` — tabela + view + RLS
- `src/pages/entrance/components/stock/PortariaStockPanel.tsx`
- `src/pages/entrance/components/stock/TransferDialog.tsx`
- `src/pages/entrance/components/stock/ReturnCylinderDialog.tsx`
- `src/pages/entrance/components/stock/MovementsHistory.tsx`
- `src/pages/entrance/components/stock/OpeningBalanceDialog.tsx`
- `src/pages/entrance/hooks/usePortariaStock.ts`
- `src/pages/entrance/hooks/usePortariaMovements.ts`

**Editar:**
- `src/pages/entrance/EntranceSales.tsx` — adicionar painel
- `src/pages/entrance/components/sale-form/ProductSelection.tsx` — destacar campo valor
- `src/pages/entrance/components/sale-form/CylinderMovement.tsx` — registrar comodato
- `src/pages/entrance/CashierClosing.tsx` — adicionar cheios restantes
- `src/hooks/useCashierSales.tsx` — disparar movimentações ao registrar venda

## Ordem de execução

1. Migração do banco
2. Hooks de leitura (saldo + movimentações)
3. Painel de estoque + diálogos de transferência/devolução
4. Integração com fluxo de venda (auto-criar movimentação)
5. Diálogo de abertura do dia
6. Ajuste UI do formulário de venda (campo valor destacado)
7. Atualização do fechamento de caixa