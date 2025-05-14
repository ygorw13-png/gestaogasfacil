
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";

export function EmptyMovements() {
  return (
    <TableRow>
      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
        Nenhum registro de movimentação encontrado
      </TableCell>
    </TableRow>
  );
}
