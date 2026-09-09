import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Avisa a portaria quando um entregador aceita uma entrega.
 */
export function useAcceptedOrdersAlert(enabled: boolean) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const avisados = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("orders-aceitas")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const novo = payload.new as any;
          if (novo?.accepted_at && novo?.id && !avisados.current.has(novo.id)) {
            avisados.current.add(novo.id);
            toast({
              title: "✅ Entrega aceita",
              description: `${novo.client_name} — o entregador saiu para entregar.`,
            });
            qc.invalidateQueries({ queryKey: ["orders"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, toast, qc]);
}
