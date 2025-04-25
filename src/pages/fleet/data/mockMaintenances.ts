
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
