import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ChequeCalculado } from "../utils/chequeCalc";

export interface TrocaCheque {
  id: string;
  data: string;
  descricao: string | null;
  taxa_juros_mensal: number;
  itens: ChequeCalculado[];
  total_valor: number;
  total_juros: number;
  total_liquido: number;
  observacoes: string | null;
  criado_por_nome: string | null;
  created_at: string;
}

const db = () => (supabase as any).from("trocas_cheque");

export const useTrocasCheque = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["trocas-cheque"],
    queryFn: async () => {
      const { data, error } = await db().select("*").order("data", { ascending: false });
      if (error) throw error;
      return (data || []) as TrocaCheque[];
    },
  });

  const salvar = useMutation({
    mutationFn: async (payload: Omit<TrocaCheque, "id" | "created_at" | "criado_por_nome">) => {
      const { data: userRes } = await supabase.auth.getUser();
      let nome: string | null = null;
      if (userRes.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", userRes.user.id)
          .maybeSingle();
        nome = prof?.name ?? null;
      }
      const { error } = await db().insert({ ...payload, criado_por_nome: nome });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trocas-cheque"] });
      toast({ title: "Troca de cheques salva", description: "Registro adicionado ao histórico." });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trocas-cheque"] });
      toast({ title: "Registro excluído" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  return { trocas: query.data || [], isLoading: query.isLoading, salvar, excluir };
};
