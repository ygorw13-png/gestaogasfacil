import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { OverviewCards } from "./dashboard/components/OverviewCards";
import { SalesChart } from "./dashboard/components/SalesChart";
import { StockChart } from "./dashboard/components/StockChart";
import { TopSellers } from "./dashboard/components/TopSellers";
import { AdminSection } from "./dashboard/components/AdminSection";
import { PromissoryStats } from "./dashboard/components/PromissoryStats";
import { overviewData, topSellers } from "./dashboard/data";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState("today");
  const { user } = useAuth();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState(overviewData);
  const [loading, setLoading] = useState(true);

  const hasFullAccess = user?.role === 'admin' || user?.role === 'gerente';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data, error } = await supabase
          .from('dashboard_data')
          .select('*')
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Erro ao buscar dados do dashboard:", error);
          setLoading(false);
          return;
        }
        
        if (data) {
          // Atualiza os dados do dashboard com os dados do banco de dados
          if (data.stock_data) {
            const stockData = data.stock_data as { 
              p13?: number; 
              p20?: number; 
              p45?: number; 
              water?: number 
            };
            
            setDashboardData(prev => ({
              ...prev,
              totalStock: {
                gasP13: stockData.p13 || 0,
                gasP20: stockData.p20 || 0,
                gasP45: stockData.p45 || 0,
                water: stockData.water || 0
              }
            }));
          }
          
          if (data.sales_data && Array.isArray(data.sales_data)) {
            setSalesData(data.sales_data);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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

      {loading ? (
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
          <OverviewCards data={dashboardData} />

          <Tabs defaultValue="sales" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sales">Vendas</TabsTrigger>
              <TabsTrigger value="stock">Estoque</TabsTrigger>
              <TabsTrigger value="promissory">Promissórias</TabsTrigger>
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
            
            <TabsContent value="promissory" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <PromissoryStats />
              </div>
            </TabsContent>
            
            {hasFullAccess && (
              <TabsContent value="sellers" className="space-y-4">
                <TopSellers sellers={topSellers} />
              </TabsContent>
            )}
          </Tabs>

          {user?.role === 'admin' && <AdminSection />}
        </>
      )}
    </div>
  );
}
