
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

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
  table: string;
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
        'postgres_changes' as any, // Type assertion para evitar erro de tipo
        {
          event,
          schema,
          table,
          filter
        },
        (payload: any) => {
          // Usar type assertion para evitar problemas de tipos profundos
          const typedPayload = payload as RealtimePayload;
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
