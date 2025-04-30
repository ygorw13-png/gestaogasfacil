import React, { createContext, useContext } from 'react';
import { CashierData, PartialClosing } from '@/pages/entrance/types/cashierTypes';
import { Sale, SalesByType } from '@/pages/entrance/types/entranceTypes';
import { useCashierSales } from '@/hooks/useCashierSales.tsx';
import { useCashierClosing } from '@/hooks/useCashierClosing';

interface CashierContextProps {
  cashierData: CashierData;
  recentSales: Sale[];
  glpSales: { p13: number; p20: number; p45: number; };
  waterSales: number;
  salesByType: SalesByType[];
  previousDaySales: number;
  startTime: Date | null;
  hoursElapsed: number;
  partialClosings: PartialClosing[];
  newSaleOpen: boolean;
  cashierClosingOpen: boolean;
  setNewSaleOpen: (open: boolean) => void;
  setCashierClosingOpen: (open: boolean) => void;
  handleNewSaleSubmit: (newSale: Sale) => void;
  handleCashierClosingSubmit: (type: "partial" | "total", observations?: string) => void;
}

export const CashierContext = createContext<CashierContextProps | undefined>(undefined);

export function CashierProvider({ children }: { children: React.ReactNode }) {
  const { 
    cashierData, 
    setCashierData,
    recentSales, 
    setRecentSales,
    glpSales, 
    setGlpSales,
    waterSales, 
    setWaterSales,
    salesByType,
    setSalesByType,
    startTime,
    setStartTime,
    hoursElapsed,
    newSaleOpen,
    setNewSaleOpen,
    handleNewSaleSubmit
  } = useCashierSales();

  const {
    previousDaySales,
    partialClosings,
    cashierClosingOpen,
    setCashierClosingOpen,
    handleCashierClosingSubmit
  } = useCashierClosing(
    cashierData,
    setCashierData,
    glpSales,
    setGlpSales,
    waterSales,
    setWaterSales,
    setSalesByType,
    setRecentSales,
    setStartTime,
    setHoursElapsed
  );

  return (
    <CashierContext.Provider value={{
      cashierData,
      recentSales,
      glpSales,
      waterSales,
      salesByType,
      previousDaySales,
      startTime,
      hoursElapsed,
      partialClosings,
      newSaleOpen,
      cashierClosingOpen,
      setNewSaleOpen,
      setCashierClosingOpen,
      handleNewSaleSubmit,
      handleCashierClosingSubmit
    }}>
      {children}
    </CashierContext.Provider>
  );
}

export function useCashier() {
  const context = useContext(CashierContext);
  if (context === undefined) {
    throw new Error('useCashier must be used within a CashierProvider');
  }
  return context;
}
