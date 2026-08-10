export type TipoVenda = "completa" | "recarga" | "vasilhame";

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
  TIPOS_VENDA.find((x) => x.value === t)?.label ?? "Somente líquido (troca de vasilhame)";

export const tipoVendaShort = (t?: string | null) =>
  t === "vasilhame" ? "Vasilhame" : t === "completa" ? "Completo" : "Troca";

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

/** Formas de pagamento que exigem o valor da venda preenchido. */
const METODOS_COM_VALOR = [
  "money",
  "dinheiro",
  "pix",
  "credit",
  "debit",
  "credito",
  "debito",
  "cartão de crédito",
  "cartão de débito",
  "cartão crédito",
  "cartão débito",
];

export function exigeValor(metodo?: string | null) {
  if (!metodo) return false;
  return METODOS_COM_VALOR.includes(metodo.toLowerCase());
}

/** Formas de pagamento que exigem identificar o cliente. */
export function exigeCliente(metodo?: string | null) {
  if (!metodo) return false;
  const m = metodo.toLowerCase();
  return m.includes("promiss") || m.includes("convenio") || m.includes("convênio");
}
