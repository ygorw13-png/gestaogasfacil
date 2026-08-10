import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowDownCircle, ArrowUpCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { paymentLabelFromCode } from "@/pages/entrance/hooks/useVendasHoje";
import { exportToCsv } from "@/utils/csvExport";

const hoje = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

type Linha = {
  id: string;
  data: string;
  parceiro: string;
  movimento: "venda_vasilhame" | "gas_completo" | "emprestimo" | "devolucao";
  produto: string;
  saida: number;
  entrada: number;
  pagamento: string;
  valor: number;
};

const MOV_LABEL: Record<Linha["movimento"], string> = {
  venda_vasilhame: "Venda de vasilhame",
  gas_completo: "Gás completo (casco saiu)",
  emprestimo: "Empréstimo / comodato",
  devolucao: "Devolução de vasilhame",
};

export default function RelatorioVasilhames() {
  const [inicio, setInicio] = useState(diasAtras(7));
  const [fim, setFim] = useState(hoje());

  const { data, isLoading } = useQuery({
    queryKey: ["relatorio-vasilhames", inicio, fim],
    queryFn: async (): Promise<Linha[]> => {
      const { data: vendas, error } = await supabase
        .from("orders")
        .select(
          "id, created_at, client_name, product, quantity, price, payment_method, status, tipo_venda, vasilhames_entregues, vasilhames_recebidos, has_empty_cylinder",
        )
        .gte("created_at", inicio + "T00:00:00")
        .lte("created_at", fim + "T23:59:59")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: movs, error: movErr } = await (supabase as any)
        .from("movimentacoes_portaria")
        .select("*")
        .gte("data_operacao", inicio)
        .lte("data_operacao", fim)
        .order("criado_em", { ascending: false });
      if (movErr) throw movErr;

      const linhasVendas: Linha[] = (vendas ?? [])
        // Vendas canceladas não entram no relatório
        .filter((r: any) => (r.status ?? "").toLowerCase() !== "cancelled" && (r.status ?? "") !== "cancelado")
        // Troca normal (cliente traz o casco) não é movimentação de vasilhame
        .filter((r: any) => (r.tipo_venda ?? "recarga") !== "recarga")
        .map((r: any) => ({
          id: r.id,
          data: r.created_at,
          parceiro: r.client_name ?? "-",
          movimento: (r.tipo_venda === "vasilhame" ? "venda_vasilhame" : "gas_completo") as Linha["movimento"],
          produto: r.product ?? "",
          saida: Number(r.vasilhames_entregues ?? r.quantity ?? 0),
          entrada: Number(r.vasilhames_recebidos ?? 0),
          pagamento: paymentLabelFromCode(r.payment_method),
          valor: Number(r.price ?? 0),
        }));

      const linhasMovs: Linha[] = (movs ?? [])
        .filter((m: any) => m.tipo === "devolucao_vasilhame" || Number(m.delta_emprestados ?? 0) !== 0)
        .map((m: any) => ({
          id: m.id,
          data: m.criado_em,
          parceiro: m.cliente_nome ?? "Portaria",
          movimento: (m.tipo === "devolucao_vasilhame" ? "devolucao" : "emprestimo") as Linha["movimento"],
          produto: m.produto ?? "",
          saida: Math.max(0, Number(m.delta_emprestados ?? 0)),
          entrada: Math.max(0, Number(m.delta_vazios ?? 0)),
          pagamento: "-",
          valor: 0,
        }));

      return [...linhasVendas, ...linhasMovs].sort((a, b) => (a.data < b.data ? 1 : -1));
    },
  });

  const linhas = data ?? [];
  const saidas = linhas.reduce((s, r) => s + r.saida, 0);
  const entradas = linhas.reduce((s, r) => s + r.entrada, 0);
  const totalVendas = linhas.reduce((s, r) => s + r.valor, 0);
  const saldo = entradas - saidas;

  const porMovimento = (Object.keys(MOV_LABEL) as Linha["movimento"][]).map((m) => {
    const itens = linhas.filter((r) => r.movimento === m);
    return {
      movimento: m,
      qtd: itens.length,
      saida: itens.reduce((s, r) => s + r.saida, 0),
      entrada: itens.reduce((s, r) => s + r.entrada, 0),
      valor: itens.reduce((s, r) => s + r.valor, 0),
    };
  });

  const baixarCsv = () => {
    exportToCsv<Linha>(
      `relatorio-vasilhames-${inicio}_${fim}.csv`,
      [
        { header: "Data", accessor: (r) => new Date(r.data).toLocaleString("pt-BR") },
        { header: "Cliente/Parceiro", accessor: (r) => r.parceiro },
        { header: "Movimento", accessor: (r) => MOV_LABEL[r.movimento] },
        { header: "Produto", accessor: (r) => r.produto },
        { header: "Cascos saída", accessor: (r) => r.saida },
        { header: "Cascos entrada", accessor: (r) => r.entrada },
        { header: "Pagamento", accessor: (r) => r.pagamento },
        { header: "Valor", accessor: (r) => r.valor.toFixed(2) },
      ],
      linhas,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatório de Vasilhames</h1>
          <p className="text-sm text-muted-foreground">
            Somente movimentações de casco: vendas de vasilhame, gás completo, empréstimos e devoluções
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor="inicio" className="text-xs">De</Label>
            <Input id="inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fim" className="text-xs">Até</Label>
            <Input id="fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
          <Button variant="outline" onClick={baixarCsv} disabled={!linhas.length}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            A venda comum (cliente leva o cheio e deixa o casco vazio) <strong>não aparece aqui</strong>, pois não muda a
            quantidade de vasilhames da empresa. Só entram os casos em que um casco sai (venda de vasilhame, gás completo,
            empréstimo) ou volta (devolução). Vendas canceladas são desconsideradas.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowUpCircle className="h-4 w-4" /> Cascos que saíram</p>
          <p className="text-2xl font-bold">{saidas}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowDownCircle className="h-4 w-4" /> Cascos que voltaram</p>
          <p className="text-2xl font-bold">{entradas}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Saldo de cascos no período</p>
          <p className={`text-2xl font-bold ${saldo < 0 ? "text-destructive" : ""}`}>{saldo > 0 ? "+" : ""}{saldo}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Valor das movimentações</p>
          <p className="text-2xl font-bold">R$ {totalVendas.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por tipo de movimentação</CardTitle>
          <CardDescription>Período de {inicio} a {fim}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Movimento</TableHead>
                <TableHead className="text-right">Registros</TableHead>
                <TableHead className="text-right">Cascos saída</TableHead>
                <TableHead className="text-right">Cascos entrada</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porMovimento.map((t) => (
                <TableRow key={t.movimento}>
                  <TableCell>{MOV_LABEL[t.movimento]}</TableCell>
                  <TableCell className="text-right">{t.qtd}</TableCell>
                  <TableCell className="text-right">{t.saida}</TableCell>
                  <TableCell className="text-right">{t.entrada}</TableCell>
                  <TableCell className="text-right">R$ {t.valor.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico detalhado</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="py-6 text-center text-muted-foreground">Carregando...</p>
          ) : linhas.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">Nenhuma movimentação de vasilhame no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente/Parceiro</TableHead>
                  <TableHead>Movimento</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Saída</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{new Date(r.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{r.parceiro}</TableCell>
                    <TableCell><Badge variant="outline">{MOV_LABEL[r.movimento]}</Badge></TableCell>
                    <TableCell>{r.produto}</TableCell>
                    <TableCell className="text-right">{r.saida}</TableCell>
                    <TableCell className="text-right">{r.entrada}</TableCell>
                    <TableCell>{r.pagamento}</TableCell>
                    <TableCell className="text-right">R$ {r.valor.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
