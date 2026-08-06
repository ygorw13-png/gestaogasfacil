import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { useRegistrarMovimentacao, type PortariaProduto } from "@/pages/entrance/hooks/usePortariaStock";

const PRODUCTS: { value: PortariaProduto; label: string; orderProduct: string }[] = [
  { value: "P13", label: "Gás P13", orderProduct: "P13" },
  { value: "P20", label: "Gás P20", orderProduct: "P20" },
  { value: "P45", label: "Gás P45", orderProduct: "P45" },
  { value: "agua", label: "Água 20L", orderProduct: "Água 20L" },
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
  const registrarMov = useRegistrarMovimentacao();
  const [clientName, setClientName] = useState("");
  const [product, setProduct] = useState<PortariaProduto>("P13");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("money");
  const [returnedEmpty, setReturnedEmpty] = useState(true);
  const [counterMode, setCounterMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const requiresClient = paymentMethod === "promissoria" || paymentMethod === "convenio";

  const reset = () => {
    setClientName("");
    setProduct("P13");
    setQuantity(1);
    setPrice("");
    setPaymentMethod("money");
    setReturnedEmpty(true);
  };

  // Atalho: Enter (com Ctrl) registra a venda
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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

      const finalName = clientName.trim() || "Cliente Balcão";
      const productLabel = PRODUCTS.find((p) => p.value === product)?.orderProduct || product;
      const now = new Date().toISOString();

      const { data: inserted, error } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          client_name: finalName,
          client_phone: null,
          address: {},
          product: productLabel,
          quantity,
          price: value,
          payment_method: paymentMethod,
          status: "delivered",
          delivered_at: now,
          origem_venda: "portaria",
          has_empty_cylinder: returnedEmpty,
          notes: "Venda rápida - retirada na portaria",
        } as any)
        .select("id")
        .single();

      if (error) throw error;
      const orderId = (inserted as any)?.id ?? null;

      // Baixa automática no estoque da portaria
      try {
        await registrarMov.mutateAsync({
          tipo: returnedEmpty ? "venda" : "venda_comodato",
          produto: product,
          delta_cheios: -quantity,
          delta_vazios: returnedEmpty ? quantity : 0,
          delta_emprestados: returnedEmpty ? 0 : quantity,
          cliente_nome: finalName,
          referencia_id: orderId,
          observacoes: "Venda rápida na portaria",
        });
      } catch {
        toast({
          title: "Venda salva, estoque não atualizado",
          description: "Registre o ajuste manualmente na portaria.",
          variant: "destructive",
        });
      }

      // Nota promissória automática
      if (paymentMethod === "promissoria") {
        const due = new Date();
        due.setDate(due.getDate() + 30);
        const { error: pnError } = await supabase.from("promissory_notes").insert({
          organization_id: (await supabase.rpc("get_my_org" as any)).data as any,
          client_name: finalName,
          value,
          due_date: due.toISOString().slice(0, 10),
          status: "pending",
          created_by: userId,
          notes: `Venda rápida portaria - ${quantity}x ${productLabel}`,
        } as any);
        if (pnError) {
          toast({
            title: "Venda salva, promissória não criada",
            description: pnError.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Nota promissória criada", description: `Vencimento em 30 dias — ${finalName}` });
        }
      }

      toast({ title: "Venda rápida registrada", description: `${quantity}x ${productLabel}` });
      reset();
      onSaved();
      if (!counterMode) onOpenChange(false);
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
          <DialogDescription>
            Atalhos: <strong>F2</strong> abre • <strong>Ctrl+Enter</strong> registra
          </DialogDescription>
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
              <Select value={product} onValueChange={(v) => setProduct(v as PortariaProduto)}>
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

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="qs-empty">Trouxe vasilhame vazio</Label>
              <p className="text-xs text-muted-foreground">
                Se desligado, a saída é registrada como comodato (emprestado).
              </p>
            </div>
            <Switch id="qs-empty" checked={returnedEmpty} onCheckedChange={setReturnedEmpty} />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="qs-counter">Modo balcão</Label>
              <p className="text-xs text-muted-foreground">
                Mantém o diálogo aberto para vendas em sequência.
              </p>
            </div>
            <Switch id="qs-counter" checked={counterMode} onCheckedChange={setCounterMode} />
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
