
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
  id: number | string;
  time: string;
  client: string;
  product: string;
  quantity: number;
  payment: string;
  paymentCode?: string;
  amount: number;
  /** false = valor não informado (preço NULL no banco). */
  valorInformado?: boolean;
  // Metadados opcionais para registrar movimentação no estoque da portaria
  productCode?: 'p13' | 'p20' | 'p45' | 'water' | 'vasilhame_p13';
  tipoVenda?: 'completa' | 'recarga' | 'vasilhame';
  vasilhamesEntregues?: number;
  vasilhamesRecebidos?: number;

  clientId?: string | null;
  /** Retirada de agregado (sem valor): id do agregado. */
  resellerId?: string | null;
  cylinderMovement?: 'none' | 'loan' | 'return';
  movementQuantity?: number;
}
