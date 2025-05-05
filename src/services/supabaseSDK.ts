
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { ValidTableName } from "@/services/supabase/types";

export interface SupabaseResponse<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

// Generic data fetching function
export async function fetchFromTable<T>(
  tableName: ValidTableName, 
  options: {
    columns?: string;
    where?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<SupabaseResponse<T>> {
  try {
    const { columns = '*', where, orderBy, limit, single } = options;
    
    // Start with a basic query
    let query = supabase.from(tableName).select(columns);
    
    // Apply filters
    if (where) {
      Object.entries(where).forEach(([key, value]) => {
        if (value !== undefined) {
          // Use eq method for equality filters
          query = query.eq(key, value);
        }
      });
    }
    
    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    // Execute query
    const result = single 
      ? await query.single()
      : await query;
      
    return { 
      data: result.data as T, 
      error: result.error 
    };
  } catch (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    return { 
      data: null, 
      error: error instanceof PostgrestError ? error : new Error(String(error))
    };
  }
}

// Interface for realtime payload (simplified)
export interface RealtimePayload {
  new: Record<string, any>;
  old: Record<string, any>;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
}

// Subscribe to real-time changes - updated to use the correct channel API
export function subscribeToTable(
  tableName: ValidTableName,
  callback: (payload: RealtimePayload) => void,
  options: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
  } = {}
): () => void {
  const { event = '*', filter } = options;
  
  // Create a channel for realtime subscriptions using the new API with type casting
  const channel = supabase
    .channel(`public-${tableName}-changes`)
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table: tableName,
        filter
      },
      (payload: any) => {
        // Access payload data safely
        const newData = payload.new || {};
        const oldData = payload.old || {};
        const eventType = payload.eventType || 'UPDATE';
        
        // Convert the payload to our simplified RealtimePayload type
        const typedPayload: RealtimePayload = {
          new: newData,
          old: oldData,
          eventType: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table: tableName,
          schema: 'public'
        };
        callback(typedPayload);
      }
    )
    .subscribe();
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
