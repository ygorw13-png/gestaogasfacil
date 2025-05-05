
import React, { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { RouteReportsFilter } from "./reports/RouteReportsFilter";
import { RouteReportsTable } from "./reports/RouteReportsTable";
import { RouteDetailsDialog } from "./reports/RouteDetailsDialog";
import { mockReports } from "../data/mockRouteReports";
import { RouteReport } from "../data/mockRouteReports";
import { generateRoutesReport } from "../utils/routeReportUtils";

export function RouteReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [driverId, setDriverId] = useState('all');
  const [selectedReport, setSelectedReport] = useState<RouteReport | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);
      console.log("Gerando relatório com filtros:", { startDate, endDate, driverId });
      
      // Gerar relatório em Excel
      const blob = await generateRoutesReport(mockReports, { startDate, endDate, driverId });
      
      // Criar URL temporária e iniciar download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_rotas_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar recursos
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Relatório gerado com sucesso",
        description: "O download do relatório foi iniciado",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório de rotas",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      console.log("Baixando relatório ID:", reportId);
      const report = mockReports.find(r => r.id === reportId);
      
      if (!report) {
        throw new Error("Relatório não encontrado");
      }
      
      // Gerar relatório individual em Excel
      const blob = await generateRoutesReport([report], {});
      
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
      
      toast({
        title: "Download iniciado",
        description: "Seu relatório está sendo baixado.",
      });
    } catch (error) {
      console.error("Erro ao baixar relatório:", error);
      toast({
        title: "Erro ao baixar relatório",
        description: "Não foi possível baixar o relatório selecionado",
        variant: "destructive"
      });
    }
  };

  const viewReportDetails = (reportId: string) => {
    const report = mockReports.find(r => r.id === reportId);
    setSelectedReport(report || null);
    setDetailsDialogOpen(true);
  };

  // Filtrar relatórios baseado nos parâmetros
  const filteredReports = mockReports.filter(report => {
    // Filtro por data de início
    const startDateMatch = !startDate || new Date(report.date) >= new Date(startDate);
    
    // Filtro por data de fim
    const endDateMatch = !endDate || new Date(report.date) <= new Date(endDate);
    
    // Filtro por motorista
    const driverMatch = driverId === 'all' || report.driver.toLowerCase().includes(driverId.toLowerCase());
    
    return startDateMatch && endDateMatch && driverMatch;
  });

  return (
    <div className="space-y-8">
      <RouteReportsFilter
        startDate={startDate}
        endDate={endDate}
        driverId={driverId}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onDriverIdChange={setDriverId}
        onGenerateReport={generateReport}
        isGeneratingReport={isGeneratingReport}
      />

      <RouteReportsTable
        reports={filteredReports}
        onDownload={downloadReport}
        onViewDetails={viewReportDetails}
      />

      <RouteDetailsDialog
        report={selectedReport}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onDownload={downloadReport}
      />
    </div>
  );
}
