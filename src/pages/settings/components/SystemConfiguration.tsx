
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getConfigSistema, upsertConfigSistema } from "@/integrations/supabase/tables/configTablesUtils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function SystemConfiguration() {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "GasFlow Aqua",
    address: "Av. Principal, 123",
    phone: "(11) 99999-9999",
    email: "contato@gasflowaqua.com.br"
  });

  useEffect(() => {
    const fetchConfig = async () => {
      if (!organization?.id) return;
      
      setLoading(true);
      try {
        const response = await getConfigSistema(organization.id);
        
        if (response.error) {
          throw response.error;
        }
        
        if (response.data) {
          setFormData({
            companyName: response.data.nome_empresa,
            address: response.data.endereco || "",
            phone: response.data.telefone || "",
            email: response.data.email || ""
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações do sistema:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações do sistema",
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
        nome_empresa: formData.companyName,
        endereco: formData.address,
        telefone: formData.phone,
        email: formData.email,
        atualizado_por: user.id
      };
      
      const { error } = await upsertConfigSistema(configData);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Configurações do sistema salvas com sucesso"
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
        <CardTitle>Configurações do Sistema</CardTitle>
        <CardDescription>
          Defina as configurações gerais do sistema e da empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company-name">Nome da Empresa</Label>
          <Input
            id="company-name"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
