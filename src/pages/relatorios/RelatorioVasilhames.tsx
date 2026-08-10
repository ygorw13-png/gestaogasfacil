import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tipoVendaLabel, tipoVendaShort } from "@/lib/saleTypes";
import { exportToCsv } from "@/utils/csvExport";

const hoje = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export default function RelatorioVasilhames() {
  const [inicio, setInicio] = useState(diasAtras(7));
  const [fim, setFim] = useState(hoje());

  const { data, isLoading } = useQuery({
    queryKey: ["relatorio-vasilhames", inicio, fim],
    queryFn: async () => {
      const { data: vendas, error } = await supabase
        .from("orders")
        .select("id, created_at, delivered_at, client_name, product, quantity, price, payment_method, status, tipo_venda, vasilhames_entregues, vasilhames_recebidos, origem_venda")
        .gte("created_at", inicio + "T00:00:00")
        .lte("created_at", fim + "T23:59:59")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (vendas ?? []) as any[];
    },
  });

  const linhas = data ?? [];
  const totalVendas = linhas.reduce((s, r) => s + Number(r.price ?? 0), 0);
  const saidas = linhas.reduce((s, r) => s + Number(r.vasilhames_entregues ?? 0), 0);
  const entradas = linhas.reduce((s, r) => s + Number(r.vasilhames_recebidos ?? 0), 0);

  // Cada venda de gás (não vasilhame avulso) deve gerar um casco vazio de volta,
  // exceto quando o casco saiu como comodato/venda completa.
  const unidadesGas = linhas
    .filter((r) => (r.tipo_venda ?? "recarga") !== "vasilhame")
    .reduce((s, r) => s + Number(r.quantity ?? 0), 0);
  const esperadoVolta = unidadesGas - linhas
    .filter((r) => (r.tipo_venda ?? "recarga") === "completa")
    .reduce((s, r) => s + Number(r.quantity ?? 0), 0);
  const divergencia = entradas - esperadoVolta;

  const porTipo = ["recarga", "completa", "vasilhame"].map((t) => {
    const itens = linhas.filter((r) => (r.tipo_venda ?? "recarga") === t);
    return {
      tipo: t,
      qtd: itens.length,
      unidades: itens.reduce((s, r) => s + Number(r.quantity ?? 0), 0),
      valor: itens.reduce((s, r) => s + Number(r.price ?? 0), 0),
    };
  });

  const baixarCsv = () => {
    exportToCsv<any>(
      `relatorio-vasilhames-${inicio}_${fim}.csv`,
      [
        { header: "Data", accessor: (r) => new Date(r.created_at).toLocaleString("pt-BR") },
        { header: "Cliente", accessor: (r) => r.client_name },
        { header: "Tipo de venda", accessor: (r) => tipoVendaLabel(r.tipo_venda) },
        { header: "Produto", accessor: (r) => r.product ?? "" },
        { header: "Quantidade", accessor: (r) => r.quantity ?? 0 },
        { header: "Vasilhames saída", accessor: (r) => r.vasilhames_entregues ?? 0 },
        { header: "Vasilhames entrada", accessor: (r) => r.vasilhames_recebidos ?? 0 },
        { header: "Pagamento", accessor: (r) => r.payment_method ?? "" },
        { header: "Valor", accessor: (r) => Number(r.price ?? 0).toFixed(2) },
        { header: "Origem", accessor: (r) => r.origem_venda ?? "" },
        { header: "Status", accessor: (r) => r.status ?? "" },
      ],
      linhas
    );
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatório de Vasilhames e Vendas</h1>
          <p className="text-sm text-muted-foreground">Entrada e saída de cascos por tipo de venda</p>
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

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total vendido</p>
          <p className="text-2xl font-bold">R$ {totalVendas.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowUpCircle className="h-4 w-4" /> Vasilhames que saíram</p>
          <p className="text-2xl font-bold">{saidas}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowDownCircle className="h-4 w-4" /> Vasilhames que voltaram</p>
          <p className="text-2xl font-bold">{entradas}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Conferência de cascos</p>
            <p className="text-sm">
              {unidadesGas} vendas de gás · esperados {esperadoVolta} vasilhames de volta · recebidos {entradas}
            </p>
          </div>
          <Badge variant={divergencia === 0 ? "outline" : "destructive"}>
            {divergencia === 0 ? "Conferido" : `Divergência: ${divergencia > 0 ? "+" : ""}${divergencia}`}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por tipo de venda</CardTitle>
          <CardDescription>Período de {inicio} a {fim}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porTipo.map((t) => (
                <TableRow key={t.tipo}>
                  <TableCell>{tipoVendaLabel(t.tipo)}</TableCell>
                  <TableCell className="text-right">{t.qtd}</TableCell>
                  <TableCell className="text-right">{t.unidades}</TableCell>
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
            <p className="py-6 text-center text-muted-foreground">Nenhuma venda no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
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
                    <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{r.client_name}</TableCell>
                    <TableCell><Badge variant="outline">{tipoVendaShort(r.tipo_venda)}</Badge></TableCell>
                    <TableCell>{r.product} ({r.quantity})</TableCell>
                    <TableCell className="text-right">{r.vasilhames_entregues ?? 0}</TableCell>
                    <TableCell className="text-right">{r.vasilhames_recebidos ?? 0}</TableCell>
                    <TableCell>{r.payment_method}</TableCell>
                    <TableCell className="text-right">R$ {Number(r.price ?? 0).toFixed(2)}</TableCell>
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
