
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { FileText, Download, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

// Mock drivers data
const mockDrivers = [
  { id: "1", name: "João Silva" },
  { id: "2", name: "Pedro Santos" },
  { id: "3", name: "Carlos Ferreira" },
  { id: "4", name: "André Oliveira" },
];

// Mock histórico de relatórios
const mockReports = [
  {
    id: "1",
    date: "2025-04-23",
    driver: "João Silva",
    destination: "Povoado Santa Maria",
    salesCount: 8,
    totalAmount: 1320.00,
    details: {
      gasP13Sold: 5,
      gasP20Sold: 2,
      gasP45Sold: 1,
      waterSold: 3,
      clients: [
        { name: "Maria da Silva", items: "1x Gás P13", value: 120.00 },
        { name: "José Pereira", items: "1x Gás P20, 2x Água", value: 240.00 },
        { name: "Ana Santos", items: "1x Gás P13, 1x Água", value: 160.00 }
      ]
    }
  },
  {
    id: "2",
    date: "2025-04-20",
    driver: "Pedro Santos",
    destination: "Cidade de São Miguel",
    salesCount: 12,
    totalAmount: 2140.00,
    details: {
      gasP13Sold: 8,
      gasP20Sold: 4,
      gasP45Sold: 0,
      waterSold: 5,
      clients: [
        { name: "Roberto Alves", items: "1x Gás P13", value: 120.00 },
        { name: "Cláudia Mendes", items: "1x Gás P20, 1x Água", value: 200.00 }
      ]
    }
  },
  {
    id: "3",
    date: "2025-04-18",
    driver: "Carlos Ferreira",
    destination: "Povoado Baixa Grande",
    salesCount: 6,
    totalAmount: 950.00,
    details: {
      gasP13Sold: 4,
      gasP20Sold: 1,
      gasP45Sold: 0,
      waterSold: 2,
      clients: [
        { name: "Paulo Ribeiro", items: "1x Gás P13", value: 120.00 },
        { name: "Teresa Gonçalves", items: "1x Gás P20", value: 180.00 }
      ]
    }
  }
];

export function RouteReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [driverId, setDriverId] = useState('all');
  const [selectedReport, setSelectedReport] = useState<typeof mockReports[0] | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Filtrar relatórios baseado nos parâmetros (neste exemplo, os filtros não estão aplicados)
  const filteredReports = mockReports;

  const generateReport = () => {
    // Lógica para gerar relatório com os filtros selecionados
    console.log("Gerando relatório com filtros:", { startDate, endDate, driverId });
    toast({
      title: "Relatório gerado com sucesso",
      description: "O relatório foi gerado com os filtros selecionados.",
    });
  };

  const downloadReport = (reportId: string) => {
    // Em um caso real, isso deveria gerar um PDF ou planilha
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório de Rotas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="driverId">Motorista</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motorista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Motoristas</SelectItem>
                  {mockDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={generateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {filteredReports.map((report) => (
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
                        onClick={() => downloadReport(report.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewReportDetails(report.id)}  
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

      {/* Dialog para mostrar detalhes do relatório */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Rota</DialogTitle>
            <DialogDescription>
              {selectedReport && (
                <span>
                  Relatório de {new Date(selectedReport.date).toLocaleDateString('pt-BR')} - {selectedReport.destination}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-secondary p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Informações Gerais</h4>
                  <p><span className="font-semibold">Motorista:</span> {selectedReport.driver}</p>
                  <p><span className="font-semibold">Destino:</span> {selectedReport.destination}</p>
                  <p><span className="font-semibold">Total de vendas:</span> {selectedReport.salesCount}</p>
                  <p><span className="font-semibold">Valor total:</span> R$ {selectedReport.totalAmount.toFixed(2)}</p>
                </div>
                
                <div className="bg-secondary p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Produtos Vendidos</h4>
                  <p><span className="font-semibold">Gás P13:</span> {selectedReport.details.gasP13Sold} unidades</p>
                  <p><span className="font-semibold">Gás P20:</span> {selectedReport.details.gasP20Sold} unidades</p>
                  <p><span className="font-semibold">Gás P45:</span> {selectedReport.details.gasP45Sold} unidades</p>
                  <p><span className="font-semibold">Água:</span> {selectedReport.details.waterSold} unidades</p>
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
                    {selectedReport.details.clients.map((client, index) => (
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
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => selectedReport && downloadReport(selectedReport.id)}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Relatório
            </Button>
            <Button onClick={() => setDetailsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
