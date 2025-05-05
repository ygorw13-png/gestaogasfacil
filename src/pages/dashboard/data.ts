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
export async function syncStockWithDashboard(stockData: {
  p13: number;
  p20: number;
  p45: number;
  water: number;
}) {
  try {
    const { data: existingData, error: fetchError } = await supabase
      .from('dashboard_data')
      .select('id')
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingData) {
      // Atualiza o registro existente
      const { error: updateError } = await supabase
        .from('dashboard_data')
        .update({
          stock_data: stockData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Cria um novo registro se não existir
      const { error: insertError } = await supabase
        .from('dashboard_data')
        .insert({
          stock_data: stockData,
          sales_data: [],
          user_id: 'system'
        });

      if (insertError) {
        throw insertError;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao sincronizar estoque com o dashboard:', error);
    throw error;
  }
}
