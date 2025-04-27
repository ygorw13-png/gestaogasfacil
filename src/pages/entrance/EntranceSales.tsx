
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, DollarSign, FileText } from "lucide-react";
import { StatisticsCards } from "./components/statistics/StatisticsCards";
import { TabContent } from "./components/tabs/TabContent";
import { EntranceHeader } from "./components/header/EntranceHeader";
import type { CashierData } from "./types/cashierTypes";
import type { Sale, SalesByType } from "./types/entranceTypes";

// Initial data
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

const activeCashierData: CashierData = {
  cash: 2345.50,
  credit: 1250.00,
  debit: 985.75,
  pix: 1500.00,
  promissory: 850.00,
  gasVoucher: 520.00,
  totalSales: 7451.25,
  quantities: {
    cash: { p13: 15, p20: 2, p45: 1, water: 10 },
    credit: { p13: 8, p20: 1, p45: 0, water: 5 },
    debit: { p13: 6, p20: 1, p45: 0, water: 3 },
    pix: { p13: 10, p20: 0, p45: 1, water: 7 },
    promissory: { p13: 5, p20: 1, p45: 0, water: 4 },
    gasVoucher: { p13: 3, p20: 0, p45: 0, water: 2 }
  },
  inventoryMovements: [
    { product: 'P13', quantity: 2, type: 'loan' as const, timestamp: '2025-04-25T15:30:00' },
    { product: 'P13', quantity: 1, type: 'return' as const, timestamp: '2025-04-25T16:00:00' },
    { product: 'P20', quantity: 1, type: 'loan' as const, timestamp: '2025-04-25T14:45:00' }
  ]
};

const initialSalesByType: SalesByType[] = [
  { type: 'Dinheiro', amount: 0, icon: <DollarSign className="h-4 w-4 text-green-600" /> },
  { type: 'Crédito', amount: 0, icon: <CreditCard className="h-4 w-4 text-blue-600" /> },
  { type: 'Débito', amount: 0, icon: <CreditCard className="h-4 w-4 text-purple-600" /> },
  { type: 'PIX', amount: 0, icon: <CreditCard className="h-4 w-4 text-yellow-600" /> },
  { type: 'Promissória', amount: 0, icon: <FileText className="h-4 w-4 text-red-600" /> },
  { type: 'Vale Gás', amount: 0, icon: <CreditCard className="h-4 w-4 text-orange-600" /> },
];

const activeSalesByType: SalesByType[] = [
  { type: 'Dinheiro', amount: 2345.50, icon: <DollarSign className="h-4 w-4 text-green-600" /> },
  { type: 'Crédito', amount: 1250.00, icon: <CreditCard className="h-4 w-4 text-blue-600" /> },
  { type: 'Débito', amount: 985.75, icon: <CreditCard className="h-4 w-4 text-purple-600" /> },
  { type: 'PIX', amount: 1500.00, icon: <CreditCard className="h-4 w-4 text-yellow-600" /> },
  { type: 'Promissória', amount: 850.00, icon: <FileText className="h-4 w-4 text-red-600" /> },
  { type: 'Vale Gás', amount: 520.00, icon: <CreditCard className="h-4 w-4 text-orange-600" /> },
];

const initialRecentSales = [
  { id: 1, time: '16:45', client: 'Maria Silva', product: 'GLP P13', quantity: 1, payment: 'PIX', amount: 120.00 },
  { id: 2, time: '16:30', client: 'João Oliveira', product: 'Água 20L', quantity: 2, payment: 'Dinheiro', amount: 24.00 },
  { id: 3, time: '16:15', client: 'André Santos', product: 'GLP P13', quantity: 1, payment: 'Crédito', amount: 120.00 },
  { id: 4, time: '15:50', client: 'Carla Pereira', product: 'GLP P13', quantity: 1, payment: 'Vale Gás', amount: 120.00 },
  { id: 5, time: '15:30', client: 'Roberto Alves', product: 'GLP P45', quantity: 1, payment: 'Promissória', amount: 360.00 },
];

export default function EntranceSales() {
  const { toast } = useToast();
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [cashierClosingOpen, setCashierClosingOpen] = useState(false);
  const [cashierData, setCashierData] = useState<CashierData>(activeCashierData);
  const [recentSales, setRecentSales] = useState(initialRecentSales);
  const [glpSales, setGlpSales] = useState({
    p13: 38,
    p20: 2,
    p45: 2,
  });
  const [waterSales, setWaterSales] = useState(28);
  const [salesByType, setSalesByType] = useState<SalesByType[]>(activeSalesByType);
  const [previousDaySales, setPreviousDaySales] = useState(6800); // Example previous day sales
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [hoursElapsed, setHoursElapsed] = useState(9); // Default work day hours

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
    
    if (newSale.product.includes('P13')) {
      setGlpSales(prev => ({ ...prev, p13: prev.p13 + newSale.quantity }));
    } else if (newSale.product.includes('P20')) {
      setGlpSales(prev => ({ ...prev, p20: prev.p20 + newSale.quantity }));
    } else if (newSale.product.includes('P45')) {
      setGlpSales(prev => ({ ...prev, p45: prev.p45 + newSale.quantity }));
    } else if (newSale.product.includes('Água')) {
      setWaterSales(prev => prev + newSale.quantity);
    }
    
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

  const handleCashierClosingSubmit = () => {
    setCashierClosingOpen(false);
    toast({
      title: "Fechamento de caixa",
      description: "O caixa foi fechado com sucesso.",
      variant: "default",
    });
    
    // Store the current total for the next day's comparison
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
    
    // Reset the timer for the new day
    setStartTime(null);
    setHoursElapsed(9); // Reset to default work day
  };

  return (
    <div className="space-y-6 animate-in pb-20">
      <EntranceHeader
        newSaleOpen={newSaleOpen}
        cashierClosingOpen={cashierClosingOpen}
        setNewSaleOpen={setNewSaleOpen}
        setCashierClosingOpen={setCashierClosingOpen}
        onNewSaleSubmit={handleNewSaleSubmit}
        onCashierClosingSubmit={handleCashierClosingSubmit}
        cashierData={cashierData}
      />

      <StatisticsCards 
        totalSales={cashierData.totalSales}
        previousDaySales={previousDaySales}
        glpSales={glpSales}
        waterSales={waterSales}
        hoursElapsed={hoursElapsed}
      />

      <div className="overflow-hidden">
        <TabContent 
          recentSales={recentSales}
          salesByType={salesByType}
        />
      </div>
    </div>
  );
}
