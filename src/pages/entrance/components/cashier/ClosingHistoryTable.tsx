
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClosingExportButton } from "./ClosingExportButton";
import { PartialClosing } from "./CashierClosingDialog";
import { ClosingExportData } from "../../types/cashierTypes";
import { useState, useMemo } from "react";
import { ClosingFilters } from "./table/ClosingFilters";
import { DailySummaryRow } from "./table/DailySummaryRow";
import { ClosingEntryRow } from "./table/ClosingEntryRow";

interface ClosingHistoryTableProps {
  partialClosings: PartialClosing[];
}

export function ClosingHistoryTable({ partialClosings }: ClosingHistoryTableProps) {
  const [searchDate, setSearchDate] = useState("");
  const [filterType, setFilterType] = useState<"all" | "partial" | "total">("all");
  
  const formattedClosings = useMemo(() => {
    return [...partialClosings].reverse().map(closing => {
      const date = new Date(closing.timestamp);
      return {
        ...closing,
        formattedDate: date.toLocaleDateString('pt-BR'),
        formattedTime: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        formattedDateTime: `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      };
    });
  }, [partialClosings]);
  
  const filteredClosings = useMemo(() => {
    let filtered = formattedClosings;
    
    if (searchDate) {
      filtered = filtered.filter(c => c.formattedDate.includes(searchDate));
    }
    
    if (filterType !== "all") {
      filtered = filtered.filter(c => filterType === "partial");
    }
    
    return filtered;
  }, [formattedClosings, searchDate, filterType]);
  
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof formattedClosings> = {};
    
    formattedClosings.forEach(closing => {
      if (!groups[closing.formattedDate]) {
        groups[closing.formattedDate] = [];
      }
      groups[closing.formattedDate].push(closing);
    });
    
    return groups;
  }, [formattedClosings]);
  
  const calculateDailyTotals = (closings: typeof formattedClosings) => {
    return closings.reduce(
      (acc, closing) => {
        acc.sales += closing.totalSales;
        acc.p13 += closing.quantities.p13;
        acc.p20 += closing.quantities.p20;
        acc.p45 += closing.quantities.p45;
        acc.water += closing.quantities.water;
        return acc;
      },
      { sales: 0, p13: 0, p20: 0, p45: 0, water: 0 }
    );
  };

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
