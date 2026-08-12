
export interface MaintenanceItem {
  id: string;
  vehiclePlate: string;
  type: string;
  scheduledDate: string;
  completionDate?: string | null;
  priority: "high" | "medium" | "low";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  estimatedCost: number;
  actualCost?: number;
  mileage?: number;
  notes?: string;
}

export interface VehicleExpense {
  id: string;
  vehiclePlate: string;
  date: string;
  description: string;
  type: "fuel" | "maintenance" | "tax" | "insurance" | "other";
  amount: number;
  notes?: string;
}

export interface FuelEntry {
  id: string;
  vehiclePlate: string;
  date: string;
  mileage: number;
  previousMileage?: number;
  fuelType: string;
  liters: number;
  cost: number;
  notes?: string;
}

export interface VehicleAssignment {
  id: string;
  vehiclePlate: string;
  employeeName: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  notes?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  type: "car" | "truck" | "van" | "moto";
  status: "active" | "maintenance" | "inactive";
  mileage: number;
  lastMaintenance?: string;
  notes?: string;
}
