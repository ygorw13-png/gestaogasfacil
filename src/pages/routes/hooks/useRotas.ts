import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Rota {
  id: string;
  data: string;
  motorista_id: string | null;
  motorista_nome: string;
  destino: string;
  clientes_count: number;
  status: string;
  hora_saida: string | null;
  hora_retorno: string | null;
  inventario: any;
  observacoes: string | null;
  criado_em: string;
}

export function useRotas(filter?: { from?: string; to?: string; status?: string }) {
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("rotas").select("*").order("data", { ascending: false });
    if (filter?.from) q = q.gte("data", filter.from);
    if (filter?.to) q = q.lte("data", filter.to);
    if (filter?.status && filter.status !== "all") q = q.eq("status", filter.status);
    const { data, error } = await q;
    if (!error && data) setRotas(data as Rota[]);
    setLoading(false);
  }, [filter?.from, filter?.to, filter?.status]);

  useEffect(() => { fetch(); }, [fetch]);

  return { rotas, loading, refetch: fetch };
}
