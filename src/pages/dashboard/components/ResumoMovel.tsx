import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/formatUtils";
import { useLateOrdersCount } from "@/hooks/useLateOrdersCount";

interface ResumoMovelProps {
  vendas: { valor: number; qtd: number };
  /** null = recebimentos não comprovados (sem registro), nunca mostrado como zero. */
  recebido: { total: number; aguardandoAcerto: number } | null;
  vencidas: { qtd: number; valor: number };
}

/** Celular: vendas, recebimentos e pendências primeiro. Usa os mesmos números do painel completo. */
export function ResumoMovel({ vendas, recebido, vencidas }: ResumoMovelProps) {
  const semEntregador = useLateOrdersCount();
  return (
    <section aria-label="Resumo do dia" className="grid grid-cols-2 gap-2 md:hidden">
      <div className="rounded-lg border bg-card p-3">
        <div className="text-xs text-muted-foreground">Vendas hoje</div>
        <div className="text-lg font-bold">{formatCurrency(vendas.valor)}</div>
        <div className="text-xs text-muted-foreground">{vendas.qtd} vendas</div>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="text-xs text-muted-foreground">Recebido hoje</div>
        {recebido ? (
          <>
            <div className="text-lg font-bold">{formatCurrency(recebido.total)}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(recebido.aguardandoAcerto)} aguardando acerto</div>
          </>
        ) : (
          <div className="text-sm font-medium text-muted-foreground">Não comprovado</div>
        )}
      </div>
      <Link to="/orders" className="flex min-h-11 flex-col justify-center rounded-lg border bg-card p-3">
        <span className="text-xs text-muted-foreground">Pedidos sem entregador</span>
        <span className={`text-lg font-bold ${semEntregador > 0 ? "text-destructive" : ""}`}>{semEntregador}</span>
      </Link>
      <Link to="/promissory" className="flex min-h-11 flex-col justify-center rounded-lg border bg-card p-3">
        <span className="text-xs text-muted-foreground">Promissórias vencidas</span>
        <span className={`text-lg font-bold ${vencidas.qtd > 0 ? "text-destructive" : ""}`}>{vencidas.qtd}</span>
        <span className="text-xs text-muted-foreground">{formatCurrency(vencidas.valor)}</span>
      </Link>
    </section>
  );
}
