import { valorObrigatorio } from "@/lib/formasPagamento";
/**
 * Valor canônico: "completa" (padrão da coluna orders.tipo_venda, das telas e
 * dos relatórios). "completo" aparece como entrada legada/alternativa e é lido
 * como "completa"; nunca é gravado. Qualquer outro texto não é um tipo válido.
 */
export type TipoVenda = "completa" | "recarga" | "vasilhame";

/** Lê qualquer valor guardado ou digitado e devolve o canônico (ou null se não reconhecido). */
export function normalizarTipoVenda(t?: string | null): TipoVenda | null {
  switch ((t ?? "").trim().toLowerCase()) {
    case "completa":
    case "completo":
      return "completa";
    case "recarga":
      return "recarga";
    case "vasilhame":
      return "vasilhame";
    default:
      return null;
  }
}

export const TIPOS_VENDA: {
  value: TipoVenda;
  label: string;
  description: string;
}[] = [
  {
    value: "completa",
    label: "Gás completo (líquido + vasilhame)",
    description: "Cliente leva o botijão cheio e fica com o vasilhame.",
  },
  {
    value: "recarga",
    label: "Somente líquido (troca de vasilhame)",
    description: "Cliente entrega um vasilhame vazio e leva um cheio.",
  },
  {
    value: "vasilhame",
    label: "Somente vasilhame (vazio)",
    description: "Venda apenas do casco vazio, sem gás.",
  },
];

export const tipoVendaLabel = (t?: string | null) =>
  TIPOS_VENDA.find((x) => x.value === normalizarTipoVenda(t))?.label ?? "Somente líquido (troca de vasilhame)";

export const tipoVendaShort = (t?: string | null) => {
  const n = normalizarTipoVenda(t);
  return n === "vasilhame" ? "Vasilhame" : n === "completa" ? "Completo" : "Troca";
};

/**
 * Movimentação de vasilhame gerada por uma venda.
 * entregues = cascos que saem da empresa | recebidos = cascos vazios que entram.
 */
export function vasilhameDeltas(tipo: TipoVenda, quantidade: number) {
  switch (tipo) {
    case "recarga":
      return { entregues: 0, recebidos: quantidade };
    case "vasilhame":
      return { entregues: quantidade, recebidos: 0 };
    case "completa":
    default:
      return { entregues: quantidade, recebidos: 0 };
  }
}

/** Formas de pagamento que exigem o valor da venda (> 0): dinheiro, PIX, crédito, débito, promissória. */
export function exigeValor(metodo?: string | null) {
  return valorObrigatorio(metodo);
}

/** Formas de pagamento que exigem identificar o cliente. */
export function exigeCliente(metodo?: string | null) {
  if (!metodo) return false;
  const m = metodo.toLowerCase();
  return m.includes("promiss") || m.includes("convenio") || m.includes("convênio");
}
