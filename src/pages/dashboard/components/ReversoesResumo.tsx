import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { G1_ACOES } from "@/lib/g1/acoes";
import { dataOperacional } from "@/lib/dataOperacional";
import { useReembolsos, useReversoes } from "@/hooks/useReversoes";
import { resumoReversoes } from "@/lib/g1/reversao";

const brl = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Reversões ao lado das vendas, sem misturar: a venda original continua contada no dia em que
 * aconteceu; aqui aparecem as reversões autorizadas hoje, o que falta reembolsar e o que foi devolvido hoje.
 */
export function ReversoesResumo() {
  const reversoes = useReversoes(60);
  const reembolsos = useReembolsos(60);
  if (!G1_ACOES || reversoes.isError || reembolsos.isError || !reversoes.data || !reembolsos.data) return null;
  const hoje = dataOperacional();
  const deHoje = reversoes.data.filter((r) => r.data_operacao === hoje);
  const resHoje = resumoReversoes(deHoje, reembolsos.data.filter((e) => e.status === "realizado" && e.data_operacao === hoje));
  const pendente = resumoReversoes([], reembolsos.data).reembolsoPendente;
  const aguardando = reversoes.data.filter((r) => r.status === "solicitada").length;
  if (deHoje.length === 0 && pendente === 0 && aguardando === 0 && resHoje.reembolsado === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Reversões (separadas das vendas)</CardTitle>
        <CardDescription>As vendas originais continuam no dia em que aconteceram. <Link to="/reversoes" className="underline">Ver detalhes</Link></CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-4">
        <div><p className="text-xs text-muted-foreground">Vendas revertidas hoje</p><p className="font-semibold">{resHoje.vendasRevertidas} · {brl(resHoje.valorVendasRevertidas)}</p></div>
        <div><p className="text-xs text-muted-foreground">Aguardando autorização</p><p className="font-semibold">{aguardando}</p></div>
        <div><p className="text-xs text-muted-foreground">A reembolsar (pendente)</p><p className="font-semibold">{brl(pendente)}</p></div>
        <div><p className="text-xs text-muted-foreground">Reembolsado hoje</p><p className="font-semibold">{brl(resHoje.reembolsado)}</p></div>
      </CardContent>
    </Card>
  );
}
