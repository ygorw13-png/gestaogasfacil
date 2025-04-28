
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryMovement } from "../../types/cashierTypes";
import { StockGrid } from "./StockGrid";
import { MovementForm } from "./MovementForm";
import { MovementsList } from "./MovementsList";
import { InitialStockForm } from "./InitialStockForm";

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

  const handleInitialStockSubmit = (initialMovements: InventoryMovement[]) => {
    // Process each movement individually
    initialMovements.forEach(movement => {
      onInventoryMovement(movement);
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
