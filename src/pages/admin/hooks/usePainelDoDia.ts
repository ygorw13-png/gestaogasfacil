import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConferenciaDiaria {
  id: string;
  data: string;
  estoque_ok: boolean;
  estoque_observacao: string | null;
  caixa_ok: boolean;
  caixa_observacao: string | null;
  rotas_ok: boolean;
  rotas_observacao: string | null;
  conferido_por_nome: string | null;
}

const hoje = () => new Date().toISOString().slice(0, 10);

export function useConferenciaHoje() {
  return useQuery({
    queryKey: ["conferencia-diaria", hoje()],
    queryFn: async (): Promise<ConferenciaDiaria | null> => {
      const { data, error } = await supabase
        .from("conferencias_diarias" as any)
        .select("*")
        .eq("data", hoje())
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ConferenciaDiaria) ?? null;
    },
  });
}

export function useMarcarConferencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<ConferenciaDiaria, "id" | "data">>) => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      const { data: profile } = userId
        ? await supabase.from("profiles").select("name").eq("id", userId).maybeSingle()
        : { data: null as any };

      const { data: existente } = await supabase
        .from("conferencias_diarias" as any)
        .select("id")
        .eq("data", hoje())
        .maybeSingle();

      const payload = { conferido_por_nome: profile?.name ?? null, ...patch } as any;

      const { error } = existente
        ? await supabase
            .from("conferencias_diarias" as any)
            .update(payload)
            .eq("id", (existente as any).id)
        : await supabase
            .from("conferencias_diarias" as any)
            .insert({ data: hoje(), ...payload });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conferencia-diaria"] });
    },
    onError: (e: Error) => toast.error(`Erro ao salvar conferência: ${e.message}`),
  });
}

export interface PromissoriaVencida {
  id: string;
  client_name: string;
  value: number;
  due_date: string;
  diasAtraso: number;
}

export function usePromissoriasVencidas() {
  return useQuery({
    queryKey: ["promissorias-vencidas"],
    queryFn: async (): Promise<PromissoriaVencida[]> => {
      const { data, error } = await supabase
        .from("promissory_notes")
        .select("id, client_name, value, due_date, status")
        .not("status", "in", "(paid,cancelled)")
        .lt("due_date", hoje())
        .order("due_date");
      if (error) throw error;
      return (data ?? []).map((n: any) => ({
        id: n.id,
        client_name: n.client_name,
        value: Number(n.value ?? 0),
        due_date: n.due_date,
        diasAtraso: Math.floor(
          (Date.now() - new Date(`${n.due_date}T00:00:00`).getTime()) / 86400000
        ),
      }));
    },
  });
}

export interface FechamentoOntem {
  data: string;
  totalDinheiro: number;
  movimentos: number;
  temFechamento: boolean;
}

export function useFechamentoOntem() {
  return useQuery({
    queryKey: ["fechamento-ontem"],
    queryFn: async (): Promise<FechamentoOntem> => {
      const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("movimentacoes_portaria" as any)
        .select("tipo, valor_dinheiro")
        .eq("data_operacao", ontem);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      return {
        data: ontem,
        totalDinheiro: rows.reduce((s, r) => s + Number(r.valor_dinheiro ?? 0), 0),
        movimentos: rows.length,
        temFechamento: rows.some((r) => String(r.tipo).includes("fechamento")),
      };
    },
  });
}

export function useRotasHoje() {
  return useQuery({
    queryKey: ["rotas-hoje"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rotas")
        .select("*")
        .eq("data", hoje())
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}
