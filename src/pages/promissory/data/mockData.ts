
import { PromissoryNote, PromissoryStatus } from "../types";

// Função auxiliar para criar datas aleatórias no passado
const getRandomPastDate = (days: number = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date;
};

// Função auxiliar para criar datas aleatórias no futuro
const getRandomFutureDate = (days: number = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * days) + 1);
  return date;
};

// Mock de promissórias para teste
export const mockPromissoryNotes: PromissoryNote[] = [
  {
    id: "1",
    clientName: "João Silva",
    value: 120.00,
    dueDate: getRandomFutureDate(15),
    status: "pending",
    createdAt: getRandomPastDate(5)
  },
  {
    id: "2",
    clientName: "Maria Souza",
    value: 85.50,
    dueDate: getRandomFutureDate(10),
    status: "assigned",
    assignedTo: "Carlos Oliveira",
    createdAt: getRandomPastDate(7)
  },
  {
    id: "3",
    clientName: "Pedro Santos",
    value: 150.00,
    dueDate: getRandomFutureDate(20),
    status: "pending",
    createdAt: getRandomPastDate(3)
  },
  {
    id: "4",
    clientName: "Ana Pereira",
    value: 95.00,
    dueDate: getRandomPastDate(5),
    status: "overdue",
    createdAt: getRandomPastDate(15)
  },
  {
    id: "5",
    clientName: "Roberto Alves",
    value: 110.00,
    dueDate: getRandomPastDate(10),
    status: "paid",
    createdAt: getRandomPastDate(20),
    paidAt: getRandomPastDate(2)
  },
  {
    id: "6",
    clientName: "Carla Moreira",
    value: 130.00,
    dueDate: getRandomFutureDate(5),
    status: "pending",
    createdAt: getRandomPastDate(4)
  },
  {
    id: "7",
    clientName: "Fernando Costa",
    value: 200.00,
    dueDate: getRandomFutureDate(8),
    status: "assigned",
    assignedTo: "Lucas Ferreira",
    createdAt: getRandomPastDate(6)
  },
  {
    id: "8",
    clientName: "Mariana Lima",
    value: 75.00,
    dueDate: getRandomPastDate(8),
    status: "overdue",
    createdAt: getRandomPastDate(18)
  },
  {
    id: "9",
    clientName: "Paulo Mendes",
    value: 160.00,
    dueDate: getRandomPastDate(15),
    status: "paid",
    createdAt: getRandomPastDate(25),
    paidAt: getRandomPastDate(5)
  },
  {
    id: "10",
    clientName: "Juliana Freitas",
    value: 135.50,
    dueDate: getRandomFutureDate(12),
    status: "pending",
    createdAt: getRandomPastDate(2)
  }
];

export const collectors = [
  "Carlos Oliveira",
  "Lucas Ferreira",
  "Marcos Silva",
  "Rafael Souza",
  "Eduardo Santos"
];
