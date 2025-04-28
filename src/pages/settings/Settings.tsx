
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { UserManagement } from "./components/UserManagement";
import { StockConfiguration } from "./components/StockConfiguration";
import { useAuth } from "@/contexts/AuthContext";

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usuarios" className="mt-4">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="estoque" className="mt-4">
          <StockConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
