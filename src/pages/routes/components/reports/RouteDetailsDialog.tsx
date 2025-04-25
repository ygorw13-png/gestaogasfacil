
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { RouteReport } from "../../data/mockRouteReports";

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
            <div className="bg-secondary p-4 rounded-lg">
              <h4 className="font-medium mb-2">Informações Gerais</h4>
              <p><span className="font-semibold">Motorista:</span> {report.driver}</p>
              <p><span className="font-semibold">Destino:</span> {report.destination}</p>
              <p><span className="font-semibold">Total de vendas:</span> {report.salesCount}</p>
              <p><span className="font-semibold">Valor total:</span> R$ {report.totalAmount.toFixed(2)}</p>
            </div>
            
            <div className="bg-secondary p-4 rounded-lg">
              <h4 className="font-medium mb-2">Produtos Vendidos</h4>
              <p><span className="font-semibold">Gás P13:</span> {report.details.gasP13Sold} unidades</p>
              <p><span className="font-semibold">Gás P20:</span> {report.details.gasP20Sold} unidades</p>
              <p><span className="font-semibold">Gás P45:</span> {report.details.gasP45Sold} unidades</p>
              <p><span className="font-semibold">Água:</span> {report.details.waterSold} unidades</p>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Vendas Realizadas</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.details.clients.map((client, index) => (
                  <TableRow key={index}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.items}</TableCell>
                    <TableCell>R$ {client.value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
