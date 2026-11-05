# Decisões operacionais — Etapa 3 (v3, 04/11/2026)

## APROVADAS pelo proprietário em 04/11/2026

**1. Origem e movimentação do estoque**
- Venda de balcão consome o estoque da portaria.
- Entrega consome o local de onde o produto efetivamente saiu.
- Saída para entregador transfere da portaria para uma carga identificada; não é venda.
- Entrega concluída consome a carga. Sobra devolvida transfere da carga para o local de retorno.
- Nunca descontar duas vezes o mesmo produto.
- Cheios, vazios e cascos emprestados registrados separadamente, conforme a operação comprovada.

**11. Venda a prazo**
- Registrada na data da venda. Pagamento posterior é recebimento da dívida, não nova venda.
- Fiado não aumenta dinheiro disponível no caixa.
- Recebimentos parciais preservam o saldo restante e o histórico.

**15. Permissões**
- *Administrador:* gestão completa por ações controladas, com motivo e histórico para correções; sem exclusão definitiva de históricos operacionais e financeiros.
- *Operador (user):* criar e operar pedidos; abrir caixa, registrar recebimentos e despesas, fechar caixa; movimentações operacionais de estoque; cadastrar e consultar clientes; ler só as configurações necessárias à operação. **Cancelamento, alteração de preço e estorno continuam pendentes de autorização específica — não liberados.**
- *Entregador:* ver entregas atribuídas e registrar vendas próprias na rua; aceitar, iniciar e concluir só as suas entregas por funções controladas; registrar recebimentos próprios para acerto; consumir e devolver a própria carga por ações controladas; cadastro rápido e consulta de clientes; sem edição livre de pedidos, preços, estoque ou financeiro.
- *Implementação:* entregador vinculado por ID, nunca pelo nome; nada de vínculo automático de históricos por semelhança de nome; aceitar/concluir não concede UPDATE genérico; cada função valida empresa, usuário ativo, atribuição, campos permitidos e transição; operador escolhe cobradores numa lista limitada a ID, nome e situação; restrições aplicadas no banco, inclusive chamadas diretas e RPCs.
- *Contingência:* rollback que restaura vulnerabilidades não é contingência de produção; contenção deve preservar os bloqueios.

## Ainda PENDENTES (não presumidas)
Destino do PIX e periodicidade do acerto (7), reserva de estoque (3), regras e efeitos de cancelamento (5), venda em data passada (6), fechamento/reabertura e acumulado dos parciais (10), e as decisões 4, 8, 9, 12, 13, 14, 16, 17 abaixo.

## Próximas decisões indispensáveis (só estas bloqueiam o próximo lote)
- **A. Autorização de cancelamento, alteração de preço e estorno para o operador** — hoje só o administrador corrige, com motivo; o operador está bloqueado. Opções: manter só admin; liberar ao operador com motivo; liberar ao operador só até um valor/prazo.
- **B. Efeito do cancelamento de venda já concluída (decisão 5)** — a correção do administrador hoje só muda o status e grava histórico, **sem devolver estoque nem desfazer recebimento**. Opções: estorno automático de carga/portaria e recebimento; estorno lançado à parte.
- **C. Pedidos antigos sem vínculo por ID** — os pedidos atuais guardam o entregador só pelo nome; pela regra aprovada eles não serão ligados automaticamente. Opções: reatribuir manualmente os pedidos em aberto na troca; deixar os antigos sem vínculo (o entregador não os verá no app novo).
- **D. Entrega saindo direto da portaria (sem carga)** — hoje a conclusão pelo entregador exige carga aberta com saldo. Confirmar se toda entrega do entregador passa por carga, ou se existe entrega que sai direto da portaria (e quem a registra).

---

## Texto original das 17 perguntas (referência)

Estas regras são do proprietário. Nada aqui foi escolhido pelo sistema: as opções descrevem consequências práticas, sem recomendação. Enquanto uma decisão não é respondida, as tarefas que dependem dela ficam paradas e as independentes continuam.

**Prioridade**
- **Agora** — bloqueia o próximo lote (segurança por papel e vendas/estoque): 15, 1, 2, 11.
- **Em seguida** — necessária antes das Etapas 4 a 6 (estoque, caixa, fiado): 3, 5, 6, 7, 10.
- **Pode esperar** — não bloqueia nada em andamento: 4, 8, 9, 12, 13, 14, 16, 17.

---

## A. Estoque e movimentação

**1. De onde sai o produto em cada tipo de venda?** *(Agora)*
- A) Balcão e entrega avulsa saem da portaria; venda de carga e ponto de revenda saem da carga do entregador. → Exige registrar a carga que sai com o entregador; a portaria só baixa o que vende direto.
- B) Tudo sai da portaria no momento da venda. → Mais simples; a carga do entregador não é controlada separadamente e sobra/falta na rua não aparece.
- C) Outra divisão definida por você.

**2. Quando o estoque é baixado?** *(Agora)*
- A) Na saída da carga para o entregador. → Estoque da portaria cai cedo; o que volta precisa ser devolvido no acerto.
- B) Na confirmação da entrega. → Estoque reflete vendas efetivas; carga em trânsito fica "invisível" até a entrega.
- C) No acerto do entregador. → Baixa só no fim do dia; durante o dia o estoque aparece maior que o real.
- Hoje: a carga não baixa nada e a venda na rua também não.

**3. Pedido pendente reserva estoque?** *(Em seguida)*
- A) Sim. → Evita vender o mesmo botijão duas vezes; pedidos esquecidos prendem estoque até serem cancelados.
- B) Não. → Mais simples; pode faltar produto para pedidos já aceitos.

**4. Recarga sem devolução do vazio.** *(Pode esperar)*
- A) Vira empréstimo (comodato) automático no nome do cliente. → Saldo de cascos por cliente aparece sozinho; exige cliente identificado.
- B) Cobra o casco na hora. → Venda vira "gás completo"; valor muda.
- C) Registro manual pelo operador. → Flexível; depende de disciplina.

**5. Devolução, perda e cancelamento de venda já entregue.** *(Em seguida)*
- A) Cancelamento estorna estoque e caixa automaticamente, com motivo obrigatório. → Histórico fiel; precisa de quem pode cancelar (ligado à decisão 15).
- B) Cancelamento só muda o status; ajustes de estoque e caixa são lançados à parte. → Mais controle manual; risco de esquecer o ajuste.
- Perda/quebra de casco: lançamento próprio (A) ou ajuste genérico de estoque (B).

**6. Venda lançada em data passada afeta qual dia?** *(Em seguida)*
- A) O dia informado (como hoje). → Fechamento daquele dia muda depois de fechado; exige reabertura/motivo.
- B) O dia atual, com a data original só como referência. → Fechamentos antigos ficam intocados; o relatório por data da venda fica diferente do caixa.

## B. Dinheiro e caixa

**7. Quem recebe cada pagamento e como é o acerto?** *(Em seguida)*
- A) Entregador recebe dinheiro/PIX na rua; acerto diário obrigatório. → O caixa do dia só fecha depois de todos os acertos.
- B) Entregador recebe, acerto quando ele voltar (sem obrigatoriedade diária). → Mais flexível; dinheiro fica mais tempo fora do caixa.
- C) Entregador não recebe; tudo é pago na portaria/PIX da empresa. → Acerto só de produto, não de dinheiro.

**8. Fundo de troco na abertura.** *(Pode esperar)*
- A) Valor fixo informado (quanto?). → Diferença do caixa considera o fundo.
- B) Sem fundo fixo. → Caixa começa em zero.

**9. Sangria e suprimento.** *(Pode esperar)*
- Quem autoriza (só admin / admin e user) e quais origens existem de fato (portaria, cofre, banco, pessoal).

**10. Fechamento e reabertura.** *(Em seguida)*
- A) Um único fechamento total por dia; reabrir exige motivo e só admin reabre. → Hoje já existe dia com dois fechamentos totais (10/08); essa regra impediria novos.
- B) Vários fechamentos totais permitidos, o último vale. → Mais flexível; relatórios precisam escolher qual vale.
- Parciais: hoje cada parcial registra o **acumulado do dia até o corte** (não só o intervalo). Confirmar se é isso que você quer ou se o parcial deve mostrar só o período desde o parcial anterior.

**11. Venda em promissória no caixa.** *(Agora)*
- A) Conta como vendido no dia; o recebimento posterior entra como "recebimento de título", não como nova venda. → Vendas não contam duas vezes; o caixa do dia tem uma parte "a receber".
- B) Só conta como venda quando for paga. → Venda do dia fica menor; recebimento vira venda no dia do pagamento.

## C. Cascos e parceiros

**12. Comodato de casco.** *(Pode esperar)* Gera cobrança após quantos dias? Há limite por cliente? Ou nenhum dos dois.

**13. Agregados e pontos de revenda.** *(Pode esperar)*
- Preço por botijão fixo por parceiro (já existe campo de preço P13 em revendedores) ou variável por entrega.
- Acerto por entrega ou periódico (semanal/quinzenal).

**14. Cascos próprios ou qualquer casco.** *(Pode esperar)*
- A) Só cascos próprios marcados. → Exige controle por marca.
- B) Vale qualquer casco. → Saldo de cascos é só por quantidade.

## D. Papéis e permissões

**15. Matriz de acesso por papel.** *(Agora — bloqueia a Etapa 2 por papel)*

Usa só os papéis que existem hoje. Proposta para confirmar ou ajustar linha a linha (não aplicada):

| Linha | Ação | admin | user | entregador |
|---|---|---|---|---|
| 15.a | Vendas/pedidos: ver e criar | ✔ | ✔ | só as próprias |
| 15.b | Editar/cancelar venda | ✔ | ✔ | ✘ |
| 15.c | Caixa: abrir/fechar/despesas | ✔ | ✔ | ✘ |
| 15.d | Promissórias: criar/receber | ✔ | ✔ | só criar (venda na rua) |
| 15.e | Estoque/portaria: movimentar | ✔ | ✔ | ✘ |
| 15.f | Comissões, frota, configurações, colaboradores | ✔ | ✘ | ✘ |
| 15.g | Excluir registros históricos | ✔ | ✘ | ✘ |

Pontos que a validação revelou e precisam de resposta junto com a matriz:
- **15.b × app do entregador:** hoje o entregador atualiza o pedido ao aceitar, sair e entregar (com forma de pagamento). Se "editar venda = ✘" valer literalmente, o app do entregador para. Opções: permitir só "atualizar status da própria entrega"; ou passar essas ações por uma função controlada.
- **15.a "só as próprias":** o pedido guarda o entregador pelo **nome**, não por identificador. Homônimos ou troca de nome quebram o filtro. Opções: aceitar o vínculo por nome; ou adicionar o vínculo por cadastro antes de aplicar essa linha.
- **Cobradores para o papel user:** a lista de colaboradores hoje só é visível para admin. Quem é "user" abre "Nova Promissória" e não vê nenhum cobrador. Opções: liberar só a leitura de nome/situação para user; ou manter e só admin atribui cobrador.
- **Entregador e clientes/venda na rua:** o app do entregador cadastra cliente e registra venda na rua. Confirmar se isso continua permitido (afeta 15.a e 15.e).
- **Leitura de configurações:** taxa de entrega e estoque mínimo são lidos por telas de todos os papéis. Confirmar se "15.f só admin" é para alterar (leitura liberada) ou também para ler.
- Papéis novos (gerente, portaria) só se esta matriz não atender — não serão criados sem sua decisão.

## E. Custos

**16. Método de custo.** *(Pode esperar — bloqueia só a Etapa 9)*
- A) Custo médio. → Suaviza variações de compra.
- B) Último custo. → Margem reage rápido a reajustes.
- C) Custo por nota de compra (lote). → Mais exato; exige lançar cada nota.

**17. Frete e impostos.** *(Pode esperar)*
- A) Entram no custo do produto. → Margem por botijão mais realista.
- B) Despesas separadas. → Margem por produto fica maior; despesas aparecem no financeiro.

## F. Regras já mantidas (referência, não oficialização)
- Portaria zera todo dia e pede saldo remanescente na abertura.
- Toda venda tem tipo (completa/recarga/vasilhame).
- Venda de balcão pode ser avulsa (sem cliente cadastrado).
- O valor gravado no pedido é o **total da venda** (não unitário) — é como o formulário grava e como caixa, comissões e recibo leem.
