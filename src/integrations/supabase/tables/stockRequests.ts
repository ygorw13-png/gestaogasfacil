
import { supabase } from "../client";
import { StockRequest } from "@/types/supabaseTypes";
import { CustomTable } from "./tableUtils";

// Stock requests table operations
export const stockRequestsTable: CustomTable<StockRequest> = {
  select: async () => {
    // Changed from single() to just the basic query to return PostgrestResponse<T[]>
    const response = await supabase
      .from('requisicoes_estoque')
      .select('*');
    return response;
  },
  
  insert: async (data: Omit<StockRequest, 'id'>) => {
    const response = await supabase
      .from('requisicoes_estoque')
      .insert(data);
    return response;
  },
  
  update: async (data: Partial<StockRequest> & { id: string }) => {
    const { id, ...updateData } = data;
    
    const response = await supabase
      .from('requisicoes_estoque')
      .update(updateData)
      .eq('id', id);
    return response;
  },
  
  delete: async (id: string) => {
    const response = await supabase
      .from('requisicoes_estoque')
      .delete()
      .eq('id', id);
    return response;
  },
};
