
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

const dailyData = [
  { name: "Dom", value: 320 },
  { name: "Seg", value: 450 },
  { name: "Ter", value: 280 },
  { name: "Qua", value: 390 },
  { name: "Qui", value: 510 },
  { name: "Sex", value: 620 },
  { name: "Sáb", value: 350 },
];

const weeklyData = [
  { name: "Semana 1", value: 2100 },
  { name: "Semana 2", value: 1800 },
  { name: "Semana 3", value: 2400 },
  { name: "Semana 4", value: 1950 },
];

const monthlyData = [
  { name: "Jan", value: 7800 },
  { name: "Fev", value: 8200 },
  { name: "Mar", value: 9100 },
  { name: "Abr", value: 8750 },
  { name: "Mai", value: 9200 },
  { name: "Jun", value: 8800 },
];

// Dados de projeção de recebimentos recomendados
const projectionData = {
  daily: { recommended: 450, current: 380 },
  weekly: { recommended: 2200, current: 2000 },
  monthly: { recommended: 8800, current: 8600 },
  total: { receivable: 24500, overdue: 3800 }
};

export function PromissoryStats() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Promissórias</CardTitle>
            <CardDescription>Análise de recebimentos</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="mb-4">
            <TabsTrigger value="daily">Diário</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="projection">Projeção</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily">
            <div className="mb-4">
              <div className="mb-1 text-sm font-medium">Recebimentos Diários</div>
              <div className="text-2xl font-bold">R$ {dailyData.reduce((sum, item) => sum + item.value, 0).toLocaleString('pt-BR')}</div>
            </div>
            
            <ChartContainer config={{
              value: { label: "Valor", color: "#3b82f6" }
            }} className="h-80">
              <BarChart data={dailyData}>
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
          </TabsContent>
          
          <TabsContent value="weekly">
            <div className="mb-4">
              <div className="mb-1 text-sm font-medium">Recebimentos Semanais</div>
              <div className="text-2xl font-bold">R$ {weeklyData.reduce((sum, item) => sum + item.value, 0).toLocaleString('pt-BR')}</div>
            </div>
            
            <ChartContainer config={{
              value: { label: "Valor", color: "#3b82f6" }
            }} className="h-80">
              <BarChart data={weeklyData}>
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
          </TabsContent>
          
          <TabsContent value="monthly">
            <div className="mb-4">
              <div className="mb-1 text-sm font-medium">Recebimentos Mensais</div>
              <div className="text-2xl font-bold">R$ {monthlyData.reduce((sum, item) => sum + item.value, 0).toLocaleString('pt-BR')}</div>
            </div>
            
            <ChartContainer config={{
              value: { label: "Valor", color: "#3b82f6" }
            }} className="h-80">
              <BarChart data={monthlyData}>
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
          </TabsContent>
          
          <TabsContent value="projection">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {projectionData.total.receivable.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluindo {projectionData.total.overdue.toLocaleString('pt-BR')} em atraso
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Meta Recomendada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Dia</div>
                      <div className="font-medium">R$ {projectionData.daily.recommended}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Semana</div>
                      <div className="font-medium">R$ {projectionData.weekly.recommended}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Mês</div>
                      <div className="font-medium">R$ {projectionData.monthly.recommended}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Meta Diária (R$ {projectionData.daily.recommended})</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round((projectionData.daily.current / projectionData.daily.recommended) * 100)}%
                  </div>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(projectionData.daily.current / projectionData.daily.recommended) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Meta Semanal (R$ {projectionData.weekly.recommended})</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round((projectionData.weekly.current / projectionData.weekly.recommended) * 100)}%
                  </div>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(projectionData.weekly.current / projectionData.weekly.recommended) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Meta Mensal (R$ {projectionData.monthly.recommended})</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round((projectionData.monthly.current / projectionData.monthly.recommended) * 100)}%
                  </div>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(projectionData.monthly.current / projectionData.monthly.recommended) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
