import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockDistribution } from "../hooks/useDashboardData";

export function StockChart() {
  const { data, isLoading } = useStockDistribution();

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Distribuição de Estoque</CardTitle>
        <CardDescription>
          Saldo atual da portaria por tipo de produto
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cheio" name="Cheio" fill="#15803d" />
                <Bar dataKey="vazio" name="Vazio" fill="#94a3b8" />
                <Bar dataKey="emprestado" name="Emprestado" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
