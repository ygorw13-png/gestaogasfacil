export interface RouteClient {
  name: string;
  items: string;
  value: number;
}

export interface RouteDetails {
  gasP13Sold: number;
  gasP20Sold: number;
  gasP45Sold: number;
  waterSold: number;
  clients: RouteClient[];
}

export interface RouteReport {
  id: string;
  date: string;
  driver: string;
  destination: string;
  salesCount: number;
  totalAmount: number;
  details: RouteDetails;
}

export const mockDrivers = [
  { id: "1", name: "João Silva" },
  { id: "2", name: "Pedro Santos" },
  { id: "3", name: "Carlos Ferreira" },
  { id: "4", name: "André Oliveira" },
];

export const mockReports: RouteReport[] = [
  {
    id: "1",
    date: "2025-04-23",
    driver: "João Silva",
    destination: "Povoado Santa Maria",
    salesCount: 8,
    totalAmount: 1320.00,
    details: {
      gasP13Sold: 5,
      gasP20Sold: 2,
      gasP45Sold: 1,
      waterSold: 3,
      clients: [
        { name: "Maria da Silva", items: "1x Gás P13", value: 120.00 },
        { name: "José Pereira", items: "1x Gás P20, 2x Água", value: 240.00 },
        { name: "Ana Santos", items: "1x Gás P13, 1x Água", value: 160.00 }
      ]
    }
  },
  {
    id: "2",
    date: "2025-04-20",
    driver: "Pedro Santos",
    destination: "Cidade de São Miguel",
    salesCount: 12,
    totalAmount: 2140.00,
    details: {
      gasP13Sold: 8,
      gasP20Sold: 4,
      gasP45Sold: 0,
      waterSold: 5,
      clients: [
        { name: "Roberto Alves", items: "1x Gás P13", value: 120.00 },
        { name: "Cláudia Mendes", items: "1x Gás P20, 1x Água", value: 200.00 }
      ]
    }
  },
  {
    id: "3",
    date: "2025-04-18",
    driver: "Carlos Ferreira",
    destination: "Povoado Baixa Grande",
    salesCount: 6,
    totalAmount: 950.00,
    details: {
      gasP13Sold: 4,
      gasP20Sold: 1,
      gasP45Sold: 0,
      waterSold: 2,
      clients: [
        { name: "Paulo Ribeiro", items: "1x Gás P13", value: 120.00 },
        { name: "Teresa Gonçalves", items: "1x Gás P20", value: 180.00 }
      ]
    }
  }
];
