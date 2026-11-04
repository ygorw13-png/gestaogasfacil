# Decisões operacionais necessárias — Etapa 3

Lista única das decisões que dependem do proprietário. Enquanto não respondidas, as tarefas dependentes ficam pausadas e as independentes continuam.

## A. Estoque e movimentação de produto

1. **Saída do produto por modalidade.** De onde sai o produto em cada caso: balcão (portaria), entrega avulsa (portaria ou carga do entregador?), venda de carga (carga), ponto de revenda/agregado (carga)?
2. **Momento da baixa.** Quando o estoque é baixado: na saída da carga para o entregador, na confirmação da entrega, ou no acerto? (Hoje a carga não baixa nada e a venda na rua também não.)
3. **Reserva.** Pedido pendente reserva estoque da portaria ou não reserva nada?
4. **Entrega sem vazio.** Cliente que não devolve o vazio na recarga: vira empréstimo/comodato automático, cobrança do casco, ou registro manual?
5. **Devolução, perda e cancelamento.** Como registrar devolução de produto, perda/quebra de casco e cancelamento de venda já entregue (com e sem pagamento recebido)?
6. **Operação retroativa.** Venda lançada em data passada afeta o estoque do dia atual ou do dia informado? (Hoje grava no dia informado.)

## B. Dinheiro e caixa

7. **Quem recebe cada pagamento.** Entregador recebe dinheiro/PIX na rua? O acerto é diário e obrigatório?
8. **Fundo de caixa.** Existe fundo fixo de troco na abertura do dia? Qual valor e de onde sai?
9. **Sangria e suprimento.** Quem autoriza e quais origens existem de fato (portaria, cofre, banco, pessoal)?
10. **Fechamento.** Um único fechamento total por dia? Reabertura exige motivo e quem pode reabrir?
11. **Venda a prazo no caixa.** A venda em promissória conta como "vendido" no dia e o recebimento entra depois como "recebimento de título" (não como nova venda)? — proposta: sim, para não contar duas vezes.

## C. Cascos e parceiros

12. **Comodato.** Empréstimo de casco gera cobrança após quanto tempo? Há limite por cliente?
13. **Agregados e pontos de revenda.** Preço por botijão é fixo por parceiro (já existe `price_p13` em revendedores) e o acerto é por entrega ou periódico?
14. **Vasilhame próprio vs do cliente.** A revenda trabalha com cascos próprios marcados ou vale qualquer casco?

## D. Papéis e permissões (necessária para a Etapa 2)

15. **Matriz operacional.** Proposta a confirmar antes de aplicar no banco:

| Ação | admin | user | entregador |
|---|---|---|---|
| Vendas/pedidos: ver e criar | ✔ | ✔ | só as próprias |
| Editar/cancelar venda | ✔ | ✔ | ✘ |
| Caixa: abrir/fechar/despesas | ✔ | ✔ | ✘ |
| Promissórias: criar/receber | ✔ | ✔ | só criar (venda na rua) |
| Estoque/portaria: movimentar | ✔ | ✔ | ✘ |
| Comissões, frota, configurações, colaboradores | ✔ | ✘ | ✘ |
| Excluir registros históricos | ✔ | ✘ | ✘ |

Confirmar ou ajustar cada linha. Criar papéis novos (gerente, portaria) só se esta matriz não atender.

## E. Custos (necessária para a Etapa 9)

16. **Método de custo.** Custo médio, último custo ou custo por nota de compra?
17. **Frete e impostos.** Entram no custo do produto ou são despesas separadas?

## F. Regras já comprovadas no comportamento atual (referência, não oficialização)

- Portaria zera todo dia e pede saldo remanescente na abertura — **mantida**.
- Toda venda tem tipo (completa/recarga/vasilhame) — **mantida**.
- Venda de balcão pode ser avulsa (sem cliente cadastrado) — **mantida**.
