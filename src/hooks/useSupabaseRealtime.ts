
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SupabaseRealtimeOptions {
  table: string;
  schema?: string;
  event?: EventType;
  filter?: string;
  onRecordChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
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
  const [latestPayload, setLatestPayload] = useState<RealtimePostgresChangesPayload<any> | null>(null);

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
        (payload: RealtimePostgresChangesPayload<any>) => {
          setLatestPayload(payload);
          if (onRecordChange) onRecordChange(payload);
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
