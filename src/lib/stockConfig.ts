/**
 * Configuração de estoque mínimo por produto.
 * O registro é identificado pelo campo `produto` ("p13", "p20", "p45", "agua");
 * o `id` é gerado pelo banco. Zero configurado é valor válido e é preservado.
 */
export type StockProduct = "p13" | "p20" | "p45" | "agua";

export interface StockConfigRow {
  id?: string;
  produto?: string | null;
  estoque_minimo?: number | null;
  alerta_ativo?: boolean | null;
}

export const findStockConfig = (rows: StockConfigRow[] | null | undefined, produto: StockProduct) =>
  (rows || []).find((r) => (r.produto || "").toLowerCase() === produto);

/** Mínimo configurado; o padrão só vale quando não há registro ou o campo é nulo. */
export const minFor = (
  rows: StockConfigRow[] | null | undefined,
  produto: StockProduct,
  fallback: number
) => findStockConfig(rows, produto)?.estoque_minimo ?? fallback;
