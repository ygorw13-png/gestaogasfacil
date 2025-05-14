
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function InventoryTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Produto</TableHead>
        <TableHead>Categoria</TableHead>
        <TableHead className="text-right">Quantidade</TableHead>
        <TableHead>Última Atualização</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
  );
}
