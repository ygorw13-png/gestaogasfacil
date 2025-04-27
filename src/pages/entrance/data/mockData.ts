
export const initialInventoryClosing = [
  { product: 'GLP P13', initial: 50, additions: 20, sales: 38, final: 32 },
  { product: 'GLP P20', initial: 10, additions: 5, sales: 2, final: 13 },
  { product: 'GLP P45', initial: 5, additions: 0, sales: 2, final: 3 },
  { product: 'Água 20L', initial: 50, additions: 30, sales: 28, final: 52 },
];

export const inventoryClosing = [
  { product: 'GLP P13', initial: 50, additions: 20, sales: 38, final: 32 },
  { product: 'GLP P20', initial: 10, additions: 5, sales: 2, final: 13 },
  { product: 'GLP P45', initial: 5, additions: 0, sales: 2, final: 3 },
  { product: 'Água 20L', initial: 50, additions: 30, sales: 28, final: 52 },
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

// Função para resetar o inventário para os valores iniciais
export const resetInventory = () => {
  inventoryClosing.forEach((item, index) => {
    Object.assign(item, initialInventoryClosing[index]);
  });
};
