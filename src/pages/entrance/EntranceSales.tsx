
import React from "react";
import { StatisticsCards } from "./components/statistics/StatisticsCards";
import { TabContent } from "./components/tabs/TabContent";
import { EntranceHeader } from "./components/header/EntranceHeader";
import { useCashier, CashierProvider } from "@/contexts/CashierContext";

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

export default function EntranceSales() {
  return (
    <CashierProvider>
      <EntranceSalesContent />
    </CashierProvider>
  );
}
