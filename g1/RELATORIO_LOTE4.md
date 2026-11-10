# G1 — Lote 4: caminhos diretos, fila offline, caixa e contenção

Data: 10/11/2026 (UTC). **Situação: candidato.** Nada publicado, nenhuma migração aplicada no Cloud, nenhum draft aceito,
nenhum registro operacional usado ou alterado. Toda verificação usou PostgreSQL descartável em 127.0.0.1 com dados fictícios.
**Gateway hospedado do Lovable Cloud: continua NÃO verificado** (pendência G0.1 mantida).

Encaminhamentos aplicados: A (operador não cancela, não altera preço, não estorna), C (troca de entregador explícita, por ID, com motivo),
D (origem física real: produto que sai da portaria vai para a carga antes do consumo, sem baixa dupla). **Decisão B continua pendente**:
nenhum estorno automático; venda concluída não é cancelada. **Decisão 13 (agregados/pontos) pendente**: venda "a acertar" é recusada.

## 1. O que mudou

### 1.1 SQL candidato `g1/candidate/sql/005_caminhos_diretos.sql` (sobre 002+003+004)
Gravações diretas que ainda contornavam carga, dívida e recebimento — **todas reproduzidas antes da correção** no banco descartável:

| Caminho | Antes | Depois |
|---|---|---|
| H1 inserir pedido já concluído / atribuído | venda sem baixa e sem recebimento | recusado; pedido novo só nasce na fila |
| H2 concluir pedido por atualização direta | entrega concluída sem consumir carga nem registrar recebimento | recusado (também para admin); só pela ação de conclusão |
| H3 atribuir/trocar/devolver entregador por atualização direta (inclusive pelo nome) | contornava C e a carga | recusado; só `atribuir_entrega` / `reatribuir_entrega` (ID + motivo) |
| H4 inserir promissória já paga ou ligada a venda | pagamento sem recebimento | recusado; promissória avulsa nasce em aberto |
| H5 trocar forma de pagamento/produto/cliente de venda concluída | recebimento e estoque deixam de bater | recusado (decisão B) |
| H6 baixa "venda" direta na portaria | baixa sem pedido nem recebimento | recusado; só `venda_portaria` |
| Produto já transferido para a carga (entrega avulsa) | podia ser trocado | recusado (verifica `carga_movimentos`, porque `orders.carga_id` fica vazio na transferência avulsa) |

Continua funcionando: pedido novo na fila, atribuído → em entrega, edição de endereço/observação, as ações controladas.
`_registrar_pagamento` e `venda_portaria` marcam o contexto controlado e devolvem o anterior.

### 1.2 Telas (somente com `VITE_G1_ACOES=on`; desligada = caminho antigo, inalterado)
- **Fila offline:** gravação direta antiga em vendas, estoque, carga, dívidas ou recebimentos **não é enviada** (nem com "enviar mesmo assim");
  aparece como "Não enviado", com o motivo e um aviso próprio — não é mais chamada de "possível duplicado". Ação controlada com chave nunca é
  descartada sozinha ao exceder tentativas. Novas gravações diretas nessas tabelas não entram na fila.
- **Caixa da portaria (Nova Venda):** o formulário só fecha depois que o banco confirma; toque duplo = um envio; reenvio usa a mesma chave
  (sem duplicar). Antes, o formulário fechava antes de gravar.
- **Agregado / ponto "a acertar":** recusado com mensagem, sem gravar venda nem ficha do parceiro (antes, a ficha era gravada mesmo com a
  venda recusada pelo banco). Ponto que paga no ato: a ficha é gravada **depois** da venda confirmada.
- **Cancelamento:** as telas não prometem mais "estorno automático"; venda cancelada aparece como "Cancelada".

### 1.3 Laboratório
- `reset_com004.sh` / `reset_com005.sh` agora **param** se o SQL falhar (antes o filtro de mensagens escondia o erro).
- `g1/tests/browser/build_iso_fe.sh` (cópia isolada do app, recusa se sobrar endereço do backend real) e `lab_reset.sh` (banco + PostgREST + gateway + app locais).

## 2. Validação (rodada neste lote)

| Suíte | Resultado |
|---|---|
| SQL caminhos diretos (`run_caminhos.py`, banco 002+003+004+005) | **43/43** |
| SQL integração (`run_integracao.py`, com 005) | **40/40** |
| SQL permissões (`G1_004=1 run_permissoes.py`, com 005) | **69/69** |
| SQL segurança (`run_security.py`, com 005) | **26/27** — diferença intencional: entregador só lê as próprias entregas |
| SQL contenção com 005 (`run_contencao_005.py`, novo) | **22/22** |
| Unitários `vitest run src/lib` (inclui 7 novos da fila) | **32/32** |
| Navegador lote 3 (regressão sobre 005, cópia reconstruída) | **14/14** |
| Navegador lote 4 (`g1_lote4_browser.py`, novo) | **17/17** |

Navegador lote 4 (backend real isolado, `shots_lote4/`): L01–L02 venda rápida com resposta perdida → erro na tela, formulário aberto, reenvio
grava uma venda, um recebimento e uma baixa · L03 duas telas atribuem o mesmo pedido ao mesmo tempo → um entregador, uma saída da portaria, a
outra tela mostra o erro · L04 fila antiga com gravação direta → nada enviado, "Não enviado" com motivo, sem botão de envio · L05 gravação
direta pela API com sessão real (forma de pagamento de venda concluída, venda já entregue, promissória quitada, baixa de venda na portaria,
entregador se atribuindo) → recusadas, nada mudou · L06–L08 contenção (abaixo) · L09 cancelamento de venda concluída pelo admin **pela tela**
→ recusado com aviso da decisão B, venda intacta, sem histórico falso · L10 painel com os cinco quadros · L12 caixa com toque duplo e resposta
perdida → uma gravação, formulário aberto; reenvio fecha sem duplicar · L13 agregado "a acertar" → recusado, nada gravado · L11 nenhuma
chamada ao backend real.

Testes legados de `src/` fora de `src/lib`: as mesmas 7 falhas antigas do template (não relacionadas).

## 3. Contenção revisada (`004_contencao.sql`, compatível com 005)
Pausa só as ações do entregador; **não reabre nenhuma gravação direta**. Verificado com o 005 em vigor (`run_contencao_005.py` e L06–L08):
- entregador não aceita, não conclui, não vende na rua, e as tentativas diretas são recusadas sem rastro;
- a portaria conclui pelo entregador atribuído: carga do pedido zerada, 1 recebimento, sem segunda baixa da portaria, preço intacto;
  a prazo gera a promissória (sem recebimento);
- isolamento entre empresas e bloqueio de contas inativas continuam;
- saldos conferidos: carga, saídas da portaria, recebimentos, promissórias e vendas na rua batem antes, durante e depois;
- ao desfazer: conclusão atrasada do entregador sobre pedido já concluído pela portaria é recusada (nada novo); venda na rua guardada na fila,
  reenviada duas vezes com a mesma chave, entra uma vez.

## 4. Limitações e pendências (não resolvidas aqui)
- **Gateway hospedado do Cloud** não verificado; **aprovação de produção** pendente.
- **Decisão B** (estorno) e **decisão 13** (preço/acerto de agregado e ponto) pendentes — por isso as recusas acima.
- Saldo da portaria não é conferido na transferência para a carga.
- A ficha do ponto que paga no ato é gravada logo depois da venda, não na mesma transação; se falhar, a tela avisa e a venda permanece.
- A conclusão atrasada do entregador é recusada com a mensagem "Chave já usada em outra ação" (correta, mas pouco clara para o usuário).
- Ordem de publicação: com 005 no banco, o app antigo (inclusive o instalado nos celulares) deixa de concluir e atribuir por gravação direta.
  O 005 deve ir junto com o frontend com `VITE_G1_ACOES=on`; o que estiver na fila antiga aparece como "Não enviado" para ser relançado.
- "Iniciado" (atribuído → em entrega) pelo operador continua por atualização direta (não mexe em estoque nem dinheiro).

## 5. Arquivos deste lote
SQL: `g1/candidate/sql/005_caminhos_diretos.sql`. Testes SQL: `run_caminhos.py`, `run_contencao_005.py`, `reset_com005.sh` (+ correção em `reset_com004.sh`).
Navegador: `g1_lote4_browser.py`, `seed_lote4.sql`, `lab_reset.sh`, `build_iso_fe.sh`, `results_lote4.json`, `results_lote3_sobre005.json`, `shots_lote4/`.
App: `src/lib/g1/flag.ts`, `src/lib/g1/acoes.ts`, `src/lib/offline/queue.ts`, `src/hooks/useOfflineSync.ts`, `src/components/offline/{OfflineBanner,OfflineSyncToasts}.tsx`,
`src/pages/offline/StatusOffline.tsx`, `src/hooks/useCashierSales.tsx`, `src/pages/entrance/hooks/{useSaleForm,useCancelarVenda}.ts`,
`src/pages/entrance/components/sales/{CancelSaleButton,RecentSalesTable}.tsx`, `src/pages/entrance/SalesHistory.tsx`, tipos de venda,
`src/lib/offline/__tests__/queue-g1.test.ts`.
