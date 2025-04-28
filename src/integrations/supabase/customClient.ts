
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

// A more type-safe approach for custom tables not in the generated types
export const customTables = {
  // Cylinder loans
  cylinderLoans: {
    select: async (): Promise<PostgrestResponse<CylinderLoan[]>> => {
      const response = await supabase
        .from('cascos_emprestados')
        .select('*');
      
      return response as PostgrestResponse<CylinderLoan[]>;
    },
    
    insert: async (data: Partial<CylinderLoan> | Partial<CylinderLoan>[]): Promise<PostgrestResponse<CylinderLoan[]>> => {
      const response = await supabase
        .from('cascos_emprestados')
        .insert(data);
      
      return response as PostgrestResponse<CylinderLoan[]>;
    },
    
    update: async (data: Partial<CylinderLoan>): Promise<PostgrestResponse<CylinderLoan[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      const response = await supabase
        .from('cascos_emprestados')
        .update(data)
        .eq('id', data.id);
      
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
    
    insert: async (data: Partial<StockConfig> | Partial<StockConfig>[]): Promise<PostgrestResponse<StockConfig[]>> => {
      const response = await supabase
        .from('configuracoes_estoque')
        .insert(data);
      
      return response as PostgrestResponse<StockConfig[]>;
    },
    
    update: async (data: Partial<StockConfig>): Promise<PostgrestResponse<StockConfig[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      const response = await supabase
        .from('configuracoes_estoque')
        .update(data)
        .eq('id', data.id);
      
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
    
    insert: async (data: Partial<StockRequest> | Partial<StockRequest>[]): Promise<PostgrestResponse<StockRequest[]>> => {
      const response = await supabase
        .from('requisicoes_estoque')
        .insert(data);
      
      return response as PostgrestResponse<StockRequest[]>;
    },
    
    update: async (data: Partial<StockRequest>): Promise<PostgrestResponse<StockRequest[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      const response = await supabase
        .from('requisicoes_estoque')
        .update(data)
        .eq('id', data.id);
      
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

  // Profiles (user profiles)
  profiles: {
    select: async (): Promise<PostgrestResponse<Profile[]>> => {
      const response = await supabase
        .from('profiles')
        .select('id, name, role');
      
      return response as PostgrestResponse<Profile[]>;
    },
    
    update: async (data: Partial<Profile>): Promise<PostgrestResponse<Profile[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      const response = await supabase
        .from('profiles')
        .update(data)
        .eq('id', data.id);
      
      return response as PostgrestResponse<Profile[]>;
    }
  }
};
