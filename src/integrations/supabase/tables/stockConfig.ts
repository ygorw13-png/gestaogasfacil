
import { supabase } from "../client";
import { StockConfig } from "@/types/supabaseTypes";
import { PostgrestError } from "@supabase/supabase-js";

// Defining response types to avoid deep instantiation issues
export interface StockConfigResponse {
  data: StockConfig[] | null;
  error: PostgrestError | null;
}

export interface SingleStockConfigResponse {
  data: StockConfig | null;
  error: PostgrestError | null;
}

// Stock configuration table operations
export const stockConfigTable = {
  select: async (): Promise<StockConfigResponse> => {
    return await supabase
      .from('configuracoes_estoque')
      .select('*');
  },
  
  insert: async (data: StockConfig): Promise<SingleStockConfigResponse> => {
    return await supabase
      .from('configuracoes_estoque')
      .insert(data)
      .select()
      .single();
  },
  
  update: async (data: Partial<StockConfig> & { id: string }): Promise<SingleStockConfigResponse> => {
    const { id, ...updateData } = data;
    
    return await supabase
      .from('configuracoes_estoque')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
  },
  
  delete: async (id: string): Promise<{ error: PostgrestError | null }> => {
    return await supabase
      .from('configuracoes_estoque')
      .delete()
      .eq('id', id);
  },
};
