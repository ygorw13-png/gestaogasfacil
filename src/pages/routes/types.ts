
export interface RouteItem {
  id: string;
  date: string;
  driverId: string;
  driverName: string;
  destination: string;
  clientsCount: number;
  status: 'preparing' | 'in-progress' | 'completed' | 'verified';
  departureTime?: string;
  returnTime?: string;
  inventory: {
    gasP13: number;
    gasP20: number;
    gasP45: number;
    emptyGasP13: number;
    emptyGasP20: number;
    emptyGasP45: number;
    water: number;
  };
  sales?: RouteSale[];
  expenses?: RouteExpense[];
  notes?: string;
}

export interface RouteSale {
  id: string;
  clientId: string;
  clientName: string;
  location?: string; // GPS coordinates or address
  time: string;
  items: {
    gasP13?: number;
    gasP20?: number;
    gasP45?: number;
    water?: number;
    emptyGasP13?: number;
    emptyGasP20?: number;
    emptyGasP45?: number;
  };
  paymentMethod: 'money' | 'credit' | 'debit' | 'pix' | 'promissory';
  promissoryId?: string; // If payment method is promissory
  total: number;
  notes?: string;
  hasInternet: boolean; // Flag to indicate if the sale was made online or offline
}

export interface RouteExpense {
  id: string;
  description: string;
  amount: number;
  time: string;
  location?: string;
  receiptPhoto?: string; // URL to photo of the receipt
}

export interface RouteFormValues {
  driverId: string;
  destination: string;
  departureTime: string;
  inventory: {
    gasP13: number;
    gasP20: number;
    gasP45: number;
    emptyGasP13: number;
    emptyGasP20: number;
    emptyGasP45: number;
    water: number;
  };
  notes?: string;
}
