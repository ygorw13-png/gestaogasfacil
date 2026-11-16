import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MapPin, User } from "lucide-react";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { useLancamentosConta } from "@/hooks/useContaBotijoes";
import { useEhAdmin } from "@/hooks/useEhAdmin";
import { VALOR_RESERVADO } from "@/lib/formasPagamento";
import { Reseller } from "../types";
import { format } from "date-fns";
import { resumirConta, useAgregadoConta, useAgregadoFinanceiro, type RetiradaAgregado } from "../hooks/useAgregadoConta";
import { AgregadoFinanceiro, DevolucaoAcertadaDialog } from "./AgregadoFinanceiro";

interface ResellerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller: Reseller | null;
}

const dt = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function situacao(r: RetiradaAgregado) {
  if (r.em_devolucao) return r.devolvida >= r.quantidade ? "Devolvida" : "Em devolução";
  if (r.pendente === 0) return "Acertada";
  if (r.acertada > 0) return "Parcialmente acertada";
  return "A acertar";
}

export function ResellerDetailsDialog({ open, onOpenChange, reseller }: ResellerDetailsDialogProps) {
  const { ehAdmin } = useEhAdmin();
  const { data: retiradas = [], isLoading } = useAgregadoConta(reseller?.id);
  const { data: fin } = useAgregadoFinanceiro(reseller?.id, ehAdmin);
  const { data: antigos = [] } = useLancamentosConta("agregado", reseller?.id);
  const [devolver, setDevolver] = useState<RetiradaAgregado | null>(null);

  if (!reseller) return null;
  const q = resumirConta(retiradas);
  const qtdAntigos = antigos.filter((l) => l.tipo === "entrega").reduce((s, l) => s + l.quantidade, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reseller.name}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-3">
            {reseller.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {reseller.phone}</span>}
            {reseller.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {reseller.address}</span>}
            {reseller.contactPerson && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {reseller.contactPerson}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          {[
            ["Retirados", q.retirada],
            ["Devolvidos", q.devolvida],
            ["Acertados", q.acertada],
            ["Ainda não acertados", q.pendente],
          ].map(([l, v]) => (
            <Card key={l as string}><CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="text-2xl font-bold">{v}</p>
            </CardContent></Card>
          ))}
        </div>
        {q.emDevolucao > 0 && <p className="text-xs text-muted-foreground">{q.emDevolucao} em devolução aguardando retorno físico.</p>}

        <div className="flex flex-wrap gap-2">
          {reseller.phone && (
            <WhatsAppButton phone={reseller.phone} message={`Olá ${reseller.name}! Aqui é da distribuidora. Vamos conferir os botijões?`} label="WhatsApp" />
          )}
        </div>
        {reseller.notes && <p className="text-sm text-muted-foreground">{reseller.notes}</p>}

        {ehAdmin && <AgregadoFinanceiro reseller={reseller} retiradas={retiradas} />}

        <div>
          <h4 className="mb-2 text-sm font-medium">Retiradas pela portaria</h4>
          <div className="max-h-72 overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Data</th><th className="p-2 text-left">Produto</th>
                  <th className="p-2 text-right">Qtd</th><th className="p-2 text-right">Devolvida</th>
                  <th className="p-2 text-right">Acertada</th><th className="p-2 text-right">Não acertada</th>
                  <th className="p-2 text-left">Situação</th><th className="p-2 text-left">Valor</th>
                  {ehAdmin && <th className="p-2" />}
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">Carregando…</td></tr>}
                {!isLoading && retiradas.length === 0 && (
                  <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Nenhuma retirada registrada.</td></tr>
                )}
                {retiradas.map((r) => (
                  <tr key={r.order_id} className="border-t">
                    <td className="p-2">{dt(r.criado_em)}</td>
                    <td className="p-2">{r.produto}</td>
                    <td className="p-2 text-right">{r.quantidade}</td>
                    <td className="p-2 text-right">{r.devolvida}</td>
                    <td className="p-2 text-right">{r.acertada}</td>
                    <td className="p-2 text-right">{r.pendente}</td>
                    <td className="p-2"><Badge variant={r.pendente > 0 ? "destructive" : "secondary"}>{situacao(r)}</Badge></td>
                    <td className="p-2 text-xs text-muted-foreground">{ehAdmin ? (r.acertada > 0 ? "No acerto" : "Pendente") : VALOR_RESERVADO}</td>
                    {ehAdmin && (
                      <td className="p-2 text-right">
                        {r.acertada > 0 && !r.em_devolucao && (
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => setDevolver(r)}>Devolução c/ ajuste</Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Devolução de retirada ainda não acertada: pela reversão em Vendas recentes ou Histórico (o estoque volta só com retorno físico confirmado).
          </p>
        </div>

        {antigos.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              Lançamentos antigos da conta anterior ({qtdAntigos} botijões, sem valor e fora do acerto novo)
            </summary>
            <ul className="mt-2 space-y-1">
              {antigos.map((l) => (
                <li key={l.id} className="flex justify-between border-b py-1">
                  <span>{new Date(`${l.data}T00:00:00`).toLocaleDateString("pt-BR")} · {l.tipo === "entrega" ? "Entrega" : l.tipo}</span>
                  <span>{l.quantidade}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <p className="text-xs text-muted-foreground">Cadastrado em {format(new Date(reseller.createdAt), "dd/MM/yyyy")}</p>

        {devolver && <DevolucaoAcertadaDialog retirada={devolver} fin={fin} onClose={() => setDevolver(null)} />}
      </DialogContent>
    </Dialog>
  );
}
