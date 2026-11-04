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
