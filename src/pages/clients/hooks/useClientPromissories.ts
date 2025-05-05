
import { useState } from "react";

interface ClientPromissory {
  id: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
}

// Mock data - em uma implementação real, isso viria do backend
const mockPromissories: ClientPromissory[] = [
  { id: "1", amount: 110, dueDate: "2025-05-10", status: "pending" },
  { id: "2", amount: 120, dueDate: "2025-04-15", status: "paid" },
  { id: "3", amount: 95, dueDate: "2025-04-01", status: "overdue" },
];

export function useClientPromissories() {
  const [promissories] = useState<ClientPromissory[]>(mockPromissories);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "overdue":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  return {
    promissories,
    formatDate,
    formatCurrency,
    getStatusBadgeColor
  };
}
