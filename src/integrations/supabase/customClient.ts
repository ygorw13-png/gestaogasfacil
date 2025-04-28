
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
      // Use 'as any' to bypass the type checking for the table name
      const response = await supabase
        .from('cascos_emprestados' as any)
        .select('*');
      
      return response;
    },
    
    insert: async (data: Partial<CylinderLoan> | Partial<CylinderLoan>[]): Promise<PostgrestResponse<CylinderLoan[]>> => {
      // Use 'as any' to bypass the type checking for the table name and data
      const response = await supabase
        .from('cascos_emprestados' as any)
        .insert(data as any);
      
      return response;
    },
    
    update: async (data: Partial<CylinderLoan>): Promise<PostgrestResponse<CylinderLoan[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      // Use 'as any' to bypass the type checking for the table name and data
      const response = await supabase
        .from('cascos_emprestados' as any)
        .update(data as any)
        .eq('id', data.id);
      
      return response;
    },
    
    delete: async (id: string): Promise<PostgrestResponse<CylinderLoan[]>> => {
      // Use 'as any' to bypass the type checking for the table name
      const response = await supabase
        .from('cascos_emprestados' as any)
        .delete()
        .eq('id', id);
      
      return response;
    },
  },
  
  // Stock configuration
  stockConfig: {
    select: async (): Promise<PostgrestResponse<StockConfig[]>> => {
      // Use 'as any' to bypass the type checking for the table name
      const response = await supabase
        .from('configuracoes_estoque' as any)
        .select('*');
      
      return response;
    },
    
    insert: async (data: Partial<StockConfig> | Partial<StockConfig>[]): Promise<PostgrestResponse<StockConfig[]>> => {
      // Use 'as any' to bypass the type checking for the table name and data
      const response = await supabase
        .from('configuracoes_estoque' as any)
        .insert(data as any);
      
      return response;
    },
    
    update: async (data: Partial<StockConfig>): Promise<PostgrestResponse<StockConfig[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      // Use 'as any' to bypass the type checking for the table name and data
      const response = await supabase
        .from('configuracoes_estoque' as any)
        .update(data as any)
        .eq('id', data.id);
      
      return response;
    },
    
    delete: async (id: string): Promise<PostgrestResponse<StockConfig[]>> => {
      // Use 'as any' to bypass the type checking for the table name
      const response = await supabase
        .from('configuracoes_estoque' as any)
        .delete()
        .eq('id', id);
      
      return response;
    },
  },
  
  // Stock requests
  stockRequests: {
    select: async (): Promise<PostgrestResponse<StockRequest[]>> => {
      // Use 'as any' to bypass the type checking for the table name
      const response = await supabase
        .from('requisicoes_estoque' as any)
        .select('*');
      
      return response;
    },
    
    insert: async (data: Partial<StockRequest> | Partial<StockRequest>[]): Promise<PostgrestResponse<StockRequest[]>> => {
      // Use 'as any' to bypass the type checking for the table name and data
      const response = await supabase
        .from('requisicoes_estoque' as any)
        .insert(data as any);
      
      return response;
    },
    
    update: async (data: Partial<StockRequest>): Promise<PostgrestResponse<StockRequest[]>> => {
      if (!data.id) {
        throw new Error("ID is required for update operations");
      }
      
      // Use 'as any' to bypass the type checking for the table name and data
      const response = await supabase
        .from('requisicoes_estoque' as any)
        .update(data as any)
        .eq('id', data.id);
      
      return response;
    },
    
    delete: async (id: string): Promise<PostgrestResponse<StockRequest[]>> => {
      // Use 'as any' to bypass the type checking for the table name
      const response = await supabase
        .from('requisicoes_estoque' as any)
        .delete()
        .eq('id', id);
      
      return response;
    },
  },

  // Profiles (user profiles)
  profiles: {
    select: async (): Promise<PostgrestResponse<Profile[]>> => {
      // Use direct supabase query since this is a standard table
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
