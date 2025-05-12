
import React from "react";
import { TableBody } from "@/components/ui/table";
import { FormattedClosing } from "../../../hooks/useClosingHistory";
import { ClosingEntryRow } from "./ClosingEntryRow";
import { DailySummaryRow } from "./DailySummaryRow";

interface ClosingTableBodyProps {
  groupedByDate: Record<string, FormattedClosing[]>;
  calculateDailyTotals: (closings: FormattedClosing[]) => {
    sales: number;
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
}

export const ClosingTableBody = React.memo(function ClosingTableBody({ 
  groupedByDate, 
  calculateDailyTotals 
}: ClosingTableBodyProps) {
  return (
    <TableBody>
      {Object.entries(groupedByDate).map(([date, closings]) => {
        const dailyTotals = calculateDailyTotals(closings);
        
        return (
          <React.Fragment key={date}>
            {closings.map((closing) => (
              <ClosingEntryRow key={closing.id} closing={closing} />
            ))}
            
            <DailySummaryRow key={`${date}-summary`} date={date} totals={dailyTotals} />
          </React.Fragment>
        );
      })}
    </TableBody>
  );
});
