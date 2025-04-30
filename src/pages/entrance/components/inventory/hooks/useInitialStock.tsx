
import { useState, useEffect } from "react";
import { InventoryMovement } from "../../../types/cashierTypes";
import { getCurrentStock, syncStockWithDashboard } from "@/pages/dashboard/data";

interface UseInitialStockProps {
  onInventoryMovement: (movement: InventoryMovement) => void;
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
}

export function useInitialStock({ onInventoryMovement, currentStock }: UseInitialStockProps) {
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

  return { initializing };
}
