
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SalesData {
  name: string;
  gas: number;
  water: number;
}

interface SalesChartProps {
  data: SalesData[];
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export function SalesChart({ data, timeframe, onTimeframeChange }: SalesChartProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Visão Geral de Vendas</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTimeframeChange("today")}
              className={`px-2.5 py-1 text-xs rounded-md ${
                timeframe === "today" ? "bg-gasflow-100 text-gasflow-700" : "text-gray-500"
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => onTimeframeChange("week")}
              className={`px-2.5 py-1 text-xs rounded-md ${
                timeframe === "week" ? "bg-gasflow-100 text-gasflow-700" : "text-gray-500"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => onTimeframeChange("month")}
              className={`px-2.5 py-1 text-xs rounded-md ${
                timeframe === "month" ? "bg-gasflow-100 text-gasflow-700" : "text-gray-500"
              }`}
            >
              Mês
            </button>
          </div>
        </div>
        <CardDescription>
          {timeframe === "today" 
            ? "Vendas de hoje por hora" 
            : timeframe === "week" 
            ? "Vendas dos últimos 7 dias"
            : "Vendas do mês atual"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="gas"
                name="GLP"
                stroke="#16a34a"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="water"
                name="Água"
                stroke="#0ea5e9"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
