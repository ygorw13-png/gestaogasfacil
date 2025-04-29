
import { supabase } from "../client";
import { CylinderLoan } from "@/types/supabaseTypes";
import { CustomTable } from "./tableUtils";

// Cylinder loans table operations
export const cylinderLoansTable: CustomTable<CylinderLoan> = {
  select: async () => {
    const response = await supabase
      .from('cascos_emprestados')
      .select('*')
      .returns<CylinderLoan[]>();
    return response;
  },
  
  insert: async (data: Omit<CylinderLoan, 'id'>) => {
    const response = await supabase
      .from('cascos_emprestados')
      .insert(data)
      .returns<CylinderLoan[]>();
    return response;
  },
  
  update: async (data: Partial<CylinderLoan> & { id: string }) => {
    const { id, ...updateData } = data;
    
    const response = await supabase
      .from('cascos_emprestados')
      .update(updateData)
      .eq('id', id)
      .returns<CylinderLoan[]>();
    return response;
  },
  
  delete: async (id: string) => {
    const response = await supabase
      .from('cascos_emprestados')
      .delete()
      .eq('id', id)
      .returns<CylinderLoan[]>();
    return response;
  },
};
