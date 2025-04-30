
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function SecuritySettings() {
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [passwordExpiration, setPasswordExpiration] = useState("90");
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [logLevel, setLogLevel] = useState("warning");
  
  const handleSave = () => {
    // Lógica para salvar as configurações de segurança
    alert("Configurações de segurança salvas com sucesso!");
  };
  
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
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password-expiration">Expiração de Senha (dias)</Label>
          <Input
            id="password-expiration"
            value={passwordExpiration}
            onChange={(e) => setPasswordExpiration(e.target.value)}
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
        
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </CardContent>
    </Card>
  );
}
