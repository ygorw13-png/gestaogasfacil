import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useClientesRuaPendentes } from "../hooks/useClientesRuaPendentes";

/** Clientes de vendas na rua ainda sem cadastro — a portaria cadastra em um clique. */
export function ClientesRuaTab() {
  const { data = [], isLoading } = useClientesRuaPendentes();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [salvando, setSalvando] = useState<string | null>(null);

  const cadastrar = async (nome: string, telefone: string) => {
    setSalvando(telefone);
    const { error } = await supabase.from("clients").insert({ name: nome, phone: telefone } as any);
    setSalvando(null);
    if (error) {
      toast({ title: "Não foi possível cadastrar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente cadastrado", description: `${nome} já aparece nas próximas vendas.` });
    qc.invalidateQueries({ queryKey: ["clientes-rua-pendentes"] });
    qc.invalidateQueries({ queryKey: ["sale_clients"] });
    qc.invalidateQueries({ queryKey: ["clients"] });
  };

  if (isLoading) return <p className="py-8 text-center text-muted-foreground">Carregando...</p>;
  if (data.length === 0)
    return <p className="py-8 text-center text-muted-foreground">Nenhum cliente pendente de cadastro.</p>;

  return (
    <div className="space-y-3">
      {data.map((c) => (
        <Card key={c.telefone}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{c.nome}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" /> {c.telefone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{c.compras} compra(s)</Badge>
              <Button size="sm" disabled={salvando === c.telefone} onClick={() => cadastrar(c.nome, c.telefone)}>
                <UserPlus className="mr-1 h-4 w-4" />
                {salvando === c.telefone ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
