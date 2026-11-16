import { useEhAdmin } from "@/hooks/useEhAdmin";
import { ehRetiradaAgregado, textoValorAgregado } from "@/lib/formasPagamento";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Valor de uma venda na lista: retirada de agregado nunca aparece como R$ 0,00 (pendente/reservado conforme o acesso). */
export function ValorVenda({ paymentCode, valorInformado, amount }: { paymentCode?: string | null; valorInformado?: boolean; amount: number }) {
  const { ehAdmin } = useEhAdmin();
  if (ehRetiradaAgregado(paymentCode)) return <span className="text-muted-foreground">{textoValorAgregado(ehAdmin)}</span>;
  if (valorInformado === false) return <span className="text-muted-foreground">Não informado</span>;
  return <>{brl(amount)}</>;
}
