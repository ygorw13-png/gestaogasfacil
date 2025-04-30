
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export function DeliverySettings() {
  const [deliveryFee, setDeliveryFee] = useState("5.00");
  const [minFreeDelivery, setMinFreeDelivery] = useState("100.00");
  const [maxRadius, setMaxRadius] = useState("15");
  const [enableTracking, setEnableTracking] = useState(true);
  
  const handleSave = () => {
    // Lógica para salvar as configurações de entrega
    alert("Configurações de entrega salvas com sucesso!");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Entrega</CardTitle>
        <CardDescription>
          Configure as opções de entrega e logística
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="delivery-fee">Taxa de Entrega (R$)</Label>
          <Input
            id="delivery-fee"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="min-free-delivery">Valor Mínimo para Entrega Grátis (R$)</Label>
          <Input
            id="min-free-delivery"
            value={minFreeDelivery}
            onChange={(e) => setMinFreeDelivery(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="max-radius">Raio Máximo de Entrega (km)</Label>
          <Input
            id="max-radius"
            value={maxRadius}
            onChange={(e) => setMaxRadius(e.target.value)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="enable-tracking">Rastreamento de Entrega</Label>
            <p className="text-sm text-muted-foreground">
              Habilitar rastreamento em tempo real das entregas
            </p>
          </div>
          <Switch
            id="enable-tracking"
            checked={enableTracking}
            onCheckedChange={setEnableTracking}
          />
        </div>
        
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </CardContent>
    </Card>
  );
}
