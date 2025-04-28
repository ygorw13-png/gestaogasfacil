
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import InventoryTable, { InventoryItem } from "./InventoryTable";
import { StockAlert } from "./components/StockAlert";
import { StockRequest } from "./components/StockRequest";
import { StockRequestsList } from "./components/StockRequestsList";
import { CylinderControl } from "./components/CylinderControl";
import { useAuth } from "@/contexts/AuthContext";

export default function Inventory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [currentStock, setCurrentStock] = useState({
    p13: 0,
    p20: 0,
    p45: 0,
    water: 0
  });

  // Mock function to get current stock - in a real app, this would come from your database
  const fetchCurrentStock = () => {
    // Simulando um estoque para teste dos alertas
    setCurrentStock({
      p13: 15, // Abaixo do mínimo configurado (20)
      p20: 10,
      p45: 3,  // Abaixo do mínimo configurado (5)
      water: 25
    });
  };

  useEffect(() => {
    fetchCurrentStock();
  }, []);

  const handleRequestCreated = () => {
    setRefreshCounter(prev => prev + 1);
    setActiveTab("requests");
  };

  // Prepare inventory table props
  const inventoryData: InventoryItem[] = [
    { id: 1, product: "GLP P13", stock: currentStock.p13, category: "GLP", min_stock: 20 },
    { id: 2, product: "GLP P20", stock: currentStock.p20, category: "GLP", min_stock: 5 },
    { id: 3, product: "GLP P45", stock: currentStock.p45, category: "GLP", min_stock: 5 },
    { id: 4, product: "Água 20L", stock: currentStock.water, category: "Água", min_stock: 20 }
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

      <StockAlert currentStock={currentStock} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="requests">Requisições</TabsTrigger>
          <TabsTrigger value="newRequest">Nova Requisição</TabsTrigger>
          <TabsTrigger value="cylinders">Vasilhames</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <div className="space-y-4 mt-4">
            <InventoryTable 
              data={inventoryData} 
              filterText="" 
            />
          </div>
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
      </Tabs>
    </div>
  );
}
