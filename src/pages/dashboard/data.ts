
export const salesData = [];

export const overviewData = {
  todaySales: 'R$ 0,00',
  totalStock: {
    gasP13: 0,
    gasP20: 0,
    gasP45: 0,
    water: 0
  },
  promissoryNotes: 0,
  promissoryValue: 'R$ 0,00'
};

export const topSellers = [];

// Estes dados podem ser inicializados a partir do localStorage ou de uma API
export const getCurrentStock = () => {
  return {
    p13: 0,
    p20: 0,
    p45: 0,
    water: 0
  };
};

// Função para sincronizar os estoques entre a portaria e o dashboard
export const syncStockWithDashboard = (stock: { p13: number; p20: number; p45: number; water: number }) => {
  // Em uma implementação real, você salvaria isso em uma API ou localStorage
  console.log('Sincronizando estoque com dashboard:', stock);
  
  // Atualiza o overviewData para refletir o novo estoque
  overviewData.totalStock = {
    gasP13: stock.p13,
    gasP20: stock.p20, 
    gasP45: stock.p45,
    water: stock.water
  };
  
  return true;
};
