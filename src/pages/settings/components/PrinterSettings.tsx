import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrinterSettings, type PaperWidth } from "@/hooks/usePrinterSettings";
import { printReceipt } from "@/lib/receiptPrint";
import { Printer } from "lucide-react";

export function PrinterSettings() {
  const { settings, save } = usePrinterSettings();

  const testPrint = () => {
    printReceipt({
      clientName: "Cliente Teste",
      clientPhone: "(00) 00000-0000",
      address: { street: "Rua Exemplo", number: "123", neighborhood: "Centro" },
      product: "GLP P13",
      quantity: 1,
      price: 110,
      paymentMethod: "Dinheiro",
      createdAt: new Date(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impressora de Cupom</CardTitle>
        <CardDescription>
          Configuração individual deste usuário/dispositivo. A impressão usa a caixa de
          impressão do navegador — selecione sua impressora térmica (ex.: Bematech MP-4200 TH)
          e marque-a como padrão para imprimir direto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Impressão de cupom ativada</Label>
            <p className="text-sm text-muted-foreground">Mostra o botão de imprimir nos pedidos.</p>
          </div>
          <Switch checked={settings.enabled} onCheckedChange={(v) => save({ enabled: v })} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Imprimir automaticamente ao lançar pedido</Label>
            <p className="text-sm text-muted-foreground">Abre a impressão logo após salvar o pedido.</p>
          </div>
          <Switch
            checked={settings.autoPrint}
            disabled={!settings.enabled}
            onCheckedChange={(v) => save({ autoPrint: v })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="printer-name">Impressora</Label>
            <Input
              id="printer-name"
              value={settings.printerName}
              onChange={(e) => save({ printerName: e.target.value })}
              placeholder="Bematech MP-4200 TH"
            />
          </div>
          <div className="space-y-2">
            <Label>Largura do papel</Label>
            <Select
              value={settings.paperWidth}
              onValueChange={(v) => save({ paperWidth: v as PaperWidth })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="80mm">80 mm (MP-4200 TH)</SelectItem>
                <SelectItem value="58mm">58 mm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="printer-header">Cabeçalho</Label>
            <Input
              id="printer-header"
              value={settings.headerText}
              onChange={(e) => save({ headerText: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printer-footer">Rodapé</Label>
            <Input
              id="printer-footer"
              value={settings.footerText}
              onChange={(e) => save({ footerText: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printer-copies">Vias</Label>
            <Input
              id="printer-copies"
              type="number"
              min={1}
              max={3}
              value={settings.copies}
              onChange={(e) => save({ copies: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </div>

        <Button variant="outline" onClick={testPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir cupom de teste
        </Button>
      </CardContent>
    </Card>
  );
}
