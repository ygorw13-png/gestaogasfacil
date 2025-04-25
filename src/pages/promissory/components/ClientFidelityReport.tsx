
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

// Dados mockados para exemplo
const fidelityData = [
  { id: 1, clientName: "João Silva", onTimePayments: 8, latePayments: 2, averageDaysLate: 0, totalValue: 2800.00, score: "good" },
  { id: 2, clientName: "Maria Santos", onTimePayments: 5, latePayments: 3, averageDaysLate: 4, totalValue: 3500.00, score: "medium" },
  { id: 3, clientName: "Pedro Souza", onTimePayments: 12, latePayments: 0, averageDaysLate: 0, totalValue: 5800.00, score: "excellent" },
  { id: 4, clientName: "Ana Oliveira", onTimePayments: 3, latePayments: 7, averageDaysLate: 8, totalValue: 4200.00, score: "bad" },
  { id: 5, clientName: "Roberto Carlos", onTimePayments: 6, latePayments: 4, averageDaysLate: 3, totalValue: 3800.00, score: "medium" },
];

const chartData = [
  { name: "João Silva", onTime: 8, late: 2 },
  { name: "Maria Santos", onTime: 5, late: 3 },
  { name: "Pedro Souza", onTime: 12, late: 0 },
  { name: "Ana Oliveira", onTime: 3, late: 7 },
  { name: "Roberto Carlos", onTime: 6, late: 4 },
];

export function ClientFidelityReport() {
  const [reportView, setReportView] = useState("table");
  
  const getScoreColor = (score: string) => {
    switch (score) {
      case "excellent": return "bg-green-500 hover:bg-green-600";
      case "good": return "bg-blue-500 hover:bg-blue-600";
      case "medium": return "bg-yellow-500 hover:bg-yellow-600";
      case "bad": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  const getScoreName = (score: string) => {
    switch (score) {
      case "excellent": return "Excelente";
      case "good": return "Bom";
      case "medium": return "Regular";
      case "bad": return "Ruim";
      default: return "Desconhecido";
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs value={reportView} onValueChange={setReportView}>
          <TabsList>
            <TabsTrigger value="table">Tabela</TabsTrigger>
            <TabsTrigger value="chart">Gráfico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pagamentos em Dia</TableHead>
                  <TableHead>Pagamentos Atrasados</TableHead>
                  <TableHead>Média de Atraso (dias)</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fidelityData.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.clientName}</TableCell>
                    <TableCell>{client.onTimePayments}</TableCell>
                    <TableCell>{client.latePayments}</TableCell>
                    <TableCell>{client.averageDaysLate}</TableCell>
                    <TableCell>R$ {client.totalValue.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getScoreColor(client.score)}>
                        {getScoreName(client.score)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="chart" className="pt-4">
            <ChartContainer config={{
              onTime: { label: "Em Dia", color: "#22c55e" },
              late: { label: "Atrasados", color: "#ef4444" }
            }} className="h-80">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="onTime" fill="var(--color-onTime)" name="Em Dia" />
                <Bar dataKey="late" fill="var(--color-late)" name="Atrasados" />
                <Legend />
              </BarChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
