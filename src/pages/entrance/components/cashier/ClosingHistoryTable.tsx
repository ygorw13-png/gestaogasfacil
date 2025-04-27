
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatUtils";
import { PartialClosing } from "./CashierClosingDialog";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ClosingExportButton } from "./ClosingExportButton";
import { ClosingExportData } from "../../types/cashierTypes";

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
      filtered = filtered.filter(c => {
        // Todos os fechamentos existentes são parciais neste momento
        // Mas no futuro teremos fechamentos totais também
        return filterType === "partial";
      });
    }
    
    return filtered;
  }, [formattedClosings, searchDate, filterType]);
  
  // Agrupar por data para mostrar saldo acumulado
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

  // Preparar dados para exportação
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
        // Valores estimados já que não temos o detalhamento real
        cash: closing.totalSales * 0.3,
        credit: closing.totalSales * 0.2,
        debit: closing.totalSales * 0.15,
        pix: closing.totalSales * 0.2,
        promissory: closing.totalSales * 0.1,
        gasVoucher: closing.totalSales * 0.05
      },
      inventory: {
        initial: {
          // Valores fictícios, no futuro seriam reais
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Input 
            value={searchDate} 
            onChange={(e) => setSearchDate(e.target.value)}
            placeholder="Filtrar por data (dd/mm/aaaa)"
            className="max-w-xs"
          />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo de Fechamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="total">Total</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSearchDate("");
              setFilterType("all");
            }}
            disabled={!searchDate && filterType === "all"}
            className="h-10"
          >
            Limpar
          </Button>
        </div>
        
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
                  {closings.map((closing, i) => (
                    <TableRow key={closing.id}>
                      <TableCell>{closing.formattedDateTime}</TableCell>
                      <TableCell>Parcial</TableCell>
                      <TableCell className="text-right">{closing.quantities.p13}</TableCell>
                      <TableCell className="text-right">{closing.quantities.p20}</TableCell>
                      <TableCell className="text-right">{closing.quantities.p45}</TableCell>
                      <TableCell className="text-right">{closing.quantities.water}</TableCell>
                      <TableCell className="text-right font-medium">R$ {formatCurrency(closing.totalSales)}</TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Linha de resumo diário */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">{date} (Total)</TableCell>
                    <TableCell>Diário</TableCell>
                    <TableCell className="text-right font-medium">{dailyTotals.p13}</TableCell>
                    <TableCell className="text-right font-medium">{dailyTotals.p20}</TableCell>
                    <TableCell className="text-right font-medium">{dailyTotals.p45}</TableCell>
                    <TableCell className="text-right font-medium">{dailyTotals.water}</TableCell>
                    <TableCell className="text-right font-medium">R$ {formatCurrency(dailyTotals.sales)}</TableCell>
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
