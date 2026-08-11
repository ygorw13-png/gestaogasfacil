
import { CashierData, PartialClosing } from "../types/cashierTypes";
import { VendasPorData } from "../hooks/useVendasPorData";
import { getTotalSalesFromPartials } from "./cashierUtils";

/**
 * Mapeia rótulos de pagamento usados no histórico para códigos do CashierData
 */
const paymentCodeMap: Record<string, keyof CashierData> = {
  Dinheiro: "cash",
  Crédito: "credit",
  Débito: "debit",
  PIX: "pix",
  Promissória: "promissory",
  "Vale Gás": "gasVoucher",
  "Gás-Povo": "gasVoucher",
  Convênio: "gasVoucher",
  Outros: "cash",
};

const emptyQuantities = () => ({ p13: 0, p20: 0, p45: 0, water: 0 });

/**
 * Constrói um CashierData a partir das vendas reais de uma data específica.
 * Usado para fechamentos retroativos de dias anteriores.
 */
export const buildCashierDataFromVendasPorData = (vendas: VendasPorData | undefined): CashierData => {
  const data: CashierData = {
    cash: 0,
    credit: 0,
    debit: 0,
    pix: 0,
    promissory: 0,
    gasVoucher: 0,
    totalSales: vendas?.totalSales ?? 0,
    quantities: {
      cash: emptyQuantities(),
      credit: emptyQuantities(),
      debit: emptyQuantities(),
      pix: emptyQuantities(),
      promissory: emptyQuantities(),
      gasVoucher: emptyQuantities(),
    },
    inventoryMovements: [],
  };

  if (!vendas) return data;

  Object.entries(vendas.byPayment).forEach(([label, amount]) => {
    const key = paymentCodeMap[label] || "cash";
    data[key] = (data[key] || 0) + amount;
  });

  Object.entries(vendas.quantitiesByPayment).forEach(([label, qts]) => {
    const key = paymentCodeMap[label] || "cash";
    data.quantities[key] = {
      p13: (data.quantities[key]?.p13 ?? 0) + (qts.p13 || 0),
      p20: (data.quantities[key]?.p20 ?? 0) + (qts.p20 || 0),
      p45: (data.quantities[key]?.p45 ?? 0) + (qts.p45 || 0),
      water: (data.quantities[key]?.water ?? 0) + (qts.water || 0),
    };
  });

  return data;
};

/**
 * Calcula o valor total de vendas desde o último fechamento parcial
 * @param cashierData Dados do caixa atual
 * @param partialClosings Array de fechamentos parciais anteriores
 * @returns Valor total de vendas desde o último fechamento parcial
 */
export const calculateSalesAmountSinceLastPartial = (cashierData: CashierData, partialClosings: PartialClosing[]): number => {
  if (partialClosings.length === 0) return cashierData.totalSales;
  
  const totalPartialSales = getTotalSalesFromPartials(partialClosings);
  
  return cashierData.totalSales - totalPartialSales;
};

/**
 * Prepara os dados de vendas em um formato adaptado para exibição
 * @param cashierData Dados originais do caixa
 * @param totalSalesSinceLastPartial Valor total de vendas desde o último fechamento
 * @returns Objeto adaptado no formato CashierData para exibição
 */
export const prepareAdaptedSalesData = (
  cashierData: CashierData, 
  totalSalesSinceLastPartial: number
): CashierData => {
  return {
    cash: cashierData.cash / 2,
    credit: cashierData.credit / 2,
    debit: cashierData.debit / 2,
    pix: cashierData.pix / 2,
    promissory: cashierData.promissory / 2,
    gasVoucher: cashierData.gasVoucher / 2,
    totalSales: totalSalesSinceLastPartial,
    quantities: {
      cash: { p13: 0, p20: 0, p45: 0, water: 0 },
      credit: { p13: 0, p20: 0, p45: 0, water: 0 },
      debit: { p13: 0, p20: 0, p45: 0, water: 0 },
      pix: { p13: 0, p20: 0, p45: 0, water: 0 },
      promissory: { p13: 0, p20: 0, p45: 0, water: 0 },
      gasVoucher: { p13: 0, p20: 0, p45: 0, water: 0 }
    },
    inventoryMovements: []
  };
};

