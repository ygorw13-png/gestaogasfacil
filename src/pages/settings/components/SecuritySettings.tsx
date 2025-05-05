
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getConfigSeguranca, upsertConfigSeguranca } from "@/integrations/supabase/tables/configTablesUtils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function SecuritySettings() {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [passwordExpiration, setPasswordExpiration] = useState("90");
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [logLevel, setLogLevel] = useState("warning");
  
  useEffect(() => {
    const fetchConfig = async () => {
      if (!organization?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await getConfigSeguranca(organization.id);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setSessionTimeout(data.tempo_sessao_minutos ? data.tempo_sessao_minutos.toString() : "60");
          setPasswordExpiration(data.expiracao_senha_dias ? data.expiracao_senha_dias.toString() : "90");
          setTwoFactorAuth(data.dois_fatores_ativo === true);
          setLogLevel(data.nivel_log || "warning");
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de segurança:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações de segurança",
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
        tempo_sessao_minutos: parseInt(sessionTimeout) || 60,
        expiracao_senha_dias: parseInt(passwordExpiration) || 90,
        dois_fatores_ativo: twoFactorAuth,
        nivel_log: logLevel,
        atualizado_por: user.id
      };
      
      const { error } = await upsertConfigSeguranca(configData);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Configurações de segurança salvas com sucesso"
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
        <CardTitle>Configurações de Segurança</CardTitle>
        <CardDescription>
          Configure as opções de segurança e privacidade do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="session-timeout">Tempo Limite da Sessão (minutos)</Label>
          <Input
            id="session-timeout"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            type="number"
            min="1"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password-expiration">Expiração de Senha (dias)</Label>
          <Input
            id="password-expiration"
            value={passwordExpiration}
            onChange={(e) => setPasswordExpiration(e.target.value)}
            type="number"
            min="1"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="two-factor-auth">Autenticação de Dois Fatores</Label>
            <p className="text-sm text-muted-foreground">
              Exigir autenticação de dois fatores para login
            </p>
          </div>
          <Switch
            id="two-factor-auth"
            checked={twoFactorAuth}
            onCheckedChange={setTwoFactorAuth}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="log-level">Nível de Log</Label>
          <Select value={logLevel} onValueChange={setLogLevel}>
            <SelectTrigger id="log-level">
              <SelectValue placeholder="Selecione o nível de log" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="error">Apenas Erros</SelectItem>
              <SelectItem value="warning">Avisos e Erros</SelectItem>
              <SelectItem value="info">Informações, Avisos e Erros</SelectItem>
              <SelectItem value="debug">Depuração Completa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
