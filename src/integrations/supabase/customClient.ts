
import { supabase } from "./client";
import { CylinderLoan, StockConfig, StockRequest } from "@/types/supabaseTypes";
import { PostgrestResponse } from "@supabase/supabase-js";
import { UserRole } from "@/types/userTypes";

// Interface for profiles
interface Profile {
  id: string;
  name: string;
  role: UserRole;
}

// A more type-safe approach for custom tables
export const customTables = {
  // Cylinder loans
  cylinderLoans: {
    select: async (): Promise<PostgrestResponse<CylinderLoan[]>> => {
      const response = await supabase
        .from('cascos_emprestados')
        .select('*');
      return response;
    },
    
    insert: async (data: Partial<CylinderLoan> | Partial<CylinderLoan>[]): Promise<PostgrestResponse<CylinderLoan[]>> => {
      const response = await supabase
        .from('cascos_emprestados')
        .insert(data);
      return response;
    },
    
    update: async (data: Partial<CylinderLoan>): Promise<PostgrestResponse<CylinderLoan[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      const response = await supabase
        .from('cascos_emprestados')
        .update(data)
        .eq('id', data.id);
      return response;
    },
    
    delete: async (id: string): Promise<PostgrestResponse<CylinderLoan[]>> => {
      const response = await supabase
        .from('cascos_emprestados')
        .delete()
        .eq('id', id);
      return response;
    },
  },
  
  // Stock configuration
  stockConfig: {
    select: async (): Promise<PostgrestResponse<StockConfig[]>> => {
      const response = await supabase
        .from('configuracoes_estoque')
        .select('*');
      return response;
    },
    
    insert: async (data: Partial<StockConfig> | Partial<StockConfig>[]): Promise<PostgrestResponse<StockConfig[]>> => {
      const response = await supabase
        .from('configuracoes_estoque')
        .insert(data);
      return response;
    },
    
    update: async (data: Partial<StockConfig>): Promise<PostgrestResponse<StockConfig[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      const response = await supabase
        .from('configuracoes_estoque')
        .update(data)
        .eq('id', data.id);
      return response;
    },
    
    delete: async (id: string): Promise<PostgrestResponse<StockConfig[]>> => {
      const response = await supabase
        .from('configuracoes_estoque')
        .delete()
        .eq('id', id);
      return response;
    },
  },
  
  // Stock requests
  stockRequests: {
    select: async (): Promise<PostgrestResponse<StockRequest[]>> => {
      const response = await supabase
        .from('requisicoes_estoque')
        .select('*');
      return response;
    },
    
    insert: async (data: Partial<StockRequest> | Partial<StockRequest>[]): Promise<PostgrestResponse<StockRequest[]>> => {
      const response = await supabase
        .from('requisicoes_estoque')
        .insert(data);
      return response;
    },
    
    update: async (data: Partial<StockRequest>): Promise<PostgrestResponse<StockRequest[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      const response = await supabase
        .from('requisicoes_estoque')
        .update(data)
        .eq('id', data.id);
      return response;
    },
    
    delete: async (id: string): Promise<PostgrestResponse<StockRequest[]>> => {
      const response = await supabase
        .from('requisicoes_estoque')
        .delete()
        .eq('id', id);
      return response;
    },
  },
  
  // Profiles
  profiles: {
    select: async (): Promise<PostgrestResponse<Profile[]>> => {
      const response = await supabase
        .from('profiles')
        .select('*');
      return response;
    },
    
    update: async (data: Partial<Profile>): Promise<PostgrestResponse<Profile[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      const response = await supabase
        .from('profiles')
        .update(data)
        .eq('id', data.id);
      return response;
    },
  },

  // Utility function to clear test data
  clearTestData: async (): Promise<void> => {
    await supabase.rpc('clear_test_data');
  }
};
