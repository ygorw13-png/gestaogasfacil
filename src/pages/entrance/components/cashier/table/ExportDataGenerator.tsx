
import { useMemo } from "react";
import { FormattedClosing } from "../../../hooks/useClosingHistory";
import { ClosingExportData } from "../../../types/cashierTypes";

interface UseExportDataProps {
  filteredClosings: FormattedClosing[];
}

export function useExportData({ filteredClosings }: UseExportDataProps) {
  const exportData = useMemo((): ClosingExportData[] => {
    return filteredClosings.map(closing => ({
      date: closing.formattedDateTime,
      type: 'Parcial',
      totalSales: closing.totalSales,
      p13Quantity: closing.quantities.p13,
      p20Quantity: closing.quantities.p20,
      p45Quantity: closing.quantities.p45,
      waterQuantity: closing.quantities.water,
      paymentMethods: {
        cash: closing.totalSales * 0.3,
        credit: closing.totalSales * 0.2,
        debit: closing.totalSales * 0.15,
        pix: closing.totalSales * 0.2,
        promissory: closing.totalSales * 0.1,
        gasVoucher: closing.totalSales * 0.05
      },
      inventory: {
        initial: {
          p13: closing.quantities.p13 + 10,
          p20: closing.quantities.p20 + 5,
          p45: closing.quantities.p45 + 3,
          water: closing.quantities.water + 20
        },
        final: {
          p13: 10,
          p20: 5,
          p45: 3,
          water: 20
        }
      },
      observations: closing.observations
    }));
  }, [filteredClosings]);

  return exportData;
}
