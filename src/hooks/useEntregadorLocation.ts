import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export interface EntregadorLocalizacao {
  user_id: string;
  nome: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updated_at: string;
}

/**
 * Atualiza a localização do entregador sempre que ele acessa o app
 * (e a cada 2 minutos enquanto estiver com o app aberto).
 */
export function useTrackMyLocation(enabled: boolean, nome?: string | null) {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !user?.id || !("geolocation" in navigator)) return;

    const send = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await (supabase.from("entregador_localizacoes") as any).upsert(
            {
              user_id: user.id,
              nome: nome ?? null,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    };

    send();
    const interval = setInterval(send, 120000);
    const onVisible = () => document.visibilityState === "visible" && send();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, user?.id, nome]);
}

/** Localizações de todos os entregadores da organização. */
export function useEntregadoresLocalizacoes() {
  return useQuery({
    queryKey: ["entregadores-localizacoes"],
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await (supabase.from("entregador_localizacoes") as any)
        .select("user_id, nome, latitude, longitude, accuracy, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EntregadorLocalizacao[];
    },
  });
}
