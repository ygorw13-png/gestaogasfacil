import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Bike } from "lucide-react";

const PRODUTOS = ["P13", "P20", "P45", "Água 20L"];
const PAGAMENTOS = ["Dinheiro", "PIX", "Cartão Crédito", "Cartão Débito"];

export default function VendaRua() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: "Cliente avulso",
    client_phone: "",
    product: "P13",
    quantity: 1,
    price: 0,
    payment_method: "Dinheiro",
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!form.price || form.price <= 0) {
      toast({ title: "Informe o valor", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      client_name: form.client_name,
      client_phone: form.client_phone || null,
      product: form.product,
      quantity: form.quantity,
      price: form.price,
      payment_method: form.payment_method,
      notes: form.notes,
      status: "completed",
      delivery_person: user.id,
      delivered_at: new Date().toISOString(),
      origem_venda: "rua",
    } as any);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Venda registrada!", description: "Será incluída no seu acerto do dia." });
    setForm({ ...form, price: 0, notes: "", client_name: "Cliente avulso", client_phone: "" });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5" /> Venda na Rua
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cliente</Label>
                <Input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.client_phone} onChange={e => setForm({...form, client_phone: e.target.value})} />
              </div>
              <div>
                <Label>Produto</Label>
                <Select value={form.product} onValueChange={v => setForm({...form, product: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUTOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: +e.target.value})} />
              </div>
              <div>
                <Label className="text-primary font-semibold">Valor Total (R$)</Label>
                <Input type="number" step="0.01" className="border-primary/50 text-lg font-semibold" value={form.price} onChange={e => setForm({...form, price: +e.target.value})} />
              </div>
              <div>
                <Label>Forma de pagamento</Label>
                <Select value={form.payment_method} onValueChange={v => setForm({...form, payment_method: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGAMENTOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Registrar Venda"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
