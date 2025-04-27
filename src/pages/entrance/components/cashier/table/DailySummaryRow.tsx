
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatUtils";

interface DailySummaryRowProps {
  date: string;
  totals: {
    sales: number;
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
}

export function DailySummaryRow({ date, totals }: DailySummaryRowProps) {
  return (
    <TableRow className="bg-muted/50">
      <TableCell className="font-medium">{date} (Total)</TableCell>
      <TableCell>Diário</TableCell>
      <TableCell className="text-right font-medium">{totals.p13}</TableCell>
      <TableCell className="text-right font-medium">{totals.p20}</TableCell>
      <TableCell className="text-right font-medium">{totals.p45}</TableCell>
      <TableCell className="text-right font-medium">{totals.water}</TableCell>
      <TableCell className="text-right font-medium">R$ {formatCurrency(totals.sales)}</TableCell>
    </TableRow>
  );
}
