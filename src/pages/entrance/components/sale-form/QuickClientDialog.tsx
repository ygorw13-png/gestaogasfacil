import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { SaleFormClient } from "./ClientSelection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (client: SaleFormClient) => void;
}

const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Cadastro rápido de cliente direto da tela de nova venda da portaria. */
export function QuickClientDialog({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setPhone("");
    setStreet("");
    setNumber("");
    setNeighborhood("");
  };

  const handleSave = async () => {
    const nome = name.trim();
    if (!nome) {
      toast({ title: "Informe o nome do cliente", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const digits = onlyDigits(phone);

      // Evita duplicidade por telefone ou nome
      const { data: existing } = await supabase.from("clients").select("id, name, phone");
      const dup = (existing || []).find((c: any) => {
        const cPhone = onlyDigits(c.phone || "");
        if (digits && cPhone && cPhone === digits) return true;
        return (c.name || "").trim().toLowerCase() === nome.toLowerCase();
      });

      if (dup) {
        toast({
          title: "Cliente já cadastrado",
          description: `${dup.name} já existe na base e foi selecionado.`,
        });
        onCreated({ id: dup.id, name: dup.name, phone: dup.phone || "", origem: "cliente" });
        reset();
        onOpenChange(false);
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: nome,
          phone: digits || null,
          address: { street, number, neighborhood },
        } as any)
        .select("id, name, phone")
        .single();

      if (error) throw error;

      toast({ title: "Cliente cadastrado", description: `${nome} foi adicionado à base.` });
      onCreated({ id: data.id, name: data.name, phone: data.phone || "", origem: "cliente" });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Erro ao cadastrar cliente",
        description: e?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastro rápido de cliente</DialogTitle>
          <DialogDescription>
            Cadastre o cliente sem sair da venda. Só o nome é obrigatório.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="qc-nome">Nome *</Label>
            <Input
              id="qc-nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="qc-tel">Telefone</Label>
            <Input
              id="qc-tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="qc-rua">Rua</Label>
              <Input id="qc-rua" value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qc-num">Número</Label>
              <Input id="qc-num" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="qc-bairro">Bairro / Povoado</Label>
            <Input
              id="qc-bairro"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Cadastrar e selecionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
