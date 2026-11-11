import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRegistrarMovimentacao, type PortariaProduto } from "@/pages/entrance/hooks/usePortariaStock";
import { SaleTypeSelect } from "@/components/forms/SaleTypeSelect";
import { exigeValor, vasilhameDeltas, tipoVendaLabel, type TipoVenda } from "@/lib/saleTypes";
import { G1_ACOES, acao, AcaoError } from "@/lib/g1/acoes";
import { ehIncerta, idDaChave } from "@/lib/g1/operacao";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { createPromissoryFromSale } from "@/lib/promissory";

const PRODUCTS: { value: PortariaProduto; label: string; orderProduct: string }[] = [
  { value: "P13", label: "Gás P13", orderProduct: "P13" },
  { value: "P20", label: "Gás P20", orderProduct: "P20" },
  { value: "P45", label: "Gás P45", orderProduct: "P45" },
  { value: "agua", label: "Água 20L", orderProduct: "Água 20L" },
];

const PAYMENTS = [
  { value: "money", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credit", label: "Cartão de Crédito" },
  { value: "debit", label: "Cartão de Débito" },
  { value: "convenio", label: "Convênio" },
  { value: "gas-povo", label: "Gás-Povo" },
  { value: "vale-gas", label: "Vale-Gás" },
  { value: "promissoria", label: "Nota Promissória" },
];

interface QuickSaleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function QuickSaleDialog({ isOpen, onOpenChange, onSaved }: QuickSaleDialogProps) {
  const { toast } = useToast();
  const registrarMov = useRegistrarMovimentacao();
  const [clientName, setClientName] = useState("");
  const [product, setProduct] = useState<PortariaProduto>("P13");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("money");
  const [tipoVenda, setTipoVenda] = useState<TipoVenda>("recarga");
  const [counterMode, setCounterMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const requiresClient = paymentMethod === "promissoria" || paymentMethod === "convenio";
  const requiresValue = exigeValor(paymentMethod);
  const returnedEmpty = tipoVenda === "recarga";

  const reset = () => {
    setClientName("");
    setProduct("P13");
    setQuantity(1);
    setPrice("");
    setPaymentMethod("money");
    setTipoVenda("recarga");
  };

  // Atalho: Enter (com Ctrl) registra a venda
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Uma venda por vez; a chave de reenvio fica presa ao conteúdo da venda (ver src/lib/g1/operacao.ts).
  const operacao = useOperacaoUnica("venda-portaria");
  const [erro, setErro] = useState<string | null>(null);
  // Trava imediata (Ctrl+Enter repetido ou clique duplo antes do re-render).
  const travaRef = useRef(false);

  const handleSubmit = async () => {
    if (travaRef.current) return;
    if (requiresClient && clientName.trim().length < 3) {
      toast({
        title: "Cliente obrigatório",
        description: "Para nota promissória/convênio é necessário identificar o cliente.",
        variant: "destructive",
      });
      return;
    }
    const value = Number(price.replace(",", "."));
    if (requiresValue && (!value || value <= 0)) {
      toast({
        title: "Informe o valor da venda",
        description: "Obrigatório para dinheiro, PIX e cartão.",
        variant: "destructive",
      });
      return;
    }

    travaRef.current = true;
    setSaving(true);
    setErro(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) throw new Error("Sessão expirada. Entre novamente para registrar a venda.");

      const finalName = clientName.trim() || "Cliente Balcão";
      const productLabel = PRODUCTS.find((p) => p.value === product)?.orderProduct || product;
      const deltas = vasilhameDeltas(tipoVenda, quantity);

      // Conteúdo que identifica ESTA venda: o mesmo conteúdo reenviado usa a mesma chave.
      const conteudo = { cliente: finalName, produto: product, quantidade: quantity, valor: value || 0, pagamento: paymentMethod, tipoVenda };

      await operacao.executar(conteudo, async (chave) => {
        if (G1_ACOES) {
          // Uma ação só: venda + baixa da portaria + recebimento/promissória.
          // Se algo falhar, nada fica gravado pela metade.
          await acao("venda_portaria", {
            _cliente_id: null, _cliente_nome: finalName, _produto: productLabel, _quantidade: quantity,
            _valor: value || 0, _forma: paymentMethod, _tipo_venda: tipoVenda, _devolveu_vazio: returnedEmpty,
            _reseller_id: null, _observacoes: `Venda rápida - ${tipoVendaLabel(tipoVenda)}`,
            _vasilhames_recebidos: deltas.recebidos, _comodato: false, _chave: chave,
          });
          return;
        }

        // ── Caminho antigo (G1 desligado): o id vem da chave, então um reenvio bate na chave primária.
        const orderId = idDaChave(chave);
        const { error: insErr } = await supabase.from("orders").insert({
          id: orderId,
          user_id: userId,
          client_name: finalName,
          client_phone: null,
          address: {},
          product: productLabel,
          quantity,
          price: value || 0,
          payment_method: paymentMethod,
          status: "delivered",
          delivered_at: new Date().toISOString(),
          origem_venda: "portaria",
          has_empty_cylinder: returnedEmpty,
          tipo_venda: tipoVenda,
          vasilhames_entregues: deltas.entregues,
          vasilhames_recebidos: deltas.recebidos,
          notes: `Venda rápida - ${tipoVendaLabel(tipoVenda)}`,
        } as any);
        if (insErr && insErr.code !== "23505") throw new AcaoError(insErr.message, ehIncerta(insErr));

        const faltou = (o: string) =>
          new AcaoError(`Venda salva, mas ${o}. Toque em Registrar de novo para completar (não duplica a venda).`, true);

        const { data: jaMov, error: movQErr } = await supabase
          .from("movimentacoes_portaria").select("id").eq("referencia_id", orderId).limit(1);
        if (movQErr) throw faltou("não foi possível conferir o estoque da portaria");
        if (!jaMov || jaMov.length === 0) {
          try {
            await registrarMov.mutateAsync({
              tipo: returnedEmpty ? "venda" : "venda_comodato",
              produto: product,
              delta_cheios: tipoVenda === "vasilhame" ? 0 : -quantity,
              delta_vazios: tipoVenda === "recarga" ? quantity : tipoVenda === "vasilhame" ? -quantity : 0,
              delta_emprestados: 0,
              cliente_nome: finalName,
              referencia_id: orderId,
              observacoes: "Venda rápida na portaria",
            });
          } catch {
            throw faltou("o estoque da portaria não foi atualizado");
          }
        }

        if (paymentMethod === "promissoria") {
          const { error: pnError } = await createPromissoryFromSale({
            clientId: null,
            clientName: finalName,
            value: value || 0,
            referenceId: orderId,
            description: `Venda rápida portaria - ${quantity}x ${productLabel}`,
          });
          if (pnError) throw faltou("a nota promissória não foi criada");
        }
      });

      // ── gravação confirmada: só agora limpa, avisa e fecha
      toast({ title: "Venda rápida registrada", description: `${quantity}x ${productLabel}` });
      reset();
      onSaved();
      if (!counterMode) onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tente novamente.";
      setErro(msg);
      toast({ title: "Venda não registrada", description: msg, variant: "destructive" });
    } finally {
      travaRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Venda Rápida (Portaria)</DialogTitle>
          <DialogDescription>
            Atalhos: <strong>F2</strong> abre • <strong>Ctrl+Enter</strong> registra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <SaleTypeSelect value={tipoVenda} onChange={setTipoVenda} id="qs-tipo" />

          <div className="space-y-2">
            <Label htmlFor="qs-client">
              Cliente {requiresClient ? "(obrigatório)" : "(opcional)"}
            </Label>
            <Input
              id="qs-client"
              placeholder="Cliente Balcão"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={product} onValueChange={(v) => setProduct(v as PortariaProduto)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qs-qty">Quantidade</Label>
              <Input
                id="qs-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENTS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qs-price">
              Valor da venda (R$) {requiresValue && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="qs-price"
              inputMode="decimal"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="qs-counter">Modo balcão</Label>
              <p className="text-xs text-muted-foreground">
                Mantém o diálogo aberto para vendas em sequência.
              </p>
            </div>
            <Switch id="qs-counter" checked={counterMode} onCheckedChange={setCounterMode} />
          </div>
        </div>

        {erro && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Venda não registrada</p>
            <p>{erro}</p>
            <p className="text-muted-foreground">Os dados continuam preenchidos.</p>
            {operacao.duvida && (
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { operacao.descartarDuvida(); setErro(null); }}>
                Descartar a tentativa anterior e registrar como nova venda
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Registrar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
