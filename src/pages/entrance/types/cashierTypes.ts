
export interface CashierQuantities {
  p13: number;
  p20: number;
  p45: number;
  water: number;
}

export interface PaymentSummaryProps {
  data: CashierData;
  formatCurrency: (value: number) => string;
  formatQuantities: (quantities: CashierQuantities) => string;
}

export interface InventoryMovement {
  product: string;
  quantity: number;
  type: 'loan' | 'return';
  timestamp: string;
}

export interface InventoryTableProps {
  data: Array<{
    product: string;
    initial: number;
    additions: number;
    sales: number;
    final: number;
  }> & {
    inventoryMovements?: InventoryMovement[];
  };
}

export interface CashierData {
  cash: number;
  credit: number;
  debit: number;
  pix: number;
  promissory: number;
  gasVoucher: number;
  totalSales: number;
  quantities: {
    cash: CashierQuantities;
    credit: CashierQuantities;
    debit: CashierQuantities;
    pix: CashierQuantities;
    promissory: CashierQuantities;
    gasVoucher: CashierQuantities;
  };
  inventoryMovements: InventoryMovement[];
}
