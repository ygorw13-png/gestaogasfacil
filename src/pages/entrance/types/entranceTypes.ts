
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
}
