
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
    totalAmount: 1320.00
  },
  {
    id: "2",
    date: "2025-04-20",
    driver: "Pedro Santos",
    destination: "Cidade de São Miguel",
    salesCount: 12,
    totalAmount: 2140.00
  },
  {
    id: "3",
    date: "2025-04-18",
    driver: "Carlos Ferreira",
    destination: "Povoado Baixa Grande",
    salesCount: 6,
    totalAmount: 950.00
  }
];

export function RouteReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [driverId, setDriverId] = useState('all');

  // Filtrar relatórios baseado nos parâmetros (neste exemplo, os filtros não estão aplicados)
  const filteredReports = mockReports;

  const generateReport = () => {
    // Lógica para gerar relatório com os filtros selecionados
    console.log("Gerando relatório com filtros:", { startDate, endDate, driverId });
    // Na implementação real, isso conectaria a uma API ou geraria um PDF
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
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
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
    </div>
  );
}
