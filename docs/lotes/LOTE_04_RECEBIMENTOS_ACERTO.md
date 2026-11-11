# Lote 4: promissórias, recebimentos e acerto dos entregadores

## Problemas encontrados e correções

| # | Problema | Correção |
|---|---|---|
| 1 | Recebimento de promissória com **chave nova a cada clique**: uma resposta perdida seguida de nova tentativa registrava **dois recebimentos**. | Chave presa ao conteúdo (`PaymentDialog` + SQL 008). Reenvio igual devolve o mesmo recebimento; valor diferente com a mesma chave é recusado. |
| 2 | Com G1, pagamento com "Cartão de Crédito/Débito" **falhava** (a forma não era reconhecida). | `formaRecebimento` normaliza acento e caixa. "Transferência Bancária" continua sem regra (decisão 7) e a tela avisa antes de enviar. |
| 3 | Promissórias **parciais sumiam** das abas; o diálogo sugeria o **valor cheio**; a lista e a **cobrança por WhatsApp** usavam o valor cheio. | Parcial aparece em "pendentes". O diálogo mostra valor, já recebido e saldo, e sugere o saldo. Tabelas e mensagem de cobrança usam o **saldo em aberto**. |
| 4 | Nota vencia **no próprio dia** do vencimento, porque `new Date("AAAA-MM-DD")` é meia-noite UTC, ou 21h do dia anterior em Bahia. O painel tinha o mesmo erro. | Comparação por data operacional (America/Bahia); o atraso em dias foi corrigido. |
| 5 | No caminho antigo, um pagamento parcial marcava a nota como **paga**, perdendo o saldo. | O caminho antigo soma ao já pago e só quita quando cobre o valor. |
| 6 | Cobrador escolhido **por nome**; o operador via a lista vazia em alguns casos; criação manual por gravação direta. | Cobrador **por ID** (`listar_cobradores`). `atribuir_cobrador` e `criar_promissoria_manual` são ações controladas, com reenvio seguro e histórico da criação manual. Uma nota parcial continua "parcial" ao receber cobrador. |
| 7 | Não se sabia **quem recebeu** nem **onde está** o dinheiro. | `recebimentos.destino` + `responsavel_id`: `caixa`, `entregador`, `cobrador` ou `nao_informado` (PIX e cartão). Dinheiro de entrega ou venda na rua fica com o entregador até o acerto, **inclusive quando a portaria registra a conclusão**. O recebimento de título pode ser marcado como "recebido pelo cobrador". |
| 8 | O **acerto** era só uma soma na tela: pedidos por forma combinada, sem gravar nada, presumindo que "PIX/cartão já caem direto na empresa". | **Acerto registrado** (`registrar_acerto`): confere o dinheiro em espécie pendente com o entregador contra o valor entregue. Diferença exige motivo e fica "divergente". Os recebimentos acertados ficam vinculados (`acerto_id`) e não entram de novo. Um acerto por vez por entregador; reenvio seguro. `acertos_entregador` deixa de aceitar gravação direta. PIX e cartão aparecem **só como informação**, sem entrar no valor a entregar e sem vínculo, até a decisão 7. |
| 9 | O painel contava PIX e cartão como "aguardando acerto" e chamava de "conferido" o resto. | Quadros separados por significado: **no caixa**, **em espécie aguardando acerto** (entregador ou cobrador), **PIX/cartão com destino a definir** e **de títulos**. A tela de acerto lista quem está com dinheiro (`dinheiro_aguardando_acerto`). |

## Arquivos

- SQL: `g1/candidate/sql/008_recebimentos_acerto.sql`. Testes: `g1/tests/sql/run_acerto008.py`, `reset_com008.sh`.
- Frontend:
  - promissórias: `usePromissoryNotes.ts`, `useCollectors.ts`, `types.ts`, `PaymentDialog.tsx`, `NewPromissoryDialog.tsx`, `AssignPromissoryDialog.tsx`, `CollectorSection.tsx`, `PendingPromissoriesTable.tsx`, `AssignedPromissoriesTable.tsx`, `ClientPromissoryDialog.tsx`, `Promissory.tsx`;
  - acerto: `AcertoEntregadores.tsx` (o resumo antigo fica para quando o G1 estiver desligado) e o novo `components/acerto/AcertoControlado.tsx`;
  - painel e regras: `orderMetrics.ts`, `OverviewStats.tsx`, `useDashboardData.ts`, `lib/g1/acoes.ts`;
  - testes: `__tests__/g1-recebimentos-lote4.test.ts` (novo) e `g1-etapa1.test.tsx` (fixture do painel com `forma`).

## Testes executados (PostgreSQL 16 em 127.0.0.1, sessão UTC, dados fictícios)

| Suíte | Resultado | Fluxos |
|---|---|---|
| `run_acerto008.py` (nova) | **43/43** | Ver detalhamento abaixo. |
| Regressões com 008 | 006 **38/38**; 007 **31/31**; 004 **40/40**; 005 **37/37**; permissões **69/69**; segurança **26/27** (a diferença intencional) | |
| `g1-recebimentos-lote4.test.ts` | **6/6** | Pelo adaptador do Node (não pelo vitest): destino derivado, PIX fora do dinheiro, acertado entra no caixa, título com cobrador, saldo parcial e vencimento. |

Detalhamento de `run_acerto008.py`:
- Promissória manual: sem venda nem recebimento, com histórico.
- Cobrador por ID: outra empresa e nota quitada são recusadas; parcial continua parcial.
- Recebimentos: parcial, quitação com dois recebimentos preservados, acima do saldo, resposta perdida reenviada (um recebimento só), mesma chave com outro valor, cobrador, PIX e chamada antiga com 4 argumentos.
- **Cenário 2:** venda a prazo, recebimento parcial e quitação. Continua 1 venda de 250, com 2 recebimentos somando 250.
- Destino do dinheiro: balcão no caixa; rua e entrega concluída pela portaria com o entregador; PIX não informado.
- Acerto: prévia, valor exato, diferença sem e com motivo, nada a acertar, sem dupla inclusão, reenvio, conteúdo diferente, aguardando acerto, cobrador, papel, gravação direta bloqueada, outra empresa e leitura pelo entregador.
- **Cenário 1 completo:** abrir 20, transferir 5, vender 2 na rua, devolver 3, acertar. Portaria fica em 98 (abertura fictícia de 100), carga em 0, acerto conferido e nada pendente.
- Concorrência: dois acertos simultâneos e dois recebimentos que estourariam o saldo.

## Não executados

- Telas (promissórias, recebimento, acerto) em navegador: sem build, PostgREST nem gateway.
- vitest, tsc e lint.

## Pendente: uma pergunta objetiva (decisão 7)

**Quando o cliente paga por PIX ou cartão ao entregador (ou ao cobrador), o dinheiro cai na conta da empresa ou na conta/maquininha do próprio entregador?** Se for na da empresa, esses valores passam a ser marcados como recebidos pela empresa. Se for na do entregador, entram no valor a entregar no acerto. Também falta saber se o acerto é diário e obrigatório.

Também ficam fora deste lote:
- prestação de contas do **cobrador**: hoje aparece em "aguardando", mas a ação de acerto do cobrador não foi criada (segue o mesmo modelo quando a regra estiver clara);
- encerramento da carga;
- correção de acerto já registrado: hoje imutável; o caminho seria uma correção administrativa com motivo.
