
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatUtils";
import { PartialClosing } from "./CashierClosingDialog";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClosingHistoryTableProps {
  partialClosings: PartialClosing[];
}

export function ClosingHistoryTable({ partialClosings }: ClosingHistoryTableProps) {
  const [searchDate, setSearchDate] = useState("");
  
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
    if (!searchDate) return formattedClosings;
    return formattedClosings.filter(c => c.formattedDate.includes(searchDate));
  }, [formattedClosings, searchDate]);
  
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

  if (partialClosings.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Nenhum fechamento de caixa registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input 
          value={searchDate} 
          onChange={(e) => setSearchDate(e.target.value)}
          placeholder="Filtrar por data (dd/mm/aaaa)"
          className="max-w-xs"
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSearchDate("")}
          disabled={!searchDate}
        >
          Limpar
        </Button>
      </div>
      
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
  );
}
