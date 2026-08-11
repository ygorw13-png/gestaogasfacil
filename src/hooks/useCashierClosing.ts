
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

    // Para fechamento parcial, vamos adicionar um registro no histórico de fechamentos
    if (type === "partial") {
      const newPartialClosing: PartialClosing = {
        id: Date.now().toString(), // Usar timestamp como ID temporário
        timestamp: new Date().toISOString(), // Convertemos Date para string
        totalSales: cashierData.totalSales / 2, // Exemplo simplificado
        quantities: {
          p13: Math.floor(glpSales.p13 / 2),
          p20: Math.floor(glpSales.p20 / 2),
          p45: Math.floor(glpSales.p45 / 2),
          water: Math.floor(waterSales / 2)
        },
        observations: observations || ""
      };
      
      setPartialClosings(prevClosings => [...prevClosings, newPartialClosing]);
      
      // Reduzir os valores atuais baseado no que foi fechado parcialmente
      setCashierData(prev => ({
        ...prev,
        totalSales: prev.totalSales / 2 // Simplificado para exemplo
      }));
      
      setGlpSales(prev => ({
        p13: Math.ceil(prev.p13 / 2),
        p20: Math.ceil(prev.p20 / 2),
        p45: Math.ceil(prev.p45 / 2),
      }));
      
      setWaterSales(prev => Math.ceil(prev / 2));
      
      toast({
        title: "Fechamento parcial",
        description: "O caixa foi fechado parcialmente com sucesso.",
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
