
import { supabase } from '@/integrations/supabase/client';

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

// Função para obter o estoque atual do usuário
export const getCurrentStock = async () => {
  try {
    const { data, error } = await supabase
      .from('dashboard_data')
      .select('stock_data')
      .single();
    
    if (error) {
      console.error("Erro ao buscar o estoque:", error);
      return {
        p13: 0,
        p20: 0,
        p45: 0,
        water: 0
      };
    }
    
    if (data && data.stock_data) {
      const stockData = data.stock_data as {
        p13?: number;
        p20?: number;
        p45?: number;
        water?: number;
      };
      
      return {
        p13: stockData.p13 || 0,
        p20: stockData.p20 || 0,
        p45: stockData.p45 || 0,
        water: stockData.water || 0
      };
    }
    
    // Se não existir, inicia com zeros
    return {
      p13: 0,
      p20: 0,
      p45: 0,
      water: 0
    };
  } catch (error) {
    console.error("Erro ao buscar o estoque:", error);
    return {
      p13: 0,
      p20: 0,
      p45: 0,
      water: 0
    };
  }
};

// Função para sincronizar os estoques entre a portaria e o dashboard
export const syncStockWithDashboard = async (stock: { p13: number; p20: number; p45: number; water: number }) => {
  try {
    // Pegar o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.id) {
      console.error("Usuário não autenticado");
      return false;
    }
    
    // Verifica se já existe um registro para o usuário atual
    const { data: existingData, error: checkError } = await supabase
      .from('dashboard_data')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Erro ao verificar dados do dashboard:", checkError);
      return false;
    }
    
    if (existingData) {
      // Atualiza o registro existente
      const { error } = await supabase
        .from('dashboard_data')
        .update({
          stock_data: {
            p13: stock.p13,
            p20: stock.p20,
            p45: stock.p45,
            water: stock.water
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
      
      if (error) {
        console.error("Erro ao atualizar estoque no dashboard:", error);
        return false;
      }
    } else {
      // Cria um novo registro
      const { error } = await supabase
        .from('dashboard_data')
        .insert({
          user_id: user.id,
          stock_data: {
            p13: stock.p13,
            p20: stock.p20,
            p45: stock.p45,
            water: stock.water
          },
          sales_data: []
        });
      
      if (error) {
        console.error("Erro ao criar registro de estoque no dashboard:", error);
        return false;
      }
    }
    
    // Atualiza o overviewData para refletir o novo estoque
    overviewData.totalStock = {
      gasP13: stock.p13,
      gasP20: stock.p20, 
      gasP45: stock.p45,
      water: stock.water
    };
    
    return true;
  } catch (error) {
    console.error("Erro ao sincronizar estoque com o dashboard:", error);
    return false;
  }
};
