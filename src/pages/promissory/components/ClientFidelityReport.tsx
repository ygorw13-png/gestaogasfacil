
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PromissoryNote } from "../types";

interface ClientFidelityReportProps {
  notes: PromissoryNote[];
}

export function ClientFidelityReport({ notes }: ClientFidelityReportProps) {
  const clientStats = useMemo(() => {
    const stats = new Map<string, { count: number, totalValue: number, paid: number }>();
    
    notes.forEach(note => {
      if (!stats.has(note.clientName)) {
        stats.set(note.clientName, { count: 0, totalValue: 0, paid: 0 });
      }
      
      const clientStat = stats.get(note.clientName)!;
      clientStat.count += 1;
      clientStat.totalValue += note.value;
      
      if (note.status === "paid") {
        clientStat.paid += 1;
      }
    });
    
    return Array.from(stats.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      totalValue: data.totalValue,
      paidPercent: data.count > 0 ? (data.paid / data.count) * 100 : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);
  }, [notes]);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Fidelidade de Clientes</CardTitle>
        <CardDescription>
          Análise dos clientes com maior volume de notas promissórias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={clientStats}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => {
              if (name === "totalValue") return [`R$ ${Number(value).toFixed(2)}`, "Valor Total"];
              if (name === "count") return [value, "Quantidade"];
              if (name === "paidPercent") return [`${Number(value).toFixed(1)}%`, "% Pagas"];
              return [value, name];
            }} />
            <Legend />
            <Bar yAxisId="left" dataKey="totalValue" name="Valor Total (R$)" fill="#22C55E" />
            <Bar yAxisId="left" dataKey="count" name="Quantidade" fill="#3B82F6" />
            <Bar yAxisId="right" dataKey="paidPercent" name="% Pagas" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
