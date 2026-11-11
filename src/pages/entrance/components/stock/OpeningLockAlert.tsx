import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { G1_ACOES } from "@/lib/g1/flag";

interface Props {
  onOpen: () => void;
}

export function OpeningLockAlert({ onOpen }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
        <div>
          <p className="text-sm font-semibold">Abertura do dia não confirmada</p>
          <p className="text-xs text-muted-foreground">
            Confirme o saldo remanescente do dia anterior antes de operar.{" "}
            {G1_ACOES
              ? "Vendas de balcão e saídas para carga só são aceitas depois da abertura."
              : "As vendas continuam liberadas, mas o estoque pode ficar divergente."}
          </p>
        </div>
      </div>
      <Button size="sm" onClick={onOpen}>
        Confirmar abertura
      </Button>
    </div>
  );
}
