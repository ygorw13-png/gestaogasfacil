
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartDisplayProps {
  data: Array<{ name: string; value: number }>;
  title: string;
  total: number;
}

export function ChartDisplay({ data, title, total }: ChartDisplayProps) {
  return (
    <>
      <div className="mb-4">
        <div className="mb-1 text-sm font-medium">{title}</div>
        <div className="text-2xl font-bold">
          R$ {total.toLocaleString('pt-BR')}
        </div>
      </div>
      
      <ChartContainer
        config={{
          value: { label: "Valor", color: "#3b82f6" }
        }}
        className="h-80"
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar 
            dataKey="value" 
            fill="var(--color-value)" 
            name="Valor" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </>
  );
}
