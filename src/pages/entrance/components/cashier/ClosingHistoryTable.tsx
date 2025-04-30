
import { Table } from "@/components/ui/table";
import { ClosingExportButton } from "./ClosingExportButton";
import { PartialClosing } from "../../types/cashierTypes";
import { useClosingHistory } from "../../hooks/useClosingHistory";
import { ClosingFilters } from "./table/ClosingFilters";
import { ClosingTableHeader } from "./table/ClosingTableHeader";
import { ClosingTableBody } from "./table/ClosingTableBody";
import { useState } from "react";
import { useExportData } from "./table/ExportDataGenerator";

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

  const exportData = useExportData({ filteredClosings });

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
          <ClosingTableHeader />
          <ClosingTableBody 
            groupedByDate={groupedByDate}
            calculateDailyTotals={calculateDailyTotals}
          />
        </Table>
      </div>
    </div>
  );
}
