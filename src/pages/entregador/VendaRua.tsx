import { useMemo, useState } from "react";
import { runOrQueue } from "@/lib/offline/queue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { Bike, UserCheck } from "lucide-react";
import { SaleTypeSelect } from "@/components/forms/SaleTypeSelect";
import { exigeValor, vasilhameDeltas, type TipoVenda } from "@/lib/saleTypes";
import { useSaleClients } from "@/pages/entrance/hooks/useSaleClients";

const PRODUTOS = ["P13", "P20", "P45", "Água 20L"];
const PAGAMENTOS = [
  { value: "money", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credit", label: "Cartão de Crédito" },
  { value: "debit", label: "Cartão de Débito" },
  { value: "promissoria", label: "Nota Promissória" },
  { value: "vale-gas", label: "Vale-Gás" },
];

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export default function VendaRua() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tipoVenda, setTipoVenda] = useState<TipoVenda>("recarga");
  const [clientId, setClientId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    product: "P13",
    quantity: 1,
    price: "",
    payment_method: "money",
    notes: "",
  });

  const { data: clientes = [] } = useSaleClients();
  const cadastrados = useMemo(
    () => clientes.filter((c) => c.origem !== "ponto"),
    [clientes]
  );

  const termo = `${form.client_name} ${form.client_phone}`.trim().toLowerCase();
  const sugestoes = useMemo(() => {
    const nome = form.client_name.trim().toLowerCase();
    const fone = onlyDigits(form.client_phone);
    if (clientId || (nome.length < 2 && fone.length < 4)) return [];
    return cadastrados
      .filter(
        (c) =>
          (nome.length >= 2 && c.name.toLowerCase().includes(nome)) ||
          (fone.length >= 4 && onlyDigits(c.phone || "").includes(fone))
      )
      .slice(0, 5);
  }, [cadastrados, form.client_name, form.client_phone, clientId, termo]);

  const precisaValor = exigeValor(form.payment_method);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const nome = form.client_name.trim();
    const fone = onlyDigits(form.client_phone);

    if (nome.length < 3) {
      toast({ title: "Informe o nome do cliente", description: "Toda venda na rua precisa do nome.", variant: "destructive" });
      return;
    }
    if (fone.length < 10) {
      toast({ title: "Informe o telefone", description: "Use DDD + número, com pelo menos 10 dígitos.", variant: "destructive" });
      return;
    }

    const valor = Number(String(form.price).replace(",", "."));
    if (precisaValor && (!valor || valor <= 0)) {
      toast({ title: "Informe o valor da venda", description: "Obrigatório para dinheiro, PIX e cartão.", variant: "destructive" });
      return;
    }

    const vas = vasilhameDeltas(tipoVenda, form.quantity);

    setLoading(true);
    const now = new Date().toISOString();
    const orderPayload = {
      user_id: user.id,
      client_id: clientId,
      client_name: nome,
      client_phone: form.client_phone.trim(),
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
      await runOrQueue({
        target: "promissory_notes",
        action: "insert",
        payload: {
          client_id: clientId,
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
    setClientId(null);
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Cliente <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Nome completo"
                  value={form.client_name}
                  onChange={(e) => { setClientId(null); setForm({ ...form, client_name: e.target.value }); }}
                />
                {clientId && (
                  <p className="flex items-center gap-1 text-xs text-primary">
                    <UserCheck className="h-3 w-3" /> Cliente já cadastrado
                  </p>
                )}
                {sugestoes.length > 0 && (
                  <div className="rounded-md border divide-y">
                    {sugestoes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setClientId(c.id);
                          setForm({ ...form, client_name: c.name, client_phone: c.phone || form.client_phone });
                        }}
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Telefone <span className="text-destructive">*</span></Label>
                <Input
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  value={form.client_phone}
                  onChange={(e) => { setClientId(null); setForm({ ...form, client_phone: e.target.value }); }}
                />
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
