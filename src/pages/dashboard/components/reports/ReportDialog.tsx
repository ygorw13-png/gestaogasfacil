
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Download } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addMonths } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateReport: (dateRange: DateRange | undefined) => void;
  isGeneratingReport: boolean;
}

export function ReportDialog({ 
  open, 
  onOpenChange, 
  onGenerateReport, 
  isGeneratingReport 
}: ReportDialogProps) {
  // Initialize with current month as default range
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date() // Today
  });

  const handleGenerate = () => {
    if (!dateRange || !dateRange.from) {
      toast({
        title: "Selecione um período",
        description: "É necessário selecionar um período para gerar o relatório",
        variant: "destructive"
      });
      return;
    }
    
    onGenerateReport(dateRange);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerar Relatório Mensal
          </DialogTitle>
          <DialogDescription>
            Selecione o período para gerar o relatório de desempenho e métricas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Período de Análise</label>
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">O relatório irá incluir:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>Análise de vendas no período selecionado</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>Métricas de desempenho financeiro</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>Análise de estoque e necessidades de reposição</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>Sugestões de otimização com base nas métricas</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Gerando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
