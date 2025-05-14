
import React from "react";
import { Table, TableBody } from "@/components/ui/table";
import { MovementsHistoryProps } from "./types";
import { MovementsTableHeader } from "./MovementsTableHeader";
import { EmptyMovements } from "./EmptyMovements";
import { MovementRow } from "./MovementRow";
import { useSortedMovements } from "./useMovements";

export function MovementsHistory({ movements }: MovementsHistoryProps) {
  const sortedMovements = useSortedMovements(movements);

  return (
    <div className="border rounded-md">
      <Table>
        <MovementsTableHeader />
        <TableBody>
          {sortedMovements.length === 0 ? (
            <EmptyMovements />
          ) : (
            sortedMovements.map((movement, index) => (
              <MovementRow 
                key={movement.id || index} 
                movement={movement} 
                index={index} 
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Export the component memorized for better performance
export default React.memo(MovementsHistory);
