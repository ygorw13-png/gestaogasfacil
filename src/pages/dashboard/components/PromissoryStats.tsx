import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PromissoryStatsTabs } from "./promissory-stats/PromissoryStatsTabs";
import { usePromissoryAnalytics } from "../hooks/useDashboardData";

export function PromissoryStats() {
  const { data, isLoading } = usePromissoryAnalytics();

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Promissórias</CardTitle>
            <CardDescription>Recebimentos reais registrados</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <PromissoryStatsTabs
            dailyData={data.dailyData}
            weeklyData={data.weeklyData}
            monthlyData={data.monthlyData}
            projectionData={data.projectionData}
          />
        )}
      </CardContent>
    </Card>
  );
}
