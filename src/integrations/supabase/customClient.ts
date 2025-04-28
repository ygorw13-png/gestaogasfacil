
import { supabase } from "./client";
import { CylinderLoan, StockConfig, StockRequest } from "@/types/supabaseTypes";
import { PostgrestFilterBuilder } from "@supabase/supabase-js";

// Creating a custom client that can query tables not in the generated types
const createCustomQuery = <T>(tableName: string) => {
  return {
    select: () => supabase.from(tableName) as unknown as PostgrestFilterBuilder<any, any, T[]>,
    insert: (data: Partial<T> | Partial<T>[]) => 
      supabase.from(tableName).insert(data) as unknown as PostgrestFilterBuilder<any, any, T[]>,
    update: (data: Partial<T>) => 
      supabase.from(tableName).update(data) as unknown as PostgrestFilterBuilder<any, any, T[]>,
    delete: () => 
      supabase.from(tableName).delete() as unknown as PostgrestFilterBuilder<any, any, T[]>,
  };
};

// Create wrapper functions for the custom tables
export const customTables = {
  // Cylinder loans
  cylinderLoans: createCustomQuery<CylinderLoan>("cascos_emprestados"),
  
  // Stock configuration
  stockConfig: createCustomQuery<StockConfig>("configuracoes_estoque"),
  
  // Stock requests
  stockRequests: createCustomQuery<StockRequest>("requisicoes_estoque"),
};
