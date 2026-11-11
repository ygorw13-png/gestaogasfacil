import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { useEntregadoresApp } from "@/hooks/useEntregadoresApp";
import { msgEntregaAtribuida } from "@/utils/whatsappLinks";
import type { Order } from "../types";
import type { AssignOptions } from "../hooks/useOrderMutations";
import { G1_ACOES } from "@/lib/g1/acoes";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { cheiosNaCarga, produtoCarga, rotuloProduto, useCargaResumo, useSaldoTransferivel } from "@/hooks/useCarga";

interface AssignOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDeliveryPerson: string;
  onDeliveryPersonChange: (value: string) => void;
  /** Resolve só depois da gravação confirmada; rejeita com o motivo em caso de erro. */
  onSubmit: (opts?: AssignOptions) => void | Promise<void>;
  order?: Order | null;
}

export function AssignOrderDialog({
  isOpen,
  onOpenChange,
  selectedDeliveryPerson,
  onDeliveryPersonChange,
  onSubmit,
  order,
}: AssignOrderDialogProps) {
  const { data: entregadores = [], isLoading } = useEntregadoresApp();

  const [retirar, setRetirar] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const operacao = useOperacaoUnica("atribuir");
  useEffect(() => { if (isOpen) { setRetirar(false); setMotivo(""); setErro(null); } }, [isOpen]);
  const troca = G1_ACOES && !!order?.deliveryPerson && order.deliveryPerson !== selectedDeliveryPerson;

  // Origem do produto (G1): sai agora da portaria (transferência) OU já está na carga do entregador.
  const produto = produtoCarga(order?.product);
  const qtd = Math.max(1, Number(order?.quantity) || 1);
  const carga = useCargaResumo(G1_ACOES && selectedDeliveryPerson ? selectedDeliveryPerson : null);
  const naCarga = cheiosNaCarga(carga.data, selectedDeliveryPerson, produto);
  const portaria = useSaldoTransferivel(produto, isOpen && G1_ACOES && !troca);
  const portariaBloqueia = retirar && (!portaria.data || !portaria.data.abertura_registrada || portaria.data.cheios < qtd);

  const entregador = entregadores.find((c) => c.id === selectedDeliveryPerson);
  const bloqueado = !selectedDeliveryPerson || (troca && !motivo.trim()) || (G1_ACOES && portariaBloqueia) || operacao.enviando;
  const enviar = async () => {
    if (bloqueado) return;
    setErro(null);
    const conteudo = { pedido: order?.id, entregador: selectedDeliveryPerson, retirar, motivo: motivo.trim() };
    try {
      await operacao.executar(conteudo, (chave) =>
        Promise.resolve(onSubmit(G1_ACOES
          ? { retirarDaPortaria: retirar, motivo, chave, nomeEntregador: entregador?.nome }
          : { nomeEntregador: entregador?.nome })));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível atribuir o pedido.");
    }
  };
  const mensagem = order ? msgEntregaAtribuida(order, entregador?.nome) : "";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Pedido</DialogTitle>
          <DialogDescription>
            Selecione o entregador para realizar esta entrega. Só aparecem
            entregadores com acesso ao app — assim a entrega chega no celular dele.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryPerson">Entregador</Label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedDeliveryPerson} onValueChange={onDeliveryPersonChange}>
                <SelectTrigger id="deliveryPerson">
                  <SelectValue placeholder="Selecione o entregador" />
                </SelectTrigger>
                <SelectContent>
                  {entregadores.length === 0 ? (
                    <SelectItem value="no-option" disabled>
                      Nenhum entregador com acesso ao app
                    </SelectItem>
                  ) : (
                    entregadores.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {!isLoading && entregadores.length === 0 && (
            <p className="text-xs text-destructive">
              Nenhum usuário com perfil de entregador. Crie a conta e defina a
              função "entregador" em Configurações {">"} Usuários.
            </p>
          )}

          {G1_ACOES && !troca && selectedDeliveryPerson && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p className="font-medium">De onde sai o produto deste pedido ({qtd}× {produto ? rotuloProduto(produto) : order?.product})?</p>
              <label className="flex items-start gap-2">
                <Checkbox checked={!retirar} onCheckedChange={(v) => v === true && setRetirar(false)} />
                <span>
                  Já está na carga dele
                  <span className="block text-xs text-muted-foreground">
                    {carga.isLoading ? "Conferindo a carga…" : carga.isError ? "Não foi possível consultar a carga." :
                      `Na carga agora: ${naCarga} cheio(s). A portaria não baixa nada; a entrega consome a carga.`}
                  </span>
                  {!retirar && !carga.isLoading && !carga.isError && naCarga < qtd && (
                    <span className="block text-xs text-destructive">
                      A carga não cobre este pedido: a conclusão será recusada até haver produto na carga.
                    </span>
                  )}
                </span>
              </label>
              <label className="flex items-start gap-2">
                <Checkbox checked={retirar} onCheckedChange={(v) => v === true && setRetirar(true)} />
                <span>
                  Sai agora da portaria com ele
                  <span className="block text-xs text-muted-foreground">
                    Transfere {qtd} para a carga dele agora (a portaria baixa uma vez; a entrega baixa da carga).
                    {portaria.data && portaria.data.abertura_registrada && ` Disponível na portaria: ${portaria.data.cheios}.`}
                  </span>
                  {retirar && portaria.isError && <span className="block text-xs text-destructive">Não foi possível consultar o saldo da portaria.</span>}
                  {retirar && portaria.data && !portaria.data.abertura_registrada && (
                    <span className="block text-xs text-destructive">A abertura do dia ainda não foi registrada na portaria.</span>
                  )}
                  {retirar && portaria.data && portaria.data.abertura_registrada && portaria.data.cheios < qtd && (
                    <span className="block text-xs text-destructive">Saldo insuficiente na portaria para este pedido.</span>
                  )}
                </span>
              </label>
            </div>
          )}

          {erro && (
            <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <p className="font-medium text-destructive">Pedido não atribuído</p>
              <p>{erro}</p>
              {operacao.duvida && (
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { operacao.descartarDuvida(); setErro(null); }}>
                  Descartar a tentativa anterior e tentar de novo
                </Button>
              )}
            </div>
          )}

          {troca && (
            <div className="space-y-2">
              <Label htmlFor="motivoTroca">Motivo da troca de entregador</Label>
              <Textarea id="motivoTroca" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: entregador anterior saiu de rota" />
            </div>
          )}

          {entregador && (
            <p className="text-xs text-muted-foreground">
              {entregador.telefone
                ? `WhatsApp do entregador: ${entregador.telefone}`
                : "Este entregador não tem telefone cadastrado — cadastre em Colaboradores para enviar o aviso."}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {order && (
            <WhatsAppButton
              phone={entregador?.telefone}
              message={mensagem}
              label="Confirmar e avisar no WhatsApp"
              size="default"
              disabled={bloqueado}
              onSent={enviar}
            />
          )}
          <Button 
            onClick={enviar}
            disabled={bloqueado}
          >
            {operacao.enviando ? "Registrando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
