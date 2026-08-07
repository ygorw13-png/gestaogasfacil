import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePontosRevenda, type PontoRevenda } from "@/hooks/usePontosRevenda";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ponto?: PontoRevenda | null;
}

export function PontoFormDialog({ open, onOpenChange, ponto }: Props) {
  const { criarPonto, atualizarPonto } = usePontosRevenda();
  const [nome, setNome] = useState(ponto?.nome ?? "");
  const [povoado, setPovoado] = useState(ponto?.povoado ?? "");
  const [telefone, setTelefone] = useState(ponto?.telefone ?? "");
  const [vasilhames, setVasilhames] = useState(ponto?.vasilhames_emprestados ?? 0);
  const [media, setMedia] = useState(ponto?.media_botijoes ?? 0);
  const [obs, setObs] = useState(ponto?.observacoes ?? "");

  const handleSave = async () => {
    if (nome.trim().length < 2) return;
    const payload = {
      nome: nome.trim(),
      povoado: povoado || null,
      telefone: telefone || null,
      vasilhames_emprestados: Number(vasilhames) || 0,
      media_botijoes: Number(media) || 0,
      observacoes: obs || null,
    };
    if (ponto) await atualizarPonto.mutateAsync({ id: ponto.id, ...payload });
    else await criarPonto.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ponto ? "Editar ponto de revenda" : "Novo ponto de revenda"}</DialogTitle>
          <DialogDescription>
            Cadastro simples: quem é, onde fica e quantos botijões costuma trabalhar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da pessoa</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="povoado">Povoado / endereço</Label>
              <Input id="povoado" value={povoado} onChange={(e) => setPovoado(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel">Telefone</Label>
              <Input id="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vas">Vasilhames emprestados</Label>
              <Input
                id="vas"
                type="number"
                min={0}
                value={vasilhames}
                onChange={(e) => setVasilhames(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media">Botijões que trabalha</Label>
              <Input
                id="media"
                type="number"
                min={0}
                value={media}
                onChange={(e) => setMedia(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>{ponto ? "Salvar" : "Cadastrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
