import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Bike } from "lucide-react";
import { SaleTypeSelect } from "@/components/forms/SaleTypeSelect";
import { exigeCliente, exigeValor, vasilhameDeltas, type TipoVenda } from "@/lib/saleTypes";

const PRODUTOS = ["P13", "P20", "P45", "Água 20L"];
const PAGAMENTOS = [
  { value: "money", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credit", label: "Cartão de Crédito" },
  { value: "debit", label: "Cartão de Débito" },
  { value: "promissoria", label: "Nota Promissória" },
  { value: "vale-gas", label: "Vale-Gás" },
];

export default function VendaRua() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tipoVenda, setTipoVenda] = useState<TipoVenda>("recarga");
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    product: "P13",
    quantity: 1,
    price: "",
    payment_method: "money",
    notes: "",
  });

  const precisaValor = exigeValor(form.payment_method);
  const precisaCliente = exigeCliente(form.payment_method);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const valor = Number(String(form.price).replace(",", "."));
    if (precisaValor && (!valor || valor <= 0)) {
      toast({ title: "Informe o valor da venda", description: "Obrigatório para dinheiro, PIX e cartão.", variant: "destructive" });
      return;
    }
    if (precisaCliente && form.client_name.trim().length < 3) {
      toast({ title: "Cliente obrigatório", description: "Nota promissória exige identificar o cliente.", variant: "destructive" });
      return;
    }

    const nome = form.client_name.trim() || "Cliente avulso";
    const vas = vasilhameDeltas(tipoVenda, form.quantity);

    setLoading(true);
    const now = new Date().toISOString();
    const orderPayload = {
      user_id: user.id,
      client_name: nome,
      client_phone: form.client_phone || null,
      product: form.product,
      quantity: form.quantity,
      price: valor || 0,
      payment_method: form.payment_method,
      notes: form.notes,
      status: "completed",
      delivery_person: user.id,
      delivered_at: now,
      origem_venda: "rua",
      tipo_venda: tipoVenda,
      vasilhames_entregues: vas.entregues,
      vasilhames_recebidos: vas.recebidos,
      has_empty_cylinder: vas.recebidos > 0,
    };

    // Sem internet? A venda fica salva no aparelho e sobe sozinha depois.
    const result = await runOrQueue({
      target: "orders",
      action: "insert",
      payload: orderPayload,
      description: `Venda na rua - ${form.quantity}x ${form.product} (${nome})`,
    });

    if (!result.error && form.payment_method === "promissoria") {
      const due = new Date();
      due.setDate(due.getDate() + 30);
      const org = navigator.onLine ? ((await supabase.rpc("get_my_org" as any)).data as any) : null;
      await runOrQueue({
        target: "promissory_notes",
        action: "insert",
        payload: {
          organization_id: org,
          client_name: nome,
          value: valor || 0,
          due_date: due.toISOString().slice(0, 10),
          status: "pending",
          created_by: user.id,
          notes: `Venda na rua - ${form.quantity}x ${form.product}`,
        },
        description: `Nota promissória - ${nome}`,
      });
    }

    setLoading(false);
    if (result.error) {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: result.queued ? "Venda salva no aparelho" : "Venda registrada!",
      description: result.queued
        ? "Sem internet agora. Ela será enviada sozinha quando a conexão voltar."
        : "Já está no seu acerto do dia.",
    });
    setForm({ ...form, price: "", notes: "", client_name: "", client_phone: "" });
  };


  return (
    <div className="max-w-2xl mx-auto pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5" /> Venda na Rua
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <SaleTypeSelect value={tipoVenda} onChange={setTipoVenda} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cliente {precisaCliente && <span className="text-destructive">*</span>}</Label>
                <Input
                  placeholder="Cliente avulso"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={form.product} onValueChange={(v) => setForm({ ...form, product: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUTOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Math.max(1, +e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGAMENTOS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-primary font-semibold">
                  Valor total (R$) {precisaValor && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  className="border-primary/50 text-lg font-semibold h-12"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Salvando..." : "Registrar Venda"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
