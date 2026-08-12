import { useMemo, useState } from "react";
import { Plus, Trash2, Save, FileDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { brl, calcularLista, ChequeItem, dataBR } from "./utils/chequeCalc";
import { gerarPdfTrocaCheques } from "./utils/chequePdf";
import { useTrocasCheque } from "./hooks/useTrocasCheque";

const novoItem = (): ChequeItem => ({
  id: crypto.randomUUID(),
  valor: 0,
  nome: "",
  dataInicio: new Date().toISOString().slice(0, 10),
  dataFim: "",
});

const TrocaCheques = () => {
  const { trocas, isLoading, salvar, excluir } = useTrocasCheque();
  const [taxa, setTaxa] = useState(3);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ChequeItem[]>([novoItem()]);

  const { linhas, totalValor, totalJuros, totalLiquido } = useMemo(
    () => calcularLista(itens, taxa),
    [itens, taxa]
  );

  const update = (id: string, patch: Partial<ChequeItem>) =>
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const podeSalvar = linhas.some((l) => l.valor > 0 && l.nome.trim() && l.dias > 0);

  const handleSalvar = () =>
    salvar.mutate({
      data,
      descricao: descricao || null,
      taxa_juros_mensal: taxa,
      itens: linhas,
      total_valor: totalValor,
      total_juros: totalJuros,
      total_liquido: totalLiquido,
      observacoes: observacoes || null,
    });

  const totaisHistorico = useMemo(() => {
    const valor = trocas.reduce((s, t) => s + Number(t.total_valor || 0), 0);
    const juros = trocas.reduce((s, t) => s + Number(t.total_juros || 0), 0);
    const cheques = trocas.reduce((s, t) => s + (t.itens?.length || 0), 0);
    return { valor, juros, cheques, liquido: valor - juros };
  }, [trocas]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Troca de Cheques</h1>
        <p className="text-sm text-muted-foreground">
          Calcule juros e valor líquido dos cheques e guarde o histórico das operações.
        </p>
      </div>

      <Tabs defaultValue="nova">
        <TabsList>
          <TabsTrigger value="nova">Nova troca</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da operação</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Data da operação</Label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Taxa de juros mensal (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxa}
                  onChange={(e) => setTaxa(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Referência (opcional)</Label>
                <Input
                  value={descricao}
                  placeholder="Ex.: Cheques loja centro"
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Cheques</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setItens((p) => [...p, novoItem()])}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar cheque
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Valor</TableHead>
                    <TableHead className="min-w-[140px]">Nome</TableHead>
                    <TableHead className="min-w-[150px]">Data Inic</TableHead>
                    <TableHead className="min-w-[150px]">Data Fim</TableHead>
                    <TableHead className="text-center">Qtde Dias</TableHead>
                    <TableHead className="text-right">Juros</TableHead>
                    <TableHead className="text-right">Vlr Líq</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={l.valor || ""}
                          onChange={(e) => update(l.id, { valor: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={l.nome}
                          onChange={(e) => update(l.id, { nome: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={l.dataInicio}
                          onChange={(e) => update(l.id, { dataInicio: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={l.dataFim}
                          onChange={(e) => update(l.id, { dataFim: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium">{l.dias}</TableCell>
                      <TableCell className="text-right font-medium">{brl(l.juros)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {brl(l.liquido)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setItens((p) => p.filter((i) => i.id !== l.id))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>{brl(totalValor)}</TableCell>
                    <TableCell colSpan={4} />
                    <TableCell className="text-right">{brl(totalJuros)}</TableCell>
                    <TableCell className="text-right">{brl(totalLiquido)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-4 space-y-1">
                <Label>Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Anotações sobre esta troca"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={handleSalvar} disabled={!podeSalvar || salvar.isPending}>
                  <Save className="mr-1 h-4 w-4" />
                  {salvar.isPending ? "Salvando..." : "Salvar troca"}
                </Button>
                <Button
                  variant="outline"
                  disabled={!podeSalvar}
                  onClick={() =>
                    gerarPdfTrocaCheques({
                      linhas,
                      taxa,
                      data,
                      descricao,
                      totalValor,
                      totalJuros,
                      totalLiquido,
                    })
                  }
                >
                  <FileDown className="mr-1 h-4 w-4" /> Gerar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { label: "Total trocado", value: brl(totaisHistorico.valor) },
              { label: "Juros recebidos", value: brl(totaisHistorico.juros) },
              { label: "Líquido pago", value: brl(totaisHistorico.liquido) },
              { label: "Cheques", value: String(totaisHistorico.cheques) },
            ].map((c) => (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-bold">{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" /> Operações registradas
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : trocas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma troca registrada ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead className="text-center">Cheques</TableHead>
                      <TableHead className="text-center">Taxa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Juros</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trocas.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{dataBR(t.data)}</TableCell>
                        <TableCell>{t.descricao || "-"}</TableCell>
                        <TableCell className="text-center">{t.itens?.length || 0}</TableCell>
                        <TableCell className="text-center">{t.taxa_juros_mensal}%</TableCell>
                        <TableCell className="text-right">{brl(Number(t.total_valor))}</TableCell>
                        <TableCell className="text-right">{brl(Number(t.total_juros))}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {brl(Number(t.total_liquido))}
                        </TableCell>
                        <TableCell className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              gerarPdfTrocaCheques({
                                linhas: t.itens || [],
                                taxa: Number(t.taxa_juros_mensal),
                                data: t.data,
                                descricao: t.descricao || "",
                                totalValor: Number(t.total_valor),
                                totalJuros: Number(t.total_juros),
                                totalLiquido: Number(t.total_liquido),
                              })
                            }
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => excluir.mutate(t.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrocaCheques;
