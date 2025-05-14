import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InventoryMovement } from "@/hooks/supabase/useInventory";

interface MovementsHistoryProps {
  movements: InventoryMovement[];
}

export function MovementsHistory({ movements }: MovementsHistoryProps) {
  // Memorizar o sorting para evitar recalcular em cada renderização
  const sortedMovements = useMemo(() => {
    return [...movements].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Ordenar da mais recente para a mais antiga
    });
  }, [movements]);

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead>Observações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMovements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                Nenhum registro de movimentação encontrado
              </TableCell>
            </TableRow>
          ) : (
            sortedMovements.map((movement, index) => (
              <TableRow key={movement.id || index}>
                <TableCell>
                  {movement.created_at 
                    ? format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "N/A"}
                </TableCell>
                <TableCell>{movement.product}</TableCell>
                <TableCell>
                  <Badge variant={getVariantByType(movement.type)}>
                    {movement.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{movement.quantity}</TableCell>
                <TableCell className="max-w-xs truncate" title={movement.notes}>
                  {movement.notes || "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Função helper para determinar a variante do Badge com base no tipo
function getVariantByType(type: string): "default" | "secondary" | "destructive" {
  switch (type) {
    case "entrada":
      return "default";
    case "saída":
      return "destructive";
    default:
      return "secondary";
  }
}

// Export the component memorized for better performance
export default React.memo(MovementsHistory);
