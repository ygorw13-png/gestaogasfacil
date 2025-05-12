
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import InventoryTable, { InventoryItem } from "./InventoryTable";
import { StockAlert } from "./components/StockAlert";
import { StockRequest } from "./components/StockRequest";
import { StockRequestsList } from "./components/StockRequestsList";
import { CylinderControl } from "./components/CylinderControl";
import { StockUpdateForm } from "./components/StockUpdateForm";
import { StockOverview } from "./components/StockOverview";
import { InventoryApp } from "./components/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { syncStockWithDashboard } from "@/pages/dashboard/data";
import { supabase } from "@/integrations/supabase/client";
import { fetchData } from "@/services/supabase/crud";

// Define a stock data interface for proper typing
interface StockData {
  p13: number;
  p20: number;
  p45: number;
  water: number;
}

export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inventory");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentStock, setCurrentStock] = useState<StockData>({
    p13: 0,
    p20: 0,
    p45: 0,
    water: 0
  });
  
  // Função para buscar o estoque atual do dashboard
  const fetchCurrentStock = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar dados do dashboard
      const response = await fetchData('dashboard_data', {
        columns: 'stock_data'
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.data && response.data.length > 0 && response.data[0].stock_data) {
        // First cast to unknown, then to our expected type to avoid TypeScript errors
        const stockData = response.data[0].stock_data as unknown as Record<string, number>;
        setCurrentStock({
          p13: stockData.p13 || 0,
          p20: stockData.p20 || 0,
          p45: stockData.p45 || 0,
          water: stockData.water || 0
        });
      } else {
        // Usar valores padrão se não houver dados
        setCurrentStock({
          p13: 15,
          p20: 10,
          p45: 3,
          water: 25
        });
      }
    } catch (error) {
      console.error("Erro ao buscar estoque:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de estoque",
        variant: "destructive"
      });
      
      // Usar valores padrão em caso de erro
      setCurrentStock({
        p13: 15,
        p20: 10,
        p45: 3,
        water: 25
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Buscar estoque atual ao carregar o componente ou quando refreshCounter mudar
  useEffect(() => {
    fetchCurrentStock();
  }, [fetchCurrentStock, refreshCounter]);

  const handleRequestCreated = () => {
    setRefreshCounter(prev => prev + 1);
    setActiveTab("requests");
  };
  
  const handleStockUpdate = async (newStock: typeof currentStock) => {
    try {
      // Atualizar estoque local
      setCurrentStock(newStock);
      
      // Sincronizar com o dashboard
      await syncStockWithDashboard(newStock);
      
      // Atualizar o contador para recarregar os dados
      setRefreshCounter(prev => prev + 1);
      
      return Promise.resolve();
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      return Promise.reject(error);
    }
  };

  // Buscar as configurações de estoque mínimo
  const [minStock, setMinStock] = useState({
    p13: 20,
    p20: 5,
    p45: 5,
    water: 20
  });

  // Função para buscar os níveis mínimos de estoque
  const fetchMinStockLevels = useCallback(async () => {
    try {
      const response = await fetchData('configuracoes_estoque');
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.data && response.data.length > 0) {
        const p13Config = response.data.find((config: any) => config.id === 'P13');
        const p20Config = response.data.find((config: any) => config.id === 'P20');
        const p45Config = response.data.find((config: any) => config.id === 'P45');
        const aguaConfig = response.data.find((config: any) => config.id === 'agua');
        
        setMinStock({
          p13: p13Config?.estoque_minimo || 20,
          p20: p20Config?.estoque_minimo || 5,
          p45: p45Config?.estoque_minimo || 5,
          water: aguaConfig?.estoque_minimo || 20
        });
      }
    } catch (error) {
      console.error("Erro ao buscar níveis mínimos de estoque:", error);
    }
  }, []);

  // Buscar níveis mínimos de estoque ao carregar o componente
  useEffect(() => {
    fetchMinStockLevels();
  }, [fetchMinStockLevels]);

  // Prepare inventory table props with complete properties matching the interface
  const inventoryData: InventoryItem[] = [
    { 
      id: 1, 
      product: "GLP P13", 
      stock: currentStock.p13, 
      category: "GLP", 
      min_stock: minStock.p13,
      status: currentStock.p13 >= minStock.p13 ? "Disponível" : "Estoque Baixo",
      location: "Estoque",
      quantity: currentStock.p13,
      type: "GLP",
      lastUpdate: new Date().toISOString()
    },
    { 
      id: 2, 
      product: "GLP P20", 
      stock: currentStock.p20, 
      category: "GLP", 
      min_stock: minStock.p20,
      status: currentStock.p20 >= minStock.p20 ? "Disponível" : "Estoque Baixo",
      location: "Estoque",
      quantity: currentStock.p20,
      type: "GLP",
      lastUpdate: new Date().toISOString()
    },
    { 
      id: 3, 
      product: "GLP P45", 
      stock: currentStock.p45, 
      category: "GLP", 
      min_stock: minStock.p45,
      status: currentStock.p45 >= minStock.p45 ? "Disponível" : "Estoque Baixo",
      location: "Estoque",
      quantity: currentStock.p45,
      type: "GLP",
      lastUpdate: new Date().toISOString()
    },
    { 
      id: 4, 
      product: "Água 20L", 
      stock: currentStock.water, 
      category: "Água", 
      min_stock: minStock.water,
      status: currentStock.water >= minStock.water ? "Disponível" : "Estoque Baixo",
      location: "Estoque",
      quantity: currentStock.water,
      type: "Água",
      lastUpdate: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Estoque
        </h1>
        
        {(user?.role === 'admin' || user?.role === 'gerente' || user?.role === 'estoque' || user?.role === 'portaria') && (
          <Button
            onClick={() => setActiveTab("newRequest")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Nova Requisição
          </Button>
        )}
      </div>

      {/* Stock overview boxes */}
      <StockOverview currentStock={currentStock} minStock={minStock} />

      <StockAlert currentStock={currentStock} minStock={minStock} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="requests">Requisições</TabsTrigger>
          <TabsTrigger value="newRequest">Nova Requisição</TabsTrigger>
          <TabsTrigger value="cylinders">Vasilhames</TabsTrigger>
          <TabsTrigger value="update">Atualizar Estoque</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <InventoryApp />
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          <StockRequestsList key={refreshCounter} />
        </TabsContent>
        
        <TabsContent value="newRequest" className="space-y-4">
          <StockRequest onRequestCreated={handleRequestCreated} />
        </TabsContent>

        <TabsContent value="cylinders" className="space-y-4">
          <CylinderControl />
        </TabsContent>
        
        <TabsContent value="update" className="space-y-4">
          <StockUpdateForm 
            currentStock={currentStock}
            onUpdateStock={handleStockUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
