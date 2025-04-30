
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
  timestamp: string;  // Explicitamente definido como string
  totalSales: number;
  quantities: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
  observations?: string;
}

// InventoryTableProps interface
export interface InventoryTableProps {
  data: {
    product: string;
    initial: number;
    additions: number;
    sales: number;
    final: number;
  }[];
  inventoryMovements?: InventoryMovement[];
}

// PaymentSummaryProps interface
export interface PaymentSummaryProps {
  data: CashierData;
  formatCurrency?: (value: number) => string;
  formatQuantities?: (quantities: { p13: number; p20: number; p45: number; water: number }) => string;
}

// ClosingExportData interface
export interface ClosingExportData {
  date: string;
  type: string;
  totalSales: number;
  p13Quantity: number;
  p20Quantity: number;
  p45Quantity: number;
  waterQuantity: number;
  paymentMethods: {
    cash: number;
    credit: number;
    debit: number;
    pix: number;
    promissory: number;
    gasVoucher: number;
  };
  inventory: {
    initial: {
      p13: number;
      p20: number;
      p45: number;
      water: number;
    };
    final: {
      p13: number;
      p20: number;
      p45: number;
      water: number;
    };
  };
  observations?: string;
}
