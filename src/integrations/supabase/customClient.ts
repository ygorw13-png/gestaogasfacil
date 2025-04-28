
import { supabase } from "./client";
import { CylinderLoan, StockConfig, StockRequest } from "@/types/supabaseTypes";

// Creating a custom client that can query tables not in the generated types
const createCustomQuery = <T>(tableName: string) => {
  return {
    select: () => {
      return supabase.from(tableName).select() as unknown as Promise<{
        data: T[] | null;
        error: any;
      }>;
    },
    insert: (data: Partial<T> | Partial<T>[]) => {
      return supabase.from(tableName).insert(data) as unknown as Promise<{
        data: T[] | null;
        error: any;
      }>;
    },
    update: (data: Partial<T>) => {
      return supabase.from(tableName).update(data) as unknown as Promise<{
        data: T[] | null;
        error: any;
      }>;
    },
    delete: () => {
      return supabase.from(tableName).delete() as unknown as Promise<{
        data: T[] | null;
        error: any;
      }>;
    },
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
