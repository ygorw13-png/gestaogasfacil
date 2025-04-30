
import { StockRequest } from "@/types/supabaseTypes";
import { createTableOperations } from "./tableUtils";

// Stock requests table operations
export const stockRequestsTable = createTableOperations<StockRequest>('requisicoes_estoque');
