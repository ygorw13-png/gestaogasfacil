
import { addDays, subDays, format } from "date-fns";

// Dados fictícios para demonstração

// Veículos
export const mockVehicles = [
  {
    id: "vehicle-1",
    plate: "ABC-1234",
    model: "Fiat Strada",
    year: 2022,
    type: "car",
    status: "active",
    mileage: 15000,
    lastMaintenance: "10/01/2025",
    documentExpiration: "20/07/2025",
  },
  {
    id: "vehicle-2",
    plate: "DEF-5678",
    model: "VW Saveiro",
    year: 2023,
    type: "car",
    status: "maintenance",
    mileage: 8500,
    lastMaintenance: "15/03/2025",
    documentExpiration: "05/09/2025",
  },
  {
    id: "vehicle-3",
    plate: "GHI-9012",
    model: "Ford F-4000",
    year: 2021,
    type: "truck",
    status: "active",
    mileage: 32000,
    lastMaintenance: "22/02/2025",
    documentExpiration: "15/10/2025",
  },
  {
    id: "vehicle-4",
    plate: "JKL-3456",
    model: "Mercedes Sprinter",
    year: 2020,
    type: "van",
    status: "active",
    mileage: 45000,
    lastMaintenance: "18/12/2024",
    documentExpiration: "30/06/2025",
  },
  {
    id: "vehicle-5",
    plate: "MNO-7890",
    model: "Renault Master",
    year: 2021,
    type: "van",
    status: "inactive",
    mileage: 50000,
    lastMaintenance: "05/11/2024",
    documentExpiration: "22/08/2025",
  }
];

// Funcionários
export const mockEmployees = [
  {
    id: "employee-1",
    name: "João Silva",
    role: "Motorista",
    document: "123.456.789-00"
  },
  {
    id: "employee-2",
    name: "Maria Oliveira",
    role: "Entregador",
    document: "987.654.321-00"
  },
  {
    id: "employee-3",
    name: "Carlos Santos",
    role: "Motorista",
    document: "111.222.333-44"
  },
  {
    id: "employee-4",
    name: "Ana Pereira",
    role: "Vendedor",
    document: "555.666.777-88"
  },
  {
    id: "employee-5",
    name: "Lucas Ferreira",
    role: "Entregador",
    document: "999.888.777-66"
  }
];

// Atribuições de veículos
export const mockAssignments = [
  {
    id: "assignment-1",
    vehicleId: "vehicle-1",
    vehiclePlate: "ABC-1234",
    employeeId: "employee-1",
    employeeName: "João Silva",
    startDate: new Date(2025, 0, 15),
    endDate: null,
    isActive: true
  },
  {
    id: "assignment-2",
    vehicleId: "vehicle-3",
    vehiclePlate: "GHI-9012",
    employeeId: "employee-3",
    employeeName: "Carlos Santos",
    startDate: new Date(2025, 1, 10),
    endDate: null,
    isActive: true
  },
  {
    id: "assignment-3",
    vehicleId: "vehicle-4",
    vehiclePlate: "JKL-3456",
    employeeId: "employee-5",
    employeeName: "Lucas Ferreira",
    startDate: new Date(2024, 11, 20),
    endDate: new Date(2025, 4, 30),
    isActive: true
  },
  {
    id: "assignment-4",
    vehicleId: "vehicle-5",
    vehiclePlate: "MNO-7890",
    employeeId: "employee-2",
    employeeName: "Maria Oliveira",
    startDate: new Date(2024, 10, 5),
    endDate: new Date(2025, 1, 28),
    isActive: false
  }
];

// Manutenções
export const mockMaintenances = [
  {
    id: "maintenance-1",
    vehicleId: "vehicle-1",
    vehiclePlate: "ABC-1234",
    type: "Troca de Óleo",
    description: "Troca de óleo e filtros",
    scheduledDate: new Date(2025, 4, 15),
    completionDate: null,
    estimatedCost: 250,
    actualCost: null,
    status: "scheduled",
    priority: "medium",
    mileage: 15000
  },
  {
    id: "maintenance-2",
    vehicleId: "vehicle-2",
    vehiclePlate: "DEF-5678",
    type: "Revisão de Freios",
    description: "Substituição das pastilhas e discos",
    scheduledDate: new Date(2025, 3, 5),
    completionDate: new Date(2025, 3, 8),
    estimatedCost: 650,
    actualCost: 720,
    status: "completed",
    priority: "high",
    mileage: 8500
  },
  {
    id: "maintenance-3",
    vehicleId: "vehicle-3",
    vehiclePlate: "GHI-9012",
    type: "Troca de Pneus",
    description: "Substituição dos 6 pneus",
    scheduledDate: new Date(2025, 5, 22),
    completionDate: null,
    estimatedCost: 3000,
    actualCost: null,
    status: "scheduled",
    priority: "medium",
    mileage: 32000
  },
  {
    id: "maintenance-4",
    vehicleId: "vehicle-4",
    vehiclePlate: "JKL-3456",
    type: "Revisão Geral",
    description: "Revisão dos 50.000 km",
    scheduledDate: new Date(2025, 4, 10),
    completionDate: null,
    estimatedCost: 1200,
    actualCost: null,
    status: "in-progress",
    priority: "medium",
    mileage: 45000
  },
  {
    id: "maintenance-5",
    vehicleId: "vehicle-5",
    vehiclePlate: "MNO-7890",
    type: "Troca de Correia Dentada",
    description: "Substituição do kit de correia",
    scheduledDate: new Date(2025, 2, 18),
    completionDate: new Date(2025, 2, 20),
    estimatedCost: 850,
    actualCost: 880,
    status: "completed",
    priority: "high",
    mileage: 50000
  }
];

// Abastecimentos
export const mockFuelEntries = [
  {
    id: "fuel-1",
    vehicleId: "vehicle-1",
    vehiclePlate: "ABC-1234",
    date: new Date(2025, 3, 12),
    mileage: 14500,
    previousMileage: 14000,
    fuelType: "gasoline",
    liters: 40,
    pricePerLiter: 5.79,
    cost: 231.60,
    station: "Posto Ipiranga",
    fullTank: true
  },
  {
    id: "fuel-2",
    vehicleId: "vehicle-3",
    vehiclePlate: "GHI-9012",
    date: new Date(2025, 3, 15),
    mileage: 31500,
    previousMileage: 31000,
    fuelType: "diesel-s10",
    liters: 120,
    pricePerLiter: 5.99,
    cost: 718.80,
    station: "Posto Shell",
    fullTank: true
  },
  {
    id: "fuel-3",
    vehicleId: "vehicle-1",
    vehiclePlate: "ABC-1234",
    date: new Date(2025, 3, 20),
    mileage: 15000,
    previousMileage: 14500,
    fuelType: "gasoline",
    liters: 38,
    pricePerLiter: 5.89,
    cost: 223.82,
    station: "Posto Petrobras",
    fullTank: true
  },
  {
    id: "fuel-4",
    vehicleId: "vehicle-4",
    vehiclePlate: "JKL-3456",
    date: new Date(2025, 3, 18),
    mileage: 44500,
    previousMileage: 44000,
    fuelType: "diesel",
    liters: 80,
    pricePerLiter: 5.85,
    cost: 468.00,
    station: "Auto Posto Central",
    fullTank: true
  }
];

// Despesas de Veículos
export const mockVehicleExpenses = [
  {
    id: "expense-1",
    vehicleId: "vehicle-1",
    vehiclePlate: "ABC-1234",
    date: new Date(2025, 3, 12),
    description: "Abastecimento",
    type: "fuel",
    amount: 231.60,
    receipt: "NF-5678"
  },
  {
    id: "expense-2",
    vehicleId: "vehicle-2",
    vehiclePlate: "DEF-5678",
    date: new Date(2025, 3, 8),
    description: "Revisão de freios",
    type: "maintenance",
    amount: 720,
    receipt: "OS-1234"
  },
  {
    id: "expense-3",
    vehicleId: "vehicle-3",
    vehiclePlate: "GHI-9012",
    date: new Date(2025, 3, 15),
    description: "Abastecimento",
    type: "fuel",
    amount: 718.80,
    receipt: "NF-9012"
  },
  {
    id: "expense-4",
    vehicleId: "vehicle-1",
    vehiclePlate: "ABC-1234",
    date: new Date(2025, 3, 5),
    description: "IPVA 2025",
    type: "tax",
    amount: 1200.00,
    receipt: "DAR-5678"
  },
  {
    id: "expense-5",
    vehicleId: "vehicle-4",
    vehiclePlate: "JKL-3456",
    date: new Date(2025, 2, 20),
    description: "Seguro Anual",
    type: "insurance",
    amount: 3500.00,
    receipt: "APL-7890"
  },
  {
    id: "expense-6",
    vehicleId: "vehicle-1",
    vehiclePlate: "ABC-1234",
    date: new Date(2025, 3, 20),
    description: "Abastecimento",
    type: "fuel",
    amount: 223.82,
    receipt: "NF-3456"
  },
  {
    id: "expense-7",
    vehicleId: "vehicle-5",
    vehiclePlate: "MNO-7890",
    date: new Date(2025, 2, 20),
    description: "Troca de correia dentada",
    type: "maintenance",
    amount: 880.00,
    receipt: "OS-5678"
  },
  {
    id: "expense-8",
    vehicleId: "vehicle-4",
    vehiclePlate: "JKL-3456",
    date: new Date(2025, 3, 18),
    description: "Abastecimento",
    type: "fuel",
    amount: 468.00,
    receipt: "NF-7890"
  }
];
