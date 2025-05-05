
import { supabase } from "../client";
import { StockConfig } from "@/types/supabaseTypes";
import { PostgrestError } from "@supabase/supabase-js";

// Defining tipos de resposta para evitar problemas de instanciação profunda
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
          : { 
              message: "Erro ao buscar configurações",
              details: String(error),
              hint: "",
              code: "custom_error"
            } as PostgrestError
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
          : { 
              message: "Erro ao inserir configuração",
              details: String(error),
              hint: "",
              code: "custom_error"
            } as PostgrestError
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
          : { 
              message: "Erro ao atualizar configuração",
              details: String(error),
              hint: "",
              code: "custom_error"
            } as PostgrestError
      };
    }
  },
  
  // Novo método para upsert - cria se não existir, atualiza se existir
  upsert: async (data: StockConfig): Promise<SingleStockConfigResponse> => {
    try {
      const response = await supabase
        .from('configuracoes_estoque')
        .upsert(data, { 
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      return response;
    } catch (error) {
      console.error("Erro ao upsert configuração de estoque:", error);
      return {
        data: null,
        error: error instanceof PostgrestError 
          ? error 
          : { 
              message: "Erro ao criar/atualizar configuração",
              details: String(error),
              hint: "",
              code: "custom_error"
            } as PostgrestError
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
          : { 
              message: "Erro ao excluir configuração",
              details: String(error),
              hint: "",
              code: "custom_error"
            } as PostgrestError
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
          : { 
              message: `Erro ao buscar configuração ${id}`,
              details: String(error),
              hint: "",
              code: "custom_error"
            } as PostgrestError
      };
    }
  }
};
