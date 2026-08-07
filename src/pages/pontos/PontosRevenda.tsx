import { useState } from "react";
import { Plus, MapPin, Phone, AlertTriangle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { usePontosRevenda, useAlertasPontos, type PontoRevenda } from "@/hooks/usePontosRevenda";
import { PontoFormDialog } from "./components/PontoFormDialog";
import { PontoDetailsDialog } from "./components/PontoDetailsDialog";

const urgenciaBadge = {
  urgente: { label: "Repor agora", className: "bg-destructive text-destructive-foreground" },
  atencao: { label: "Acabando", className: "bg-amber-500 text-white" },
  ok: { label: "Abastecido", className: "bg-emerald-600 text-white" },
} as const;

export default function PontosRevenda() {
  const { isLoading } = usePontosRevenda();
  const { alertas } = useAlertasPontos();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PontoRevenda | null>(null);
  const [selected, setSelected] = useState<PontoRevenda | null>(null);
  const [busca, setBusca] = useState("");

  const filtrados = alertas.filter(
    (a) =>
      a.ponto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (a.ponto.povoado ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  const totalDevido = alertas.reduce((s, a) => s + a.botijoesDevidos, 0);
  const totalEmprestados = alertas.reduce((s, a) => s + a.ponto.vasilhames_emprestados, 0);
  const precisamRota = alertas.filter((a) => a.urgencia !== "ok").length;

  return (
    <div className="space-y-6 animate-in pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pontos de Revenda</h1>
          <p className="text-sm text-muted-foreground">
            Pontos na zona rural e povoados, com saldo de botijões e previsão de reposição.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo ponto
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Botijões em aberto</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalDevido}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Vasilhames emprestados</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalEmprestados}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Precisam de rota</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-amber-600">{precisamRota}</CardContent>
        </Card>
      </div>

      <Input
        placeholder="Buscar por nome ou povoado..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Store className="h-8 w-8" />
            <p>Nenhum ponto de revenda cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((a) => {
            const badge = urgenciaBadge[a.urgencia];
            return (
              <Card
                key={a.ponto.id}
                className="cursor-pointer transition hover:shadow-md"
                onClick={() => setSelected(a.ponto)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{a.ponto.nome}</CardTitle>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {a.ponto.povoado && (
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {a.ponto.povoado}
                    </p>
                  )}
                  {a.ponto.telefone && (
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {a.ponto.telefone}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Em aberto</p>
                      <p className="font-semibold">{a.botijoesDevidos} botijões</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Emprestados</p>
                      <p className="font-semibold">{a.ponto.vasilhames_emprestados}</p>
                    </div>
                  </div>
                  <p className="pt-1 text-xs text-muted-foreground">
                    {a.diasSemEntrega === null
                      ? "Sem entregas registradas"
                      : `Última entrega há ${a.diasSemEntrega} dia(s)`}
                    {a.diasEstimadosRestantes !== null &&
                      ` · estimativa: ${
                        a.diasEstimadosRestantes <= 0
                          ? "já acabou"
                          : `${a.diasEstimadosRestantes} dia(s)`
                      }`}
                  </p>
                  {a.urgencia !== "ok" && (
                    <p className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <AlertTriangle className="h-3 w-3" /> Incluir na próxima rota
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PontoFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        ponto={editing}
      />
      <PontoDetailsDialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        ponto={selected}
      />
    </div>
  );
}
