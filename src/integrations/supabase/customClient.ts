
import { supabase } from "./client";
import { CylinderLoan, StockConfig, StockRequest } from "@/types/supabaseTypes";

// A more type-safe approach for custom tables not in the generated types
export const customTables = {
  // Cylinder loans
  cylinderLoans: {
    select: () => supabase.from("cascos_emprestados").select() as unknown as Promise<{
      data: CylinderLoan[] | null;
      error: any;
    }>,
    insert: (data: Partial<CylinderLoan> | Partial<CylinderLoan>[]) => 
      supabase.from("cascos_emprestados").insert(data) as unknown as Promise<{
        data: CylinderLoan[] | null;
        error: any;
      }>,
    update: (data: Partial<CylinderLoan>) => 
      supabase.from("cascos_emprestados").update(data) as unknown as Promise<{
        data: CylinderLoan[] | null;
        error: any;
      }>,
    delete: () => 
      supabase.from("cascos_emprestados").delete() as unknown as Promise<{
        data: CylinderLoan[] | null;
        error: any;
      }>,
  },
  
  // Stock configuration
  stockConfig: {
    select: () => supabase.from("configuracoes_estoque").select() as unknown as Promise<{
      data: StockConfig[] | null;
      error: any;
    }>,
    insert: (data: Partial<StockConfig> | Partial<StockConfig>[]) => 
      supabase.from("configuracoes_estoque").insert(data) as unknown as Promise<{
        data: StockConfig[] | null;
        error: any;
      }>,
    update: (data: Partial<StockConfig>) => 
      supabase.from("configuracoes_estoque").update(data) as unknown as Promise<{
        data: StockConfig[] | null;
        error: any;
      }>,
    delete: () => 
      supabase.from("configuracoes_estoque").delete() as unknown as Promise<{
        data: StockConfig[] | null;
        error: any;
      }>,
  },
  
  // Stock requests
  stockRequests: {
    select: () => supabase.from("requisicoes_estoque").select() as unknown as Promise<{
      data: StockRequest[] | null;
      error: any;
    }>,
    insert: (data: Partial<StockRequest> | Partial<StockRequest>[]) => 
      supabase.from("requisicoes_estoque").insert(data) as unknown as Promise<{
        data: StockRequest[] | null;
        error: any;
      }>,
    update: (data: Partial<StockRequest>) => 
      supabase.from("requisicoes_estoque").update(data) as unknown as Promise<{
        data: StockRequest[] | null;
        error: any;
      }>,
    delete: () => 
      supabase.from("requisicoes_estoque").delete() as unknown as Promise<{
        data: StockRequest[] | null;
        error: any;
      }>,
  }
};
