
import { supabase } from "../client";
import { StockRequest } from "@/types/supabaseTypes";
import { CustomTable } from "./tableUtils";

// Stock requests table operations
export const stockRequestsTable: CustomTable<StockRequest> = {
  select: async () => {
    const response = await supabase
      .from('requisicoes_estoque')
      .select('*')
      .returns<StockRequest[]>();
    return response;
  },
  
  insert: async (data: Omit<StockRequest, 'id'>) => {
    const response = await supabase
      .from('requisicoes_estoque')
      .insert(data)
      .returns<StockRequest[]>();
    return response;
  },
  
  update: async (data: Partial<StockRequest> & { id: string }) => {
    const { id, ...updateData } = data;
    
    const response = await supabase
      .from('requisicoes_estoque')
      .update(updateData)
      .eq('id', id)
      .returns<StockRequest[]>();
    return response;
  },
  
  delete: async (id: string) => {
    const response = await supabase
      .from('requisicoes_estoque')
      .delete()
      .eq('id', id)
      .returns<StockRequest[]>();
    return response;
  },
};
