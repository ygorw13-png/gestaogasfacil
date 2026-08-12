import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Client } from "../hooks/useClients";

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSaved: () => void;
}

const empty = {
  name: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  reference: "",
  notes: "",
};

export function EditClientDialog({ open, onOpenChange, client, onSaved }: EditClientDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    const a = client.addressObj || {};
    setForm({
      name: client.name || "",
      phone: client.phone || "",
      cep: a.cep || "",
      street: a.street || "",
      number: a.number || "",
      complement: a.complement || "",
      neighborhood: a.neighborhood || "",
      city: a.city || "",
      reference: a.reference || "",
      notes: client.notes || "",
    });
  }, [client]);

  const set = (k: keyof typeof empty, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    if (!client) return;
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("clients")
      .update({
        name: form.name,
        phone: form.phone || null,
        notes: form.notes || null,
        address: {
          cep: form.cep,
          street: form.street,
          number: form.number,
          complement: form.complement,
          neighborhood: form.neighborhood,
          city: form.city,
          reference: form.reference,
        },
      })
      .eq("id", client.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente atualizado" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>Atualize os dados cadastrais do cliente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label>CEP</Label>
              <Input value={form.cep} onChange={(e) => set("cep", e.target.value)} maxLength={9} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Rua</Label>
              <Input value={form.street} onChange={(e) => set("street", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Número</Label>
              <Input value={form.number} onChange={(e) => set("number", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Complemento</Label>
              <Input value={form.complement} onChange={(e) => set("complement", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Bairro</Label>
              <Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Ponto de referência</Label>
            <Input value={form.reference} onChange={(e) => set("reference", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
