
import { supabase } from "../client";
import { StockConfig } from "@/types/supabaseTypes";

// Stock configuration table operations
export const stockConfigTable = {
  select: async () => {
    const response = await supabase
      .from('configuracoes_estoque')
      .select('*');
    return response;
  },
  
  insert: async (data: StockConfig) => {
    const response = await supabase
      .from('configuracoes_estoque')
      .insert(data);
    return response;
  },
  
  update: async (data: Partial<StockConfig> & { id: string }) => {
    const { id, ...updateData } = data;
    
    const response = await supabase
      .from('configuracoes_estoque')
      .update(updateData)
      .eq('id', id);
    return response;
  },
  
  delete: async (id: string) => {
    const response = await supabase
      .from('configuracoes_estoque')
      .delete()
      .eq('id', id);
    return response;
  },
};
