/**
 * Regras únicas de leitura de pedidos para indicadores e relatórios.
 *
 * `orders.price` é o VALOR TOTAL da venda (não unitário): é o que o
 * formulário grava em "Valor da venda", o que o recebimento substitui
 * e o que caixa, comissões e recibo já usam. Multiplicar pela quantidade
 * contaria em dobro.
 */
export interface OrderLike {
  price?: number | string | null;
  quantity?: number | string | null;
  status?: string | null;
}

/** Pedidos que entram nos indicadores: todos exceto cancelados. */
export const isCountedOrder = (o: OrderLike) => o.status !== "cancelled";

/** Valor da venda (total gravado). */
export const orderTotal = (o: OrderLike) => Number(o.price) || 0;

/** Soma de valor dos pedidos contabilizados. */
export const sumRevenue = (orders: OrderLike[]) =>
  orders.filter(isCountedOrder).reduce((s, o) => s + orderTotal(o), 0);

/** Estados de pedido ainda em andamento (não é venda concluída). */
export const PENDING_STATUSES = ["pending", "assigned", "accepted", "delivering", "scheduled"];
/** Estados de venda concluída. */
export const DONE_STATUSES = ["completed", "delivered"];

export interface NoteLike {
  value?: number | string | null;
  paid_amount?: number | string | null;
  status?: string | null;
  paid_at?: string | null;
}

/**
 * Separa pedidos pendentes, vendas concluídas, o que entrou em dinheiro/PIX/cartão
 * e o que ficou a receber. Venda a prazo conta como venda no dia, mas não como
 * dinheiro recebido; o pagamento posterior é recebimento de título, não venda nova.
 */
export function summarizeFlow(
  orders: (OrderLike & { payment_method?: string | null })[],
  notes: NoteLike[],
  isToday: (iso: string) => boolean
) {
  const pend = orders.filter((o) => PENDING_STATUSES.includes(String(o.status)));
  const done = orders.filter((o) => DONE_STATUSES.includes(String(o.status)));
  const aPrazo = done.filter((o) => o.payment_method === "promissoria");
  const semForma = done.filter((o) => !o.payment_method);
  const sum = (l: OrderLike[]) => l.reduce((s, o) => s + orderTotal(o), 0);
  const open = notes.filter((n) => n.status !== "paid" && n.status !== "cancelled");
  const pagosHoje = notes.filter((n) => n.paid_at && isToday(n.paid_at));
  return {
    pendentes: { count: pend.length, value: sum(pend) },
    concluidas: { count: done.length, value: sum(done) },
    vendidoAPrazo: sum(aPrazo),
    recebidoNaVenda: sum(done) - sum(aPrazo) - sum(semForma),
    semFormaRegistrada: sum(semForma),
    recebidoDeTitulos: pagosHoje.reduce((s, n) => s + (Number(n.paid_amount) || 0), 0),
    aReceber: open.reduce((s, n) => s + Math.max(0, (Number(n.value) || 0) - (Number(n.paid_amount) || 0)), 0),
  };
}

export interface RecebimentoLike {
  valor: number | string;
  origem: string;
  order_id?: string | null;
  acerto_id?: string | null;
  criado_em: string;
  /** dinheiro | pix | cartao | outros */
  forma?: string | null;
  /** caixa | entregador | cobrador | nao_informado (SQL 008; vazio = linha anterior, regra derivada) */
  destino?: string | null;
}

/** Onde o valor está. Mesma regra de public._destino_efetivo (SQL 008). */
export function destinoEfetivo(r: Pick<RecebimentoLike, "destino" | "forma" | "origem">): "caixa" | "entregador" | "cobrador" | "nao_informado" {
  if (r.destino === "caixa" || r.destino === "entregador" || r.destino === "cobrador" || r.destino === "nao_informado") return r.destino;
  if ((r.forma ?? "dinheiro") !== "dinheiro") return "nao_informado";
  return r.origem === "entrega" || r.origem === "venda_rua" ? "entregador" : "caixa";
}

export interface NotaPainel extends NoteLike {
  due_date?: string | null;
  order_id?: string | null;
}

/**
 * Painel do dia (G1). Separa: vendas concluídas, recebido hoje, saldo a
 * receber, saldo vencido e divergências.
 *
 * Entrega concluída NÃO prova pagamento: "recebido" só soma recebimentos
 * registrados. Sem esse registro (`recebimentos = null`), o recebido fica
 * "não comprovado" e a forma combinada aparece apenas como informação.
 */
export function summarizePainel(args: {
  ordersHoje: (OrderLike & { id?: string; payment_method?: string | null })[];
  notas: NotaPainel[];
  recebimentosHoje: RecebimentoLike[] | null;
  divergenciasHoje: { esperado: number | string; recebido: number | string }[] | null;
  hoje: string; // AAAA-MM-DD local
}) {
  const { ordersHoje, notas, recebimentosHoje, divergenciasHoje, hoje } = args;
  const done = ordersHoje.filter((o) => DONE_STATUSES.includes(String(o.status)));
  const sum = (l: OrderLike[]) => l.reduce((s, o) => s + orderTotal(o), 0);
  const abertas = notas.filter((n) => n.status !== "paid" && n.status !== "cancelled");
  const saldo = (n: NotaPainel) => Math.max(0, (Number(n.value) || 0) - (Number(n.paid_amount) || 0));
  const vencidas = abertas.filter((n) => n.due_date && n.due_date < hoje);

  let recebido: null | { total: number; noCaixa: number; aguardandoAcerto: number; pixCartao: number; deTitulos: number } = null;
  const semComprovacao: string[] = [];
  if (recebimentosHoje) {
    const v = (r: RecebimentoLike) => Number(r.valor) || 0;
    const tot = recebimentosHoje.reduce((s, r) => s + v(r), 0);
    // Significados diferentes, rótulos diferentes:
    //  no caixa      = dinheiro que entrou na portaria (balcão, título pago na portaria ou já acertado);
    //  aguardando    = dinheiro em espécie com entregador ou cobrador, ainda não acertado;
    //  PIX/cartão    = valores informados cujo destino ainda não foi definido (decisão 7).
    const somar = (f: (r: RecebimentoLike) => boolean) => recebimentosHoje.filter(f).reduce((s, r) => s + v(r), 0);
    const pixCartao = somar((r) => destinoEfetivo(r) === "nao_informado");
    const aguardando = somar((r) => !r.acerto_id && (destinoEfetivo(r) === "entregador" || destinoEfetivo(r) === "cobrador"));
    const noCaixa = somar((r) => destinoEfetivo(r) === "caixa" || (!!r.acerto_id && destinoEfetivo(r) !== "nao_informado"));
    recebido = {
      total: tot,
      noCaixa,
      aguardandoAcerto: aguardando,
      pixCartao,
      deTitulos: somar((r) => r.origem === "promissoria"),
    };
    const comReceb = new Set(recebimentosHoje.map((r) => r.order_id).filter(Boolean));
    const comNota = new Set(notas.map((n) => n.order_id).filter(Boolean));
    done.forEach((o) => {
      if (o.id && orderTotal(o) > 0 && !comReceb.has(o.id) && !comNota.has(o.id)) semComprovacao.push(o.id);
    });
  }

  return {
    concluidas: { count: done.length, value: sum(done) },
    formaInformada: sum(done.filter((o) => o.payment_method && o.payment_method !== "promissoria")),
    recebido,
    aReceber: abertas.reduce((s, n) => s + saldo(n), 0),
    vencido: { count: vencidas.length, value: vencidas.reduce((s, n) => s + saldo(n), 0) },
    divergencias: {
      valor: divergenciasHoje ? divergenciasHoje.length : null,
      diferenca: (divergenciasHoje || []).reduce((s, d) => s + (Number(d.esperado) - Number(d.recebido)), 0),
      semComprovacao: recebimentosHoje ? semComprovacao.length : null,
      semForma: done.filter((o) => !o.payment_method).length,
    },
  };
}
