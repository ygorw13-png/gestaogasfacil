
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, roleLabels } from "@/types/userTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'vendedor');
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<Array<{id: string, name: string, role: UserRole}>>([]);
  const [activeTab, setActiveTab] = useState("usuarios");
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    p13Min: 20,
    p20Min: 5,
    p45Min: 5,
    aguaMin: 20,
    alertsEnabled: true
  });
  
  // Carregar usuários do sistema
  useEffect(() => {
    const fetchUsers = async () => {
      if (user?.role === 'admin' || user?.role === 'gerente') {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name, role');

          if (error) {
            throw error;
          }
          
          if (data) {
            setUsers(data as Array<{id: string, name: string, role: UserRole}>);
          }
        } catch (error) {
          console.error("Erro ao carregar usuários:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os usuários",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    const fetchStockSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('configuracoes_estoque')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Mapear configurações
          const p13Setting = data.find(item => item.produto === 'P13');
          const p20Setting = data.find(item => item.produto === 'P20');
          const p45Setting = data.find(item => item.produto === 'P45');
          const aguaSetting = data.find(item => item.produto === 'agua');
          
          setStoreSettings({
            p13Min: p13Setting?.estoque_minimo || 20,
            p20Min: p20Setting?.estoque_minimo || 5,
            p45Min: p45Setting?.estoque_minimo || 5,
            aguaMin: aguaSetting?.estoque_minimo || 20,
            alertsEnabled: p13Setting?.alerta_ativo !== false
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de estoque:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    fetchStockSettings();
  }, [user?.role, toast]);

  const handleUpdateRole = async () => {
    if (!selectedUserId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário para atualizar",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', selectedUserId);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Permissão atualizada para ${roleLabels[selectedRole]}`
      });
      
      // Atualizar a lista
      setUsers(users.map(u => 
        u.id === selectedUserId 
          ? {...u, role: selectedRole} 
          : u
      ));
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateStockSettings = async () => {
    setLoading(true);
    try {
      // Atualizar P13
      await supabase
        .from('configuracoes_estoque')
        .update({ 
          estoque_minimo: storeSettings.p13Min,
          alerta_ativo: storeSettings.alertsEnabled,
          atualizado_por: user?.id || '',
          atualizado_em: new Date().toISOString()
        })
        .eq('produto', 'P13');
        
      // Atualizar P20
      await supabase
        .from('configuracoes_estoque')
        .update({ 
          estoque_minimo: storeSettings.p20Min,
          alerta_ativo: storeSettings.alertsEnabled,
          atualizado_por: user?.id || '',
          atualizado_em: new Date().toISOString()
        })
        .eq('produto', 'P20');
        
      // Atualizar P45
      await supabase
        .from('configuracoes_estoque')
        .update({ 
          estoque_minimo: storeSettings.p45Min,
          alerta_ativo: storeSettings.alertsEnabled,
          atualizado_por: user?.id || '',
          atualizado_em: new Date().toISOString()
        })
        .eq('produto', 'P45');
        
      // Atualizar Água
      await supabase
        .from('configuracoes_estoque')
        .update({ 
          estoque_minimo: storeSettings.aguaMin,
          alerta_ativo: storeSettings.alertsEnabled,
          atualizado_por: user?.id || '',
          atualizado_em: new Date().toISOString()
        })
        .eq('produto', 'agua');
      
      toast({
        title: "Sucesso",
        description: "Configurações de estoque atualizadas"
      });
    } catch (error: any) {
      console.error("Erro ao atualizar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Configure permissões de acesso para usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Permissões de Usuário</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Selecione um usuário</label>
                    <Select 
                      value={selectedUserId} 
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({roleLabels[user.role as UserRole]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Nível de acesso</label>
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
                  </div>
                  
                  <Button onClick={handleUpdateRole} disabled={loading || !selectedUserId}>
                    {loading ? "Atualizando..." : "Atualizar Permissão"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="estoque" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Estoque</CardTitle>
              <CardDescription>
                Configure os níveis mínimos de estoque e alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque Mínimo P13</label>
                  <Input 
                    type="number" 
                    value={storeSettings.p13Min}
                    onChange={(e) => setStoreSettings({...storeSettings, p13Min: parseInt(e.target.value) || 0})}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque Mínimo P20</label>
                  <Input 
                    type="number" 
                    value={storeSettings.p20Min}
                    onChange={(e) => setStoreSettings({...storeSettings, p20Min: parseInt(e.target.value) || 0})}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque Mínimo P45</label>
                  <Input 
                    type="number" 
                    value={storeSettings.p45Min}
                    onChange={(e) => setStoreSettings({...storeSettings, p45Min: parseInt(e.target.value) || 0})}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque Mínimo Água</label>
                  <Input 
                    type="number" 
                    value={storeSettings.aguaMin}
                    onChange={(e) => setStoreSettings({...storeSettings, aguaMin: parseInt(e.target.value) || 0})}
                    min={0}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="enableAlerts"
                  checked={storeSettings.alertsEnabled}
                  onChange={(e) => setStoreSettings({...storeSettings, alertsEnabled: e.target.checked})}
                  className="h-4 w-4 text-green-600"
                />
                <label htmlFor="enableAlerts" className="text-sm font-medium">
                  Habilitar alertas de estoque mínimo
                </label>
              </div>
              
              <Button 
                onClick={handleUpdateStockSettings} 
                disabled={loading}
                className="mt-4"
              >
                {loading ? "Atualizando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
