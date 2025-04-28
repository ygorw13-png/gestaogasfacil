
export interface CashierData {
  cash: number;
  credit: number;
  debit: number;
  pix: number;
  promissory: number;
  gasVoucher: number;
  totalSales: number;
  quantities: {
    cash: { p13: number; p20: number; p45: number; water: number };
    credit: { p13: number; p20: number; p45: number; water: number };
    debit: { p13: number; p20: number; p45: number; water: number };
    pix: { p13: number; p20: number; p45: number; water: number };
    promissory: { p13: number; p20: number; p45: number; water: number };
    gasVoucher: { p13: number; p20: number; p45: number; water: number };
  };
  inventoryMovements: InventoryMovement[];
}

export interface InventoryMovement {
  product: string;
  quantity: number;
  type: "loan" | "return" | "initial" | "route";
  timestamp: string;
}

export interface PartialClosing {
  id: string;
  date: string;
  amount: number;
  observations?: string;
  hasReport: boolean;
}
