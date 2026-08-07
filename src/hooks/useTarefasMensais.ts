import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TarefasMensais {
  id: string;
  competencia: string;
  boletos_ok: boolean;
  notas_fiscais_ok: boolean;
  contabilidade_ok: boolean;
  observacoes: string | null;
  conferido_por_nome: string | null;
}

export const competenciaAtual = () => new Date().toISOString().slice(0, 7);

/** Janela de obrigações fiscais: dias 1 a 10 de cada mês */
export const dentroJanelaFiscal = (d = new Date()) => d.getDate() <= 10;

export function useTarefasMensais(competencia = competenciaAtual()) {
  return useQuery({
    queryKey: ["tarefas-mensais", competencia],
    queryFn: async (): Promise<TarefasMensais | null> => {
      const { data, error } = await supabase
        .from("tarefas_mensais" as any)
        .select("*")
        .eq("competencia", competencia)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as TarefasMensais) ?? null;
    },
  });
}

export function useMarcarTarefaMensal(competencia = competenciaAtual()) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<TarefasMensais, "id" | "competencia">>) => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      const { data: profile } = userId
        ? await supabase.from("profiles").select("name").eq("id", userId).maybeSingle()
        : { data: null as any };

      const { data: existente } = await supabase
        .from("tarefas_mensais" as any)
        .select("id")
        .eq("competencia", competencia)
        .maybeSingle();

      const payload = {
        conferido_por: userId ?? null,
        conferido_por_nome: profile?.name ?? null,
        ...patch,
      } as any;

      const { error } = existente
        ? await supabase
            .from("tarefas_mensais" as any)
            .update(payload)
            .eq("id", (existente as any).id)
        : await supabase
            .from("tarefas_mensais" as any)
            .insert({ competencia, ...payload });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas-mensais"] }),
    onError: (e: Error) => toast.error(`Erro ao salvar tarefa mensal: ${e.message}`),
  });
}
