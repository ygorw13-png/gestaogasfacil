import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRotas } from "../hooks/useRotas";
import { getStatusColor, getStatusText } from "../utils/routeStatusUtils";
import { History } from "lucide-react";

export function RoutesHistory() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [search, setSearch] = useState("");

  const { rotas, loading } = useRotas({ from, to });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rotas.filter(r =>
      !q || r.motorista_nome.toLowerCase().includes(q) || r.destino.toLowerCase().includes(q)
    );
  }, [rotas, search]);

  const clear = () => { setFrom(monthAgo); setTo(today); setSearch(""); };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Histórico de Rotas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <Label>Data inicial</Label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <Label>Data final</Label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div>
          <Label>Buscar motorista / destino</Label>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." />
        </div>
        <Button variant="outline" onClick={clear}>Limpar filtros</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Clientes</TableHead>
              <TableHead>Saída</TableHead>
              <TableHead>Retorno</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma rota no período selecionado
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.data).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="font-medium">{r.motorista_nome}</TableCell>
                <TableCell>{r.destino}</TableCell>
                <TableCell>{r.clientes_count}</TableCell>
                <TableCell>{r.hora_saida || "-"}</TableCell>
                <TableCell>{r.hora_retorno || "-"}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(r.status)}>{getStatusText(r.status)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Total: {filtered.length} rota(s) encontrada(s)
      </p>
    </Card>
  );
}
