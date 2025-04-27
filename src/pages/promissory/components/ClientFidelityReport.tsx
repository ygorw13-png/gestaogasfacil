
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
    
    return Array.from(stats.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalValue: data.totalValue,
        paidPercent: data.count > 0 ? (data.paid / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  }, [notes]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Análise de Fidelidade de Clientes</CardTitle>
          <CardDescription>
            Top 10 clientes por volume total de notas promissórias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={clientStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
                tick={{ fill: '#666', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left"
                tick={{ fill: '#666' }}
                label={{ 
                  value: 'Valor Total (R$)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: '#666' }
                }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fill: '#666' }}
                label={{ 
                  value: 'Quantidade e % Pagas', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { fill: '#666' }
                }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === "totalValue") return [`R$ ${value.toFixed(2)}`, "Valor Total"];
                  if (name === "count") return [value, "Quantidade de Notas"];
                  if (name === "paidPercent") return [`${value.toFixed(1)}%`, "% de Notas Pagas"];
                  return [value, name];
                }}
                labelStyle={{ fontWeight: 'bold' }}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '8px'
                }}
              />
              <Legend 
                verticalAlign="top"
                height={36}
                formatter={(value: string) => {
                  if (value === "totalValue") return "Valor Total (R$)";
                  if (value === "count") return "Quantidade de Notas";
                  if (value === "paidPercent") return "% de Notas Pagas";
                  return value;
                }}
              />
              <Bar 
                yAxisId="left" 
                dataKey="totalValue" 
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
                name="totalValue"
              />
              <Bar 
                yAxisId="right" 
                dataKey="count" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                name="count"
              />
              <Bar 
                yAxisId="right" 
                dataKey="paidPercent" 
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
                name="paidPercent"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

