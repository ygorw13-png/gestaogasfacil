
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatUtils";
import { PartialClosing } from "../CashierClosingDialog";

interface ClosingEntryRowProps {
  closing: PartialClosing & {
    formattedDateTime: string;
  };
}

export function ClosingEntryRow({ closing }: ClosingEntryRowProps) {
  return (
    <TableRow>
      <TableCell>{closing.formattedDateTime}</TableCell>
      <TableCell>Parcial</TableCell>
      <TableCell className="text-right">{closing.quantities.p13}</TableCell>
      <TableCell className="text-right">{closing.quantities.p20}</TableCell>
      <TableCell className="text-right">{closing.quantities.p45}</TableCell>
      <TableCell className="text-right">{closing.quantities.water}</TableCell>
      <TableCell className="text-right font-medium">R$ {formatCurrency(closing.totalSales)}</TableCell>
    </TableRow>
  );
}
