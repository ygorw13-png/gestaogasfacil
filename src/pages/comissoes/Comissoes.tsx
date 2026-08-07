import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, BadgePercent, AlertTriangle } from "lucide-react";
import {
  useComissaoConfig,
  useSalvarComissaoConfig,
  useComissaoRegras,
  useSalvarRegra,
  useExcluirRegra,
  useBonusFaixas,
  useSalvarFaixa,
  useExcluirFaixa,
  useComissoesPeriodo,
  useFechamentosComissao,
  useRegistrarFechamento,
  periodoQuinzenal,
} from "@/hooks/useComissoes";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function useColaboradores() {
  return useQuery({
    queryKey: ["colaboradores-comissao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nome, situacao")
        .eq("situacao", "ativo")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function Comissoes() {
  const { data: config } = useComissaoConfig();
  const salvarConfig = useSalvarComissaoConfig();
  const ativo = !!config?.ativo;

  const atual = periodoQuinzenal();
  const [inicio, setInicio] = useState(atual.inicio);
  const [fim, setFim] = useState(atual.fim);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <BadgePercent className="h-7 w-7" /> Comissões
          </h1>
          <p className="text-sm text-muted-foreground">
            Vendas da portaria e do app dos vendedores · fechamento quinzenal
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-md border px-4 py-2">
          <Switch
            checked={ativo}
            onCheckedChange={(v) => salvarConfig.mutate({ ativo: v, ciclo: "quinzenal" })}
          />
          <span className="text-sm font-medium">{ativo ? "Módulo ativo" : "Módulo desativado"}</span>
        </label>
      </div>

      {!ativo && (
        <Card className="border-amber-500/60">
          <CardContent className="flex items-start gap-3 pt-6 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
            <p>
              O módulo está pronto, mas <strong>desativado</strong>. Você pode configurar as regras e
              faixas de bônus agora e ligar quando começar a trabalhar com comissões — nada é cobrado
              ou exibido aos vendedores enquanto estiver desligado.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="painel">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
          <TabsTrigger value="bonus">Bônus</TabsTrigger>
          <TabsTrigger value="historico">Fechamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="painel" className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Início</Label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Fim</Label>
              <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                const p = periodoQuinzenal();
                setInicio(p.inicio);
                setFim(p.fim);
              }}
            >
              Quinzena atual
            </Button>
          </div>
          <PainelComissoes inicio={inicio} fim={fim} />
        </TabsContent>

        <TabsContent value="regras">
          <RegrasTab />
        </TabsContent>

        <TabsContent value="bonus">
          <BonusTab />
        </TabsContent>

        <TabsContent value="historico">
          <FechamentosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PainelComissoes({ inicio, fim }: { inicio: string; fim: string }) {
  const { data, isLoading } = useComissoesPeriodo(inicio, fim);
  const registrar = useRegistrarFechamento();

  if (isLoading) return <p className="text-sm text-muted-foreground">Calculando…</p>;
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">Nenhuma venda no período.</p>;

  const total = data.reduce((s, r) => s + r.totalReceber, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total a pagar no período</CardTitle>
          <CardDescription>{brl(total)}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {data.map((r) => (
          <Card key={r.nome}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                {r.nome}
                {r.semRegra && <Badge variant="outline">sem regra</Badge>}
              </CardTitle>
              <CardDescription>
                {r.qtdVendas} venda(s) · {r.qtdBotijoes} botijão(ões) · {brl(r.totalVendido)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Linha label="Comissão sobre vendas" valor={r.comissaoVendas} />
              <Linha label="Promissórias recebidas" valor={r.promissoriasRecebidas} muted />
              <Linha label="Comissão de promissórias" valor={r.comissaoPromissorias} />
              <Linha label="Bônus por meta" valor={r.bonus} />
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total a receber</span>
                <span>{brl(r.totalReceber)}</span>
              </div>
              <Button
                size="sm"
                className="mt-2 w-full"
                disabled={registrar.isPending}
                onClick={() =>
                  registrar.mutate({
                    colaborador_nome: r.nome,
                    periodo_inicio: inicio,
                    periodo_fim: fim,
                    total_vendido: r.totalVendido,
                    total_comissao: r.comissaoVendas + r.comissaoPromissorias,
                    total_bonus: r.bonus,
                    total_pagar: r.totalReceber,
                    detalhes: r,
                  })
                }
              >
                Registrar pagamento
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const Linha = ({ label, valor, muted }: { label: string; valor: number; muted?: boolean }) => (
  <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
    <span>{label}</span>
    <span>{brl(valor)}</span>
  </div>
);

const regraVazia = {
  colaborador_nome: "",
  modo: "percentual" as "percentual" | "fixo",
  perc_dinheiro: 0,
  perc_pix: 0,
  perc_cartao: 0,
  perc_promissoria: 0,
  fixo_por_botijao: 0,
  ativo: true,
};

function RegrasTab() {
  const { data: regras } = useComissaoRegras();
  const { data: colaboradores } = useColaboradores();
  const salvar = useSalvarRegra();
  const excluir = useExcluirRegra();
  const [nova, setNova] = useState({ ...regraVazia });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nova regra por colaborador</CardTitle>
          <CardDescription>
            Percentual sobre o valor da venda ou valor fixo por botijão. A comissão de nota
            promissória só é liberada quando a nota for recebida.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Label className="text-xs">Colaborador</Label>
            <Select
              value={nova.colaborador_nome}
              onValueChange={(v) => setNova({ ...nova, colaborador_nome: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(colaboradores ?? []).map((c: any) => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Modo</Label>
            <Select
              value={nova.modo}
              onValueChange={(v: any) => setNova({ ...nova, modo: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentual">% do valor da venda</SelectItem>
                <SelectItem value="fixo">Valor fixo por botijão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {nova.modo === "fixo" ? (
            <div>
              <Label className="text-xs">R$ por botijão</Label>
              <Input
                type="number"
                step="0.01"
                value={nova.fixo_por_botijao}
                onChange={(e) => setNova({ ...nova, fixo_por_botijao: Number(e.target.value) })}
              />
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs">% Dinheiro</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={nova.perc_dinheiro}
                  onChange={(e) => setNova({ ...nova, perc_dinheiro: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">% PIX</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={nova.perc_pix}
                  onChange={(e) => setNova({ ...nova, perc_pix: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">% Cartão</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={nova.perc_cartao}
                  onChange={(e) => setNova({ ...nova, perc_cartao: Number(e.target.value) })}
                />
              </div>
            </>
          )}
          <div>
            <Label className="text-xs">% Promissória (no recebimento)</Label>
            <Input
              type="number"
              step="0.1"
              value={nova.perc_promissoria}
              onChange={(e) => setNova({ ...nova, perc_promissoria: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!nova.colaborador_nome || salvar.isPending}
              onClick={() =>
                salvar.mutate(nova, { onSuccess: () => setNova({ ...regraVazia }) })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Colaborador</th>
              <th className="p-2 text-left">Modo</th>
              <th className="p-2 text-right">Dinheiro</th>
              <th className="p-2 text-right">PIX</th>
              <th className="p-2 text-right">Cartão</th>
              <th className="p-2 text-right">Promissória</th>
              <th className="p-2 text-right">Fixo/botijão</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {(regras ?? []).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.colaborador_nome}</td>
                <td className="p-2">{r.modo === "fixo" ? "Fixo" : "Percentual"}</td>
                <td className="p-2 text-right">{r.perc_dinheiro}%</td>
                <td className="p-2 text-right">{r.perc_pix}%</td>
                <td className="p-2 text-right">{r.perc_cartao}%</td>
                <td className="p-2 text-right">{r.perc_promissoria}%</td>
                <td className="p-2 text-right">{brl(Number(r.fixo_por_botijao))}</td>
                <td className="p-2 text-right">
                  <Button size="icon" variant="ghost" onClick={() => excluir.mutate(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {(regras ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                  Nenhuma regra cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BonusTab() {
  const { data: faixas } = useBonusFaixas();
  const salvar = useSalvarFaixa();
  const excluir = useExcluirFaixa();
  const [valor, setValor] = useState(0);
  const [bonus, setBonus] = useState(0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faixas de bônus por promissórias recebidas</CardTitle>
          <CardDescription>
            Ex.: recebeu R$ 2.000 → bônus de R$ 50. Vale a maior faixa atingida no período.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Recebimento mínimo (R$)</Label>
            <Input type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">Bônus (R$)</Label>
            <Input type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} />
          </div>
          <Button
            disabled={!valor || !bonus}
            onClick={() =>
              salvar.mutate(
                { valor_min_recebido: valor, bonus },
                {
                  onSuccess: () => {
                    setValor(0);
                    setBonus(0);
                  },
                }
              )
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar faixa
          </Button>
        </CardContent>
      </Card>

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">A partir de</th>
              <th className="p-2 text-right">Bônus</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {(faixas ?? []).map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-2">{brl(Number(f.valor_min_recebido))}</td>
                <td className="p-2 text-right">{brl(Number(f.bonus))}</td>
                <td className="p-2 text-right">
                  <Button size="icon" variant="ghost" onClick={() => excluir.mutate(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {(faixas ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-muted-foreground">
                  Nenhuma faixa cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FechamentosTab() {
  const { data } = useFechamentosComissao();
  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-2 text-left">Colaborador</th>
            <th className="p-2 text-left">Período</th>
            <th className="p-2 text-right">Vendido</th>
            <th className="p-2 text-right">Comissão</th>
            <th className="p-2 text-right">Bônus</th>
            <th className="p-2 text-right">Pago</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((f: any) => (
            <tr key={f.id} className="border-t">
              <td className="p-2">{f.colaborador_nome}</td>
              <td className="p-2">
                {new Date(`${f.periodo_inicio}T00:00:00`).toLocaleDateString("pt-BR")} —{" "}
                {new Date(`${f.periodo_fim}T00:00:00`).toLocaleDateString("pt-BR")}
              </td>
              <td className="p-2 text-right">{brl(Number(f.total_vendido))}</td>
              <td className="p-2 text-right">{brl(Number(f.total_comissao))}</td>
              <td className="p-2 text-right">{brl(Number(f.total_bonus))}</td>
              <td className="p-2 text-right font-medium">{brl(Number(f.total_pagar))}</td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-muted-foreground">
                Nenhum fechamento registrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
