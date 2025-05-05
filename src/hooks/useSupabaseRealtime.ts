
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { ValidTableName } from "@/services/supabaseService";

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

// Tipo simplificado para o payload de tempo real
export interface RealtimePayload {
  new: Record<string, any>;
  old: Record<string, any>;
  eventType: string;
  table: string;
  schema: string;
}

interface SupabaseRealtimeOptions {
  table: ValidTableName;
  schema?: string;
  event?: EventType;
  filter?: string;
  onRecordChange?: (payload: RealtimePayload) => void;
}

export function useSupabaseRealtime({
  table,
  schema = 'public',
  event = '*',
  filter,
  onRecordChange
}: SupabaseRealtimeOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [latestPayload, setLatestPayload] = useState<RealtimePayload | null>(null);

  useEffect(() => {
    const channelName = `${schema}-${table}-changes`;
    
    // Criar o canal para ouvir mudanças
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as unknown as 'system',
        {
          event,
          schema,
          table,
          filter
        },
        (payload: any) => {
          // Access payload data safely
          const newData = payload.new || (payload.payload && payload.payload.new) || {};
          const oldData = payload.old || (payload.payload && payload.payload.old) || {};
          const eventType = payload.eventType || payload.type || 'UPDATE';
          
          // Criar um payload tipado para nosso uso
          const typedPayload: RealtimePayload = {
            new: newData,
            old: oldData,
            eventType: eventType,
            table,
            schema
          };
          
          setLatestPayload(typedPayload);
          if (onRecordChange) onRecordChange(typedPayload);
        }
      )
      .subscribe((status) => {
        setIsListening(status === 'SUBSCRIBED');
      });

    setChannel(realtimeChannel);

    // Função de limpeza
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table, schema, event, filter, onRecordChange]);

  return { channel, isListening, latestPayload };
}
