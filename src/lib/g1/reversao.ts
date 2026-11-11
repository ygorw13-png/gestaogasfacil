/**
 * Decisão B — reversão controlada (SQL 011). Regras de exibição usadas pelas telas:
 * a venda original nunca é reescrita; a reversão é um registro à parte, com autorização,
 * fatos físicos e reembolso separados. "A reembolsar" nunca é somado como "reembolsado".
 */
export type TipoReversao = "cancelamento" | "devolucao" | "troca" | "duplicidade";
export type StatusReversao = "solicitada" | "aguardando_retorno" | "reembolso_pendente" | "concluida" | "recusada";

export interface ReversaoLinha {
  id: string;
  order_id: string;
  order_valida_id: string | null;
  tipo: TipoReversao;
  status: StatusReversao;
  motivo: string;
  solicitado_por_nome: string | null;
  solicitado_em: string;
  decidido_por_nome: string | null;
  decidido_em: string | null;
  recusa_motivo: string | null;
  data_operacao: string | null;
  pagamento_duplicado: boolean | null;
  produto: string | null;
  quantidade: number | null;
  tipo_venda: string | null;
  valor_venda: number | null;
  data_venda: string | null;
  esperado_cheios: number;
  esperado_vazios_recolher: number;
  esperado_vazios_cliente: number;
  esperado_emprestados: number;
  esperado_substituto: number;
  confirmado_cheios: number;
  confirmado_vazios_recolher: number;
  confirmado_vazios_cliente: number;
  confirmado_emprestados: number;
  confirmado_substituto: number;
  promissoria_cancelada: number;
  valor_reembolso: number;
  valor_reembolsado: number;
  efeitos: unknown;
}

export interface ReembolsoLinha {
  id: string;
  reversao_id: string;
  order_id: string;
  forma: string;
  valor: number;
  status: "pendente" | "realizado";
  origem: string | null;
  referencia: string | null;
  acerto_original_id: string | null;
  realizado_por_nome: string | null;
  realizado_em: string | null;
  data_operacao: string | null;
  criado_em: string;
}

export const TIPO_ROTULO: Record<TipoReversao, string> = {
  cancelamento: "Cancelamento de pedido",
  devolucao: "Devolução integral",
  troca: "Troca por problema",
  duplicidade: "Lançamento duplicado",
};

export const STATUS_ROTULO: Record<StatusReversao, string> = {
  solicitada: "Aguardando autorização",
  aguardando_retorno: "Produto aguardando retorno",
  reembolso_pendente: "Reembolso pendente",
  concluida: "Reversão concluída",
  recusada: "Recusada",
};

export const AVISO_PARCIAL =
  "Devolução parcial ainda não está disponível. Nesta etapa: devolução integral, troca integral por problema ou lançamento duplicado.";

export const CONDICAO_ROTULO: Record<string, string> = {
  intacto: "Lacrado / sem uso",
  problema: "Com problema",
  parcial: "Parcialmente usado",
  nao_conferido: "Sem condição confirmada",
};

/** O que ainda falta acontecer fisicamente (vazio = nada pendente). */
export function pendenciasFisicas(r: Pick<ReversaoLinha,
  "esperado_cheios" | "confirmado_cheios" | "esperado_vazios_recolher" | "confirmado_vazios_recolher" |
  "esperado_vazios_cliente" | "confirmado_vazios_cliente" | "esperado_substituto" | "confirmado_substituto">) {
  const falta = {
    cheios: Math.max(0, r.esperado_cheios - r.confirmado_cheios),
    vaziosRecolher: Math.max(0, r.esperado_vazios_recolher - r.confirmado_vazios_recolher),
    vaziosCliente: Math.max(0, r.esperado_vazios_cliente - r.confirmado_vazios_cliente),
    substituto: Math.max(0, r.esperado_substituto - r.confirmado_substituto),
  };
  const textos: string[] = [];
  if (falta.cheios) textos.push(`${falta.cheios} cheio(s) a recolher`);
  if (falta.vaziosRecolher) textos.push(`${falta.vaziosRecolher} vasilhame(s) a recolher`);
  if (falta.vaziosCliente) textos.push(`${falta.vaziosCliente} vazio(s) a devolver ao cliente`);
  if (falta.substituto) textos.push(`${falta.substituto} substituto(s) a entregar`);
  return { ...falta, textos, pendente: textos.length > 0 };
}

export const efeitosTexto = (e: unknown): string[] => (Array.isArray(e) ? e.filter((x): x is string => typeof x === "string") : []);

/** Forma do recebimento → o reembolso exige referência/comprovante? (PIX e cartão: conta da empresa). */
export const exigeReferencia = (forma: string) => forma !== "dinheiro";

/**
 * Resumo separado: vendas revertidas (valor da venda original, sem reescrever a venda),
 * reembolso pendente e reembolso realizado. Reembolso nunca conta como venda nova,
 * e "a reembolsar" nunca aparece como devolvido.
 */
export function resumoReversoes(reversoes: Pick<ReversaoLinha, "tipo" | "status" | "valor_venda">[], reembolsos: Pick<ReembolsoLinha, "status" | "valor">[]) {
  const decididas = reversoes.filter((r) => r.status !== "solicitada" && r.status !== "recusada");
  const revertidas = decididas.filter((r) => r.tipo === "devolucao" || r.tipo === "duplicidade");
  const soma = (xs: number[]) => Math.round(xs.reduce((s, v) => s + (Number(v) || 0), 0) * 100) / 100;
  return {
    aguardandoAutorizacao: reversoes.filter((r) => r.status === "solicitada").length,
    emAndamento: reversoes.filter((r) => r.status === "aguardando_retorno" || r.status === "reembolso_pendente").length,
    vendasRevertidas: revertidas.length,
    valorVendasRevertidas: soma(revertidas.map((r) => Number(r.valor_venda) || 0)),
    reembolsoPendente: soma(reembolsos.filter((e) => e.status === "pendente").map((e) => e.valor)),
    reembolsado: soma(reembolsos.filter((e) => e.status === "realizado").map((e) => e.valor)),
  };
}

/** Quais tipos a tela oferece para o pedido (venda concluída x pedido em aberto). */
export function tiposPermitidos(statusPedido: string, tipoVenda?: string | null): TipoReversao[] {
  if (statusPedido === "cancelled") return [];
  if (statusPedido === "delivered" || statusPedido === "completed") {
    return tipoVenda === "vasilhame" ? ["devolucao", "duplicidade"] : ["devolucao", "troca", "duplicidade"];
  }
  return ["cancelamento"];
}
