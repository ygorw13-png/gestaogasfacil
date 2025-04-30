
import { RouteItem } from "../types";

// Mock data para rotas
export const mockRoutes: RouteItem[] = [
  {
    id: "1",
    date: "2025-04-25",
    driverId: "1",
    driverName: "João Silva",
    destination: "Povoado Santa Maria",
    clientsCount: 8,
    status: "in-progress",
    departureTime: "08:30",
    inventory: {
      gasP13: 30,
      gasP20: 5,
      gasP45: 2,
      emptyGasP13: 10,
      emptyGasP20: 2,
      emptyGasP45: 0,
      water: 15
    }
  },
  {
    id: "2",
    date: "2025-04-25",
    driverId: "2",
    driverName: "Pedro Santos",
    destination: "Cidade de São Miguel",
    clientsCount: 12,
    status: "completed",
    departureTime: "07:15",
    returnTime: "16:45",
    inventory: {
      gasP13: 45,
      gasP20: 8,
      gasP45: 5,
      emptyGasP13: 15,
      emptyGasP20: 4,
      emptyGasP45: 1,
      water: 25
    }
  },
  {
    id: "3",
    date: "2025-04-24",
    driverId: "3",
    driverName: "Carlos Ferreira",
    destination: "Povoado Baixa Grande",
    clientsCount: 6,
    status: "verified",
    departureTime: "08:00",
    returnTime: "14:30",
    inventory: {
      gasP13: 20,
      gasP20: 3,
      gasP45: 0,
      emptyGasP13: 8,
      emptyGasP20: 0,
      emptyGasP45: 0,
      water: 10
    }
  }
];
