
import { Badge } from "@/components/ui/badge";
import { InventoryStatusBadgeProps } from "../types/inventory-types";

export function InventoryStatusBadge({ 
  quantity, 
  threshold = 10 
}: InventoryStatusBadgeProps) {
  const isLowStock = quantity <= threshold;
  
  return (
    <Badge variant={isLowStock ? "destructive" : "default"}>
      {isLowStock ? "Estoque Baixo" : "Disponível"}
    </Badge>
  );
}
