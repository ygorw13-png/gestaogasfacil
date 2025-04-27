
import { PromissoryNote } from "../types";

export const mockPromissoryNotes: PromissoryNote[] = [
  {
    id: "1",
    clientName: "Supermercado Silva",
    value: 2500.00,
    dueDate: new Date("2025-05-15"),
    status: "pending",
    createdAt: new Date("2025-04-01")
  },
  {
    id: "2",
    clientName: "Supermercado Silva",
    value: 1800.00,
    dueDate: new Date("2025-04-30"),
    status: "paid",
    createdAt: new Date("2025-03-15"),
    paidAt: new Date("2025-04-25")
  },
  {
    id: "3",
    clientName: "Restaurante Sabor & Cia",
    value: 3200.00,
    dueDate: new Date("2025-05-20"),
    status: "assigned",
    createdAt: new Date("2025-04-05"),
    assignedTo: "Carlos Santos"
  },
  {
    id: "4",
    clientName: "Hotel Estrela",
    value: 4500.00,
    dueDate: new Date("2025-05-10"),
    status: "paid",
    createdAt: new Date("2025-03-20"),
    paidAt: new Date("2025-04-15")
  },
  {
    id: "5",
    clientName: "Restaurante Sabor & Cia",
    value: 2800.00,
    dueDate: new Date("2025-06-01"),
    status: "pending",
    createdAt: new Date("2025-04-15")
  },
  {
    id: "6",
    clientName: "Pizzaria Bella",
    value: 1500.00,
    dueDate: new Date("2025-05-25"),
    status: "paid",
    createdAt: new Date("2025-04-01"),
    paidAt: new Date("2025-04-20")
  },
  {
    id: "7",
    clientName: "Lanchonete Bom Sabor",
    value: 900.00,
    dueDate: new Date("2025-05-30"),
    status: "pending",
    createdAt: new Date("2025-04-10")
  },
  {
    id: "8",
    clientName: "Hotel Estrela",
    value: 3800.00,
    dueDate: new Date("2025-06-15"),
    status: "assigned",
    createdAt: new Date("2025-04-20"),
    assignedTo: "Maria Oliveira"
  },
  {
    id: "9",
    clientName: "Restaurante Fino",
    value: 5200.00,
    dueDate: new Date("2025-05-28"),
    status: "paid",
    createdAt: new Date("2025-03-28"),
    paidAt: new Date("2025-04-25")
  },
  {
    id: "10",
    clientName: "Padaria Delícia",
    value: 1200.00,
    dueDate: new Date("2025-06-05"),
    status: "pending",
    createdAt: new Date("2025-04-15")
  },
  {
    id: "11",
    clientName: "Supermercado Silva",
    value: 3100.00,
    dueDate: new Date("2025-06-10"),
    status: "pending",
    createdAt: new Date("2025-04-20")
  },
  {
    id: "12",
    clientName: "Restaurante Fino",
    value: 4800.00,
    dueDate: new Date("2025-06-20"),
    status: "assigned",
    createdAt: new Date("2025-04-22"),
    assignedTo: "Carlos Santos"
  },
  {
    id: "13",
    clientName: "Hotel Estrela",
    value: 2900.00,
    dueDate: new Date("2025-05-15"),
    status: "paid",
    createdAt: new Date("2025-03-15"),
    paidAt: new Date("2025-04-10")
  },
  {
    id: "14",
    clientName: "Padaria Delícia",
    value: 1600.00,
    dueDate: new Date("2025-06-25"),
    status: "pending",
    createdAt: new Date("2025-04-25")
  },
  {
    id: "15",
    clientName: "Pizzaria Bella",
    value: 2200.00,
    dueDate: new Date("2025-06-30"),
    status: "pending",
    createdAt: new Date("2025-04-25")
  }
];

export const collectors = [
  "Carlos Santos",
  "Maria Oliveira",
  "Roberto Lima",
  "Juliana Costa"
];
