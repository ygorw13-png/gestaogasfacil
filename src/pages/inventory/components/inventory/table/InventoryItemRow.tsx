
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { InventoryItem } from "@/hooks/supabase/useInventory";
import { InventoryStatusBadge } from "./InventoryStatusBadge";

interface InventoryItemRowProps {
  item: InventoryItem;
}

export function InventoryItemRow({ item }: InventoryItemRowProps) {
  return (
    <TableRow key={item.id}>
      <TableCell className="font-medium">{item.product}</TableCell>
      <TableCell>{item.category}</TableCell>
      <TableCell className="text-right">{item.quantity}</TableCell>
      <TableCell>
        {format(new Date(item.last_update), "dd/MM/yyyy HH:mm")}
      </TableCell>
      <TableCell>
        <InventoryStatusBadge quantity={item.quantity} />
      </TableCell>
    </TableRow>
  );
}
