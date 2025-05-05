
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

// Simplified type for realtime payload to avoid recursive type issues
export interface RealtimePayload {
  new: Record<string, any>;
  old: Record<string, any>;
  eventType: string;
  table: string;
  schema: string;
  [key: string]: any;
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
    
    // Create the channel for listening to changes
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any, // Type assertion to bypass type checking
        {
          event,
          schema,
          table,
          filter
        },
        (payload: any) => {
          const typedPayload = payload as RealtimePayload;
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
