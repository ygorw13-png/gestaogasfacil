
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { RouteReport } from "../../data/mockRouteReports";
import { RouteGeneralInfo } from "./dialog/RouteGeneralInfo";
import { RouteSalesInfo } from "./dialog/RouteSalesInfo";
import { RouteSalesTable } from "./dialog/RouteSalesTable";

interface RouteDetailsDialogProps {
  report: RouteReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (reportId: string) => void;
}

export function RouteDetailsDialog({ report, open, onOpenChange, onDownload }: RouteDetailsDialogProps) {
  if (!report) return null;

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
            onClick={() => onDownload(report.id)}
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
