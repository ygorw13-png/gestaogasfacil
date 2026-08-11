import { useMemo } from "react";
import { useSalesHistory } from "./useSalesHistory";
import { productKey } from "./useVendasHoje";

export interface ProdutoQtd {
  p13: number;
  p20: number;
  p45: number;
  water: number;
}

export interface ResumoCategoria {
  /** Código do grupo: money | pix | card | agregado:<id> | <código original> */
  key: string;
  label: string;
  quantidade: number;
  valor: number;
  valorGas: number;
  valorAgua: number;
  /** Quantidade vendida por produto */
  produtos: ProdutoQtd;
  /** Categorias que exigem conferência de valor em espécie/extrato */
  conferivel: boolean;
  /** Venda para agregado/revendedor */
  agregado?: boolean;
}

const zeroProdutos = (): ProdutoQtd => ({ p13: 0, p20: 0, p45: 0, water: 0 });


const GRUPOS: Record<string, { key: string; label: string; conferivel: boolean }> = {
  money: { key: "money", label: "Dinheiro", conferivel: true },
  cash: { key: "money", label: "Dinheiro", conferivel: true },
  pix: { key: "pix", label: "PIX", conferivel: true },
  credit: { key: "card", label: "Cartão (crédito/débito)", conferivel: true },
  debit: { key: "card", label: "Cartão (crédito/débito)", conferivel: true },
};

/**
 * Resumo das vendas da data por categoria de pagamento (quantidade e valor),
 * separando o valor do gás do valor da água e os agregados (revendedores),
 * que aparecem como categoria própria por nome.
 */
export function useResumoPagamentos(date: string) {
  const dateObj = useMemo(() => new Date(`${date}T00:00:00`), [date]);
  const { data: sales = [], isLoading } = useSalesHistory(dateObj, dateObj);

  return useMemo(() => {
    const map = new Map<string, ResumoCategoria>();
    let totalValor = 0;
    let totalQtd = 0;

    sales
      .filter((s) => s.status !== "cancelled")
      .forEach((s) => {
        const isAgregado = Boolean(s.resellerId);
        const grupo = isAgregado
          ? {
              key: `agregado:${s.resellerId}`,
              label: s.resellerName || "Agregado",
              conferivel: false,
            }
          : GRUPOS[s.paymentCode] || {
              key: s.paymentCode || "outros",
              label: s.payment,
              conferivel: false,
            };
        const atual =
          map.get(grupo.key) ||
          ({
            key: grupo.key,
            label: grupo.label,
            quantidade: 0,
            valor: 0,
            valorGas: 0,
            valorAgua: 0,
            produtos: zeroProdutos(),
            conferivel: grupo.conferivel,
            agregado: isAgregado,
          } as ResumoCategoria);

        const pKey = productKey(s.product);
        const isAgua = pKey === "water";
        atual.quantidade += s.quantity || 0;
        atual.valor += s.amount || 0;
        if (pKey) atual.produtos[pKey] += s.quantity || 0;
        if (isAgua) atual.valorAgua += s.amount || 0;
        else atual.valorGas += s.amount || 0;

        map.set(grupo.key, atual);
        totalValor += s.amount || 0;
        totalQtd += s.quantity || 0;
      });

    const categorias = Array.from(map.values()).sort((a, b) => b.valor - a.valor);
    const agregados = categorias.filter((c) => c.agregado);
    const somaProdutos = (list: ResumoCategoria[]): ProdutoQtd =>
      list.reduce(
        (acc, c) => ({
          p13: acc.p13 + c.produtos.p13,
          p20: acc.p20 + c.produtos.p20,
          p45: acc.p45 + c.produtos.p45,
          water: acc.water + c.produtos.water,
        }),
        zeroProdutos()
      );
    return {
      isLoading,
      categorias,
      agregados,
      totalAgregadosValor: agregados.reduce((a, c) => a + c.valor, 0),
      totalAgregadosQtd: agregados.reduce((a, c) => a + c.quantidade, 0),
      totalAgregadosProdutos: somaProdutos(agregados),
      conferiveis: categorias.filter((c) => c.conferivel),
      outras: categorias.filter((c) => !c.conferivel && !c.agregado),
      totalProdutos: somaProdutos(categorias),
      totalValor,
      totalQtd,
    };

  }, [sales, isLoading]);
}
