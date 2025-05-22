
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InventoryMovement } from "@/hooks/supabase/useInventory";
import { MovementTypeBadge } from "./MovementTypeBadge";

interface MovementRowProps {
  movement: InventoryMovement;
  index: number;
}

export function MovementRow({ movement, index }: MovementRowProps) {
  // Format date safely by checking if it's valid first
  const formattedDate = React.useMemo(() => {
    if (!movement.created_at) return "N/A";
    
    // Try to create a valid date object
    const dateObj = new Date(movement.created_at);
    
    // Check if the date is valid before formatting
    if (!isValid(dateObj)) return "Data inválida";
    
    return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
  }, [movement.created_at]);

  return (
    <TableRow key={movement.id || index}>
      <TableCell>{formattedDate}</TableCell>
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
