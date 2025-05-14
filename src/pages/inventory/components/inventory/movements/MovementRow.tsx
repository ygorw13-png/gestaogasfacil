
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InventoryMovement } from "@/hooks/supabase/useInventory";
import { MovementTypeBadge } from "./MovementTypeBadge";

interface MovementRowProps {
  movement: InventoryMovement;
  index: number;
}

export function MovementRow({ movement, index }: MovementRowProps) {
  return (
    <TableRow key={movement.id || index}>
      <TableCell>
        {movement.created_at 
          ? format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
          : "N/A"}
      </TableCell>
      <TableCell>{movement.product}</TableCell>
      <TableCell>
        <MovementTypeBadge type={movement.type} />
      </TableCell>
      <TableCell className="text-right">{movement.quantity}</TableCell>
      <TableCell className="max-w-xs truncate" title={movement.notes}>
        {movement.notes || "-"}
      </TableCell>
    </TableRow>
  );
}
