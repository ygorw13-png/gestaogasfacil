
import { PromissoryNote } from "../types";

export const promissoryNotes: PromissoryNote[] = [
  {
    id: 1,
    clientName: "João Silva",
    value: 350.00,
    dueDate: new Date("2024-04-30"),
    status: "pending",
    collector: null,
    paymentHistory: []
  },
  {
    id: 2,
    clientName: "Maria Santos",
    value: 780.50,
    dueDate: new Date("2024-04-28"),
    status: "assigned",
    collector: "Carlos Oliveira",
    paymentHistory: []
  },
  {
    id: 3,
    clientName: "Pedro Souza",
    value: 1200.00,
    dueDate: new Date("2024-05-05"),
    status: "pending",
    collector: null,
    paymentHistory: []
  },
  {
    id: 4,
    clientName: "Ana Oliveira",
    value: 450.00,
    dueDate: new Date("2024-04-25"),
    status: "paid",
    collector: null,
    paymentHistory: [
      { date: new Date("2024-04-25"), amount: 450.00, method: "Dinheiro" }
    ]
  },
  {
    id: 5,
    clientName: "Roberto Carlos",
    value: 980.00,
    dueDate: new Date("2024-04-20"),
    status: "overdue",
    collector: null,
    paymentHistory: []
  }
];

export const collectors = [
  "Carlos Oliveira",
  "Ana Paula",
  "Roberto Santos",
  "Márcia Lima"
];
