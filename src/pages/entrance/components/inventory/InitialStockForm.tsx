
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InventoryMovement } from "../../types/cashierTypes";

interface InitialStockFormProps {
  onAddInitialStock: (movements: InventoryMovement[]) => void;
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
}

export function InitialStockForm({ onAddInitialStock, currentStock }: InitialStockFormProps) {
  const [p13Stock, setP13Stock] = useState<number>(currentStock.p13);
  const [p20Stock, setP20Stock] = useState<number>(currentStock.p20);
  const [p45Stock, setP45Stock] = useState<number>(currentStock.p45);
  const [waterStock, setWaterStock] = useState<number>(currentStock.water);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const timestamp = new Date().toISOString();
    const movements: InventoryMovement[] = [];
    
    // Only create movements for values that have changed
    if (p13Stock !== currentStock.p13) {
      movements.push({
        product: "P13",
        quantity: p13Stock,
        type: "initial",
        timestamp
      });
    }
    
    if (p20Stock !== currentStock.p20) {
      movements.push({
        product: "P20",
        quantity: p20Stock,
        type: "initial",
        timestamp
      });
    }
    
    if (p45Stock !== currentStock.p45) {
      movements.push({
        product: "P45",
        quantity: p45Stock,
        type: "initial",
        timestamp
      });
    }
    
    if (waterStock !== currentStock.water) {
      movements.push({
        product: "water",
        quantity: waterStock,
        type: "initial",
        timestamp
      });
    }
    
    if (movements.length > 0) {
      onAddInitialStock(movements);
      toast({
        title: "Estoque inicial registrado",
        description: "Os valores de estoque inicial foram atualizados com sucesso."
      });
    } else {
      toast({
        title: "Nenhuma alteração detectada",
        description: "Nenhum valor de estoque foi alterado.",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="p13-stock">GLP P13</Label>
          <Input
            id="p13-stock"
            type="number"
            min="0"
            value={p13Stock}
            onChange={(e) => setP13Stock(Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="p20-stock">GLP P20</Label>
          <Input
            id="p20-stock"
            type="number"
            min="0"
            value={p20Stock}
            onChange={(e) => setP20Stock(Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="p45-stock">GLP P45</Label>
          <Input
            id="p45-stock"
            type="number"
            min="0"
            value={p45Stock}
            onChange={(e) => setP45Stock(Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="water-stock">Água 20L</Label>
          <Input
            id="water-stock"
            type="number"
            min="0"
            value={waterStock}
            onChange={(e) => setWaterStock(Number(e.target.value))}
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full">Registrar Estoque Inicial</Button>
    </form>
  );
}
