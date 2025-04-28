
import { supabase } from "./client";
import { CylinderLoan, DbProfile, StockConfig, StockRequest } from "@/types/supabaseTypes";
import { PostgrestResponse } from "@supabase/supabase-js";
import { UserRole } from "@/types/userTypes";

// A more type-safe approach for custom tables
export const customTables = {
  // Cylinder loans
  cylinderLoans: {
    select: async (): Promise<PostgrestResponse<CylinderLoan[]>> => {
      const response = await supabase
        .from('cascos_emprestados')
        .select('*');
      return response as PostgrestResponse<CylinderLoan[]>;
    },
    
    insert: async (data: Omit<CylinderLoan, 'id'> | Omit<CylinderLoan, 'id'>[]): Promise<PostgrestResponse<CylinderLoan[]>> => {
      const response = await supabase
        .from('cascos_emprestados')
        .insert(data);
      return response as PostgrestResponse<CylinderLoan[]>;
    },
    
    update: async (data: Partial<CylinderLoan> & { id: string }): Promise<PostgrestResponse<CylinderLoan[]>> => {
      const { id, ...updateData } = data;
      
      const response = await supabase
        .from('cascos_emprestados')
        .update(updateData)
        .eq('id', id);
      return response as PostgrestResponse<CylinderLoan[]>;
    },
    
    delete: async (id: string): Promise<PostgrestResponse<CylinderLoan[]>> => {
      const response = await supabase
        .from('cascos_emprestados')
        .delete()
        .eq('id', id);
      return response as PostgrestResponse<CylinderLoan[]>;
    },
  },
  
  // Stock configuration
  stockConfig: {
    select: async (): Promise<PostgrestResponse<StockConfig[]>> => {
      const response = await supabase
        .from('configuracoes_estoque')
        .select('*');
      return response as PostgrestResponse<StockConfig[]>;
    },
    
    insert: async (data: Omit<StockConfig, 'id'> | Omit<StockConfig, 'id'>[]): Promise<PostgrestResponse<StockConfig[]>> => {
      const response = await supabase
        .from('configuracoes_estoque')
        .insert(data);
      return response as PostgrestResponse<StockConfig[]>;
    },
    
    update: async (data: Partial<StockConfig> & { id: string }): Promise<PostgrestResponse<StockConfig[]>> => {
      const { id, ...updateData } = data;
      
      const response = await supabase
        .from('configuracoes_estoque')
        .update(updateData)
        .eq('id', id);
      return response as PostgrestResponse<StockConfig[]>;
    },
    
    delete: async (id: string): Promise<PostgrestResponse<StockConfig[]>> => {
      const response = await supabase
        .from('configuracoes_estoque')
        .delete()
        .eq('id', id);
      return response as PostgrestResponse<StockConfig[]>;
    },
  },
  
  // Stock requests
  stockRequests: {
    select: async (): Promise<PostgrestResponse<StockRequest[]>> => {
      const response = await supabase
        .from('requisicoes_estoque')
        .select('*');
      return response as PostgrestResponse<StockRequest[]>;
    },
    
    insert: async (data: Omit<StockRequest, 'id'> | Omit<StockRequest, 'id'>[]): Promise<PostgrestResponse<StockRequest[]>> => {
      const response = await supabase
        .from('requisicoes_estoque')
        .insert(data);
      return response as PostgrestResponse<StockRequest[]>;
    },
    
    update: async (data: Partial<StockRequest> & { id: string }): Promise<PostgrestResponse<StockRequest[]>> => {
      const { id, ...updateData } = data;
      
      const response = await supabase
        .from('requisicoes_estoque')
        .update(updateData)
        .eq('id', id);
      return response as PostgrestResponse<StockRequest[]>;
    },
    
    delete: async (id: string): Promise<PostgrestResponse<StockRequest[]>> => {
      const response = await supabase
        .from('requisicoes_estoque')
        .delete()
        .eq('id', id);
      return response as PostgrestResponse<StockRequest[]>;
    },
  },
  
  // Profiles
  profiles: {
    select: async (): Promise<PostgrestResponse<DbProfile[]>> => {
      const response = await supabase
        .from('profiles')
        .select('*');
      return response as PostgrestResponse<DbProfile[]>;
    },
    
    update: async (data: Partial<DbProfile> & { id: string }): Promise<PostgrestResponse<DbProfile[]>> => {
      const { id, ...updateData } = data;
      
      const response = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);
      return response as PostgrestResponse<DbProfile[]>;
    },
  },

  // Utility function to clear test data
  clearTestData: async (): Promise<void> => {
    await supabase.rpc('clear_test_data');
  }
};
