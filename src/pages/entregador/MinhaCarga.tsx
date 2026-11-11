import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, Truck } from "lucide-react";
import { G1_ACOES } from "@/lib/g1/acoes";
import { rotuloProduto, useCargaHistorico, useCargaResumo } from "@/hooks/useCarga";
import { DevolucaoCargaDialog } from "@/components/carga/DevolucaoCargaDialog";
import { CargaHistoricoTabela } from "@/components/carga/CargaHistoricoTabela";
import { useReversoes, type ReversaoComPedido } from "@/hooks/useReversoes";
import { ConfirmarFisicoDialog } from "@/components/reversao/ConfirmarFisicoDialog";
import { STATUS_ROTULO, TIPO_ROTULO, pendenciasFisicas } from "@/lib/g1/reversao";
import { Badge } from "@/components/ui/badge";

/**
 * App do entregador: o que está na minha carga, o que aconteceu com ela e devolução da sobra.
 * O banco só mostra a carga do próprio entregador e só aceita devolver o que está nela.
 */
export default function MinhaCarga() {
  const resumo = useCargaResumo(null);
  const historico = useCargaHistorico(null, 2);
  const [devolver, setDevolver] = useState(false);
  const reversoes = useReversoes(30);
  const [recolher, setRecolher] = useState<ReversaoComPedido | null>(null);
  const minhasReversoes = (reversoes.data ?? []).filter((r) => r.status === "solicitada" || r.status === "aguardando_retorno");
  const linhas = resumo.data ?? [];
  const cargaId = linhas[0]?.carga_id ?? null;
  const temAlgo = linhas.some((l) => l.cheios !== 0 || l.vazios !== 0);

  if (!G1_ACOES) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        A consulta da carga ainda não está ativa. Confira com a portaria o que saiu com você.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg"><Truck className="h-5 w-5" /> Minha carga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resumo.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {resumo.isError && <p className="text-sm text-destructive" role="alert">Não foi possível consultar a carga agora.</p>}
          {resumo.data && linhas.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto na sua carga. Peça a saída na portaria.</p>}
          {linhas.length > 0 && (
            <ul className="divide-y rounded-md border">
              {linhas.map((l) => (
                <li key={l.produto} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-medium">{rotuloProduto(l.produto)}</span>
                  <span className="tabular-nums"><strong>{l.cheios}</strong> cheio(s) · {l.vazios} vazio(s)</span>
                </li>
              ))}
            </ul>
          )}
          <Button className="w-full" variant="outline" disabled={!temAlgo} onClick={() => setDevolver(true)}>
            <ArrowDownToLine className="mr-2 h-4 w-4" /> Devolver sobra na portaria
          </Button>
        </CardContent>
      </Card>

      {minhasReversoes.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Devoluções e trocas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {minhasReversoes.map((r) => {
              const falta = pendenciasFisicas(r);
              return (
                <div key={r.id} className="space-y-2 rounded-md border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{TIPO_ROTULO[r.tipo]} · {r.pedido?.client_name ?? "Cliente"}</span>
                    <Badge variant="outline">{STATUS_ROTULO[r.status]}</Badge>
                  </div>
                  {r.status === "aguardando_retorno" && <p className="text-xs text-muted-foreground">Pendente: {falta.textos.join(" · ")}</p>}
                  {r.status === "aguardando_retorno" && (cargaId ? (
                    <Button size="sm" className="w-full" variant="outline" onClick={() => setRecolher(r)}>Informar recolhimento na minha carga</Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sem carga aberta: entregue o produto na portaria para a conferência.</p>
                  ))}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Movimentos de hoje e ontem</CardTitle></CardHeader>
        <CardContent>
          <CargaHistoricoTabela movimentos={historico.data} isLoading={historico.isLoading} isError={historico.isError} />
        </CardContent>
      </Card>

      <ConfirmarFisicoDialog open={!!recolher} onOpenChange={(o) => !o && setRecolher(null)} reversao={recolher}
        cliente={recolher?.pedido?.client_name} cargaFixa={cargaId ? { id: cargaId, nome: "aberta" } : null} />
      <DevolucaoCargaDialog open={devolver} onOpenChange={setDevolver} linhas={linhas} quem="registrada por você" />
    </div>
  );
}
