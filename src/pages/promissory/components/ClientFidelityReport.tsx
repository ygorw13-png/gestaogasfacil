import React, { memo } from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PromissoryNote } from "../types";
import { useClientStats } from "../hooks/useClientStats";

interface ClientFidelityReportProps {
  notes: PromissoryNote[];
}

function ClientFidelityReportComponent({ notes }: ClientFidelityReportProps) {
  const clientStats = useClientStats(notes);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Análise de Fidelidade de Clientes</CardTitle>
          <CardDescription>
            Top 10 clientes por volume financeiro e percentual de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart
              data={clientStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
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
                domain={[0, 100]}
                tick={{ fill: '#666' }}
                label={{ 
                  value: '% de Notas Pagas', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { fill: '#666' }
                }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === "totalValue") return [`R$ ${value.toFixed(2)}`, "Valor Total"];
                  if (name === "paidPercent") return [`${value.toFixed(1)}%`, "% de Notas Pagas"];
                  if (name === "count") return [value, "Quantidade de Notas"];
                  return [value, name];
                }}
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
                  if (value === "paidPercent") return "% de Notas Pagas";
                  if (value === "count") return "Quantidade de Notas";
                  return value;
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="totalValue"
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
                name="totalValue"
                barSize={40}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="paidPercent"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: '#F59E0B', r: 6 }}
                name="paidPercent"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export const ClientFidelityReport = memo(ClientFidelityReportComponent);
