
import { RouteReport } from "./types";

export interface Driver {
  id: string;
  name: string;
}

export type { RouteReport };

export const mockDrivers: Driver[] = [
  { id: "1", name: "João Silva" },
  { id: "2", name: "Pedro Santos" },
  { id: "3", name: "Carlos Ferreira" },
];

export const mockReports: RouteReport[] = [
  {
    id: "1",
    date: "2025-04-25",
    driver: "João Silva",
    destination: "Povoado Santa Maria",
    salesCount: 8,
    totalAmount: 1240.50,
    details: {
      gasP13Sold: 6,
      gasP20Sold: 1,
      gasP45Sold: 0,
      waterSold: 5,
      clients: [
        { name: "Maria Souza", items: "1x Gás P13, 2x Água", value: 170.50 },
        { name: "José Oliveira", items: "2x Gás P13", value: 220.00 },
        { name: "Ana Lima", items: "1x Gás P20, 1x Água", value: 170.00 },
      ]
    }
  },
  {
    id: "2",
    date: "2025-04-24",
    driver: "Pedro Santos",
    destination: "Cidade de São Miguel",
    salesCount: 12,
    totalAmount: 1850.00,
    details: {
      gasP13Sold: 10,
      gasP20Sold: 2,
      gasP45Sold: 0,
      waterSold: 8,
      clients: [
        { name: "Roberto Alves", items: "1x Gás P13, 1x Água", value: 125.00 },
        { name: "Juliana Costa", items: "1x Gás P20", value: 150.00 },
        { name: "Marcos Silva", items: "2x Gás P13, 2x Água", value: 250.00 },
      ]
    }
  },
  {
    id: "3",
    date: "2025-04-23",
    driver: "Carlos Ferreira",
    destination: "Povoado Baixa Grande",
    salesCount: 6,
    totalAmount: 780.00,
    details: {
      gasP13Sold: 5,
      gasP20Sold: 0,
      gasP45Sold: 1,
      waterSold: 3,
      clients: [
        { name: "Fernanda Santos", items: "1x Gás P13, 1x Água", value: 125.00 },
        { name: "Ricardo Gomes", items: "1x Gás P45", value: 300.00 },
        { name: "Camila Ferreira", items: "1x Gás P13", value: 110.00 },
      ]
    }
  }
];
