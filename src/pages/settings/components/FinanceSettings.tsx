
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getConfigFinanceira, upsertConfigFinanceira } from "@/integrations/supabase/tables/configTablesUtils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function FinanceSettings() {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState("BRL");
  const [taxRate, setTaxRate] = useState("18");
  const [paymentMethods, setPaymentMethods] = useState(
    "Dinheiro,Cartão de Crédito,Cartão de Débito,PIX,Boleto"
  );

  useEffect(() => {
    const fetchConfig = async () => {
      if (!organization?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await getConfigFinanceira(organization.id);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setCurrency(data.moeda || "BRL");
          setTaxRate(data.taxa_imposto ? data.taxa_imposto.toString() : "18");
          
          if (data.metodos_pagamento && Array.isArray(data.metodos_pagamento)) {
            setPaymentMethods(data.metodos_pagamento.join(','));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações financeiras:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações financeiras",
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
      const paymentMethodsArray = paymentMethods
        .split(',')
        .map(method => method.trim())
        .filter(method => method.length > 0);
      
      const configData = {
        organization_id: organization.id,
        moeda: currency,
        taxa_imposto: parseFloat(taxRate) || 0,
        metodos_pagamento: paymentMethodsArray,
        atualizado_por: user.id
      };
      
      const { error } = await upsertConfigFinanceira(configData);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Configurações financeiras salvas com sucesso"
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
        <CardTitle>Configurações Financeiras</CardTitle>
        <CardDescription>
          Configure as opções financeiras e métodos de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Moeda</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currency">
              <SelectValue placeholder="Selecione a moeda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">Real (BRL)</SelectItem>
              <SelectItem value="USD">Dólar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tax-rate">Taxa de Imposto (%)</Label>
          <Input
            id="tax-rate"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="payment-methods">Métodos de Pagamento</Label>
          <Input
            id="payment-methods"
            value={paymentMethods}
            onChange={(e) => setPaymentMethods(e.target.value)}
            placeholder="Separados por vírgula"
          />
          <p className="text-sm text-muted-foreground">
            Separe os métodos de pagamento por vírgula
          </p>
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
