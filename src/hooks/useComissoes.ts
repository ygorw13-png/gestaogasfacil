import { normalizarForma } from "@/lib/formasPagamento";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ComissaoConfig {
  id: string;
  ativo: boolean;
  ciclo: string;
  pagar_promissoria_no_recebimento: boolean;
}

export interface ComissaoRegra {
  id: string;
  colaborador_id: string | null;
  colaborador_nome: string;
  modo: "percentual" | "fixo";
  perc_dinheiro: number;
  perc_pix: number;
  perc_cartao: number;
  perc_promissoria: number;
  fixo_por_botijao: number;
  ativo: boolean;
}

export interface BonusFaixa {
  id: string;
  valor_min_recebido: number;
  bonus: number;
}

/** Períodos quinzenais: dia 1-15 e 16-fim do mês */
export function periodoQuinzenal(ref = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const primeiraQuinzena = ref.getDate() <= 15;
  const inicio = new Date(y, m, primeiraQuinzena ? 1 : 16);
  const fim = primeiraQuinzena ? new Date(y, m, 15) : new Date(y, m + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { inicio: iso(inicio), fim: iso(fim) };
}

export function useComissaoConfig() {
  return useQuery({
    queryKey: ["comissao-config"],
    queryFn: async (): Promise<ComissaoConfig | null> => {
      const { data, error } = await supabase
        .from("comissao_config" as any)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ComissaoConfig) ?? null;
    },
  });
}

export function useSalvarComissaoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ComissaoConfig>) => {
      const { data: existente } = await supabase
        .from("comissao_config" as any)
        .select("id")
        .maybeSingle();
      const { error } = existente
        ? await supabase
            .from("comissao_config" as any)
            .update(patch as any)
            .eq("id", (existente as any).id)
        : await supabase.from("comissao_config" as any).insert(patch as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comissao-config"] });
      toast.success("Configuração de comissões salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useComissaoRegras() {
  return useQuery({
    queryKey: ["comissao-regras"],
    queryFn: async (): Promise<ComissaoRegra[]> => {
      const { data, error } = await supabase
        .from("comissao_regras" as any)
        .select("*")
        .order("colaborador_nome");
      if (error) throw error;
      return (data ?? []) as unknown as ComissaoRegra[];
    },
  });
}

export function useSalvarRegra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (regra: Partial<ComissaoRegra> & { id?: string }) => {
      const { id, ...rest } = regra;
      const { error } = id
        ? await supabase.from("comissao_regras" as any).update(rest as any).eq("id", id)
        : await supabase.from("comissao_regras" as any).insert(rest as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comissao-regras"] });
      toast.success("Regra salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirRegra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comissao_regras" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comissao-regras"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBonusFaixas() {
  return useQuery({
    queryKey: ["comissao-bonus-faixas"],
    queryFn: async (): Promise<BonusFaixa[]> => {
      const { data, error } = await supabase
        .from("comissao_bonus_faixas" as any)
        .select("*")
        .order("valor_min_recebido");
      if (error) throw error;
      return (data ?? []) as unknown as BonusFaixa[];
    },
  });
}

export function useSalvarFaixa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (faixa: { valor_min_recebido: number; bonus: number }) => {
      const { error } = await supabase.from("comissao_bonus_faixas" as any).insert(faixa as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comissao-bonus-faixas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirFaixa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comissao_bonus_faixas" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comissao-bonus-faixas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface ResumoVendedor {
  nome: string;
  qtdVendas: number;
  qtdBotijoes: number;
  totalVendido: number;
  porPagamento: Record<string, number>;
  comissaoVendas: number;
  promissoriasRecebidas: number;
  comissaoPromissorias: number;
  bonus: number;
  totalReceber: number;
  semRegra: boolean;
  /** Vendas (R$ por grupo) que a regra percentual não cobre: não comissionadas. */
  semTaxa: Record<string, number>;
}

/**
 * Grupo de comissão da forma gravada (código canônico de formasPagamento).
 * Dinheiro/PIX/Cartão usam a taxa configurada; promissória só é comissionada no recebimento;
 * Vale-gás, Gás do Povo e Convênio não têm taxa configurável e nunca viram recebimento/promissória.
 */
export type GrupoComissao = "dinheiro" | "pix" | "cartao" | "promissoria" | "vale-gas" | "gas-povo" | "convenio" | "nao-reconhecida";

export function grupoPagamento(m?: string | null): GrupoComissao {
  const c = normalizarForma(m);
  switch (c) {
    case "money": return "dinheiro";
    case "pix": return "pix";
    case "credit":
    case "debit": return "cartao";
    case "promissoria": return "promissoria";
    case "vale-gas":
    case "gas-povo":
    case "convenio": return c;
    default: return "nao-reconhecida";
  }
}

export interface RegraCalculo {
  modo: string;
  perc_dinheiro: number | string;
  perc_pix: number | string;
  perc_cartao: number | string;
  fixo_por_botijao: number | string;
}

/**
 * Comissão de uma venda pela regra configurada. `semTaxa` = venda que a regra não cobre
 * (forma sem taxa configurável ou não reconhecida): não é comissionada nem jogada em "outros".
 */
export function comissaoVenda(regra: RegraCalculo, forma: string | null | undefined, valor: number, qtd: number) {
  const g = grupoPagamento(forma);
  if (regra.modo === "fixo") {
    // promissória só é comissionada no recebimento
    return { grupo: g, comissao: g === "promissoria" ? 0 : Number(regra.fixo_por_botijao) * qtd, semTaxa: false };
  }
  const taxa: Partial<Record<GrupoComissao, number | string>> = {
    dinheiro: regra.perc_dinheiro,
    pix: regra.perc_pix,
    cartao: regra.perc_cartao,
  };
  if (g === "promissoria") return { grupo: g, comissao: 0, semTaxa: false };
  const perc = taxa[g];
  if (perc === undefined || perc === null || !Number.isFinite(Number(perc))) return { grupo: g, comissao: 0, semTaxa: true };
  return { grupo: g, comissao: (valor * Number(perc)) / 100, semTaxa: false };
}

export const NOME_GRUPO: Record<GrupoComissao, string> = {
  dinheiro: "Dinheiro", pix: "PIX", cartao: "Crédito/Débito", promissoria: "Nota promissória",
  "vale-gas": "Vale-gás", "gas-povo": "Gás do Povo", convenio: "Convênio", "nao-reconhecida": "Forma não reconhecida",
};

export function useComissoesPeriodo(inicio: string, fim: string) {
  const { data: regras } = useComissaoRegras();
  const { data: faixas } = useBonusFaixas();

  return useQuery({
    queryKey: ["comissoes-periodo", inicio, fim, regras?.length, faixas?.length],
    enabled: !!regras,
    queryFn: async (): Promise<ResumoVendedor[]> => {
      const [{ data: orders, error: e1 }, { data: notas, error: e2 }] = await Promise.all([
        supabase
          .from("orders")
          .select("delivery_person, payment_method, price, quantity, status, delivered_at, created_at")
          .in("status", ["delivered", "completed"])
          .gte("created_at", `${inicio}T00:00:00`)
          .lte("created_at", `${fim}T23:59:59`),
        supabase
          .from("promissory_notes")
          .select("assigned_to, paid_amount, value, paid_at, status")
          .eq("status", "paid")
          .gte("paid_at", `${inicio}T00:00:00`)
          .lte("paid_at", `${fim}T23:59:59`),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const mapa = new Map<string, ResumoVendedor>();
      const get = (nome: string) => {
        if (!mapa.has(nome)) {
          mapa.set(nome, {
            nome,
            qtdVendas: 0,
            qtdBotijoes: 0,
            totalVendido: 0,
            porPagamento: {},
            comissaoVendas: 0,
            promissoriasRecebidas: 0,
            comissaoPromissorias: 0,
            bonus: 0,
            totalReceber: 0,
            semRegra: false,
            semTaxa: {},
          });
        }
        return mapa.get(nome)!;
      };

      for (const o of (orders ?? []) as any[]) {
        const nome = o.delivery_person || "Portaria (sem vendedor)";
        const r = get(nome);
        const valor = Number(o.price ?? 0);
        const qtd = Number(o.quantity ?? 0);
        const g = grupoPagamento(o.payment_method);
        r.qtdVendas += 1;
        r.qtdBotijoes += qtd;
        r.totalVendido += valor;
        r.porPagamento[g] = (r.porPagamento[g] ?? 0) + valor;

        const regra = (regras ?? []).find((x) => x.ativo && x.colaborador_nome === nome);
        if (!regra) {
          r.semRegra = true;
          continue;
        }
        const cv = comissaoVenda(regra, o.payment_method, valor, qtd);
        r.comissaoVendas += cv.comissao;
        if (cv.semTaxa) r.semTaxa[cv.grupo] = (r.semTaxa[cv.grupo] ?? 0) + valor;
      }

      for (const n of (notas ?? []) as any[]) {
        const nome = n.assigned_to || "Portaria (sem vendedor)";
        const r = get(nome);
        const recebido = Number(n.paid_amount ?? n.value ?? 0);
        r.promissoriasRecebidas += recebido;
        const regra = (regras ?? []).find((x) => x.ativo && x.colaborador_nome === nome);
        if (!regra) {
          r.semRegra = true;
          continue;
        }
        r.comissaoPromissorias += (recebido * Number(regra.perc_promissoria)) / 100;
      }

      const ordenadas = [...(faixas ?? [])].sort(
        (a, b) => Number(a.valor_min_recebido) - Number(b.valor_min_recebido)
      );
      for (const r of mapa.values()) {
        const faixa = ordenadas
          .filter((f) => r.promissoriasRecebidas >= Number(f.valor_min_recebido))
          .pop();
        r.bonus = faixa ? Number(faixa.bonus) : 0;
        r.totalReceber = r.comissaoVendas + r.comissaoPromissorias + r.bonus;
      }

      return [...mapa.values()].sort((a, b) => b.totalReceber - a.totalReceber);
    },
  });
}

export function useFechamentosComissao() {
  return useQuery({
    queryKey: ["comissao-fechamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comissao_fechamentos" as any)
        .select("*")
        .order("periodo_inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useRegistrarFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      colaborador_nome: string;
      periodo_inicio: string;
      periodo_fim: string;
      total_vendido: number;
      total_comissao: number;
      total_bonus: number;
      total_pagar: number;
      status?: string;
      detalhes?: any;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("comissao_fechamentos" as any).insert({
        ...payload,
        status: payload.status ?? "pago",
        pago_em: new Date().toISOString(),
        criado_por: userRes.user?.id ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comissao-fechamentos"] });
      toast.success("Fechamento registrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
