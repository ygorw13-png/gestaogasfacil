
import { PostgrestError } from "@supabase/supabase-js";

// Interface for standardized API response
export interface ApiResponse<T> {
  data?: T;
  error?: PostgrestError | Error;
  status: 'success' | 'error';
  message?: string;
}

// Valid table names
export type ValidTableName = 'cascos_emprestados' | 'clients' | 'colaboradores' | 'organizations' | 
  'configuracoes_entrega' | 'configuracoes_estoque' | 'configuracoes_financeiras' | 
  'configuracoes_notificacoes' | 'configuracoes_seguranca' | 'configuracoes_sistema' | 
  'dashboard_data' | 'orders' | 'profiles' | 'requisicoes_estoque';

// Query options interface
export interface QueryOptions<TFilter = Record<string, any>> {
  columns?: string;
  filters?: TFilter;
  orderBy?: { column: string; ascending?: boolean };
  pagination?: { page: number; pageSize: number };
  relations?: string[];
}
