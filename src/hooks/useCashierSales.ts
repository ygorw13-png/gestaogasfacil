
import { useState, useEffect } from 'react';
import { CashierData } from '@/pages/entrance/types/cashierTypes';
import { Sale, SalesByType } from '@/pages/entrance/types/entranceTypes';
import { updateInventorySales } from '@/pages/entrance/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, FileText } from 'lucide-react';

// Estado inicial do caixa - todos os valores zerados
export const initialCashierData: CashierData = {
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

export const initialSalesByType: SalesByType[] = [
  { type: 'Dinheiro', amount: 0, icon: <DollarSign className="h-4 w-4 text-green-600" /> },
  { type: 'Crédito', amount: 0, icon: <CreditCard className="h-4 w-4 text-blue-600" /> },
  { type: 'Débito', amount: 0, icon: <CreditCard className="h-4 w-4 text-purple-600" /> },
  { type: 'PIX', amount: 0, icon: <CreditCard className="h-4 w-4 text-yellow-600" /> },
  { type: 'Promissória', amount: 0, icon: <FileText className="h-4 w-4 text-red-600" /> },
  { type: 'Vale Gás', amount: 0, icon: <CreditCard className="h-4 w-4 text-orange-600" /> },
];

export function useCashierSales() {
  const { toast } = useToast();
  const [cashierData, setCashierData] = useState<CashierData>(initialCashierData);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [glpSales, setGlpSales] = useState({
    p13: 0,
    p20: 0,
    p45: 0,
  });
  const [waterSales, setWaterSales] = useState(0);
  const [salesByType, setSalesByType] = useState<SalesByType[]>(initialSalesByType);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [hoursElapsed, setHoursElapsed] = useState(0);
  const [newSaleOpen, setNewSaleOpen] = useState(false);

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

  return {
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
  };
}
