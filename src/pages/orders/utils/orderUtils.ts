import { nomeForma } from "@/lib/formasPagamento";

export const getPaymentMethodName = (method: string | undefined) => nomeForma(method);

export const getDeliveryType = (order: { isCompletePackage: boolean; hasEmptyCylinder: boolean }) => {
  if (order.isCompletePackage) {
    return "Venda completa (gás + vasilhame)";
  } else if (order.hasEmptyCylinder) {
    return "Troca (cliente entrega vasilhame vazio)";
  } else {
    return "Empréstimo (cliente não tem vasilhame para trocar)";
  }
};

export const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  return date.toLocaleDateString('pt-BR') + " " + 
         date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "Pendente",
    assigned: "Atribuído",
    delivering: "Em entrega",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };
  return statusMap[status] || status;
};

export const getOrderStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-500",
    assigned: "bg-blue-500",
    delivering: "bg-amber-500",
    delivered: "bg-green-600",
    cancelled: "bg-red-500",
  };
  return colorMap[status] || "bg-gray-500";
};
