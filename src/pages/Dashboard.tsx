import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewCards } from "./dashboard/components/OverviewCards";
import { SalesChart } from "./dashboard/components/SalesChart";
import { StockChart } from "./dashboard/components/StockChart";
import { TopSellers } from "./dashboard/components/TopSellers";
import { AdminSection } from "./dashboard/components/AdminSection";
import { PromissoryStats } from "./dashboard/components/PromissoryStats";
import { ReversoesResumo } from "./dashboard/components/ReversoesResumo";
import { ResumoMovel } from "./dashboard/components/ResumoMovel";
import {
  useDashboardOverview,
  useSalesSeries,
  useTopSellers,
  type Timeframe,
} from "./dashboard/hooks/useDashboardData";

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const { data: overview, isLoading, isError, refetch, dataUpdatedAt } = useDashboardOverview();
  const { data: salesData } = useSalesSeries(timeframe);
  const { data: sellers } = useTopSellers("month");

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <div className="flex items-center gap-2 max-sm:text-xs">
          <span className="text-sm text-muted-foreground">Última atualização: </span>
          <span className="text-sm font-medium">
            {new Date(dataUpdatedAt || Date.now()).toLocaleString("pt-BR")}
          </span>
        </div>
      </div>

      {isError && !overview ? (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 space-y-3">
          <p className="font-semibold text-destructive">Indicadores indisponíveis</p>
          <p className="text-sm text-muted-foreground">
            Não foi possível consultar os dados agora. Os valores não são exibidos como zero para não confundir falha com ausência de vendas.
          </p>
          <button type="button" onClick={() => refetch()} className="text-sm font-medium text-primary underline">
            Tentar novamente
          </button>
        </div>
      ) : isLoading || !overview ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <>
          <ResumoMovel
            vendas={{ valor: overview.todaySalesValue, qtd: overview.ordersToday }}
            recebido={overview.painel.recebido}
            vencidas={{ qtd: overview.painel.vencido.count, valor: overview.painel.vencido.value }}
          />
          <OverviewCards data={overview} />
          <ReversoesResumo />

          <Tabs defaultValue="sales" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sales">Vendas</TabsTrigger>
              <TabsTrigger value="stock">Estoque</TabsTrigger>
              <TabsTrigger value="promissory">Promissórias</TabsTrigger>
              <TabsTrigger value="sellers">Vendedores</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <SalesChart
                  data={salesData || []}
                  timeframe={timeframe}
                  onTimeframeChange={(t) => setTimeframe(t as Timeframe)}
                />
              </div>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <StockChart />
              </div>
            </TabsContent>

            <TabsContent value="promissory" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <PromissoryStats />
              </div>
            </TabsContent>

            <TabsContent value="sellers" className="space-y-4">
              <TopSellers sellers={sellers || []} />
            </TabsContent>
          </Tabs>

          <AdminSection />
        </>
      )}
    </div>
  );
}
