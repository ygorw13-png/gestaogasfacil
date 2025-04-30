
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RoutesList } from "./components/RoutesList";
import { NewRouteForm } from "./components/NewRouteForm";
import { RouteReports } from "./components/RouteReports";

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Rotas</h1>
      </div>
      
      <Alert variant="warning" className="mb-6 bg-blue-50 border-blue-200">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          Esta área é exclusiva para gerenciamento de rotas de entrega. Todas as vendas e movimentações dos motoristas são registradas aqui.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Rotas Ativas</TabsTrigger>
          <TabsTrigger value="new">Nova Rota</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <RoutesList />
        </TabsContent>
        
        <TabsContent value="new" className="space-y-4">
          <NewRouteForm />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <RouteReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
