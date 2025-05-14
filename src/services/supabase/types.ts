
// API Response
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T | null;
  error: {
    message: string;
    details?: string | undefined;
  } | null;
}

// Valid table names to use with our Supabase hooks
export type ValidTableName = 
  | 'configuracoes_estoque'
  | 'orders'
  | 'clients'
  | 'dashboard_data'
  | 'colaboradores'
  | 'profiles'
  | 'requisicoes_estoque';

// Query options for data fetching
export interface QueryOptions {
  columns?: string;
  filters?: Record<string, unknown>;
  orderBy?: { 
    column: string; 
    ascending?: boolean 
  };
  pagination?: { 
    page: number; 
    pageSize: number 
  };
}
