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
