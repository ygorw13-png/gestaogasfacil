import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { acao } from "@/lib/g1/acoes";
import { numeroPedido } from "@/lib/entregas";
import { cheiosNaCarga, produtoCarga, rotuloProduto, useCargaResumo } from "@/hooks/useCarga";
import type { Order } from "../types";

const FORMAS = [
  { value: "money", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credit", label: "Cartão de crédito" },
  { value: "debit", label: "Cartão de débito" },
  { value: "promissoria", label: "A prazo (nota promissória)" },
];
const rotuloForma = (v?: string | null) => FORMAS.find((f) => f.value === v)?.label ?? (v || "não informada");
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numero = (t: string) => (t.trim() === "" ? null : Number(t.replace(",", ".")));

interface Props {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado só depois da confirmação do banco. */
  onConcluida: () => void;
  onReatribuir?: (orderId: string) => void;
}

/**
 * "Concluir entrega" (substitui o antigo "Dar baixa"): pede forma e valor efetivos e os cascos recebidos,
 * confere a carga do entregador atribuído e só fecha depois que o banco confirmar (ação controlada com chave).
 */
export function ConcluirEntregaDialog({ order, isOpen, onOpenChange, onConcluida, onReatribuir }: Props) {
  const [forma, setForma] = useState("");
  const [valor, setValor] = useState("");
  const [cascos, setCascos] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const operacao = useOperacaoUnica("concluir-entrega");
  const qc = useQueryClient();
  const { toast } = useToast();
  useEffect(() => { if (isOpen) { setForma(""); setValor(""); setCascos(""); setMotivo(""); setErro(null); } }, [isOpen, order?.id]);

  const produto = produtoCarga(order?.product);
  const qtd = Math.max(1, Number(order?.quantity) || 1);
  const carga = useCargaResumo(isOpen && order?.deliveryPersonId ? order.deliveryPersonId : null);
  const naCarga = cheiosNaCarga(carga.data, order?.deliveryPersonId, produto);
  const cargaOk = !!order?.deliveryPersonId && !carga.isLoading && !carga.isError && naCarga >= qtd;

  const aPrazo = forma === "promissoria";
  const v = numero(valor);
  const c = numero(cascos);
  const preco = Number(order?.price || 0);
  const diverge = !aPrazo && v !== null && Math.abs(v - preco) > 0.009;
  const faltando = !forma ? "Escolha a forma de pagamento efetiva."
    : !aPrazo && (v === null || Number.isNaN(v) || v < 0) ? "Informe o valor realmente recebido (0 se nada foi recebido)."
    : c === null || Number.isNaN(c) || c < 0 || !Number.isInteger(c) ? "Informe quantos cascos vazios foram recebidos (0 se nenhum)."
    : diverge && motivo.trim().length < 5 ? "Valor diferente do pedido: explique o motivo (mínimo 5 caracteres)."
    : null;
  const pode = !!order && cargaOk && !faltando && !operacao.enviando;

  const enviar = async () => {
    if (!order || !pode) return;
    setErro(null);
    const conteudo = { pedido: order.id, forma, valor: aPrazo ? null : v, cascos: c, motivo: diverge ? motivo.trim() : null };
    try {
      await operacao.executar(conteudo, (chave) => acao("operador_concluir_entrega", {
        _order_id: order.id, _forma: forma, _valor_recebido: aPrazo ? null : v, _vasilhames_recebidos: c,
        _motivo_divergencia: diverge ? motivo.trim() : null, _chave: chave,
      }));
      // Confirmado pelo banco: atualiza Pedidos, portaria, carga, painel, financeiro e o app do entregador.
      qc.invalidateQueries();
      toast({ title: "Entrega concluída", description: `${numeroPedido(order.id)} — ${order.clientName}` });
      onConcluida();
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir a entrega.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!operacao.enviando) onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir entrega {order ? numeroPedido(order.id) : ""}</DialogTitle>
          <DialogDescription>Registre o que realmente aconteceu na entrega. O preço do pedido não muda.</DialogDescription>
        </DialogHeader>
        {order && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md border p-3 text-sm">
              <dt className="text-muted-foreground">Cliente</dt><dd>{order.clientName}</dd>
              <dt className="text-muted-foreground">Entregador</dt><dd>{order.deliveryPersonName ?? "—"}</dd>
              <dt className="text-muted-foreground">Produto</dt><dd>{qtd}× {order.product}</dd>
              <dt className="text-muted-foreground">Preço original</dt><dd>{brl(preco)}</dd>
              <dt className="text-muted-foreground">Combinado</dt><dd>{rotuloForma(order.paymentMethod)}</dd>
            </dl>

            {!order.deliveryPersonId ? (
              <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">Sem entregador identificado: atribua o pedido antes de concluir.</p>
            ) : carga.isLoading ? (
              <p className="text-sm text-muted-foreground">Conferindo a carga do entregador…</p>
            ) : carga.isError ? (
              <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">Não foi possível consultar a carga. Nada será concluído até a consulta funcionar.</p>
            ) : naCarga < qtd ? (
              <div role="alert" className="space-y-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
                <p>A carga de {order.deliveryPersonName} tem {naCarga} cheio(s) de {produto ? rotuloProduto(produto) : order.product}; este pedido precisa de {qtd}.</p>
                <p>Registre a saída da portaria para a carga dele ou, se o produto está com outro entregador, reatribua com a transferência física.</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline"><Link to="/entrance/cargas">Abrir Cargas</Link></Button>
                  {onReatribuir && <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); onReatribuir(order.id); }}>Reatribuir</Button>}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Na carga de {order.deliveryPersonName}: {naCarga} cheio(s). A conclusão baixa {qtd} da carga.</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="formaEfetiva">Forma de pagamento efetiva *</Label>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger id="formaEfetiva"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{FORMAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {aPrazo ? (
              <p className="text-xs text-muted-foreground">A prazo: gera a promissória de {brl(preco)} para o cliente, sem recebimento.</p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="valorRecebido">Valor realmente recebido (R$) *</Label>
                <Input id="valorRecebido" inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="cascosRecebidos">Cascos vazios recebidos *</Label>
              <Input id="cascosRecebidos" type="number" min={0} step={1} placeholder="0" value={cascos} onChange={(e) => setCascos(e.target.value)} />
            </div>
            {diverge && (
              <div className="space-y-2">
                <Label htmlFor="motivoDivergencia">Motivo da diferença (pedido {brl(preco)} × recebido {brl(v ?? 0)}) *</Label>
                <Textarea id="motivoDivergencia" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
            )}
            {faltando && cargaOk && <p className="text-xs text-muted-foreground">{faltando}</p>}
            {erro && (
              <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-destructive">Entrega não concluída</p>
                <p>{erro}</p>
                {operacao.duvida && <p className="mt-1 text-xs">Tente de novo: a mesma tentativa não grava duas vezes.</p>}
              </div>
            )}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={operacao.enviando}>Cancelar</Button>
          <Button onClick={enviar} disabled={!pode}>{operacao.enviando ? "Registrando…" : "Concluir entrega"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
