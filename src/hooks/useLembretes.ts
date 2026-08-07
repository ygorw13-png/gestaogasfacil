import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Lembrete {
  id: string;
  titulo: string;
  categoria: string;
  veiculo_id: string | null;
  veiculo_placa: string | null;
  intervalo_dias: number;
  ultima_execucao: string;
  observacoes: string | null;
  ativo: boolean;
}

export interface LembreteInput {
  id?: string;
  titulo: string;
  categoria: string;
  veiculo_id?: string | null;
  veiculo_placa?: string | null;
  intervalo_dias: number;
  ultima_execucao: string;
  observacoes?: string | null;
  ativo?: boolean;
}

export const CATEGORIAS_LEMBRETE = [
  { value: "manutencao", label: "Manutenção" },
  { value: "troca_oleo", label: "Troca de óleo" },
  { value: "documento", label: "Documento / Licenciamento" },
  { value: "pagamento", label: "Pagamento recorrente" },
  { value: "outro", label: "Outro" },
];

export function diasRestantes(l: Lembrete) {
  const proxima = new Date(l.ultima_execucao + "T00:00:00");
  proxima.setDate(proxima.getDate() + l.intervalo_dias);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = Math.round((proxima.getTime() - hoje.getTime()) / 86400000);
  return { proxima, dias: diff };
}

export function useLembretes() {
  return useQuery({
    queryKey: ["lembretes-manutencao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lembretes_manutencao" as any)
        .select("*")
        .order("ultima_execucao", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Lembrete[];
    },
  });
}

export function useSalvarLembrete() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: LembreteInput) => {
      const payload = {
        titulo: input.titulo,
        categoria: input.categoria,
        veiculo_id: input.veiculo_id ?? null,
        veiculo_placa: input.veiculo_placa ?? null,
        intervalo_dias: input.intervalo_dias,
        ultima_execucao: input.ultima_execucao,
        observacoes: input.observacoes ?? null,
        ativo: input.ativo ?? true,
      };
      if (input.id) {
        const { error } = await supabase
          .from("lembretes_manutencao" as any)
          .update(payload)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lembretes_manutencao" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lembretes-manutencao"] });
      toast({ title: "Lembrete salvo" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao salvar lembrete", description: e.message, variant: "destructive" }),
  });
}

export function useMarcarFeito() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lembretes_manutencao" as any)
        .update({ ultima_execucao: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lembretes-manutencao"] });
      toast({ title: "Lembrete atualizado", description: "Contagem reiniciada a partir de hoje." });
    },
  });
}

export function useExcluirLembrete() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lembretes_manutencao" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lembretes-manutencao"] });
      toast({ title: "Lembrete excluído" });
    },
  });
}

export function useVeiculosSimples() {
  return useQuery({
    queryKey: ["veiculos-simples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles" as any)
        .select("id, plate, model")
        .order("plate");
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; plate: string; model: string | null }[];
    },
  });
}
