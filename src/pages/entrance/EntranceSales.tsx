
import React, { useEffect, useState } from "react";
import { StatisticsCards } from "./components/statistics/StatisticsCards";
import { TabContent } from "./components/tabs/TabContent";
import { EntranceHeader } from "./components/header/EntranceHeader";
import { useCashier, CashierProvider } from "@/contexts/CashierContext";
import { PortariaStockPanel } from "./components/stock/PortariaStockPanel";
import { OpeningBalanceDialog } from "./components/stock/OpeningBalanceDialog";
import { OpeningLockAlert } from "./components/stock/OpeningLockAlert";
import { useMovimentacoesPortaria } from "./hooks/usePortariaStock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ShoppingCart, Users, History, Receipt } from "lucide-react";
import { useLateOrdersCount } from "@/hooks/useLateOrdersCount";
import Orders from "@/pages/orders/Orders";
import AcertoEntregadores from "./AcertoEntregadores";
import HistoricoPortaria from "./HistoricoPortaria";
import { DespesasPortariaTab } from "./components/despesas/DespesasPortariaTab";
import { useSearchParams } from "react-router-dom";


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
  const lateCount = useLateOrdersCount();
  const [openingDialogOpen, setOpeningDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Abre o fechamento direto pelo lembrete das 17h (/entrance?fechamento=1)
  useEffect(() => {
    if (searchParams.get("fechamento") === "1") {
      setCashierClosingOpen(true);
      searchParams.delete("fechamento");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, setCashierClosingOpen]);

  const hasOpening = !loadingMovs && !!movimentacoes?.some((m) => m.tipo === "abertura");

  // Sugerir abertura do dia se não houver movimentação de abertura hoje
  useEffect(() => {
    if (loadingMovs || !movimentacoes) return;
    if (!movimentacoes.some((m) => m.tipo === "abertura") && movimentacoes.length === 0) {
      setOpeningDialogOpen(true);
    }
  }, [movimentacoes, loadingMovs]);

  return (
    <div className="space-y-6 animate-in pb-20">
      <Tabs defaultValue="balcao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="balcao" className="flex items-center gap-2">
            <Store size={14} />
            <span>Balcão</span>
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="flex items-center gap-2">
            <ShoppingCart size={14} />
            <span>Pedidos</span>
            {lateCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground">
                {lateCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="acerto" className="flex items-center gap-2">
            <Users size={14} />
            <span>Acerto Entregadores</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History size={14} />
            <span>Histórico Diário</span>
          </TabsTrigger>
          <TabsTrigger value="despesas" className="flex items-center gap-2">
            <Receipt size={14} />
            <span>Despesas</span>
          </TabsTrigger>
        </TabsList>


        <TabsContent value="balcao" className="space-y-6">
          {!hasOpening && <OpeningLockAlert onOpen={() => setOpeningDialogOpen(true)} />}

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
        </TabsContent>

        <TabsContent value="pedidos">
          <Orders />
        </TabsContent>

        <TabsContent value="acerto">
          <AcertoEntregadores />
        </TabsContent>

        <TabsContent value="historico">
          <HistoricoPortaria />
        </TabsContent>

        <TabsContent value="despesas">
          <DespesasPortariaTab />
        </TabsContent>
      </Tabs>

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
