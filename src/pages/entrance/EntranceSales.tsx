
import React, { useEffect, useState } from "react";
import { StatisticsCards } from "./components/statistics/StatisticsCards";
import { TabContent } from "./components/tabs/TabContent";
import { EntranceHeader } from "./components/header/EntranceHeader";
import { useCashier, CashierProvider } from "@/contexts/CashierContext";
import { PortariaStockPanel } from "./components/stock/PortariaStockPanel";
import { OpeningBalanceDialog } from "./components/stock/OpeningBalanceDialog";
import { useMovimentacoesPortaria } from "./hooks/usePortariaStock";

function EntranceSalesContent() {
  const { 
    cashierData, 
    newSaleOpen, 
    cashierClosingOpen, 
    setNewSaleOpen, 
    setCashierClosingOpen, 
    handleNewSaleSubmit, 
    handleCashierClosingSubmit, 
    glpSales, 
    waterSales,
    previousDaySales, 
    hoursElapsed, 
    recentSales, 
    salesByType 
  } = useCashier();

  const { data: movimentacoes, isLoading: loadingMovs } = useMovimentacoesPortaria();
  const [openingDialogOpen, setOpeningDialogOpen] = useState(false);

  // Sugerir abertura do dia se não houver movimentação de abertura hoje
  useEffect(() => {
    if (loadingMovs) return;
    const hasOpening = movimentacoes?.some((m) => m.tipo === "abertura");
    if (!hasOpening && movimentacoes && movimentacoes.length === 0) {
      setOpeningDialogOpen(true);
    }
  }, [movimentacoes, loadingMovs]);

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

      <PortariaStockPanel />

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

      <OpeningBalanceDialog open={openingDialogOpen} onOpenChange={setOpeningDialogOpen} />
    </div>
  );
}

export default function EntranceSales() {
  return (
    <CashierProvider>
      <EntranceSalesContent />
    </CashierProvider>
  );
}
