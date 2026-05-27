import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

const initial = {
  name: "", phone: "", street: "", number: "", complement: "",
  neighborhood: "", reference: "", notes: "",
};

export function NewClientDialog({ open, onOpenChange, onSubmit }: NewClientDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof initial, v: string) => setForm(s => ({ ...s, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("clients").insert({
      name: form.name,
      phone: form.phone || null,
      notes: form.notes || null,
      address: {
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        reference: form.reference,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente cadastrado com sucesso" });
    setForm(initial);
    onSubmit();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>Cadastre um novo cliente no sistema.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-1">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(99) 99999-9999" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <Label>Rua</Label>
              <Input value={form.street} onChange={e => set("street", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Número da casa *</Label>
              <Input value={form.number} onChange={e => set("number", e.target.value)} placeholder="Ex: 123" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Complemento</Label>
              <Input value={form.complement} onChange={e => set("complement", e.target.value)} placeholder="Apto, bloco..." />
            </div>
            <div className="space-y-1">
              <Label>Bairro</Label>
              <Input value={form.neighborhood} onChange={e => set("neighborhood", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Ponto de referência</Label>
            <Input value={form.reference} onChange={e => set("reference", e.target.value)} placeholder="Próximo a..." />
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Cadastrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
