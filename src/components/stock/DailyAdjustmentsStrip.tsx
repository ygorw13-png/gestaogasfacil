import { History } from "lucide-react";

export interface AdjustmentItem {
  id: string;
  at: string;
  who: string;
  label: string; // ex.: "GLP P13: 10 → 8 cheios"
  motivo?: string | null;
}

interface Props {
  items: AdjustmentItem[];
  className?: string;
}

/**
 * Faixa compacta com as correções manuais feitas HOJE.
 * O histórico é diário — no dia seguinte volta vazio.
 */
export function DailyAdjustmentsStrip({ items, className = "" }: Props) {
  if (!items.length) return null;

  const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`rounded-md border border-amber-500/30 bg-amber-500/5 p-2 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <History className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Correções de hoje ({items.length})
        </span>
      </div>
      <ul className="space-y-0.5 max-h-24 overflow-y-auto">
        {items.map((i) => (
          <li key={i.id} className="text-[11px] text-muted-foreground leading-snug">
            <span className="font-medium text-foreground">{hora(i.at)}</span> — {i.label}
            {i.who ? ` • ${i.who}` : ""}
            {i.motivo ? ` • ${i.motivo}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
