
import { useState } from "react";
import { 
  Home, 
  Clipboard, 
  TrendingUp, 
  AlertCircle, 
  Package, 
  Droplet
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock data for the dashboard
const salesData = [
  { name: '1', gas: 4000, water: 2400 },
  { name: '2', gas: 3000, water: 1398 },
  { name: '3', gas: 2000, water: 9800 },
  { name: '4', gas: 2780, water: 3908 },
  { name: '5', gas: 1890, water: 4800 },
  { name: '6', gas: 2390, water: 3800 },
  { name: '7', gas: 3490, water: 4300 },
  { name: '8', gas: 3490, water: 4300 },
  { name: '9', gas: 3490, water: 4300 },
  { name: '10', gas: 3490, water: 4300 },
];

const overviewData = {
  todaySales: 'R$ 5.240,00',
  totalStock: {
    gasP13: 45,
    gasP20: 12,
    gasP45: 8,
    water: 65
  },
  promissoryNotes: 28,
  promissoryValue: 'R$ 3.750,00'
};

const topSellers = [
  { id: 1, name: 'João Silva', sales: 42, value: 'R$ 2.350,00' },
  { id: 2, name: 'Maria Souza', sales: 38, value: 'R$ 1.980,00' },
  { id: 3, name: 'Pedro Santos', sales: 35, value: 'R$ 1.750,00' },
  { id: 4, name: 'Ana Oliveira', sales: 30, value: 'R$ 1.600,00' },
];

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState("today");

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Última atualização: </span>
          <span className="text-sm font-medium">{new Date().toLocaleString()}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas de Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.todaySales}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque GLP (P13)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.totalStock.gasP13} unidades</div>
            <p className="text-xs text-muted-foreground">
              12 unidades na portaria
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Água</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.totalStock.water} galões</div>
            <p className="text-xs text-muted-foreground">
              15 galões na portaria
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promissórias</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.promissoryNotes}</div>
            <p className="text-xs text-muted-foreground">
              Total: {overviewData.promissoryValue}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="sellers">Vendedores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Visão Geral de Vendas</CardTitle>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTimeframe("today")}
                      className={`px-2.5 py-1 text-xs rounded-md ${
                        timeframe === "today" ? "bg-gasflow-100 text-gasflow-700" : "text-gray-500"
                      }`}
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setTimeframe("week")}
                      className={`px-2.5 py-1 text-xs rounded-md ${
                        timeframe === "week" ? "bg-gasflow-100 text-gasflow-700" : "text-gray-500"
                      }`}
                    >
                      Semana
                    </button>
                    <button
                      onClick={() => setTimeframe("month")}
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
                    <LineChart data={salesData}>
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
          </div>
        </TabsContent>
        
        <TabsContent value="stock" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
                    <BarChart data={[
                      { name: 'P13', cheio: 45, vazio: 30, defeituoso: 2 },
                      { name: 'P20', cheio: 12, vazio: 8, defeituoso: 1 },
                      { name: 'P45', cheio: 8, vazio: 4, defeituoso: 0 },
                      { name: 'Água', cheio: 65, vazio: 40, defeituoso: 3 },
                    ]}>
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
          </div>
        </TabsContent>
        
        <TabsContent value="sellers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Vendedores</CardTitle>
              <CardDescription>
                Vendedores com melhor desempenho no período atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellers.map((seller) => (
                  <div key={seller.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="bg-gasflow-100 text-gasflow-700 w-9 h-9 rounded-full flex items-center justify-center">
                        {seller.id}
                      </div>
                      <div>
                        <p className="font-medium">{seller.name}</p>
                        <p className="text-sm text-muted-foreground">{seller.sales} vendas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{seller.value}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
