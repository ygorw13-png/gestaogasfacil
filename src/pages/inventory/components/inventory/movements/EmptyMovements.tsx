
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";

interface EmptyMovementsProps {
  message?: string;
}

export function EmptyMovements({ message = "Nenhum registro de movimentação encontrado" }: EmptyMovementsProps) {
  return (
    <TableRow>
      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
        {message}
      </TableCell>
    </TableRow>
  );
}
