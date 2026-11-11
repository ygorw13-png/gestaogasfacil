import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { acao } from "@/lib/g1/acoes";
import { rotuloProduto, useInvalidarCarga, type CargaResumoLinha } from "@/hooks/useCarga";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Linhas da carga ABERTA de UM entregador (carga_resumo). */
  linhas: CargaResumoLinha[];
  /** Texto de quem registra, para a confirmação (ex.: "pela portaria" ou "por você"). */
  quem?: string;
}

/**
 * Devolução total ou parcial da sobra: carga -> portaria. Limitada ao que está na carga
 * (o banco recusa mais cheios do que há e mais vazios do que os recolhidos).
 */
export function DevolucaoCargaDialog({ open, onOpenChange, linhas, quem }: Props) {
  const { toast } = useToast();
  const invalidar = useInvalidarCarga();
  const operacao = useOperacaoUnica("carga-devolver");
  const comSaldo = useMemo(() => linhas.filter((l) => l.cheios > 0 || l.vazios > 0), [linhas]);
  const [produto, setProduto] = useState<string>("");
  const [cheios, setCheios] = useState(0);
  const [vazios, setVazios] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const linha = comSaldo.find((l) => l.produto === produto);
  const maxCheios = Math.max(0, linha?.cheios ?? 0);
  const maxVazios = Math.max(0, linha?.vazios ?? 0);

  useEffect(() => {
    if (!open) return;
    const p = comSaldo[0]?.produto ?? "";
    setProduto(p);
    setErro(null);
  }, [open, comSaldo]);
  useEffect(() => { setCheios(maxCheios); setVazios(maxVazios); }, [produto, maxCheios, maxVazios]);

  const invalida = !linha || cheios < 0 || vazios < 0 || cheios + vazios === 0 || cheios > maxCheios || vazios > maxVazios
    || !Number.isInteger(cheios) || !Number.isInteger(vazios);

  const enviar = async () => {
    if (invalida || !linha) return;
    setErro(null);
    try {
      await operacao.executar({ carga: linha.carga_id, produto, cheios, vazios }, (chave) =>
        acao("carga_devolver", { _carga_id: linha.carga_id, _produto: produto, _cheios: cheios, _vazios: vazios, _chave: chave }),
      );
      invalidar();
      toast({
        title: "Devolução registrada",
        description: `${cheios} cheio(s) e ${vazios} vazio(s) de ${rotuloProduto(produto)} voltaram para a portaria${quem ? ` (${quem})` : ""}.`,
      });
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Devolução não registrada.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !operacao.enviando && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Devolver sobra para a portaria</DialogTitle>
          <DialogDescription>
            {linha ? `Carga de ${linha.entregador_nome}.` : ""} Só é possível devolver o que está na carga.
          </DialogDescription>
        </DialogHeader>

        {comSaldo.length === 0 ? (
          <p className="text-sm text-muted-foreground">Não há cheios nem vazios nesta carga.</p>
        ) : (
          <fieldset disabled={operacao.enviando} className="space-y-4 border-0 p-0 m-0 min-w-0">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={produto} onValueChange={setProduto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {comSaldo.map((l) => (
                    <SelectItem key={l.produto} value={l.produto}>
                      {rotuloProduto(l.produto)} — {l.cheios} cheio(s), {l.vazios} vazio(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dev-cheios">Cheios (até {maxCheios})</Label>
                <Input id="dev-cheios" type="number" min={0} max={maxCheios} step={1} value={cheios} onChange={(e) => setCheios(Math.trunc(Number(e.target.value)))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dev-vazios">Vazios (até {maxVazios})</Label>
                <Input id="dev-vazios" type="number" min={0} max={maxVazios} step={1} value={vazios} onChange={(e) => setVazios(Math.trunc(Number(e.target.value)))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Começa preenchido com tudo (devolução total). Diminua para devolver só uma parte.</p>
          </fieldset>
        )}

        {erro && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Devolução não registrada</p>
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
          <Button onClick={enviar} disabled={invalida || operacao.enviando}>{operacao.enviando ? "Registrando…" : "Registrar devolução"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
