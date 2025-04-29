
import { supabase } from "../client";
import { Colaborador } from "@/types/supabaseTypes";

// Colaboradores table operations
export const colaboradoresTable = {
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
};
