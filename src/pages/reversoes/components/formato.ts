import { FUSO_OPERACIONAL } from "@/lib/dataOperacional";

export const brl = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const quando = (iso?: string | null) => iso
  ? new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO_OPERACIONAL, day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
  : "—";
export const FORMA_ROTULO: Record<string, string> = { dinheiro: "Dinheiro", pix: "PIX", cartao: "Cartão", promissoria: "Promissória" };
export const ORIGEM_ROTULO: Record<string, string> = {
  caixa: "caixa da portaria", entregador: "dinheiro com o entregador", cobrador: "dinheiro com o cobrador", conta_empresa: "conta da empresa",
};
