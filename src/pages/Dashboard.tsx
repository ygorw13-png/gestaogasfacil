import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewCards } from "./dashboard/components/OverviewCards";
import { SalesChart } from "./dashboard/components/SalesChart";
import { StockChart } from "./dashboard/components/StockChart";
import { TopSellers } from "./dashboard/components/TopSellers";
import { AdminSection } from "./dashboard/components/AdminSection";
import { PromissoryStats } from "./dashboard/components/PromissoryStats";
import {
  useDashboardOverview,
  useSalesSeries,
  useTopSellers,
  type Timeframe,
} from "./dashboard/hooks/useDashboardData";

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const { data: overview, isLoading, dataUpdatedAt } = useDashboardOverview();
  const { data: salesData } = useSalesSeries(timeframe);
  const { data: sellers } = useTopSellers("month");

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Última atualização: </span>
          <span className="text-sm font-medium">
            {new Date(dataUpdatedAt || Date.now()).toLocaleString("pt-BR")}
          </span>
        </div>
      </div>

      {isLoading || !overview ? (
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
          <OverviewCards data={overview} />

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
