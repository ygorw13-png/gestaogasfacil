
export const initialInventoryClosing = [
  { product: 'GLP P13', initial: 50, additions: 0, sales: 0, final: 50 },
  { product: 'GLP P20', initial: 10, additions: 0, sales: 0, final: 10 },
  { product: 'GLP P45', initial: 5, additions: 0, sales: 0, final: 5 },
  { product: 'Água 20L', initial: 50, additions: 0, sales: 0, final: 50 },
];

export const inventoryClosing = [
  { product: 'GLP P13', initial: 50, additions: 0, sales: 0, final: 50 },
  { product: 'GLP P20', initial: 10, additions: 0, sales: 0, final: 10 },
  { product: 'GLP P45', initial: 5, additions: 0, sales: 0, final: 5 },
  { product: 'Água 20L', initial: 50, additions: 0, sales: 0, final: 50 },
];

// Função para retornar a contagem de estoque atual
export const getCurrentStock = () => {
  return {
    p13: inventoryClosing[0].final,
    p20: inventoryClosing[1].final,
    p45: inventoryClosing[2].final,
    water: inventoryClosing[3].final
  };
};

// Função para atualizar o estoque final
export const updateFinalStock = (
  product: string, 
  newFinal: number
) => {
  const index = inventoryClosing.findIndex(item => item.product.includes(product));
  if (index !== -1) {
    inventoryClosing[index].final = newFinal;
    return true;
  }
  return false;
};

// Função para atualizar as vendas de estoque
export const updateInventorySales = (
  product: string,
  quantity: number
) => {
  const index = inventoryClosing.findIndex(item => item.product.includes(product));
  if (index !== -1) {
    inventoryClosing[index].sales += quantity;
    inventoryClosing[index].final = inventoryClosing[index].initial + 
                                    inventoryClosing[index].additions - 
                                    inventoryClosing[index].sales;
    return true;
  }
  return false;
};

// Função para resetar o inventário para os valores iniciais
export const resetInventory = () => {
  inventoryClosing.forEach((item, index) => {
    Object.assign(item, initialInventoryClosing[index]);
  });
};
