
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { OverviewCards } from "./dashboard/components/OverviewCards";
import { SalesChart } from "./dashboard/components/SalesChart";
import { StockChart } from "./dashboard/components/StockChart";
import { TopSellers } from "./dashboard/components/TopSellers";
import { AdminSection } from "./dashboard/components/AdminSection";
import { salesData, overviewData, topSellers } from "./dashboard/data";

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState("today");
  const { user } = useAuth();

  const hasFullAccess = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Última atualização: </span>
          <span className="text-sm font-medium">{new Date().toLocaleString()}</span>
        </div>
      </div>

      {!hasFullAccess && (
        <Alert variant="warning" className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Você tem acesso limitado ao dashboard. Algumas informações só estão disponíveis para usuários com perfis de Administrador ou Gerente.
          </AlertDescription>
        </Alert>
      )}

      <OverviewCards data={overviewData} />

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          {hasFullAccess && <TabsTrigger value="sellers">Vendedores</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SalesChart 
              data={salesData} 
              timeframe={timeframe} 
              onTimeframeChange={setTimeframe} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="stock" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <StockChart />
          </div>
        </TabsContent>
        
        {hasFullAccess && (
          <TabsContent value="sellers" className="space-y-4">
            <TopSellers sellers={topSellers} />
          </TabsContent>
        )}
      </Tabs>

      {user?.role === 'admin' && <AdminSection />}
    </div>
  );
}
