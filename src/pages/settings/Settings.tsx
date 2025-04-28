
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, roleLabels } from "@/types/userTypes";

export default function Settings() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'vendedor');

  const handleUpdateRole = () => {
    // Esta funcionalidade será implementada futuramente
    alert(`Função de atualização de permissão para ${roleLabels[selectedRole]} será implementada em breve.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
          <CardDescription>
            Gerencie as configurações do GasFlow Aqua
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Permissões de Usuário</h2>
            <div className="flex items-center space-x-4">
              <Select 
                value={selectedRole} 
                onValueChange={(value: UserRole) => setSelectedRole(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um nível de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="portaria">Portaria</SelectItem>
                  <SelectItem value="estoque">Estoque</SelectItem>
                  <SelectItem value="entregador">Entregador</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleUpdateRole}>Atualizar Permissão</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Nível de acesso atual: {user?.role ? roleLabels[user.role] : ''}
            </p>
          </div>
          
          <p className="text-muted-foreground">
            Funcionalidades adicionais de configuração em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
