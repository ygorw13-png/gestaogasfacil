import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, BellRing, Check, Pencil, Trash2 } from "lucide-react";
import {
  CATEGORIAS_LEMBRETE,
  diasRestantes,
  useExcluirLembrete,
  useLembretes,
  useMarcarFeito,
  useSalvarLembrete,
  useVeiculosSimples,
  type Lembrete,
  type LembreteInput,
} from "@/hooks/useLembretes";

const NENHUM = "__none__";

const vazio = (): LembreteInput => ({
  titulo: "",
  categoria: "troca_oleo",
  veiculo_id: null,
  veiculo_placa: null,
  intervalo_dias: 40,
  ultima_execucao: new Date().toISOString().split("T")[0],
  observacoes: "",
  ativo: true,
});

function statusBadge(dias: number) {
  if (dias < 0) return <Badge variant="destructive">Atrasado {Math.abs(dias)}d</Badge>;
  if (dias === 0) return <Badge variant="destructive">Vence hoje</Badge>;
  if (dias <= 7) return <Badge className="bg-amber-500 text-white hover:bg-amber-500">Em {dias}d</Badge>;
  return <Badge variant="secondary">Em {dias}d</Badge>;
}

export default function LembretesTab() {
  const { data: lembretes = [], isLoading } = useLembretes();
  const { data: veiculos = [] } = useVeiculosSimples();
  const salvar = useSalvarLembrete();
  const marcarFeito = useMarcarFeito();
  const excluir = useExcluirLembrete();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LembreteInput>(vazio());

  const abrirNovo = () => {
    setForm(vazio());
    setOpen(true);
  };

  const abrirEdicao = (l: Lembrete) => {
    setForm({
      id: l.id,
      titulo: l.titulo,
      categoria: l.categoria,
      veiculo_id: l.veiculo_id,
      veiculo_placa: l.veiculo_placa,
      intervalo_dias: l.intervalo_dias,
      ultima_execucao: l.ultima_execucao,
      observacoes: l.observacoes ?? "",
      ativo: l.ativo,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.titulo.trim()) return;
    await salvar.mutateAsync(form);
    setOpen(false);
  };

  const ativos = lembretes.filter((l) => l.ativo);
  const pendentes = ativos.filter((l) => diasRestantes(l).dias <= 7);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Lembretes recorrentes
            </CardTitle>
            <CardDescription>
              Ex.: trocar óleo da moto a cada 40 dias a partir da última troca — com o veículo identificado.
            </CardDescription>
          </div>
          <Button onClick={abrirNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lembrete
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendentes.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <strong>{pendentes.length}</strong> lembrete(s) vencendo em até 7 dias.
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lembrete</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Intervalo</TableHead>
              <TableHead>Última vez</TableHead>
              <TableHead>Próxima</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && lembretes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum lembrete cadastrado.
                </TableCell>
              </TableRow>
            )}
            {lembretes.map((l) => {
              const { proxima, dias } = diasRestantes(l);
              return (
                <TableRow key={l.id} className={l.ativo ? "" : "opacity-50"}>
                  <TableCell>
                    <div className="font-medium">{l.titulo}</div>
                    <div className="text-xs text-muted-foreground">
                      {CATEGORIAS_LEMBRETE.find((c) => c.value === l.categoria)?.label ?? l.categoria}
                    </div>
                  </TableCell>
                  <TableCell>{l.veiculo_placa ?? "—"}</TableCell>
                  <TableCell>{l.intervalo_dias} dias</TableCell>
                  <TableCell>{new Date(l.ultima_execucao + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{proxima.toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{l.ativo ? statusBadge(dias) : <Badge variant="outline">Inativo</Badge>}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => marcarFeito.mutate(l.id)}
                      title="Marcar como feito hoje"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => abrirEdicao(l)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => excluir.mutate(l.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar lembrete" : "Novo lembrete"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.titulo}
                placeholder="Trocar óleo da moto"
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => setForm({ ...form, categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_LEMBRETE.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Veículo</Label>
                <Select
                  value={form.veiculo_id ?? NENHUM}
                  onValueChange={(v) => {
                    if (v === NENHUM) return setForm({ ...form, veiculo_id: null, veiculo_placa: null });
                    const veic = veiculos.find((x) => x.id === v);
                    setForm({ ...form, veiculo_id: v, veiculo_placa: veic?.plate ?? null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUM}>Nenhum</SelectItem>
                    {veiculos.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate}
                        {v.model ? ` - ${v.model}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Repetir a cada (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.intervalo_dias}
                  onChange={(e) => setForm({ ...form, intervalo_dias: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Última realização</Label>
                <Input
                  type="date"
                  value={form.ultima_execucao}
                  onChange={(e) => setForm({ ...form, ultima_execucao: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes ?? ""}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.ativo ?? true}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
              <Label>Lembrete ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={salvar.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
