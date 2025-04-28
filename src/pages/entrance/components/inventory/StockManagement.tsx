
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryMovement } from "../../types/cashierTypes";
import { StockGrid } from "./StockGrid";
import { MovementForm } from "./MovementForm";
import { MovementsList } from "./MovementsList";
import { InitialStockForm } from "./InitialStockForm";
import { getCurrentStock, syncStockWithDashboard } from "@/pages/dashboard/data";

interface StockManagementProps {
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
  onInventoryMovement: (movement: InventoryMovement) => void;
  inventoryMovements: InventoryMovement[];
}

export function StockManagement({ 
  currentStock, 
  onInventoryMovement,
  inventoryMovements
}: StockManagementProps) {
  const [activeTab, setActiveTab] = useState<string>("movements");
  const [initializing, setInitializing] = useState(true);
  
  useEffect(() => {
    const initializeStock = async () => {
      // Busca o estoque inicial do usuário do banco de dados
      const stock = await getCurrentStock();
      
      // Inicializa o estoque com os valores do banco de dados
      if (stock && (stock.p13 > 0 || stock.p20 > 0 || stock.p45 > 0 || stock.water > 0)) {
        const movements: InventoryMovement[] = [];
        
        if (stock.p13 > 0) {
          movements.push({
            product: "P13",
            quantity: stock.p13,
            type: "initial",
            timestamp: new Date().toISOString()
          });
        }
        
        if (stock.p20 > 0) {
          movements.push({
            product: "P20",
            quantity: stock.p20,
            type: "initial",
            timestamp: new Date().toISOString()
          });
        }
        
        if (stock.p45 > 0) {
          movements.push({
            product: "P45",
            quantity: stock.p45,
            type: "initial",
            timestamp: new Date().toISOString()
          });
        }
        
        if (stock.water > 0) {
          movements.push({
            product: "water",
            quantity: stock.water,
            type: "initial",
            timestamp: new Date().toISOString()
          });
        }
        
        if (movements.length > 0) {
          // Só aplica as movimentações se houver algum valor na base de dados
          movements.forEach(movement => {
            onInventoryMovement(movement);
          });
        }
      }
      
      setInitializing(false);
    };
    
    initializeStock();
  }, [onInventoryMovement]);
  
  // Sincroniza automaticamente o estoque com o dashboard quando há mudanças
  useEffect(() => {
    if (!initializing) {
      syncStockWithDashboard(currentStock);
    }
  }, [currentStock, initializing]);
  
  const calculateNetMovements = () => {
    const result = {
      P13: { loan: 0, return: 0, net: 0 },
      P20: { loan: 0, return: 0, net: 0 },
      P45: { loan: 0, return: 0, net: 0 },
      water: { loan: 0, return: 0, net: 0 }
    };
    
    inventoryMovements.forEach(move => {
      if (move.type === "loan") {
        result[move.product as keyof typeof result].loan += move.quantity;
      } else if (move.type === "return") {
        result[move.product as keyof typeof result].return += move.quantity;
      }
      // We ignore "initial" type for net calculations
    });
    
    // Calculate net values
    Object.keys(result).forEach(key => {
      const k = key as keyof typeof result;
      result[k].net = result[k].return - result[k].loan;
    });
    
    return result;
  };
  
  const movements = calculateNetMovements();

  const handleInitialStockSubmit = async (initialMovements: InventoryMovement[]) => {
    // Process each movement individually
    initialMovements.forEach(movement => {
      onInventoryMovement(movement);
    });
    
    // Sincroniza o estoque com o dashboard
    await syncStockWithDashboard({
      p13: currentStock.p13,
      p20: currentStock.p20, 
      p45: currentStock.p45,
      water: currentStock.water
    });
    
    // Switch back to movements tab
    setActiveTab("movements");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Estoque</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <StockGrid currentStock={currentStock} movements={movements} />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="initial">Estoque Inicial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="movements" className="space-y-4 pt-4">
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Registrar Movimentação</h3>
              <MovementForm onAddMovement={onInventoryMovement} />
            </div>
            
            {inventoryMovements.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Movimentações Recentes</h3>
                <MovementsList movements={inventoryMovements} />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="initial" className="space-y-4 pt-4">
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Definir Estoque Inicial</h3>
              <InitialStockForm 
                onAddInitialStock={handleInitialStockSubmit}
                currentStock={currentStock}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
