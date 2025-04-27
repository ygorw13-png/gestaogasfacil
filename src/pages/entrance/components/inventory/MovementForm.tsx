
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { InventoryMovement } from "../../types/cashierTypes";
import { useToast } from "@/hooks/use-toast";

interface MovementFormProps {
  onAddMovement: (movement: InventoryMovement) => void;
}

export function MovementForm({ onAddMovement }: MovementFormProps) {
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
    
    const movement: InventoryMovement = {
      product,
      quantity,
      type: movementType,
      timestamp: new Date().toISOString()
    };
    
    onAddMovement(movement);
    
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

  return (
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
  );
}
