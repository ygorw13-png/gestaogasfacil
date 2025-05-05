
import { useState } from "react";

interface ClientPurchase {
  id: string;
  date: string;
  product: string;
  quantity: number;
  amount: number;
  paymentMethod: string;
}

// Mock data - em uma implementação real, isso viria do backend
const mockPurchases: ClientPurchase[] = [
  { id: "1", date: "2025-05-01", product: "P13", quantity: 1, amount: 110, paymentMethod: "Dinheiro" },
  { id: "2", date: "2025-04-22", product: "P13", quantity: 2, amount: 220, paymentMethod: "Cartão de crédito" },
  { id: "3", date: "2025-04-10", product: "P20", quantity: 1, amount: 180, paymentMethod: "Dinheiro" },
];

export function useClientPurchases() {
  const [purchases] = useState<ClientPurchase[]>(mockPurchases);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  return {
    purchases,
    formatDate,
    formatCurrency
  };
}
