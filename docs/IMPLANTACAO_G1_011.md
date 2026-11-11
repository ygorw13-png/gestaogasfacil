# Implantação G1 011 — decisão B (reversão controlada) — 11/11/2026

Regra aprovada pelo proprietário (arquivo enviado em 11/11/2026). Escopo desta entrega: cancelamento de pedido,
devolução integral, troca integral por problema e correção de duplicidade. Devolução parcial: recusada com explicação.
Fora: diferença de preço na troca, decisão 13 (agregados/pontos), novas regras de preço/comissão/fechamento.

## Banco
- Cópia de segurança antes da mudança: `pg_dump -Fc` do esquema `public` (49 tabelas com dados), restaurada com sucesso
  num banco descartável local para conferência (143 pedidos / R$ 7.290,00, 54 promissórias, 11 clientes, 204 movimentos).
  Arquivo privado do projeto: `/mnt/documents/.lovable/backups/gasfacil_antes_011_20261111T1448Z.dump`.
- Aplicado: `drizzle/migrations/0010_g1_011_reversao_controlada.sql` = `g1/candidate/sql/011_reversao_controlada.sql`
  (diferença só na quebra de linha final). As 15 funções criadas/substituídas têm `md5(pg_get_functiondef)` igual ao laboratório.
- Dados depois: mesmas contagens e somas; 0 reversões. Nenhum registro existente alterado.

## Regras implementadas (backend, válidas também em chamadas diretas)
- Só administrador autoriza (cancelamento, devolução, troca, duplicidade, recusa). Operador e entregador solicitam;
  entregador só para entregas/vendas suas e só registra recolhimento na própria carga aberta.
- Autorização grava numa transação os efeitos calculados; físico e financeiro ficam pendentes até confirmados.
- Cancelamento antes da entrega: sem saída → estoque parado; produto na carga → continua na carga; pagamento → reembolso pendente.
- Devolução integral: espera o que a venda gravou (cheios, vazio do cliente, vasilhame vendido, comodato). Item intacto volta ao
  estoque do local real (portaria ou carga); com problema, usado ou sem condição → conferência (fora do disponível).
- Troca: recolhido sempre em conferência; substituto sai do local real; sem nova venda, promissória ou recebimento.
- Financeiro: "a reembolsar" ≠ "reembolsado". Dinheiro: caixa, entregador (desconta no acerto pendente) ou cobrador; já acertado →
  sai do caixa e o acerto original fica intacto. PIX/cartão: conta da empresa, só realizado com referência. Promissória: saldo
  cancelado por ajuste vinculado; recebimentos preservados viram reembolso pendente.
- Duplicidade: exige a venda válida; corrige só a baixa de hoje e carga aberta; dia encerrado não é reescrito (fica registrado);
  sem pagamento duplicado → recebimento anulado (preservado, fora dos totais), sem reembolso; bloqueia se já entrou em acerto.
- Ajustes na data operacional (America/Bahia); venda original nunca reescrita; chave de reenvio por conteúdo; travas no pedido.

## Testes (dados fictícios, banco descartável 127.0.0.1)
- `g1/tests/sql/run_reversao011.py`: 67/67 (`result_reversao011_lab.json`).
- Regressões com 011: caminhos010 43/43, acerto008 43/43, regressao010 14/14, carga007 31/31, portaria006 38/38,
  integracao 40/40 (expectativa de mensagem B atualizada), permissoes 69/69, security 26/27 (mesma falha já presente no 010).
- Navegador isolado (`g1/tests/browser/g1_011_browser.py`): 10/10 — solicitação do operador sem efeitos, parcial indisponível,
  autorização, retorno físico na portaria, reembolso pelo caixa, promissória R$125/R$40, andamento na venda, recusa, painel, sem acesso a servidores reais.
- Vitest das regras de tela: `src/lib/g1/__tests__/reversao.test.ts` 6/6; suítes `src/lib/__tests__` 56/56.

## Limites conhecidos
- Vendas registradas antes das ações controladas (sem vínculo de estoque/pagamento) têm devolução/duplicidade bloqueadas com explicação.
- Situação fiscal: não há documento fiscal vinculado no sistema; reversão operacional não cancela nada fiscal.
- Não testado no navegador: troca, duplicidade, fluxo do entregador na carga (cobertos só no SQL).
