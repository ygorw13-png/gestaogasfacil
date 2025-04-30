
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function FinanceSettings() {
  const [currency, setCurrency] = useState("BRL");
  const [taxRate, setTaxRate] = useState("18");
  const [paymentMethods, setPaymentMethods] = useState(
    "Dinheiro,Cartão de Crédito,Cartão de Débito,PIX,Boleto"
  );
  
  const handleSave = () => {
    // Lógica para salvar as configurações financeiras
    alert("Configurações financeiras salvas com sucesso!");
  };
  
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
        
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </CardContent>
    </Card>
  );
}
