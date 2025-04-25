
export const getPaymentMethodName = (method: string | undefined) => {
  if (!method) return "Não informado";
  
  const methods: Record<string, string> = {
    cash: "Dinheiro",
    credit: "Cartão de Crédito",
    debit: "Cartão de Débito",
    pix: "PIX",
    promissory: "Promissória",
    voucher: "Vale Gás",
  };
  
  return methods[method] || method;
};

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
