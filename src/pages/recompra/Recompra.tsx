import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageCircle, Phone, Cake, AlertCircle, CheckCircle2, Clock, UserPlus, Send, SkipForward } from "lucide-react";
import { useRecompraInsights, ClienteInsight } from "./hooks/useRecompraInsights";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { msgRecompra, resumoUltimoPedido, normalizePhone } from "@/utils/whatsappLinks";
import { useEnviarWhatsApp } from "@/hooks/useEnviarWhatsApp";


const statusConfig = {
  em_dia:       { label: "Em dia",         className: "bg-green-100 text-green-800",   icon: CheckCircle2 },
  hora_comprar: { label: "Hora de comprar", className: "bg-yellow-100 text-yellow-900", icon: Clock },
  atrasado:     { label: "Atrasado",        className: "bg-red-100 text-red-800",       icon: AlertCircle },
  novo:         { label: "Novo cliente",    className: "bg-gray-100 text-gray-700",     icon: UserPlus },
};

type TipoContato = "pre" | "atrasado" | "pos" | "aniversario";

function tipoParaCliente(i: ClienteInsight): TipoContato {
  if (i.aniversario_hoje) return "aniversario";
  if (i.dias_desde_ultima != null && i.dias_desde_ultima <= 3) return "pos";
  if (i.status === "atrasado") return "atrasado";
  return "pre";
}

function mensagemPara(i: ClienteInsight, tipo: TipoContato) {
  return msgRecompra({
    clientName: i.cliente_nome,
    tipo,
    diasDesdeUltima: i.dias_desde_ultima,
    mediaDias: i.media_dias,
    ultimoPedido: i.ultimo_pedido,
  });
}

export default function Recompra() {
  const { insights, loading } = useRecompraInsights();
  const { enviar, enviarLote, enviando } = useEnviarWhatsApp();
  const [status, setStatus] = useState<string>("all");

  const [search, setSearch] = useState("");
  const [fila, setFila] = useState<ClienteInsight[]>([]);
  const [filaIndex, setFilaIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return insights.filter(i => {
      const statusOk = status === "all" || i.status === status;
      const textOk = !q || i.cliente_nome.toLowerCase().includes(q)
        || (i.cliente_phone || "").includes(q);
      return statusOk && textOk;
    });
  }, [insights, status, search]);

  const counts = useMemo(() => {
    return insights.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [insights]);

  const aniversariantes = useMemo(() => insights.filter(i => i.aniversario_hoje), [insights]);

  // Clientes elegíveis para lembrete de recompra (atrasado ou na hora, com telefone válido)
  const elegiveis = useMemo(
    () => filtered.filter(i =>
      (i.status === "atrasado" || i.status === "hora_comprar") && !!normalizePhone(i.cliente_phone)
    ),
    [filtered]
  );

  const registrarContato = async (ins: ClienteInsight, tipo: TipoContato, canal: "whatsapp" | "ligacao") => {
    const { error } = await supabase.from("contatos_recompra").insert({
      cliente_id: ins.cliente_id,
      cliente_nome: ins.cliente_nome,
      tipo: tipo === "atrasado" ? "pre" : tipo,
      canal,
      observacao: resumoUltimoPedido(ins.ultimo_pedido) ?? undefined,
    });
    if (error) toast.error("Erro ao registrar: " + error.message);
  };

  const handleWhats = async (ins: ClienteInsight, tipo: TipoContato) => {
    if (!normalizePhone(ins.cliente_phone)) { toast.error("Cliente sem telefone válido"); return; }
    await enviar({
      telefone: ins.cliente_phone,
      mensagem: mensagemPara(ins, tipo),
      nome: ins.cliente_nome,
      tipo: `recompra_${tipo}`,
      referencia_id: ins.cliente_id,
    });
    registrarContato(ins, tipo, "whatsapp");
  };

  /** Dispara todas as mensagens de uma vez pelo backend. */
  const dispararTodos = async () => {
    if (elegiveis.length === 0) { toast.error("Nenhum cliente elegível no filtro atual"); return; }
    const lista = elegiveis.map(ins => {
      const tipo = tipoParaCliente(ins);
      return {
        telefone: ins.cliente_phone,
        mensagem: mensagemPara(ins, tipo),
        nome: ins.cliente_nome,
        tipo: `recompra_${tipo}`,
        referencia_id: ins.cliente_id,
      };
    });
    const res = await enviarLote(lista);
    if (res?.enviados > 0) {
      await Promise.all(elegiveis.map(ins => registrarContato(ins, tipoParaCliente(ins), "whatsapp")));
    }
  };

  const iniciarDisparos = () => {
    if (elegiveis.length === 0) { toast.error("Nenhum cliente elegível no filtro atual"); return; }
    setFila(elegiveis);
    setFilaIndex(0);
    handleWhats(elegiveis[0], tipoParaCliente(elegiveis[0]));
  };


  const proximoDisparo = () => {
    const next = filaIndex + 1;
    if (next >= fila.length) {
      setFila([]); setFilaIndex(0);
      toast.success("Fila de disparos concluída");
      return;
    }
    setFilaIndex(next);
    handleWhats(fila[next], tipoParaCliente(fila[next]));
  };

  const atual = fila[filaIndex];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recompra</h1>
        <p className="text-muted-foreground">CRM inteligente: lembretes de recompra no WhatsApp com sugestão de repetir o último pedido</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["atrasado", "hora_comprar", "em_dia", "novo"] as const).map(s => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <Card key={s} className="cursor-pointer hover:shadow-md transition" onClick={() => setStatus(s)}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{counts[s] || 0}</div>
                  <div className="text-xs text-muted-foreground">{cfg.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disparos em lote */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="text-sm">
            <div className="font-medium">Disparo de lembretes</div>
            <div className="text-muted-foreground">
              {elegiveis.length} cliente(s) com telefone válido prontos para receber lembrete de recompra
              {atual ? ` — enviando ${filaIndex + 1} de ${fila.length}: ${atual.cliente_nome}` : ""}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={iniciarDisparos} disabled={elegiveis.length === 0}>
              <Send className="h-4 w-4 mr-2" /> Iniciar disparos ({elegiveis.length})
            </Button>
            {fila.length > 0 && (
              <Button variant="outline" onClick={proximoDisparo}>
                <SkipForward className="h-4 w-4 mr-2" /> Próximo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Birthday alert */}
      {aniversariantes.length > 0 && (
        <Card className="border-pink-300 bg-pink-50">
          <CardHeader>
            <CardTitle className="text-pink-800 flex items-center gap-2 text-base">
              <Cake className="h-5 w-5" /> Aniversariantes de hoje ({aniversariantes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {aniversariantes.map(a => (
              <Button key={a.cliente_id} size="sm" variant="outline" onClick={() => handleWhats(a, "aniversario")}>
                <MessageCircle className="h-4 w-4 mr-1" /> {a.cliente_nome}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="hora_comprar">Hora de comprar</SelectItem>
              <SelectItem value="em_dia">Em dia</SelectItem>
              <SelectItem value="novo">Novo cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Buscar</Label>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome ou telefone..." />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Último pedido</TableHead>
                <TableHead>Média</TableHead>
                <TableHead>Atraso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              ) : filtered.map(i => {
                const cfg = statusConfig[i.status];
                const atrasoDias = i.media_dias && i.dias_desde_ultima
                  ? Math.max(0, i.dias_desde_ultima - i.media_dias) : 0;
                const tipo = tipoParaCliente(i);
                const resumo = resumoUltimoPedido(i.ultimo_pedido);
                const labelBtn = tipo === "pos" ? "Pós-venda" : tipo === "aniversario" ? "Parabenizar" : "Lembrete";
                return (
                  <TableRow key={i.cliente_id}>
                    <TableCell>
                      <div className="font-medium">{i.cliente_nome}</div>
                      <div className="text-xs text-muted-foreground">{i.cliente_phone || "sem telefone"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{resumo || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {i.ultima_compra ? new Date(i.ultima_compra).toLocaleDateString("pt-BR") : "sem compras"}
                      </div>
                    </TableCell>
                    <TableCell>{i.media_dias ? `${i.media_dias} dias` : "—"}</TableCell>
                    <TableCell>
                      {atrasoDias > 0 ? <Badge variant="destructive">+{atrasoDias}d</Badge> : "—"}
                    </TableCell>
                    <TableCell><Badge className={cfg.className}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" disabled={!normalizePhone(i.cliente_phone)}
                        onClick={() => handleWhats(i, tipo)}>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {labelBtn}
                      </Button>
                      {i.cliente_phone && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`tel:+55${i.cliente_phone.replace(/\D/g, "")}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
