
import { useMemo } from "react";
import { InventoryMovement } from "../types/cashierTypes";

export interface MovementResults {
  P13: { loan: number, return: number, net: number };
  P20: { loan: number, return: number, net: number };
  P45: { loan: number, return: number, net: number };
  water: { loan: number, return: number, net: number };
}

export function calculateNetMovements(inventoryMovements: InventoryMovement[]): MovementResults {
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
}

export function useNetMovements(inventoryMovements: InventoryMovement[]) {
  return useMemo(() => calculateNetMovements(inventoryMovements), [inventoryMovements]);
}
