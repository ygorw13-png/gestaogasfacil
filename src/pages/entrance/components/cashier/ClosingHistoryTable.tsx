
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClosingExportButton } from "./ClosingExportButton";
import { PartialClosing } from "./CashierClosingDialog";
import { ClosingExportData } from "../../types/cashierTypes";
import { useClosingHistory } from "../../hooks/useClosingHistory";
import { ClosingFilters } from "./table/ClosingFilters";
import { DailySummaryRow } from "./table/DailySummaryRow";
import { ClosingEntryRow } from "./table/ClosingEntryRow";

interface ClosingHistoryTableProps {
  partialClosings: PartialClosing[];
}

export function ClosingHistoryTable({ partialClosings }: ClosingHistoryTableProps) {
  const [searchDate, setSearchDate] = useState("");
  const [filterType, setFilterType] = useState<"all" | "partial" | "total">("all");
  
  const {
    filteredClosings,
    groupedByDate,
    calculateDailyTotals
  } = useClosingHistory(partialClosings, searchDate, filterType);

  const exportData = useMemo((): ClosingExportData[] => {
    return filteredClosings.map(closing => ({
      date: closing.formattedDateTime,
      type: 'Parcial',
      totalSales: closing.totalSales,
      p13Quantity: closing.quantities.p13,
      p20Quantity: closing.quantities.p20,
      p45Quantity: closing.quantities.p45,
      waterQuantity: closing.quantities.water,
      paymentMethods: {
        cash: closing.totalSales * 0.3,
        credit: closing.totalSales * 0.2,
        debit: closing.totalSales * 0.15,
        pix: closing.totalSales * 0.2,
        promissory: closing.totalSales * 0.1,
        gasVoucher: closing.totalSales * 0.05
      },
      inventory: {
        initial: {
          p13: closing.quantities.p13 + 10,
          p20: closing.quantities.p20 + 5,
          p45: closing.quantities.p45 + 3,
          water: closing.quantities.water + 20
        },
        final: {
          p13: 10,
          p20: 5,
          p45: 3,
          water: 20
        }
      },
      observations: closing.observations
    }));
  }, [filteredClosings]);

  if (partialClosings.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Nenhum fechamento de caixa registrado</p>
      </div>
    );
  }

  const hasActiveFilters = searchDate !== "" || filterType !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <ClosingFilters
          searchDate={searchDate}
          filterType={filterType}
          onSearchChange={setSearchDate}
          onFilterChange={setFilterType}
          onClearFilters={() => {
            setSearchDate("");
            setFilterType("all");
          }}
          hasActiveFilters={hasActiveFilters}
        />
        
        <ClosingExportButton 
          data={exportData}
          fileName="historico-fechamentos"
          disabled={filteredClosings.length === 0}
        />
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">P13</TableHead>
              <TableHead className="text-right">P20</TableHead>
              <TableHead className="text-right">P45</TableHead>
              <TableHead className="text-right">Água</TableHead>
              <TableHead className="text-right">Total (R$)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedByDate).map(([date, closings]) => {
              const dailyTotals = calculateDailyTotals(closings);
              
              return (
                <>
                  {closings.map((closing) => (
                    <ClosingEntryRow key={closing.id} closing={closing} />
                  ))}
                  
                  <DailySummaryRow key={`${date}-summary`} date={date} totals={dailyTotals} />
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
