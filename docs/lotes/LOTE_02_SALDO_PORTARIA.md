# Lote 2: saldo da portaria na transferência para a carga e data operacional

## Problemas resolvidos

| # | Problema encontrado | Correção |
|---|---|---|
| 1 | `_transferir_para_carga` (004) não conferia o saldo: a portaria podia ir a negativo numa saída para a carga. | Valida empresa, entregador (ativo, papel `entregador`, mesma empresa), produto e quantidade. **Exige a abertura do dia** e recusa quantidades acima dos cheios disponíveis no dia. Valida e movimenta na mesma transação. |
| 2 | Duas saídas simultâneas (ou uma saída junto com uma venda) podiam ler o mesmo saldo. | Trava de transação por (empresa, produto, dia), usada por **todo** movimento da portaria (`registrar_movimentacao_portaria`, logo vendas, ajustes, retornos e transferências). A ordem de travas é sempre pedido → carga → portaria, sem ciclo. |
| 3 | A data operacional era UTC: `CURRENT_DATE` no banco e `toISOString()` nas telas. Entre 21:00 e 23:59 (Bahia), os movimentos caíam no dia seguinte. | `public.data_operacional()` = data civil em America/Bahia. Passa a ser o padrão da coluna e da função de movimento. A transferência valida e grava no mesmo dia. As telas da portaria usam `hojePortaria()`. Os dias já gravados **não** são reescritos. |
| 4 | A tela não tinha como saber quanto pode transferir. | `saldo_transferivel_portaria(produto)`, só leitura, para operador e admin. Devolve o dia, se a abertura foi registrada e os cheios disponíveis. |

**Sem abertura não há transferência.** Nada é criado automaticamente: nem abertura, nem saldo. A mensagem pede para confirmar a abertura do dia. A rotina de abertura da empresa não mudou: a tela de abertura continua igual, e **vendas de balcão continuam liberadas antes da abertura e sem conferência de saldo**, como hoje. Bloqueá-las é decisão do proprietário (ver pendências).

## Ativação coordenada (importante)

A data nas telas depende da chave G1:
- `VITE_G1_ACOES=on`: dia em America/Bahia.
- Desligada: dia em UTC, como hoje.

Banco e tela sempre olham o mesmo dia, desde que o 006 seja aplicado junto com a publicação do frontend com a chave ligada. Aplique **fora da janela 21:00–23:59 (Bahia)**, quando as duas datas coincidem. O fechamento automático (`fechamento-portaria-automatico`, agendado para 03:05 UTC = 00:05 Bahia) calcula "hoje" em UTC. Nesse horário as duas datas coincidem, então ele continua fechando o dia certo. A função **não foi alterada** porque fica em `supabase/functions/`, que é implantada automaticamente.

## Arquivos

- SQL candidato: `g1/candidate/sql/006_saldo_portaria.sql`.
- Testes SQL: `g1/tests/sql/run_portaria006.py`, `g1/tests/sql/reset_com006.sh` (opção `com_abertura` para as suítes anteriores).
- Frontend:
  - novos: `src/lib/dataOperacional.ts` (puro) e `src/lib/g1/dataPortaria.ts`;
  - ajustados: `usePortariaStock.ts`, `OpeningBalanceDialog.tsx`, `CashierClosingForm.tsx`, `FechamentoReminder.tsx`, `useCashierSales.tsx`, `dailyAdjustLog.ts`;
  - teste: `src/lib/__tests__/g1-portaria-lote2.test.ts`.

## Testes executados (PostgreSQL 16 em 127.0.0.1, sessão em UTC como no Cloud, dados fictícios)

| Suíte | Resultado | O que valida |
|---|---|---|
| `run_portaria006.py` (nova) | **38/38** | Data Bahia independente do fuso da sessão. Abertura obrigatória: recusa sem deixar rastro, e abertura ou saldo de outro dia não valem. Saldo dentro e acima do disponível, vendas reduzindo o transferível, retorno de carga liberando saldo, saldo por produto, atribuição com e sem retirada. Validações de quantidade, produto, destino, empresa, inativo e papel. Idempotência. Consulta para a tela. **Concorrência:** duas saídas disputando o saldo (só uma passa e nada fica negativo), mesma chave simultânea, saída chegando durante uma venda (espera a trava e vê o saldo consumido). |
| `run_integracao.py` (004) com 006 e abertura fictícia | **40/40** | Sem abertura, 11 verificações falham, como esperado: todas transferem para a carga sem abertura, que é a regra nova. |
| `run_vendas005.py` com 006 e abertura fictícia | **37/37** | |
| `run_permissoes.py` (`G1_004=1`) com 006 e abertura fictícia | **69/69** | |
| `run_security.py` com 006 | **26/27** | A diferença intencional de sempre. |
| `g1-portaria-lote2.test.ts` | **5/5** | Adaptador do Node, rodado com o relógio da máquina em `Asia/Tokyo` e em `UTC`. Inclui 22:30 em Bahia, virada às 03:00 UTC e virada de ano. |

## Não executados

- vitest, tsc, lint e build: sem `node_modules`.
- Navegador isolado: sem PostgREST nem gateway.

## Pendências e limitações

- **Decisão:** a venda de balcão acima do saldo, ou antes da abertura, continua permitida (é a regra atual da tela). Bloquear exige decisão do proprietário, ligada à decisão 3 (reserva de estoque).
- `fechamento-portaria-automatico` usa a data UTC. Está correto no horário agendado, mas uma execução manual entre 21:00 e 23:59 (Bahia) fecharia o dia errado. A alteração recomendada (usar a data Bahia) deve ser revisada e implantada junto com o 006, nunca editada direto em `supabase/functions/`.
- Outras telas fora da portaria ainda calculam "hoje" pelo navegador (pedidos, painéis, relatórios). Isso entra no lote de integração e datas.
- A tela de transferência e a explicação da origem na atribuição ficam no Lote 3.
