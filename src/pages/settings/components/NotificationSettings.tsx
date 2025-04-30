
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [stockNotifications, setStockNotifications] = useState(true);
  
  const handleSave = () => {
    // Lógica para salvar as configurações de notificação
    alert("Configurações de notificações salvas com sucesso!");
  };
  
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
        
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </CardContent>
    </Card>
  );
}
