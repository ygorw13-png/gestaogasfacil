
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ClosingTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Data/Hora</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead className="text-right">P13</TableHead>
        <TableHead className="text-right">P20</TableHead>
        <TableHead className="text-right">P45</TableHead>
        <TableHead className="text-right">Água</TableHead>
        <TableHead className="text-right">Total (R$)</TableHead>
      </TableRow>
    </TableHeader>
  );
}
