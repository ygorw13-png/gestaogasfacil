import { supabase } from "./client";
import { CylinderLoan, DbProfile, StockConfig, StockRequest, Colaborador } from "@/types/supabaseTypes";

// A more type-safe approach for custom tables
export const customTables = {
  // Cylinder loans
  cylinderLoans: {
    select: async () => {
      const response = await supabase
        .from('cascos_emprestados')
        .select('*');
      return response;
    },
    
    insert: async (data: Omit<CylinderLoan, 'id'>) => {
      const response = await supabase
        .from('cascos_emprestados')
        .insert(data);
      return response;
    },
    
    update: async (data: Partial<CylinderLoan> & { id: string }) => {
      const { id, ...updateData } = data;
      
      const response = await supabase
        .from('cascos_emprestados')
        .update(updateData)
        .eq('id', id);
      return response;
    },
    
    delete: async (id: string) => {
      const response = await supabase
        .from('cascos_emprestados')
        .delete()
        .eq('id', id);
      return response;
    },
  },
  
  // Stock configuration
  stockConfig: {
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
  },
  
  // Stock requests
  stockRequests: {
    select: async () => {
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
  },
  
  // Colaboradores
  colaboradores: {
    select: async () => {
      const response = await supabase
        .from('colaboradores')
        .select('*');
      return response;
    },
    
    selectAtivos: async () => {
      const response = await supabase
        .from('colaboradores')
        .select('*')
        .eq('situacao', 'ativo');
      return response;
    },
    
    getById: async (id: string) => {
      const response = await supabase
        .from('colaboradores')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      return response;
    },
    
    insert: async (data: Omit<Colaborador, 'id' | 'criado_em' | 'atualizado_em'>) => {
      const response = await supabase
        .from('colaboradores')
        .insert(data);
      return response;
    },
    
    update: async (data: Partial<Colaborador> & { id: string }) => {
      const { id, ...updateData } = data;
      
      const response = await supabase
        .from('colaboradores')
        .update(updateData)
        .eq('id', id);
      return response;
    },
    
    delete: async (id: string) => {
      const response = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id);
      return response;
    },
  },
  
  // Profiles
  profiles: {
    select: async () => {
      const response = await supabase
        .from('profiles')
        .select('*');
      return response;
    },
    
    // Método para selecionar usuários por organização
    selectByOrganization: async (organizationId: string) => {
      const response = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId);
      return response;
    },
    
    update: async (data: Partial<DbProfile> & { id: string }) => {
      const { id, ...updateData } = data;
      
      const response = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);
      return response;
    },
  },

  // Organizations
  organizations: {
    select: async () => {
      // Using raw query to avoid TypeScript issues with tables not in the types file
      const response = await supabase
        .from('organizations')
        .select('*');
      return response;
    },
    
    getById: async (id: string) => {
      // Using raw query to avoid TypeScript issues with tables not in the types file
      const response = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();
      return response;
    }
  },

  // Utility function to clear test data
  clearTestData: async (): Promise<void> => {
    await supabase.rpc('clear_test_data');
  }
};
