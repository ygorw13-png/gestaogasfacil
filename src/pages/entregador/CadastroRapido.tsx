import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";

export default function CadastroRapido() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", street: "", number: "", neighborhood: "", reference: "",
  });

  const reset = () => setForm({ name: "", phone: "", street: "", number: "", neighborhood: "", reference: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: "Nome e telefone obrigatórios", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("clients").insert({
      name: form.name,
      phone: form.phone,
      address: {
        street: form.street, number: form.number,
        neighborhood: form.neighborhood, reference: form.reference,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente cadastrado!" });
    reset();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Cadastro Rápido de Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="col-span-2">
                <Label>Telefone *</Label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
              </div>
              <div>
                <Label>Rua</Label>
                <Input value={form.street} onChange={e => setForm({...form, street: e.target.value})} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={form.number} onChange={e => setForm({...form, number: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Bairro</Label>
                <Input value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Ponto de referência</Label>
                <Textarea rows={2} value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar Cliente"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
