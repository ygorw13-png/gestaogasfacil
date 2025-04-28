
import { supabase } from "./client";
import { CylinderLoan, StockConfig, StockRequest } from "@/types/supabaseTypes";

// A more type-safe approach for custom tables not in the generated types
export const customTables = {
  // Cylinder loans
  cylinderLoans: {
    select: () => {
      return supabase
        .from("cascos_emprestados")
        .select("*") as unknown as Promise<{
          data: CylinderLoan[] | null;
          error: any;
        }>;
    },
    insert: (data: Partial<CylinderLoan> | Partial<CylinderLoan>[]) => {
      return supabase
        .from("cascos_emprestados")
        .insert(data) as unknown as Promise<{
          data: CylinderLoan[] | null;
          error: any;
        }>;
    },
    update: (data: Partial<CylinderLoan>) => {
      return supabase
        .from("cascos_emprestados")
        .update(data)
        .eq("id", data.id) as unknown as Promise<{
          data: CylinderLoan[] | null;
          error: any;
        }>;
    },
    delete: (id: string) => {
      return supabase
        .from("cascos_emprestados")
        .delete()
        .eq("id", id) as unknown as Promise<{
          data: CylinderLoan[] | null;
          error: any;
        }>;
    },
  },
  
  // Stock configuration
  stockConfig: {
    select: () => {
      return supabase
        .from("configuracoes_estoque")
        .select("*") as unknown as Promise<{
          data: StockConfig[] | null;
          error: any;
        }>;
    },
    insert: (data: Partial<StockConfig> | Partial<StockConfig>[]) => {
      return supabase
        .from("configuracoes_estoque")
        .insert(data) as unknown as Promise<{
          data: StockConfig[] | null;
          error: any;
        }>;
    },
    update: (data: Partial<StockConfig>) => {
      return supabase
        .from("configuracoes_estoque")
        .update(data)
        .eq("id", data.id) as unknown as Promise<{
          data: StockConfig[] | null;
          error: any;
        }>;
    },
    delete: (id: string) => {
      return supabase
        .from("configuracoes_estoque")
        .delete()
        .eq("id", id) as unknown as Promise<{
          data: StockConfig[] | null;
          error: any;
        }>;
    },
  },
  
  // Stock requests
  stockRequests: {
    select: () => {
      return supabase
        .from("requisicoes_estoque")
        .select("*") as unknown as Promise<{
          data: StockRequest[] | null;
          error: any;
        }>;
    },
    insert: (data: Partial<StockRequest> | Partial<StockRequest>[]) => {
      return supabase
        .from("requisicoes_estoque")
        .insert(data) as unknown as Promise<{
          data: StockRequest[] | null;
          error: any;
        }>;
    },
    update: (data: Partial<StockRequest>) => {
      return supabase
        .from("requisicoes_estoque")
        .update(data)
        .eq("id", data.id) as unknown as Promise<{
          data: StockRequest[] | null;
          error: any;
        }>;
    },
    delete: (id: string) => {
      return supabase
        .from("requisicoes_estoque")
        .delete()
        .eq("id", id) as unknown as Promise<{
          data: StockRequest[] | null;
          error: any;
        }>;
    },
  }
};
