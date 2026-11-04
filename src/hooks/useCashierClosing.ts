
import { useState, useCallback } from 'react';
import { PartialClosing, CashierData } from '@/pages/entrance/types/cashierTypes';
import { useToast } from '@/hooks/use-toast';
import { resetInventory } from '@/pages/entrance/data/mockData';
import { initialCashierData, initialSalesByType } from './useCashierSales';

export function useCashierClosing(
  cashierData: CashierData,
  setCashierData: React.Dispatch<React.SetStateAction<CashierData>>,
  glpSales: { p13: number; p20: number; p45: number; },
  setGlpSales: React.Dispatch<React.SetStateAction<{ p13: number; p20: number; p45: number; }>>,
  waterSales: number,
  setWaterSales: React.Dispatch<React.SetStateAction<number>>,
  setSalesByType: React.Dispatch<React.SetStateAction<any[]>>,
  setRecentSales: React.Dispatch<React.SetStateAction<any[]>>,
  setStartTime: React.Dispatch<React.SetStateAction<Date | null>>,
  setHoursElapsed: React.Dispatch<React.SetStateAction<number>>
) {
  const { toast } = useToast();
  const [previousDaySales, setPreviousDaySales] = useState(0);
  const [partialClosings, setPartialClosings] = useState<PartialClosing[]>([]);
  const [cashierClosingOpen, setCashierClosingOpen] = useState(false);
  
  const handleCashierClosingSubmit = useCallback((type: "partial" | "total", observations?: string, isRetroactive = false) => {
    // Fechamento retroativo: apenas notifica e fecha o dialog. O registro no banco já foi feito no formulário.
    if (isRetroactive) {
      toast({
        title: type === "total" ? "Fechamento retroativo registrado" : "Fechamento parcial retroativo registrado",
        description: "O fechamento foi salvo na data selecionada.",
        variant: "default",
      });
      setCashierClosingOpen(false);
      return;
    }

    // Fechamento parcial: registra um retrato fiel dos totais atuais,
    // sem alterar os valores em aberto do caixa.
    if (type === "partial") {
      const newPartialClosing: PartialClosing = {
        id: Date.now().toString(), // ID temporário apenas para exibição local
        timestamp: new Date().toISOString(),
        totalSales: cashierData.totalSales,
        quantities: {
          p13: glpSales.p13,
          p20: glpSales.p20,
          p45: glpSales.p45,
          water: waterSales
        },
        observations: observations || ""
      };

      setPartialClosings(prevClosings => [...prevClosings, newPartialClosing]);

      toast({
        title: "Fechamento parcial",
        description: "Retrato do caixa registrado. Os valores em aberto não foram alterados.",
        variant: "default",
      });
    } else {
      // Fechamento total
      setPreviousDaySales(cashierData.totalSales);
      
      // Reset all data
      setCashierData(initialCashierData);
      setRecentSales([]);
      setGlpSales({
        p13: 0,
        p20: 0,
        p45: 0,
      });
      setWaterSales(0);
      setSalesByType(initialSalesByType);
      setPartialClosings([]);
      
      // Reset the inventory data
      resetInventory();
      
      // Reset the timer for the new day
      setStartTime(null);
      setHoursElapsed(0);
      
      toast({
        title: "Fechamento total",
        description: "O caixa foi fechado totalmente com sucesso.",
        variant: "default",
      });
    }
    
    setCashierClosingOpen(false);
  }, [
    cashierData,
    glpSales,
    waterSales,
    setCashierData,
    setGlpSales,
    setWaterSales,
    setSalesByType,
    setRecentSales,
    setStartTime,
    setHoursElapsed,
    toast
  ]);


  return {
    previousDaySales,
    partialClosings,
    cashierClosingOpen,
    setCashierClosingOpen,
    handleCashierClosingSubmit
  };
}
