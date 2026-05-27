import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockRoutes } from "../data/mockRoutes";
import { getStatusColor, getStatusText } from "../utils/routeStatusUtils";
import { History } from "lucide-react";

export function RoutesHistory() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [search, setSearch] = useState("");

  const routes = useMemo(() => {
    return mockRoutes.filter(r => {
      const dateOk = r.date >= from && r.date <= to;
      const q = search.toLowerCase();
      const textOk = !q ||
        r.driverName.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q);
      return dateOk && textOk;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [from, to, search]);

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
            {routes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma rota no período selecionado
                </TableCell>
              </TableRow>
            ) : routes.map(r => (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.date).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="font-medium">{r.driverName}</TableCell>
                <TableCell>{r.destination}</TableCell>
                <TableCell>{r.clientsCount}</TableCell>
                <TableCell>{r.departureTime || "-"}</TableCell>
                <TableCell>{r.returnTime || "-"}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(r.status)}>{getStatusText(r.status)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Total: {routes.length} rota(s) encontrada(s)
      </p>
    </Card>
  );
}
