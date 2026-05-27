
import { CashierData } from "./cashierTypes";

export interface SalesByType {
  type: string;
  amount: number;
  icon: JSX.Element;
}

export interface EntranceState {
  newSaleOpen: boolean;
  cashierClosingOpen: boolean;
  cashierData: CashierData;
  recentSales: Sale[];
  glpSales: {
    p13: number;
    p20: number;
    p45: number;
  };
  waterSales: number;
}

export interface Sale {
  id: number;
  time: string;
  client: string;
  product: string;
  quantity: number;
  payment: string;
  amount: number;
  // Metadados opcionais para registrar movimentação no estoque da portaria
  productCode?: 'p13' | 'p20' | 'p45' | 'water';
  clientId?: string | null;
  cylinderMovement?: 'none' | 'loan' | 'return';
  movementQuantity?: number;
}
