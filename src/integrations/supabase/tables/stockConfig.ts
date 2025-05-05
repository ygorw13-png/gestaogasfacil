
import { supabase } from "../client";
import { StockConfig } from "@/types/supabaseTypes";
import { PostgrestError } from "@supabase/supabase-js";

// Definindo tipos de resposta para evitar problemas de instanciação profunda
export interface StockConfigResponse {
  data: StockConfig[] | null;
  error: PostgrestError | null;
}

export interface SingleStockConfigResponse {
  data: StockConfig | null;
  error: PostgrestError | null;
}

// Operações da tabela de configurações de estoque
export const stockConfigTable = {
  select: async (): Promise<StockConfigResponse> => {
    try {
      const response = await supabase
        .from('configuracoes_estoque')
        .select('*');
      
      return response;
    } catch (error) {
      console.error("Erro ao selecionar configurações de estoque:", error);
      return {
        data: null,
        error: error instanceof PostgrestError 
          ? error 
          : new PostgrestError("Erro ao buscar configurações", 500)
      };
    }
  },
  
  insert: async (data: StockConfig): Promise<SingleStockConfigResponse> => {
    try {
      const response = await supabase
        .from('configuracoes_estoque')
        .insert(data)
        .select()
        .single();
      
      return response;
    } catch (error) {
      console.error("Erro ao inserir configuração de estoque:", error);
      return {
        data: null,
        error: error instanceof PostgrestError 
          ? error 
          : new PostgrestError("Erro ao inserir configuração", 500)
      };
    }
  },
  
  update: async (data: Partial<StockConfig> & { id: string }): Promise<SingleStockConfigResponse> => {
    try {
      const { id, ...updateData } = data;
      
      const response = await supabase
        .from('configuracoes_estoque')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      return response;
    } catch (error) {
      console.error("Erro ao atualizar configuração de estoque:", error);
      return {
        data: null,
        error: error instanceof PostgrestError 
          ? error 
          : new PostgrestError("Erro ao atualizar configuração", 500)
      };
    }
  },
  
  delete: async (id: string): Promise<{ error: PostgrestError | null }> => {
    try {
      const response = await supabase
        .from('configuracoes_estoque')
        .delete()
        .eq('id', id);
      
      return response;
    } catch (error) {
      console.error("Erro ao excluir configuração de estoque:", error);
      return {
        error: error instanceof PostgrestError 
          ? error 
          : new PostgrestError("Erro ao excluir configuração", 500)
      };
    }
  },

  // Método para buscar configuração específica
  getById: async (id: string): Promise<SingleStockConfigResponse> => {
    try {
      const response = await supabase
        .from('configuracoes_estoque')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      return response;
    } catch (error) {
      console.error(`Erro ao buscar configuração de estoque ${id}:`, error);
      return {
        data: null,
        error: error instanceof PostgrestError 
          ? error 
          : new PostgrestError(`Erro ao buscar configuração ${id}`, 500)
      };
    }
  }
};
