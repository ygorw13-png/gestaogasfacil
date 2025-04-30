
import { useMemo } from "react";
import { InventoryMovement } from "../../types/cashierTypes";

export function calculateNetMovements(inventoryMovements: InventoryMovement[]) {
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
