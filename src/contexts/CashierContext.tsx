
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CashierData, PartialClosing } from '@/pages/entrance/types/cashierTypes';
import { Sale, SalesByType } from '@/pages/entrance/types/entranceTypes';
import { CreditCard, DollarSign, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateInventorySales, resetInventory } from '@/pages/entrance/data/mockData';

// Estado inicial do caixa - todos os valores zerados
const initialCashierData: CashierData = {
  cash: 0,
  credit: 0,
  debit: 0,
  pix: 0,
  promissory: 0,
  gasVoucher: 0,
  totalSales: 0,
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

const initialSalesByType: SalesByType[] = [
  { type: 'Dinheiro', amount: 0, icon: <DollarSign className="h-4 w-4 text-green-600" /> },
  { type: 'Crédito', amount: 0, icon: <CreditCard className="h-4 w-4 text-blue-600" /> },
  { type: 'Débito', amount: 0, icon: <CreditCard className="h-4 w-4 text-purple-600" /> },
  { type: 'PIX', amount: 0, icon: <CreditCard className="h-4 w-4 text-yellow-600" /> },
  { type: 'Promissória', amount: 0, icon: <FileText className="h-4 w-4 text-red-600" /> },
  { type: 'Vale Gás', amount: 0, icon: <CreditCard className="h-4 w-4 text-orange-600" /> },
];

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
  const { toast } = useToast();
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [cashierClosingOpen, setCashierClosingOpen] = useState(false);
  const [cashierData, setCashierData] = useState<CashierData>(initialCashierData);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [glpSales, setGlpSales] = useState({
    p13: 0,
    p20: 0,
    p45: 0,
  });
  const [waterSales, setWaterSales] = useState(0);
  const [salesByType, setSalesByType] = useState<SalesByType[]>(initialSalesByType);
  const [previousDaySales, setPreviousDaySales] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [hoursElapsed, setHoursElapsed] = useState(0);
  const [partialClosings, setPartialClosings] = useState<PartialClosing[]>([]);

  // Calculate hours elapsed since first sale or since the start of the day
  useEffect(() => {
    if (!startTime && recentSales.length > 0) {
      // If there's no start time but we have sales, use the current time
      setStartTime(new Date());
    }

    // Update hours elapsed every minute
    const interval = setInterval(() => {
      if (startTime) {
        const now = new Date();
        const elapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        setHoursElapsed(Math.max(elapsed, 1)); // At least 1 hour to avoid division by zero
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startTime, recentSales]);

  const handleNewSaleSubmit = (newSale: Sale) => {
    // Set start time if this is the first sale after reset
    if (!startTime) {
      setStartTime(new Date());
    }
    
    const updatedSales = [newSale, ...recentSales.slice(0, 4)];
    setRecentSales(updatedSales);
    
    const newTotal = cashierData.totalSales + newSale.amount;
    setCashierData({
      ...cashierData,
      totalSales: newTotal,
    });
    
    // Atualizar as vendas de estoque e os contadores de produtos
    if (newSale.product.includes('P13')) {
      setGlpSales(prev => ({ ...prev, p13: prev.p13 + newSale.quantity }));
      updateInventorySales('P13', newSale.quantity);
    } else if (newSale.product.includes('P20')) {
      setGlpSales(prev => ({ ...prev, p20: prev.p20 + newSale.quantity }));
      updateInventorySales('P20', newSale.quantity);
    } else if (newSale.product.includes('P45')) {
      setGlpSales(prev => ({ ...prev, p45: prev.p45 + newSale.quantity }));
      updateInventorySales('P45', newSale.quantity);
    } else if (newSale.product.includes('Água')) {
      setWaterSales(prev => prev + newSale.quantity);
      updateInventorySales('Água', newSale.quantity);
    }
    
    // Update payment type statistics
    setSalesByType(prev => 
      prev.map(item => {
        if (item.type === newSale.payment) {
          return { ...item, amount: item.amount + newSale.amount };
        }
        return item;
      })
    );
    
    toast({
      title: "Venda registrada",
      description: "A venda foi registrada com sucesso.",
      variant: "default",
    });
    
    setNewSaleOpen(false);
  };

  const handleCashierClosingSubmit = (type: "partial" | "total", observations?: string) => {
    // Para fechamento parcial, vamos adicionar um registro no histórico de fechamentos
    if (type === "partial") {
      const newPartialClosing: PartialClosing = {
        id: Date.now().toString(), // Usar timestamp como ID temporário
        timestamp: new Date(),
        amount: cashierData.totalSales / 2, // Exemplo simplificado
        cashier_name: "Usuário Atual", // Idealmente pegaria do contexto de autenticação
        quantities: {
          p13: Math.floor(glpSales.p13 / 2),
          p20: Math.floor(glpSales.p20 / 2),
          p45: Math.floor(glpSales.p45 / 2),
          water: Math.floor(waterSales / 2)
        },
        observations: observations || ""
      };
      
      setPartialClosings([...partialClosings, newPartialClosing]);
      
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
      
      setWaterSales(Math.ceil(waterSales / 2));
      
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
  };

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
