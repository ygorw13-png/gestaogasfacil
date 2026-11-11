import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEntregadoresApp } from "@/hooks/useEntregadoresApp";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { acao } from "@/lib/g1/acoes";
import { PRODUTOS_CARGA, rotuloProduto, useInvalidarCarga, useSaldoTransferivel, type ProdutoCarga } from "@/hooks/useCarga";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entregadorInicial?: string | null;
}

const dataBR = (iso?: string) => (iso ? iso.split("-").reverse().join("/") : "");

/**
 * Saída avulsa da portaria para a carga do entregador (transferência, não é venda).
 * O banco confere abertura do dia, saldo, entregador e quantidade; aqui só mostramos o mesmo limite antes.
 */
export function SaidaCargaDialog({ open, onOpenChange, entregadorInicial }: Props) {
  const { toast } = useToast();
  const invalidar = useInvalidarCarga();
  const { data: entregadores = [] } = useEntregadoresApp();
  const [entregador, setEntregador] = useState<string>("");
  const [produto, setProduto] = useState<ProdutoCarga>("P13");
  const [qtd, setQtd] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const operacao = useOperacaoUnica("carga-saida");
  const { data: saldo, isLoading: carregandoSaldo, isError: erroSaldo } = useSaldoTransferivel(produto, open);

  useEffect(() => {
    if (open) { setEntregador(entregadorInicial ?? ""); setQtd(1); setErro(null); }
  }, [open, entregadorInicial]);

  const disponivel = saldo?.cheios ?? 0;
  const semAbertura = saldo && !saldo.abertura_registrada;
  const invalida = !Number.isInteger(qtd) || qtd < 1;
  const acima = !!saldo && qtd > disponivel;
  const bloqueado = !entregador || invalida || acima || !!semAbertura || !saldo || operacao.enviando;
  const nome = entregadores.find((e) => e.id === entregador)?.nome ?? "entregador";

  const enviar = async () => {
    if (bloqueado) return;
    setErro(null);
    try {
      await operacao.executar({ entregador, produto, qtd }, (chave) =>
        acao("carga_saida", { _entregador_id: entregador, _produto: produto, _cheios: qtd, _chave: chave }),
      );
      invalidar();
      toast({ title: "Transferido para a carga", description: `${qtd}× ${rotuloProduto(produto)} com ${nome}. A portaria baixou ${qtd}.` });
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Transferência não registrada.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !operacao.enviando && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Saída da portaria para a carga</DialogTitle>
          <DialogDescription>Transferência para o entregador levar. Não é venda: a venda acontece na entrega ou na rua.</DialogDescription>
        </DialogHeader>

        <fieldset disabled={operacao.enviando} className="space-y-4 border-0 p-0 m-0 min-w-0">
          <div className="space-y-2">
            <Label>Entregador</Label>
            <Select value={entregador} onValueChange={setEntregador}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {entregadores.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={produto} onValueChange={(v) => setProduto(v as ProdutoCarga)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUTOS_CARGA.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saida-qtd">Quantidade (cheios)</Label>
              <Input id="saida-qtd" type="number" min={1} step={1} value={qtd} onChange={(e) => setQtd(Math.trunc(Number(e.target.value)))} />
            </div>
          </div>
        </fieldset>

        <div className="rounded-md border p-3 text-sm" role="status">
          {carregandoSaldo && <span className="text-muted-foreground">Conferindo o saldo da portaria…</span>}
          {erroSaldo && <span className="text-destructive">Não foi possível consultar o saldo da portaria. A transferência fica bloqueada até a consulta funcionar.</span>}
          {saldo && semAbertura && (
            <span className="text-destructive">
              A abertura da portaria de {dataBR(saldo.data_operacao)} ainda não foi registrada. Confirme a abertura do dia em Vendas (Balcão) antes de transferir.
            </span>
          )}
          {saldo && !semAbertura && (
            <span className={acima ? "text-destructive" : ""}>
              Disponível na portaria ({dataBR(saldo.data_operacao)}): <strong>{disponivel}</strong> cheio(s) de {rotuloProduto(produto)}.
              {acima && " A quantidade é maior que o disponível."}
            </span>
          )}
        </div>

        {erro && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Transferência não registrada</p>
            <p>{erro}</p>
            {operacao.duvida && (
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { operacao.descartarDuvida(); setErro(null); }}>
                Descartar a tentativa anterior e registrar como nova
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={operacao.enviando}>Cancelar</Button>
          <Button onClick={enviar} disabled={bloqueado}>{operacao.enviando ? "Registrando…" : "Transferir"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
