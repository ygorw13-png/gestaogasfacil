import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { acao } from "@/lib/g1/acoes";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { useUserRole } from "@/hooks/useUserRole";
import { useAtualizarAposReversao } from "@/hooks/useReversoes";
import { AVISO_PARCIAL, TIPO_ROTULO, tiposPermitidos, type TipoReversao } from "@/lib/g1/reversao";

export interface PedidoParaReverter {
  id: string;
  client: string;
  product: string;
  quantity: number;
  amount?: number;
  /** status do pedido: delivered/completed = venda concluída */
  status: string;
  tipoVenda?: string | null;
}

const brl = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const EXPLICA: Record<TipoReversao, string> = {
  cancelamento: "Pedido ainda não entregue. Sem saída de produto, nada se move. Se o produto já foi para a carga, ele continua na carga até a devolução ser registrada. Pagamento antecipado vira reembolso pendente.",
  devolucao: "O cliente devolve tudo. A venda original fica no histórico; o produto só volta ao estoque quando o retorno for confirmado, e o dinheiro só conta como devolvido quando o reembolso for registrado.",
  troca: "Troca do produto com problema por outro, sem cobrança. A venda, a promissória e os recebimentos ficam como estão. O recolhido fica separado para conferência.",
  duplicidade: "A venda foi lançada duas vezes. Corrige só o que este lançamento gravou, sem coleta física. Só gera reembolso se o cliente pagou duas vezes.",
};

export function ReverterVendaDialog({ open, onOpenChange, pedido }: { open: boolean; onOpenChange: (o: boolean) => void; pedido: PedidoParaReverter | null }) {
  const { isAdmin, isEntregador } = useUserRole();
  const atualizar = useAtualizarAposReversao();
  const operacao = useOperacaoUnica("reversao");
  const tipos = useMemo(() => (pedido ? tiposPermitidos(pedido.status, pedido.tipoVenda) : []), [pedido]);
  const [tipo, setTipo] = useState<TipoReversao | "parcial" | "">("");
  const [motivo, setMotivo] = useState("");
  const [valida, setValida] = useState("");
  const [pagouDuas, setPagouDuas] = useState<"sim" | "nao" | "nao_sei" | "">("");
  const [autorizar, setAutorizar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setTipo(tipos.length === 1 ? tipos[0] : ""); setMotivo(""); setValida(""); setPagouDuas(""); setAutorizar(true); setErro(null); }
  }, [open, tipos]);

  const candidatas = useQuery({
    queryKey: ["reversoes", "candidatas-validas", pedido?.id],
    enabled: open && tipo === "duplicidade" && !!pedido,
    queryFn: async () => {
      const desde = new Date(Date.now() - 45 * 86_400_000).toISOString();
      const { data, error } = await supabase.from("orders").select("id, client_name, product, quantity, price, created_at, delivered_at")
        .eq("client_name", pedido!.client).in("status", ["delivered", "completed"]).neq("id", pedido!.id)
        .gte("created_at", desde).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!pedido) return null;
  const opcoesTipo = isEntregador ? tipos.filter((t) => t === "devolucao" || t === "troca") : tipos;
  const autoriza = isAdmin && autorizar && !(tipo === "duplicidade" && pagouDuas === "nao_sei");
  const pronto = !!tipo && tipo !== "parcial" && motivo.trim().length >= 5
    && (tipo !== "duplicidade" || (!!valida && !!pagouDuas)) && !operacao.enviando;

  const enviar = async () => {
    if (!pronto || !tipo || (tipo as string) === "parcial") return; // parcial nunca é enviada
    setErro(null);
    const args = {
      _order_id: pedido.id, _tipo: tipo, _motivo: motivo.trim(),
      _order_valida_id: tipo === "duplicidade" ? valida : null,
      _pagamento_duplicado: tipo === "duplicidade" ? (pagouDuas === "sim" ? true : pagouDuas === "nao" ? false : null) : null,
      _autorizar: autoriza,
    };
    try {
      await operacao.executar(args, (chave) => acao("reversao_solicitar", { ...args, _chave: chave }));
      atualizar();
      toast.success(autoriza ? `${TIPO_ROTULO[tipo]} autorizada` : `${TIPO_ROTULO[tipo]} solicitada ao administrador`, {
        description: autoriza && tipo !== "cancelamento" ? "Acompanhe o retorno do produto e o reembolso em Reversões e Reembolsos." : undefined,
      });
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tipos.length === 1 && tipos[0] === "cancelamento" ? "Cancelar pedido" : "Reverter venda"}</DialogTitle>
          <DialogDescription>
            {pedido.client} · {pedido.product} · {pedido.quantity} un.{typeof pedido.amount === "number" ? ` · ${brl(pedido.amount)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {opcoesTipo.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este pedido não pode ser revertido.</p>
        ) : (
          <div className="space-y-4">
            {opcoesTipo.length > 1 && (
              <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as TipoReversao | "parcial")} className="space-y-2">
                {opcoesTipo.map((t) => (
                  <label key={t} className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm">
                    <RadioGroupItem value={t} className="mt-0.5" />
                    <span><span className="font-medium">{TIPO_ROTULO[t]}</span></span>
                  </label>
                ))}
                {opcoesTipo.includes("devolucao") && (
                  <label className="flex items-start gap-2 rounded-md border border-dashed p-2 text-sm text-muted-foreground">
                    <RadioGroupItem value="parcial" disabled className="mt-0.5" />
                    <span><span className="font-medium">Devolução parcial</span> — {AVISO_PARCIAL}</span>
                  </label>
                )}
              </RadioGroup>
            )}

            {tipo && tipo !== "parcial" && <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">{EXPLICA[tipo]}</p>}

            {tipo === "duplicidade" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Venda válida (a que fica)</Label>
                  <Select value={valida} onValueChange={setValida}>
                    <SelectTrigger><SelectValue placeholder={candidatas.isLoading ? "Carregando…" : "Escolha a venda correta"} /></SelectTrigger>
                    <SelectContent>
                      {(candidatas.data ?? []).map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {new Date(o.delivered_at ?? o.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {o.product} · {o.quantity} un. · {brl(Number(o.price))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {candidatas.data && candidatas.data.length === 0 && (
                    <p className="text-xs text-destructive">Nenhuma outra venda concluída deste cliente nos últimos 45 dias. Sem a venda válida, a duplicidade não pode ser registrada.</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>O cliente pagou duas vezes?</Label>
                  <RadioGroup value={pagouDuas} onValueChange={(v) => setPagouDuas(v as typeof pagouDuas)} className="flex flex-wrap gap-3 text-sm">
                    <label className="flex items-center gap-1"><RadioGroupItem value="nao" /> Não</label>
                    <label className="flex items-center gap-1"><RadioGroupItem value="sim" /> Sim (gera reembolso pendente)</label>
                    <label className="flex items-center gap-1"><RadioGroupItem value="nao_sei" /> Não sei ainda</label>
                  </RadioGroup>
                </div>
              </div>
            )}

            {tipo && tipo !== "parcial" && (
              <div className="space-y-1">
                <Label htmlFor="motivo-reversao">Motivo</Label>
                <Textarea id="motivo-reversao" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex.: cliente desistiu, botijão com vazamento, lançado duas vezes…" />
              </div>
            )}

            {tipo && tipo !== "parcial" && (isAdmin ? (
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={autorizar} onCheckedChange={(v) => setAutorizar(v === true)} disabled={tipo === "duplicidade" && pagouDuas === "nao_sei"} />
                <span>Autorizar agora (como administrador){tipo === "duplicidade" && pagouDuas === "nao_sei" ? " — confirme o pagamento antes de autorizar" : ""}</span>
              </label>
            ) : (
              <p className="text-xs text-muted-foreground">Fica como solicitação. Só o administrador autoriza; nada muda no estoque ou no dinheiro antes disso.</p>
            ))}

            {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}
            {operacao.duvida && <p className="text-xs text-muted-foreground">Sem confirmação do servidor. Tentar de novo usa o mesmo registro, sem duplicar.</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button variant="destructive" disabled={!pronto} onClick={enviar}>
            {operacao.enviando ? "Registrando…" : autoriza ? "Autorizar" : "Solicitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
