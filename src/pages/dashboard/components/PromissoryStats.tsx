
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { PromissoryStatsTabs } from "./promissory-stats/PromissoryStatsTabs";

// Data constants moved to separate variables to improve readability
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
        <PromissoryStatsTabs
          dailyData={dailyData}
          weeklyData={weeklyData}
          monthlyData={monthlyData}
          projectionData={projectionData}
        />
      </CardContent>
    </Card>
  );
}
