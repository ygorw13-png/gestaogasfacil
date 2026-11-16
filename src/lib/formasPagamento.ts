/**
 * Formas de pagamento: um código canônico por modalidade, usado em todas as telas e igual ao
 * gravado em orders.payment_method pelas ações do banco (public._forma_pedido, candidato 014).
 * Só grafias equivalentes da MESMA modalidade são unificadas; o desconhecido vira null (erro),
 * nunca outra modalidade.
 */
export type FormaPagamento =
  | "money" | "pix" | "credit" | "debit" | "promissoria" | "vale-gas" | "gas-povo" | "convenio";

export interface FormaInfo {
  codigo: FormaPagamento;
  /** Rótulo exibido (também é a chave dos totais por forma no caixa). */
  rotulo: string;
  /** Rótulo longo para listas de escolha. */
  opcao: string;
  /** Valor obrigatório e maior que zero. As demais aceitam "não informado". */
  valorObrigatorio: boolean;
  /** Nome exibido em detalhes, compras, cartão do entregador e formulários impressos. */
  nome: string;
}

export const FORMAS_PAGAMENTO: FormaInfo[] = [
  { codigo: "money", rotulo: "Dinheiro", opcao: "Dinheiro", valorObrigatorio: true, nome: "Dinheiro" },
  { codigo: "pix", rotulo: "PIX", opcao: "PIX", valorObrigatorio: true, nome: "PIX" },
  { codigo: "credit", rotulo: "Crédito", opcao: "Cartão de Crédito", valorObrigatorio: true, nome: "Crédito" },
  { codigo: "debit", rotulo: "Débito", opcao: "Cartão de Débito", valorObrigatorio: true, nome: "Débito" },
  { codigo: "promissoria", rotulo: "Promissória", opcao: "Nota Promissória", valorObrigatorio: true, nome: "Nota promissória" },
  { codigo: "vale-gas", rotulo: "Vale Gás", opcao: "Vale-Gás", valorObrigatorio: false, nome: "Vale-gás" },
  { codigo: "gas-povo", rotulo: "Gás do Povo", opcao: "Gás do Povo", valorObrigatorio: false, nome: "Gás do Povo" },
  { codigo: "convenio", rotulo: "Convênio", opcao: "Convênio", valorObrigatorio: false, nome: "Convênio" },
];

const SINONIMOS: Record<string, FormaPagamento> = {
  money: "money", dinheiro: "money", cash: "money",
  pix: "pix",
  credit: "credit", credito: "credit", cartaodecredito: "credit",
  debit: "debit", debito: "debit", cartaodedebito: "debit",
  promissoria: "promissoria", promissory: "promissoria", notapromissoria: "promissoria",
  valegas: "vale-gas", gasvoucher: "vale-gas", voucher: "vale-gas",
  gaspovo: "gas-povo", gasdopovo: "gas-povo",
  convenio: "convenio", partner: "convenio",
};

/** Mesma regra do banco: minúsculas, sem acento, sem espaço/hífen/sublinhado. */
export function normalizarForma(v?: string | null): FormaPagamento | null {
  const k = (v ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[\s_-]+/g, "");
  return SINONIMOS[k] ?? null;
}

export function infoForma(v?: string | null): FormaInfo | null {
  const c = normalizarForma(v);
  return c ? FORMAS_PAGAMENTO.find((f) => f.codigo === c)! : null;
}

/**
 * Retirada de agregado "a acertar" (candidato 017): não é forma de pagamento nem venda com valor.
 * O pedido fica sem preço; o valor existe só no acerto do administrador.
 */
export const FORMA_AGREGADO = "agregado";
export const ROTULO_AGREGADO = "Retirada de agregado — a acertar";
export const VALOR_RESERVADO = "Valor reservado ao administrador";
export const ehRetiradaAgregado = (v?: string | null) => v === FORMA_AGREGADO;

/** Texto do valor de uma retirada de agregado conforme o acesso (nunca "R$ 0,00"). */
export const textoValorAgregado = (ehAdmin: boolean) => (ehAdmin ? "Pendente: valor no acerto" : VALOR_RESERVADO);

/** Rótulo da forma gravada; código desconhecido = "Outros" (não é atribuído a outra modalidade). */
export function rotuloForma(v?: string | null): string {
  if (ehRetiradaAgregado(v)) return ROTULO_AGREGADO;
  return infoForma(v)?.rotulo ?? "Outros";
}

/**
 * Nome da forma gravada para exibição. Não altera o código gravado: vazio = "Não informado";
 * código desconhecido é mostrado como está (nunca atribuído a outra modalidade).
 */
export function nomeForma(v?: string | null): string {
  if (!v || !String(v).trim()) return "Não informado";
  if (ehRetiradaAgregado(v)) return ROTULO_AGREGADO;
  return infoForma(v)?.nome ?? String(v);
}

export function valorObrigatorio(v?: string | null): boolean {
  return infoForma(v)?.valorObrigatorio ?? false;
}

/**
 * Confere o valor para a forma. Devolve o valor a gravar (null = não informado) ou lança erro claro.
 * `texto` aceita vírgula ou ponto; vazio = não informado.
 */
export function valorParaForma(forma: string | null | undefined, valor: number | null): number | null {
  const info = infoForma(forma);
  if (!info) throw new Error("Forma de pagamento inválida. Selecione uma das opções da lista.");
  const informado = valor !== null && Number.isFinite(valor) && valor !== 0;
  if (valor !== null && (!Number.isFinite(valor) || valor < 0)) throw new Error("Valor inválido.");
  if (info.valorObrigatorio) {
    if (!informado || (valor as number) <= 0) throw new Error(`Informe um valor maior que zero para ${info.rotulo}.`);
    return valor as number;
  }
  return informado ? (valor as number) : null;
}

/** Texto digitado -> número (vírgula ou ponto). Vazio -> null; texto inválido -> NaN. */
export function lerValor(texto: string | number | null | undefined): number | null {
  if (texto === null || texto === undefined) return null;
  const s = String(texto).trim().replace(/\s/g, "");
  if (!s) return null;
  const normal = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return /^\d+(\.\d+)?$/.test(normal) ? Number(normal) : NaN;
}
