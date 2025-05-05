
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getConfigNotificacoes, upsertConfigNotificacoes } from "@/integrations/supabase/tables/configTablesUtils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function NotificationSettings() {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [stockNotifications, setStockNotifications] = useState(true);
  
  useEffect(() => {
    const fetchConfig = async () => {
      if (!organization?.id) return;
      
      setLoading(true);
      try {
        const response = await getConfigNotificacoes(organization.id);
        
        // Verificar se a resposta contém algum erro (maneira segura de verificar)
        if (response && 'error' in response && response.error) {
          throw response.error;
        }
        
        if (response.data) {
          setEmailNotifications(response.data.email_ativo !== false);
          setSmsNotifications(response.data.sms_ativo === true);
          setOrderNotifications(response.data.notificacao_pedidos !== false);
          setStockNotifications(response.data.notificacao_estoque !== false);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de notificações:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações de notificações",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, [organization?.id, toast]);
  
  const handleSave = async () => {
    if (!organization?.id || !user?.id) {
      toast({
        title: "Erro",
        description: "Dados da organização não disponíveis",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      const configData = {
        organization_id: organization.id,
        email_ativo: emailNotifications,
        sms_ativo: smsNotifications,
        notificacao_pedidos: orderNotifications,
        notificacao_estoque: stockNotifications,
        atualizado_por: user.id
      };
      
      const result = await upsertConfigNotificacoes(configData);
      
      // Verificar se a resposta contém algum erro (maneira segura de verificar)
      if (result && 'error' in result && result.error) {
        throw result.error;
      }
      
      toast({
        title: "Sucesso",
        description: "Configurações de notificações salvas com sucesso"
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <LoadingSpinner message="Carregando configurações..." />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificações</CardTitle>
        <CardDescription>
          Configure como você deseja receber notificações do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="email-notifications">Notificações por Email</Label>
            <p className="text-sm text-muted-foreground">
              Receba notificações por email sobre eventos importantes
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="sms-notifications">Notificações por SMS</Label>
            <p className="text-sm text-muted-foreground">
              Receba notificações por SMS sobre eventos importantes
            </p>
          </div>
          <Switch
            id="sms-notifications"
            checked={smsNotifications}
            onCheckedChange={setSmsNotifications}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="order-notifications">Notificações de Pedidos</Label>
            <p className="text-sm text-muted-foreground">
              Seja notificado quando houver novos pedidos ou alterações
            </p>
          </div>
          <Switch
            id="order-notifications"
            checked={orderNotifications}
            onCheckedChange={setOrderNotifications}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="stock-notifications">Alertas de Estoque</Label>
            <p className="text-sm text-muted-foreground">
              Seja notificado quando o estoque estiver baixo
            </p>
          </div>
          <Switch
            id="stock-notifications"
            checked={stockNotifications}
            onCheckedChange={setStockNotifications}
          />
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
