import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntregadoresApp } from "@/hooks/useEntregadoresApp";
import { useToast } from "@/hooks/use-toast";

/** Vínculo explícito colaborador -> conta do app (por ID). Só o administrador grava (o banco confere). */
export function VinculoContaApp({ colaboradorId, atual }: { colaboradorId: string; atual: string | null }) {
  const { data: contas = [] } = useEntregadoresApp();
  const [valor, setValor] = useState(atual ?? "nenhuma");
  const [salvando, setSalvando] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  const salvar = async () => {
    setSalvando(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("colaboradores").update({ user_id: valor === "nenhuma" ? null : valor }).eq("id", colaboradorId);
    setSalvando(false);
    if (error) {
      toast({ title: "Vínculo não salvo", description: /duplicate|unique/i.test(error.message) ? "Esta conta já está vinculada a outro colaborador." : error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["entregadores-app"] });
    toast({ title: "Vínculo salvo", description: "Os avisos de entrega usarão o telefone deste cadastro." });
  };
  return (
    <div className="mt-6 space-y-2 rounded-md border p-3">
      <Label>Conta no app (avisos de entrega pelo WhatsApp)</Label>
      <p className="text-xs text-muted-foreground">Escolha a conta de entregador desta pessoa. O WhatsApp do aviso usa o telefone deste cadastro.</p>
      <div className="flex gap-2">
        <Select value={valor} onValueChange={setValor}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhuma">Nenhuma</SelectItem>
            {contas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" disabled={salvando || valor === (atual ?? "nenhuma")} onClick={salvar}>Salvar vínculo</Button>
      </div>
    </div>
  );
}
