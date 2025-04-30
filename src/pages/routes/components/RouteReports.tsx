
import React, { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { RouteReportsFilter } from "./reports/RouteReportsFilter";
import { RouteReportsTable } from "./reports/RouteReportsTable";
import { RouteDetailsDialog } from "./reports/RouteDetailsDialog";
import { mockReports } from "../data/mockRouteReports";
import { RouteReport } from "../data/mockRouteReports";

export function RouteReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [driverId, setDriverId] = useState('all');
  const [selectedReport, setSelectedReport] = useState<RouteReport | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const generateReport = () => {
    console.log("Gerando relatório com filtros:", { startDate, endDate, driverId });
    toast({
      title: "Relatório gerado com sucesso",
      description: "O relatório foi gerado com os filtros selecionados.",
    });
  };

  const downloadReport = (reportId: string) => {
    console.log("Baixando relatório ID:", reportId);
    toast({
      title: "Download iniciado",
      description: "Seu relatório está sendo baixado.",
    });
  };

  const viewReportDetails = (reportId: string) => {
    const report = mockReports.find(r => r.id === reportId);
    setSelectedReport(report || null);
    setDetailsDialogOpen(true);
  };

  // Filtrar relatórios baseado nos parâmetros (neste exemplo, os filtros não estão aplicados)
  const filteredReports = mockReports;

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
