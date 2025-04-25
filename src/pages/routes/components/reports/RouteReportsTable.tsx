
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Truck } from "lucide-react";
import { RouteReport } from "../../data/mockRouteReports";

interface RouteReportsTableProps {
  reports: RouteReport[];
  onDownload: (reportId: string) => void;
  onViewDetails: (reportId: string) => void;
}

export function RouteReportsTable({ reports, onDownload, onViewDetails }: RouteReportsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Relatórios</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{new Date(report.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{report.driver}</TableCell>
                <TableCell>{report.destination}</TableCell>
                <TableCell>{report.salesCount}</TableCell>
                <TableCell>R$ {report.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDownload(report.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails(report.id)}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
