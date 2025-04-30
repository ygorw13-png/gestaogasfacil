
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { UserManagement } from "./components/UserManagement";
import { StockConfiguration } from "./components/StockConfiguration";
import { SystemConfiguration } from "./components/SystemConfiguration";
import { NotificationSettings } from "./components/NotificationSettings";
import { FinanceSettings } from "./components/FinanceSettings";
import { DeliverySettings } from "./components/DeliverySettings";
import { SecuritySettings } from "./components/SecuritySettings";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("usuarios");

  // Verificar se o usuário tem permissão para acessar a página
  if (user?.role !== 'admin' && user?.role !== 'gerente') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <Card>
          <CardContent className="pt-6">
            <p>Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usuarios" className="mt-4">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="estoque" className="mt-4">
          <StockConfiguration />
        </TabsContent>

        <TabsContent value="sistema" className="mt-4">
          <SystemConfiguration />
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <FinanceSettings />
        </TabsContent>

        <TabsContent value="entregas" className="mt-4">
          <DeliverySettings />
        </TabsContent>

        <TabsContent value="seguranca" className="mt-4">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
