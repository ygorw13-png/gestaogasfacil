
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewStats } from "./admin/OverviewStats";
import { QuickActions } from "./admin/QuickActions";
import { UsersOverview } from "./admin/UsersOverview";
import { FinanceMetrics } from "./admin/FinanceMetrics";

export function AdminSection() {
  return (
    <Card className="border-gasflow-200 bg-gasflow-50/80 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-gasflow-700" />
          <CardTitle className="text-gasflow-700">Área de Administração</CardTitle>
        </div>
        <CardDescription>
          Esta seção só é visível para usuários com permissão de Administrador
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full sm:w-auto border rounded-md bg-white">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="finance">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-2">
            <OverviewStats />
            <QuickActions />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4 mt-2">
            <UsersOverview />
          </TabsContent>
          
          <TabsContent value="finance" className="space-y-4 mt-2">
            <FinanceMetrics />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
