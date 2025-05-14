
import { TableCell, TableRow } from "@/components/ui/table";
import { EmptyTableRowProps } from "../types/inventory-types";

export function EmptyTableRow({ colSpan, message }: EmptyTableRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-8 text-gray-500">
        {message}
      </TableCell>
    </TableRow>
  );
}
