
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { RouteReport } from "../../data/mockRouteReports";
import { RouteGeneralInfo } from "./dialog/RouteGeneralInfo";
import { RouteSalesInfo } from "./dialog/RouteSalesInfo";
import { RouteSalesTable } from "./dialog/RouteSalesTable";
import { toast } from "@/hooks/use-toast";
import { generateRouteDetailReport } from "../../utils/routeReportUtils";

interface RouteDetailsDialogProps {
  report: RouteReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (reportId: string) => void;
}

export function RouteDetailsDialog({ report, open, onOpenChange, onDownload }: RouteDetailsDialogProps) {
  if (!report) return null;

  const handleDownload = async () => {
    try {
      // Chamamos a função original para manter a compatibilidade
      onDownload(report.id);
      
      // Também geramos um relatório mais bonito
      const blob = await generateRouteDetailReport(report);
      
      // Criar URL temporária e iniciar download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rota_${report.destination.replace(/\s+/g, '_')}_${new Date(report.date).toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar recursos
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório detalhado",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Rota</DialogTitle>
          <DialogDescription>
            {new Date(report.date).toLocaleDateString('pt-BR')} - {report.destination}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RouteGeneralInfo report={report} />
            <RouteSalesInfo report={report} />
          </div>
          
          <RouteSalesTable report={report} />
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Relatório
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
