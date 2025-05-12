
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertOctagon } from "lucide-react";

interface StockAlertProps {
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
  minStock?: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
}

export function StockAlert({ 
  currentStock, 
  minStock = { p13: 20, p20: 5, p45: 5, water: 20 } 
}: StockAlertProps) {
  // Verificar se algum produto está com estoque baixo
  const lowStock = {
    p13: currentStock.p13 < minStock.p13,
    p20: currentStock.p20 < minStock.p20,
    p45: currentStock.p45 < minStock.p45,
    water: currentStock.water < minStock.water
  };

  const hasLowStock = lowStock.p13 || lowStock.p20 || lowStock.p45 || lowStock.water;

  if (!hasLowStock) return null;

  return (
    <Alert variant="warning">
      <AlertOctagon className="h-4 w-4" />
      <AlertTitle>Atenção ao estoque!</AlertTitle>
      <AlertDescription>
        <p>Os seguintes produtos estão com estoque abaixo do mínimo recomendado:</p>
        <ul className="list-disc list-inside mt-2">
          {lowStock.p13 && (
            <li>GLP P13: {currentStock.p13} unidades (mínimo: {minStock.p13})</li>
          )}
          {lowStock.p20 && (
            <li>GLP P20: {currentStock.p20} unidades (mínimo: {minStock.p20})</li>
          )}
          {lowStock.p45 && (
            <li>GLP P45: {currentStock.p45} unidades (mínimo: {minStock.p45})</li>
          )}
          {lowStock.water && (
            <li>Água 20L: {currentStock.water} unidades (mínimo: {minStock.water})</li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
