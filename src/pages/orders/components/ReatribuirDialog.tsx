import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { useEntregadoresApp } from "@/hooks/useEntregadoresApp";
import { cheiosNaCarga, produtoCarga, rotuloProduto, useCargaResumo } from "@/hooks/useCarga";
import { acao } from "@/lib/g1/acoes";
import { numeroPedido } from "@/lib/entregas";
import type { Order } from "../types";

interface Props {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFeito: () => void;
}

/**
 * Reatribuir: entregador atual, novo entregador e motivo obrigatório. O aceite anterior deixa de valer.
 * O produto não muda de carga sozinho: só com a transferência física marcada (registrada entre as cargas).
 * Fechar ou cancelar não envia nada.
 */
export function ReatribuirDialog({ order, isOpen, onOpenChange, onFeito }: Props) {
  const { data: entregadores = [], isLoading } = useEntregadoresApp();
  const [novo, setNovo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [transferir, setTransferir] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const operacao = useOperacaoUnica("reatribuir");
  const qc = useQueryClient();
  const { toast } = useToast();
  useEffect(() => { if (isOpen) { setNovo(""); setMotivo(""); setTransferir(false); setErro(null); } }, [isOpen, order?.id]);

  const atual = order?.deliveryPersonId ?? null;
  const produto = produtoCarga(order?.product);
  const qtd = Math.max(1, Number(order?.quantity) || 1);
  const cargaAtual = useCargaResumo(isOpen && atual ? atual : null);
  const comAnterior = cheiosNaCarga(cargaAtual.data, atual, produto);
  const opcoes = entregadores.filter((e) => e.id !== atual);
  const nomeNovo = entregadores.find((e) => e.id === novo)?.nome;
  const pode = !!order && !!novo && motivo.trim().length >= 5 && !operacao.enviando && (!transferir || comAnterior >= qtd);

  const enviar = async () => {
    if (!order || !pode) return;
    setErro(null);
    try {
      await operacao.executar({ pedido: order.id, novo, motivo: motivo.trim(), transferir }, (chave) =>
        acao("reatribuir_entrega", { _order_id: order.id, _novo_entregador_id: novo, _motivo: motivo.trim(), _transferir_carga: transferir, _chave: chave }));
      qc.invalidateQueries();
      toast({ title: "Pedido reatribuído", description: `${numeroPedido(order.id)} agora com ${nomeNovo}. Aguardando o aceite dele.` });
      onFeito();
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível reatribuir.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!operacao.enviando) onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reatribuir {order ? numeroPedido(order.id) : ""}</DialogTitle>
          <DialogDescription>O novo entregador precisa aceitar de novo. O aceite anterior deixa de valer.</DialogDescription>
        </DialogHeader>
        {order && (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <span className="text-muted-foreground">Entregador atual: </span>
              <strong>{order.deliveryPersonName ?? "—"}</strong>
            </div>
            <div className="space-y-2">
              <Label htmlFor="novoEntregador">Novo entregador *</Label>
              <Select value={novo} onValueChange={setNovo} disabled={isLoading}>
                <SelectTrigger id="novoEntregador"><SelectValue placeholder={isLoading ? "Carregando…" : "Selecione"} /></SelectTrigger>
                <SelectContent>
                  {opcoes.length === 0 ? <SelectItem value="nenhum" disabled>Nenhum outro entregador ativo</SelectItem>
                    : opcoes.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivoReatribuir">Motivo *</Label>
              <Textarea id="motivoReatribuir" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: moto quebrou, cliente pediu outro horário" />
            </div>
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p className="font-medium">Produto deste pedido ({qtd}× {produto ? rotuloProduto(produto) : order.product})</p>
              <p className="text-xs text-muted-foreground">
                {cargaAtual.isLoading ? "Conferindo a carga do entregador atual…" : cargaAtual.isError ? "Não foi possível consultar a carga do entregador atual."
                  : `Na carga de ${order.deliveryPersonName}: ${comAnterior} cheio(s).`}
              </p>
              <label className="flex items-start gap-2">
                <Checkbox checked={transferir} onCheckedChange={(v) => setTransferir(v === true)} disabled={comAnterior < qtd} />
                <span>
                  O botijão passou agora, em mãos, para o novo entregador
                  <span className="block text-xs text-muted-foreground">Registra a transferência entre as cargas. Sem marcar, o produto continua na carga do entregador atual e o novo precisa ter produto na carga dele (ou retorno à portaria e nova saída).</span>
                </span>
              </label>
            </div>
            {erro && (
              <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-destructive">Pedido não reatribuído</p><p>{erro}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={operacao.enviando}>Cancelar</Button>
          <Button onClick={enviar} disabled={!pode}>{operacao.enviando ? "Registrando…" : "Reatribuir"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
