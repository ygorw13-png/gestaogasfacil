import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PRODUCTS = [
  { value: "P13", label: "Gás P13" },
  { value: "P20", label: "Gás P20" },
  { value: "P45", label: "Gás P45" },
  { value: "Água 20L", label: "Água 20L" },
];

const PAYMENTS = [
  { value: "money", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credit", label: "Cartão de Crédito" },
  { value: "debit", label: "Cartão de Débito" },
  { value: "convenio", label: "Convênio" },
  { value: "gas-povo", label: "Gás-Povo" },
  { value: "vale-gas", label: "Vale-Gás" },
  { value: "promissoria", label: "Nota Promissória" },
];

interface QuickSaleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function QuickSaleDialog({ isOpen, onOpenChange, onSaved }: QuickSaleDialogProps) {
  const { toast } = useToast();
  const [clientName, setClientName] = useState("");
  const [product, setProduct] = useState("P13");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("money");
  const [saving, setSaving] = useState(false);

  const requiresClient = paymentMethod === "promissoria" || paymentMethod === "convenio";

  const reset = () => {
    setClientName("");
    setProduct("P13");
    setQuantity(1);
    setPrice("");
    setPaymentMethod("money");
  };

  const handleSubmit = async () => {
    if (requiresClient && clientName.trim().length < 3) {
      toast({
        title: "Cliente obrigatório",
        description: "Para nota promissória/convênio é necessário identificar o cliente.",
        variant: "destructive",
      });
      return;
    }
    const value = Number(price.replace(",", "."));
    if (!value || value <= 0) {
      toast({ title: "Informe o valor da venda", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) throw new Error("Usuário não autenticado");

      const now = new Date().toISOString();
      const { error } = await supabase.from("orders").insert({
        user_id: userId,
        client_name: clientName.trim() || "Cliente Balcão",
        client_phone: null,
        address: {},
        product,
        quantity,
        price: value,
        payment_method: paymentMethod,
        status: "delivered",
        delivered_at: now,
        origem_venda: "portaria",
        notes: "Venda rápida - retirada na portaria",
      } as any);

      if (error) throw error;

      toast({ title: "Venda rápida registrada", description: `${quantity}x ${product}` });
      reset();
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast({
        title: "Erro ao registrar venda",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Venda Rápida (Portaria)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qs-client">
              Cliente {requiresClient ? "(obrigatório)" : "(opcional)"}
            </Label>
            <Input
              id="qs-client"
              placeholder="Cliente Balcão"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qs-qty">Quantidade</Label>
              <Input
                id="qs-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENTS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qs-price">Valor da venda (R$)</Label>
            <Input
              id="qs-price"
              inputMode="decimal"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Registrar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
