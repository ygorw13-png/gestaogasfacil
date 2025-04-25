
import { Reseller } from "./types";

export const mockResellers: Reseller[] = [
  {
    id: "1",
    name: "Distribuidora Gás Express",
    phone: "11987654321",
    address: "Av. Central, 123",
    contactPerson: "José Silva",
    priceP13: 80,
    priceP20: 150,
    priceP45: 280,
    priceWater: 8,
    notes: "Cliente desde janeiro de 2024, bom histórico de pagamentos.",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Água e Gás Delivery",
    phone: "11912345678",
    address: "Rua das Flores, 456",
    contactPerson: "Maria Oliveira",
    priceP13: 85,
    priceP20: 155,
    priceP45: 290,
    priceWater: 9,
    notes: "Prefere entregas às terças e quintas.",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "3",
    name: "Gás do João",
    phone: "11955556666",
    contactPerson: "João Pereira",
    priceP13: 82,
    priceP20: 152,
    priceP45: 285,
    priceWater: 8.5,
    createdAt: new Date("2024-03-10"),
  },
];
