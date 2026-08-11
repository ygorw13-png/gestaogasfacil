import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  useRegistrarDespesa,
  ORIGEM_DINHEIRO_LABELS,
  type OrigemDinheiro,
  type TipoDespesa,
} from "@/hooks/useDespesas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIAS: { value: string; label: string; tipo: TipoDespesa }[] = [
  { value: "gasolina", label: "Gasolina / Combustível", tipo: "combustivel" },
  { value: "manutencao", label: "Manutenção da moto", tipo: "manutencao" },
  { value: "alimentacao", label: "Alimentação", tipo: "diversa" },
  { value: "material", label: "Material / Consumo", tipo: "diversa" },
  { value: "outros", label: "Outros", tipo: "diversa" },
];

function useColaboradores() {
  return useQuery({
    queryKey: ["colaboradores-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores" as any)
        .select("id, nome, cargo")
        .eq("situacao", "ativo")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

function useVeiculos() {
  return useQuery({
    queryKey: ["veiculos-despesa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, plate, model")
        .order("plate");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

function useVinculos() {
  return useQuery({
    queryKey: ["vehicle-assignments-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_assignments")
        .select("vehicle_id, driver_name, status")
        .eq("status", "active");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function DespesaPortariaDialog({ open, onOpenChange }: Props) {
  const registrar = useRegistrarDespesa();
  const { data: colaboradores } = useColaboradores();
  const { data: veiculos } = useVeiculos();
  const { data: vinculos } = useVinculos();

  const [categoria, setCategoria] = useState("gasolina");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [colaboradorId, setColaboradorId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");
  const [origem, setOrigem] = useState<OrigemDinheiro>("caixa_portaria");
  const [obs, setObs] = useState("");

  const colaborador = useMemo(
    () => (colaboradores ?? []).find((c) => c.id === colaboradorId),
    [colaboradores, colaboradorId]
  );

  // Ao escolher o vendedor, sugere automaticamente a moto vinculada a ele
  useEffect(() => {
    if (!colaborador || !vinculos) return;
    const vinculo = vinculos.find(
      (v) => (v.driver_name ?? "").toLowerCase() === String(colaborador.nome).toLowerCase()
    );
    if (vinculo) setVeiculoId(vinculo.vehicle_id);
  }, [colaborador, vinculos]);

  const valorNum = Number(valor.replace(",", ".")) || 0;
  const categoriaInfo = CATEGORIAS.find((c) => c.value === categoria)!;

  const handleSave = async () => {
    if (valorNum <= 0) {
      setErro("Informe um valor maior que zero.");
      toast.error("Informe o valor da despesa");
      return;
    }
    setErro(null);
    const veiculo = (veiculos ?? []).find((v) => v.id === veiculoId);
    try {
      await registrar.mutateAsync({
        tipo: categoriaInfo.tipo,
        categoria,
        descricao:
          descricao.trim() ||
          `${categoriaInfo.label}${colaborador ? ` - ${colaborador.nome}` : ""}`,
        valor: valorNum,
        data: new Date().toISOString().slice(0, 10),
        origem_dinheiro: origem,
        colaborador_id: colaboradorId || null,
        colaborador_nome: colaborador?.nome ?? null,
        veiculo_id: veiculoId || null,
        veiculo_placa: veiculo?.plate ?? null,
        observacoes: obs || null,
      });
      toast.success(`Despesa de ${valorNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} lançada`);
      setDescricao("");
      setValor("");
      setObs("");
      onOpenChange(false);
    } catch (e: any) {
      setErro(e?.message ?? "Não foi possível salvar a despesa.");
      toast.error("Erro ao salvar despesa", { description: e?.message });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lançar despesa da portaria</DialogTitle>
          <DialogDescription>
            Ex: gasolina da moto de um vendedor. Saindo do caixa da portaria, gera sangria
            automática no fechamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de despesa</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendedor / entregador</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(colaboradores ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Moto / veículo</Label>
              <Select value={veiculoId} onValueChange={setVeiculoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(veiculos ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate} {v.model ? `— ${v.model}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Descrição</Label>
            <Input
              id="desc"
              placeholder="Ex: 20 litros de gasolina"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>De onde saiu o dinheiro?</Label>
            <Select value={origem} onValueChange={(v) => setOrigem(v as OrigemDinheiro)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ORIGEM_DINHEIRO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSave} disabled={registrar.isPending || valorNum <= 0}>
            Lançar despesa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
