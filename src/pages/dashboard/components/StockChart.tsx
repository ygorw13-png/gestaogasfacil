
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const stockData = [
  { name: 'P13', cheio: 45, vazio: 30, defeituoso: 2 },
  { name: 'P20', cheio: 12, vazio: 8, defeituoso: 1 },
  { name: 'P45', cheio: 8, vazio: 4, defeituoso: 0 },
  { name: 'Água', cheio: 65, vazio: 40, defeituoso: 3 },
];

export function StockChart() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Distribuição de Estoque</CardTitle>
        <CardDescription>
          Visualização do estoque atual por tipo de produto
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cheio" name="Cheio" fill="#15803d" />
              <Bar dataKey="vazio" name="Vazio" fill="#d1d5db" />
              <Bar dataKey="defeituoso" name="Defeituoso" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
