
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "./components/UserManagement";
import { StockConfiguration } from "./components/StockConfiguration";
import { SystemConfiguration } from "./components/SystemConfiguration";
import { NotificationSettings } from "./components/NotificationSettings";
import { FinanceSettings } from "./components/FinanceSettings";
import { DeliverySettings } from "./components/DeliverySettings";
import { SecuritySettings } from "./components/SecuritySettings";
import { PrinterSettings } from "./components/PrinterSettings";
import { WhatsAppSettings } from "./components/WhatsAppSettings";
import { useUserRole } from "@/hooks/useUserRole";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("usuarios");

  const { role } = useUserRole();
  const admin = role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start lg:grid lg:grid-cols-9">

          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
          <TabsTrigger value="impressora">Impressora</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          {admin && <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>}
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

        <TabsContent value="impressora" className="mt-4">
          <PrinterSettings />
        </TabsContent>


        <TabsContent value="seguranca" className="mt-4">
          <SecuritySettings />
        </TabsContent>

        {admin && (
          <TabsContent value="whatsapp" className="mt-4">
            <WhatsAppSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
