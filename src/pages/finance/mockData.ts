
import { Vehicle, Employee, FuelExpense, MaintenanceExpense, MiscExpense, FixedExpense } from './types';

export const mockVehicles: Vehicle[] = [
  { id: "1", plate: "ABC-1234", model: "Fiat Strada" },
  { id: "2", plate: "DEF-5678", model: "VW Saveiro" },
];

export const mockEmployees: Employee[] = [
  { id: "1", name: "João Silva", role: "Motorista" },
  { id: "2", name: "Pedro Santos", role: "Entregador" },
];

export const mockFuelExpenses: FuelExpense[] = [
  {
    id: "1",
    date: new Date(),
    vehicleId: "1",
    liters: 40,
    pricePerLiter: 5.79,
    totalAmount: 231.60,
    notes: "Abastecimento regular",
  },
];

export const mockMaintenanceExpenses: MaintenanceExpense[] = [
  {
    id: "1",
    date: new Date(),
    type: "vehicle",
    description: "Troca de óleo",
    amount: 250.00,
    vehicleId: "1",
  },
  {
    id: "2",
    date: new Date(),
    type: "workplace",
    description: "Manutenção do ar condicionado",
    amount: 350.00,
  },
];

export const mockMiscExpenses: MiscExpense[] = [
  {
    id: "1",
    date: new Date(),
    description: "Material de escritório",
    amount: 150.00,
    category: "Escritório",
  },
];

export const mockFixedExpenses: FixedExpense[] = [
  {
    id: "1",
    description: "Aluguel",
    amount: 2500.00,
    dueDay: 10,
    category: "Infraestrutura",
  },
];
