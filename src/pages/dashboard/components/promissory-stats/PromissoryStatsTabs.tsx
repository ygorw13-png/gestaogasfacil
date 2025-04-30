
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartDisplay } from "./ChartDisplay";
import { ProjectionContent } from "./ProjectionContent";

interface PromissoryTabsProps {
  dailyData: Array<{ name: string; value: number }>;
  weeklyData: Array<{ name: string; value: number }>;
  monthlyData: Array<{ name: string; value: number }>;
  projectionData: {
    daily: { recommended: number; current: number };
    weekly: { recommended: number; current: number };
    monthly: { recommended: number; current: number };
    total: { receivable: number; overdue: number };
  };
}

export function PromissoryStatsTabs({
  dailyData,
  weeklyData,
  monthlyData,
  projectionData
}: PromissoryTabsProps) {
  // Calculate totals for each timeframe
  const dailyTotal = dailyData.reduce((sum, item) => sum + item.value, 0);
  const weeklyTotal = weeklyData.reduce((sum, item) => sum + item.value, 0);
  const monthlyTotal = monthlyData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Tabs defaultValue="daily">
      <TabsList className="mb-4">
        <TabsTrigger value="daily">Diário</TabsTrigger>
        <TabsTrigger value="weekly">Semanal</TabsTrigger>
        <TabsTrigger value="monthly">Mensal</TabsTrigger>
        <TabsTrigger value="projection">Projeção</TabsTrigger>
      </TabsList>
      
      <TabsContent value="daily">
        <ChartDisplay 
          data={dailyData}
          title="Recebimentos Diários"
          total={dailyTotal}
        />
      </TabsContent>
      
      <TabsContent value="weekly">
        <ChartDisplay 
          data={weeklyData}
          title="Recebimentos Semanais"
          total={weeklyTotal}
        />
      </TabsContent>
      
      <TabsContent value="monthly">
        <ChartDisplay 
          data={monthlyData}
          title="Recebimentos Mensais"
          total={monthlyTotal}
        />
      </TabsContent>
      
      <TabsContent value="projection">
        <ProjectionContent data={projectionData} />
      </TabsContent>
    </Tabs>
  );
}
