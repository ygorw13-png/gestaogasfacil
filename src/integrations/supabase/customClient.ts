
import { supabase } from "./client";
import { CylinderLoan, StockConfig, StockRequest } from "@/types/supabaseTypes";

// Create wrapper functions for the custom tables
export const customTables = {
  // Cylinder loans
  cylinderLoans: {
    select: () => supabase.from('cascos_emprestados'),
    insert: (data: Partial<CylinderLoan> | Partial<CylinderLoan>[]) => 
      supabase.from('cascos_emprestados').insert(data),
    update: (data: Partial<CylinderLoan>) => 
      supabase.from('cascos_emprestados').update(data),
  },
  // Stock configuration
  stockConfig: {
    select: () => supabase.from('configuracoes_estoque'),
    insert: (data: Partial<StockConfig> | Partial<StockConfig>[]) => 
      supabase.from('configuracoes_estoque').insert(data),
    update: (data: Partial<StockConfig>) => 
      supabase.from('configuracoes_estoque').update(data),
  },
  // Stock requests
  stockRequests: {
    select: () => supabase.from('requisicoes_estoque'),
    insert: (data: Partial<StockRequest> | Partial<StockRequest>[]) => 
      supabase.from('requisicoes_estoque').insert(data),
    update: (data: Partial<StockRequest>) => 
      supabase.from('requisicoes_estoque').update(data),
  },
};
