
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { InventoryItem } from "@/hooks/supabase/useInventory";
import { InventoryTableProps } from "../types";
import { EmptyTableRow } from "./EmptyTableRow";
import { InventoryItemRow } from "./InventoryItemRow";
import { InventoryTableHeader } from "./InventoryTableHeader";

export function InventoryItemsTable({ items, isLoading, error }: InventoryTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <InventoryTableHeader />
        <TableBody>
          {isLoading ? (
            <EmptyTableRow 
              colSpan={5} 
              message="Carregando dados do inventário..." 
            />
          ) : items.length === 0 ? (
            <EmptyTableRow 
              colSpan={5} 
              message="Nenhum item encontrado no inventário" 
            />
          ) : (
            items.map((item) => (
              <InventoryItemRow key={item.id} item={item} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
