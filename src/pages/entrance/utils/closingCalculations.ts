
import { CashierData, PartialClosing } from "../types/cashierTypes";
import { getTotalSalesFromPartials } from "./cashierUtils";

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
