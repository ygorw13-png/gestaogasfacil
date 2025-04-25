
export type Vehicle = {
  id: string;
  plate: string;
  model: string;
  employeeId?: string;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
};

export type FuelExpense = {
  id: string;
  date: Date;
  vehicleId: string;
  liters: number;
  pricePerLiter: number;
  totalAmount: number;
  notes?: string;
};

export type MaintenanceExpense = {
  id: string;
  date: Date;
  type: 'vehicle' | 'workplace';
  description: string;
  amount: number;
  vehicleId?: string;
  notes?: string;
};

export type MiscExpense = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  notes?: string;
};

export type FixedExpense = {
  id: string;
  description: string;
  amount: number;
  dueDay: number;
  category: string;
  lastPayment?: Date;
  notes?: string;
};
