
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { ValidTableName } from "@/services/supabaseService";

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

// Simplified type for realtime payload
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
    
    // Create channel to listen for changes
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter
        },
        (payload: any) => {
          // Access payload data safely
          const newData = payload.new || {};
          const oldData = payload.old || {};
          const eventType = payload.eventType || 'UPDATE';
          
          // Create typed payload for our use
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

    // Cleanup function
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table, schema, event, filter, onRecordChange]);

  return { channel, isListening, latestPayload };
}
