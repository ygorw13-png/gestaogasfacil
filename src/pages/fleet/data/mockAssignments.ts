
import { addDays, subDays } from 'date-fns';

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
