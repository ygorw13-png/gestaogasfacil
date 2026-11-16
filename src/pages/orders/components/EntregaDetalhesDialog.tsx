import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { dataEntrega, motivoRevisao, numeroPedido } from "@/lib/entregas";
import { EstadoEntregaBadge } from "./EstadoEntregaBadge";
import { nomeForma } from "@/lib/formasPagamento";

const TIPO_EVENTO: Record<string, string> = {
  atribuicao: "Atribuído", reatribuicao: "Reatribuído", retirada_fila: "Voltou para a fila", recusa: "Recusado pelo entregador",
  aceite: "Aceito pelo entregador", conclusao: "Entrega concluída", cancelamento: "Cancelado", status: "Situação alterada",
  regularizacao: "Regularização administrativa", transferencia_carga: "Produto transferido entre cargas",
};
const dataBR = (d: string) => d.split("-").reverse().join("/");
const quando = (t?: string | null) => (t ? new Date(t).toLocaleString("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "short" }) : "—");

/** Detalhes de um pedido pelo ID (abre a partir de qualquer pendência), com o histórico da entrega. */
export function EntregaDetalhesDialog({ orderId, onOpenChange }: { orderId: string | null; onOpenChange: (open: boolean) => void }) {
  const pedido = useQuery({
    queryKey: ["pedido-detalhe", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("orders").select("*").eq("id", orderId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const ids = [data.delivery_person_id, data.delivery_person].filter(Boolean);
      const [{ data: perfis }, { data: colabs }, ev] = await Promise.all([
        supabase.from("profiles").select("id, name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("colaboradores").select("id, nome").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("entrega_eventos").select("*").eq("order_id", orderId).order("criado_em"),
      ]);
      const nomes = new Map<string, string>();
      colabs?.forEach((c) => nomes.set(c.id, `${c.nome} (cadastro antigo, sem conta no app)`));
      perfis?.forEach((p) => nomes.set(p.id, p.name));
      return { o: data, nomes, eventos: (ev.data ?? []) as Record<string, string | null>[] };
    },
  });
  const d = pedido.data;
  const o = d?.o;
  const revisao = o ? motivoRevisao({ status: o.status, deliveryPersonId: o.delivery_person_id, deliveryPerson: o.delivery_person, acceptedAt: o.accepted_at }) : null;
  const nome = (id?: string | null) => (id ? d?.nomes.get(id) ?? "Entregador" : "—");

  return (
    <Dialog open={!!orderId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pedido {orderId ? numeroPedido(orderId) : ""}</DialogTitle>
          <DialogDescription>{o ? `Criado em ${quando(o.created_at)}` : pedido.isLoading ? "Carregando…" : pedido.isError ? "Não foi possível carregar o pedido." : "Pedido não encontrado."}</DialogDescription>
        </DialogHeader>
        {o && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <EstadoEntregaBadge entrega={{ status: o.status, deliveryPersonId: o.delivery_person_id, deliveryPerson: o.delivery_person, acceptedAt: o.accepted_at, rejectionReason: o.rejection_reason }} />
              {revisao && <span className="text-destructive">{revisao}</span>}
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
              <dt className="text-muted-foreground">Cliente</dt><dd>{o.client_name}{o.client_phone ? ` · ${o.client_phone}` : ""}</dd>
              <dt className="text-muted-foreground">Endereço</dt><dd>{[o.address?.street, o.address?.number, o.address?.neighborhood].filter(Boolean).join(", ") || "—"}</dd>
              <dt className="text-muted-foreground">Produto</dt><dd>{o.quantity}× {o.product}</dd>
              <dt className="text-muted-foreground">Preço</dt><dd>{Number(o.price ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd>
              <dt className="text-muted-foreground">Pagamento</dt><dd>{nomeForma(o.payment_method)}</dd>
              <dt className="text-muted-foreground">Data da entrega</dt><dd>{dataBR(dataEntrega(o.entrega_prevista, o.created_at))}{o.entrega_prevista ? " (prevista)" : " (dia do pedido)"}</dd>
              <dt className="text-muted-foreground">Entregador</dt><dd>{nome(o.delivery_person_id || o.delivery_person)}</dd>
              {o.rejection_reason && <><dt className="text-muted-foreground">Recusa</dt><dd>{o.rejection_reason}</dd></>}
              {o.delivered_at && <><dt className="text-muted-foreground">Entregue em</dt><dd>{quando(o.delivered_at)}</dd></>}
            </dl>
            <div>
              <h3 className="mb-1 font-medium">Histórico da entrega</h3>
              {d.eventos.length === 0 ? <p className="text-muted-foreground">Sem eventos registrados (registros anteriores a esta versão não têm histórico detalhado).</p> : (
                <ul className="space-y-1">
                  {d.eventos.map((e) => (
                    <li key={e.id} className="rounded border p-2">
                      <span className="font-medium">{TIPO_EVENTO[e.tipo ?? ""] ?? e.tipo}</span> · {quando(e.criado_em)}
                      {e.registrado_por_nome ? ` · por ${e.registrado_por_nome}` : ""}
                      {(e.entregador_anterior || e.entregador_anterior_texto || e.entregador_novo) && (
                        <span className="block text-xs text-muted-foreground">{nome(e.entregador_anterior || e.entregador_anterior_texto)} → {nome(e.entregador_novo)}</span>)}
                      {e.motivo && <span className="block text-xs">{e.motivo}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
