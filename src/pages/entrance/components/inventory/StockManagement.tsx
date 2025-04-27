
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryMovement } from "../../types/cashierTypes";
import { ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [product, setProduct] = useState<string>("");
  const [movementType, setMovementType] = useState<"loan" | "return">("loan");
  const [quantity, setQuantity] = useState<number>(1);
  const { toast } = useToast();
  
  const handleAddMovement = () => {
    if (!product) {
      toast({
        title: "Produto não selecionado",
        description: "Selecione um produto para registrar a movimentação",
        variant: "destructive",
      });
      return;
    }
    
    if (quantity <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }
    
    // Em um caso real, você verificaria se há estoque suficiente
    // para o empréstimo, por exemplo
    
    const movement: InventoryMovement = {
      product,
      quantity,
      type: movementType,
      timestamp: new Date().toISOString()
    };
    
    onInventoryMovement(movement);
    
    toast({
      title: movementType === "loan" ? "Empréstimo registrado" : "Devolução registrada",
      description: `${quantity} unidade(s) de ${getProductName(product)} ${movementType === "loan" ? "emprestada(s)" : "devolvida(s)"} com sucesso.`
    });
    
    // Resetar o formulário
    setProduct("");
    setQuantity(1);
  };
  
  const getProductName = (code: string): string => {
    switch (code) {
      case "P13": return "GLP P13";
      case "P20": return "GLP P20";
      case "P45": return "GLP P45";
      case "water": return "Água 20L";
      default: return code;
    }
  };
  
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-md border p-4 text-center">
            <div className="text-2xl font-semibold">{currentStock.p13}</div>
            <div className="text-sm text-muted-foreground">GLP P13</div>
            <div className={`text-xs mt-1 ${movements.P13.net < 0 ? 'text-red-500' : movements.P13.net > 0 ? 'text-green-500' : ''}`}>
              {movements.P13.net !== 0 ? `${movements.P13.net > 0 ? '+' : ''}${movements.P13.net}` : ''}
            </div>
          </div>
          <div className="rounded-md border p-4 text-center">
            <div className="text-2xl font-semibold">{currentStock.p20}</div>
            <div className="text-sm text-muted-foreground">GLP P20</div>
            <div className={`text-xs mt-1 ${movements.P20.net < 0 ? 'text-red-500' : movements.P20.net > 0 ? 'text-green-500' : ''}`}>
              {movements.P20.net !== 0 ? `${movements.P20.net > 0 ? '+' : ''}${movements.P20.net}` : ''}
            </div>
          </div>
          <div className="rounded-md border p-4 text-center">
            <div className="text-2xl font-semibold">{currentStock.p45}</div>
            <div className="text-sm text-muted-foreground">GLP P45</div>
            <div className={`text-xs mt-1 ${movements.P45.net < 0 ? 'text-red-500' : movements.P45.net > 0 ? 'text-green-500' : ''}`}>
              {movements.P45.net !== 0 ? `${movements.P45.net > 0 ? '+' : ''}${movements.P45.net}` : ''}
            </div>
          </div>
          <div className="rounded-md border p-4 text-center">
            <div className="text-2xl font-semibold">{currentStock.water}</div>
            <div className="text-sm text-muted-foreground">Água 20L</div>
            <div className={`text-xs mt-1 ${movements.water.net < 0 ? 'text-red-500' : movements.water.net > 0 ? 'text-green-500' : ''}`}>
              {movements.water.net !== 0 ? `${movements.water.net > 0 ? '+' : ''}${movements.water.net}` : ''}
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3">Registrar Movimentação</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="product">Produto</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P13">GLP P13</SelectItem>
                  <SelectItem value="P20">GLP P20</SelectItem>
                  <SelectItem value="P45">GLP P45</SelectItem>
                  <SelectItem value="water">Água 20L</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input 
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="movement-type">Tipo</Label>
              <Select value={movementType} onValueChange={(v) => setMovementType(v as "loan" | "return")}>
                <SelectTrigger id="movement-type">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loan">Empréstimo</SelectItem>
                  <SelectItem value="return">Devolução</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleAddMovement}
                className="w-full"
              >
                <Plus className="mr-1 h-4 w-4" />
                Registrar
              </Button>
            </div>
          </div>
        </div>
        
        {inventoryMovements.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Movimentações Recentes</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {inventoryMovements.slice().reverse().map((movement, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/40">
                  <div className="flex items-center">
                    {movement.type === "loan" ? (
                      <ArrowUpFromLine className="h-4 w-4 mr-2 text-red-500" />
                    ) : (
                      <ArrowDownToLine className="h-4 w-4 mr-2 text-green-500" />
                    )}
                    <div>
                      <span className="font-medium">{getProductName(movement.product)}</span>
                      <span> - {movement.quantity} unidade(s)</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(movement.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
