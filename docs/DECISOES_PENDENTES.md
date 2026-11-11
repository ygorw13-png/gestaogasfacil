# Decisões pendentes (lista curta)

Conferidas contra `g1/DECISOES_OPERACIONAIS.md` e o `HANDOFF_CLAUDE.md`; nenhuma delas foi respondida até 10/11/2026. O sistema **não presume** nenhuma: onde dependem dela, a operação é recusada com mensagem clara ou o valor aparece como "a definir".

## Atualização de continuidade G1 009

A decisão de bloquear venda sem abertura/saldo foi implementada no candidato 009 e validada 14/14
em PostgreSQL isolado. PIX/cartão na conta da empresa e acerto diário configurável são decisões já
recuperadas, com implementação pendente. Não solicitar essas respostas novamente.
O cancelamento B continua pendente e bloqueado. O restante deste documento é referência histórica.

## Bloqueiam a próxima entrega (retrato anterior)

1. **Destino de PIX e cartão; periodicidade do acerto (decisão 7).** Quando o cliente paga por PIX ou cartão ao entregador (ou ao cobrador), o valor cai na conta da empresa ou na do entregador? O acerto é diário e obrigatório?
   - Hoje: esses valores ficam "destino a definir" e não entram no dinheiro a entregar.
2. **Cancelamento de venda concluída (decisão 5 / B).** O cancelamento estorna estoque e dinheiro automaticamente, ou só muda o status com ajustes lançados à parte?
   - Hoje: o cancelamento é bloqueado no banco.
3. **Venda de balcão sem abertura ou acima do saldo da portaria.**
   - Hoje: é permitida, como a tela já fazia (só a transferência para a carga exige abertura e saldo). Quer bloquear também a venda?

## Necessárias em seguida (não bloqueiam o que já foi feito)

- **6.** Venda em data passada e dias fechados. Hoje é recusada com G1 ligado.
- **10.** Fechamento, reabertura e parciais. Existem dias com dois fechamentos totais.
- **13.** Agregados e pontos: preço e acerto. Hoje a venda a prazo sem valor é recusada com G1 ligado.
- **3.** Reserva de estoque por pedido pendente.
- **8 / 9.** Fundo de troco, sangria e suprimento.
- **4, 12, 14.** Recarga sem devolução de casco, comodato e cascos próprios.
- **16, 17.** Método de custo, frete e impostos. Bloqueiam só lucro e margem, que continuam não exibidos.
