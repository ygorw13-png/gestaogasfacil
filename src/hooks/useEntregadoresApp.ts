import { useQuery } from "@tanstack/react-query";
import { acao } from "@/lib/g1/acoes";

export interface EntregadorApp {
  id: string;
  nome: string;
  /** Cadastro de colaborador vinculado a esta conta do app (pelo ID, nunca pelo nome). */
  vinculado: boolean;
  /** Telefone do colaborador vinculado é válido para WhatsApp. */
  telefoneValido: boolean;
  /** Últimos 4 dígitos do telefone (o número completo fica só no servidor). */
  telefoneFinal: string | null;
}

/**
 * Entregadores ATIVOS da empresa com conta no app (`listar_entregadores_aviso`, SQL 016). O id é o da conta:
 * é ele que vai em orders.delivery_person_id. O telefone vem do colaborador vinculado à conta por ID.
 */
export function useEntregadoresApp() {
  return useQuery({
    queryKey: ["entregadores-app"],
    queryFn: async (): Promise<EntregadorApp[]> => {
      const lista = await acao<{ id: string; nome: string; vinculado: boolean; telefone_valido: boolean; telefone_final: string | null }[]>(
        "listar_entregadores_aviso", {});
      return (lista ?? []).map((p) => ({
        id: p.id, nome: p.nome, vinculado: !!p.vinculado, telefoneValido: !!p.telefone_valido, telefoneFinal: p.telefone_final,
      }));
    },
    staleTime: 60_000,
  });
}

/** Motivo para o entregador não poder receber o aviso App + WhatsApp (null = pode). */
export function impedimentoAviso(e?: EntregadorApp | null): string | null {
  if (!e) return null;
  if (!e.vinculado) return "Sem cadastro de colaborador vinculado a esta conta do app (Colaboradores > Editar > Conta no app).";
  if (!e.telefoneValido) return "Telefone do colaborador inválido para WhatsApp (cadastre DDD + número em Colaboradores).";
  return null;
}
