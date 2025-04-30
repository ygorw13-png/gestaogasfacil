
import { useMemo } from "react";
import { PartialClosing } from "../types/cashierTypes";

export interface FormattedClosing extends PartialClosing {
  formattedDate: string;
  formattedTime: string;
  formattedDateTime: string;
}

interface UseClosingHistoryReturn {
  formattedClosings: FormattedClosing[];
  filteredClosings: FormattedClosing[];
  groupedByDate: Record<string, FormattedClosing[]>;
  calculateDailyTotals: (closings: FormattedClosing[]) => {
    sales: number;
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
}

export function useClosingHistory(
  partialClosings: PartialClosing[],
  searchDate: string,
  filterType: "all" | "partial" | "total"
): UseClosingHistoryReturn {
  const formattedClosings = useMemo(() => {
    return [...partialClosings].reverse().map(closing => {
      const date = new Date(closing.timestamp);
      return {
        ...closing,
        formattedDate: date.toLocaleDateString('pt-BR'),
        formattedTime: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        formattedDateTime: `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      };
    });
  }, [partialClosings]);
  
  const filteredClosings = useMemo(() => {
    let filtered = formattedClosings;
    
    if (searchDate) {
      filtered = filtered.filter(c => c.formattedDate.includes(searchDate));
    }
    
    if (filterType !== "all") {
      filtered = filtered.filter(c => filterType === "partial");
    }
    
    return filtered;
  }, [formattedClosings, searchDate, filterType]);
  
  const groupedByDate = useMemo(() => {
    const groups: Record<string, FormattedClosing[]> = {};
    
    formattedClosings.forEach(closing => {
      if (!groups[closing.formattedDate]) {
        groups[closing.formattedDate] = [];
      }
      groups[closing.formattedDate].push(closing);
    });
    
    return groups;
  }, [formattedClosings]);
  
  const calculateDailyTotals = (closings: FormattedClosing[]) => {
    return closings.reduce(
      (acc, closing) => {
        acc.sales += closing.totalSales;
        acc.p13 += closing.quantities.p13;
        acc.p20 += closing.quantities.p20;
        acc.p45 += closing.quantities.p45;
        acc.water += closing.quantities.water;
        return acc;
      },
      { sales: 0, p13: 0, p20: 0, p45: 0, water: 0 }
    );
  };

  return {
    formattedClosings,
    filteredClosings,
    groupedByDate,
    calculateDailyTotals,
  };
}
