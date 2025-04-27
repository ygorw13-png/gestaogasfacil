
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryMovement } from "../../types/cashierTypes";
import { StockGrid } from "./StockGrid";
import { MovementForm } from "./MovementForm";
import { MovementsList } from "./MovementsList";

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
      } else {
        result[move.product as keyof typeof result].return += move.quantity;
      }
    });
    
    // Calculate net values
    Object.keys(result).forEach(key => {
      const k = key as keyof typeof result;
      result[k].net = result[k].return - result[k].loan;
    });
    
    return result;
  };
  
  const movements = calculateNetMovements();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Estoque</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <StockGrid currentStock={currentStock} movements={movements} />
        
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
      </CardContent>
    </Card>
  );
}
