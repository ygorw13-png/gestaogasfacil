# Lote 3: telas da carga

## O que mudou

| # | Problema | Correção |
|---|---|---|
| 1 | Nenhuma tela chamava `carga_saida` nem `carga_devolver`, e não havia onde ver a carga. A venda na rua e a conclusão só funcionavam se a atribuição tivesse marcado "sai da portaria". | **Portaria > Cargas dos Entregadores** (`/entrance/cargas`): saldo de cada carga aberta por produto (cheios e vazios recolhidos), **saída avulsa** portaria → carga, **devolução total ou parcial** e **histórico** dos últimos 7 dias, filtrável por entregador. |
| 2 | O entregador não via a própria carga. | **Minha Carga** (`/entregador/carga`, na barra do app e no menu): saldo, movimentos de hoje e ontem e "Devolver sobra na portaria". A rota foi liberada no `RoleGuard` do entregador; `/entrance/cargas` continua bloqueada para ele. |
| 3 | `carga_devolver` comparava o produto em texto cru (`'Botijão P13'` falhava no CHECK da portaria) e não prendia a chave ao conteúdo. | SQL 007: produto normalizado, chave com resumo do conteúdo, limite de cheios e vazios ao que está na carga (o entregador não transforma a devolução em entrada livre de estoque), data operacional e registro identificado quando é o entregador que devolve. |
| 4 | **Venda de vasilhame na rua baixava um CHEIO da carga.** | SQL 007: baixa um vazio recolhido na carga (mesma regra da portaria) e recusa quando não há vazio. Os cheios ficam intactos. |
| 5 | Na atribuição, a opção "sai da portaria" não mostrava saldo nem consequência. | O diálogo pergunta **de onde sai o produto**: "Já está na carga dele", com o saldo atual e um aviso se não cobrir o pedido, ou "Sai agora da portaria", com o disponível, aviso de falta de abertura ou de saldo e botão bloqueado. A baixa dupla é impedida no banco: a portaria baixa só na transferência e a entrega baixa só a carga. |
| 6 | A confirmação da atribuição mostrava o **ID** do entregador. | Mostra o nome (e atualiza o nome na lista). A atribuição usa a chave da tela, presa ao conteúdo, e o diálogo só fecha depois da gravação; em erro, mostra o motivo. |
| 7 | Venda na rua: chave trocada só no sucesso, sem relação com o conteúdo; nenhuma indicação de carga. | Chave presa ao conteúdo (a fila offline reenvia com a mesma chave). Trava contra toque duplo. Mostra "Na sua carga: N" e bloqueia o envio quando a carga **conhecida** (online, consulta bem-sucedida) não cobre. Offline ou com falha na consulta, o servidor confere no envio. |
| 8 | Quem confirmava a abertura depois de uma venda no dia gravava só "ajuste": o dia continuava sem abertura, o aviso não sumia e a saída para a carga ficava bloqueada. | `OpeningBalanceDialog` sempre grava o marcador de abertura (deltas zero) quando nenhuma linha de abertura foi gravada. A rotina não muda. |

Leituras: `carga_resumo` e `carga_historico` (SQL 007, somente leitura). Operador e admin consultam qualquer entregador da empresa; o entregador, só a própria carga. Outro ID é recusado, e entregador de outra empresa também.

## Arquivos

- SQL: `g1/candidate/sql/007_carga_telas.sql`. Testes: `g1/tests/sql/run_carga007.py`, `reset_com007.sh`.
- Novos:
  - `src/hooks/useCarga.ts`;
  - `src/components/carga/{SaidaCargaDialog,DevolucaoCargaDialog,CargaHistoricoTabela}.tsx`;
  - `src/pages/entrance/Cargas.tsx`, `src/pages/entregador/MinhaCarga.tsx`.
- Alterados:
  - atribuição: `AssignOrderDialog.tsx`, `OrdersList.tsx`, `useOrderMutations.ts`;
  - venda na rua e abertura: `VendaRua.tsx`, `OpeningBalanceDialog.tsx`;
  - rotas e menus: `App.tsx`, `components/auth/RoleGuard.tsx`, `EntregadorLayout.tsx`, `EntregadorNavigation.tsx`, `navigation-config.tsx`.

## Testes executados (PostgreSQL 16 em 127.0.0.1, sessão UTC, dados fictícios)

| Suíte | Resultado | Fluxos |
|---|---|---|
| `run_carga007.py` (nova) | **31/31** | Saldo após saída. Visibilidade por papel e empresa. Venda na rua consome a carga do próprio entregador, inclusive o vazio recolhido. Venda de vasilhame consome vazio e não cheio. Devolução parcial e total (a carga diminui e a portaria aumenta o mesmo tanto). Devolução pelo entregador. Limites de cheios e vazios. Produto com nome livre. Data operacional. Reenvio com o mesmo e com outro conteúdo. Histórico com cliente. Concorrência: duas devoluções, e devolução contra venda na rua, disputando a mesma carga (só uma passa, sem saldo negativo). |
| `run_portaria006.py` com 007 | **38/38** | |
| `run_integracao.py`, `run_vendas005.py`, `run_permissoes.py` (`G1_004=1`) com 007 e abertura fictícia | **40/40, 37/37, 69/69** | |
| Sintaxe dos 16 arquivos TS/TSX do lote | 0 erros | Na checagem parcial de tipos (pacotes como `any`), sobram só falsos positivos do ambiente sem tipos. |

## Não executados

- Telas no navegador (saída, devolução, atribuição, Minha Carga): sem `node_modules`, build, PostgREST nem gateway nesta sessão. Os fluxos de tela estão **implementados, mas não exercitados**.
- vitest, tsc e lint do projeto.

## Pendências

- `useEntregadoresApp` lista quem tem `profiles.role = 'entregador'`; o banco exige o papel em `user_roles`. Uma conta com só um dos dois aparece na lista mas é recusada pelo banco, com mensagem clara. É preciso alinhar a origem do papel (lote de usuários e permissões).
- Encerrar a carga (status `encerrada`) acontece no acerto (Lote 4).
- Venda na rua offline com carga insuficiente: o servidor recusa na sincronização. Mostrar isso claramente na fila é o lote offline.
