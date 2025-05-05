
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getConfigEntrega, upsertConfigEntrega } from "@/integrations/supabase/tables/configTablesUtils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function DeliverySettings() {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("5.00");
  const [minFreeDelivery, setMinFreeDelivery] = useState("100.00");
  const [maxRadius, setMaxRadius] = useState("15");
  const [enableTracking, setEnableTracking] = useState(true);
  
  useEffect(() => {
    const fetchConfig = async () => {
      if (!organization?.id) return;
      
      setLoading(true);
      try {
        const response = await getConfigEntrega(organization.id);
        
        // Verificar se a resposta contém algum erro (maneira segura de verificar)
        if (response && 'error' in response && response.error) {
          throw response.error;
        }
        
        if (response.data) {
          setDeliveryFee(response.data.taxa_entrega ? response.data.taxa_entrega.toString() : "5.00");
          setMinFreeDelivery(response.data.valor_min_entrega_gratis ? response.data.valor_min_entrega_gratis.toString() : "100.00");
          setMaxRadius(response.data.raio_maximo_km ? response.data.raio_maximo_km.toString() : "15");
          setEnableTracking(response.data.rastreamento_ativo !== false);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de entrega:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações de entrega",
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
        taxa_entrega: parseFloat(deliveryFee) || 0,
        valor_min_entrega_gratis: parseFloat(minFreeDelivery) || 0,
        raio_maximo_km: parseInt(maxRadius) || 0,
        rastreamento_ativo: enableTracking,
        atualizado_por: user.id
      };
      
      const result = await upsertConfigEntrega(configData);
      
      // Verificar se a resposta contém algum erro (maneira segura de verificar)
      if (result && 'error' in result && result.error) {
        throw result.error;
      }
      
      toast({
        title: "Sucesso",
        description: "Configurações de entrega salvas com sucesso"
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
        
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
