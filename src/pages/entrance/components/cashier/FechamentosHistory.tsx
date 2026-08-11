import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, Search, X, AlertTriangle, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/formatUtils";
import { gerarPdfFechamento } from "../../utils/closingPdf";
import { useFechamentosCaixa, type FechamentoCaixa } from "../../hooks/useFechamentosCaixa";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("pt-BR");

export function FechamentosHistory() {
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<"all" | "partial" | "total">("all");
  const [somenteDivergencia, setSomenteDivergencia] = useState(false);
  const { toast } = useToast();

  const { data: fechamentos = [], isLoading } = useFechamentosCaixa({
    search,
    tipo,
    somenteDivergencia,
  });

  const baixarPdf = (f: FechamentoCaixa) => {
    if (!f.quantidades) return;
    gerarPdfFechamento({
      tipo: f.tipo,
      cashierData: f.quantidades,
      observacoes: f.observacoes || undefined,
      operador: f.fechado_por_nome || undefined,
      dataFechamento: f.data_fechamento,
      estoque: f.estoque_final || [],
    });
  };

  const reenviar = (f: FechamentoCaixa) => {
    const msg =
      `*Fechamento de caixa — Portaria*\n` +
      `Data: ${formatDate(f.data_fechamento)}\n` +
      `Tipo: ${f.tipo === "total" ? "Total" : "Parcial"}\n` +
      `Total de vendas: ${formatCurrency(f.total_vendas)}\n` +
      `Dinheiro: ${formatCurrency(f.total_dinheiro)}\n` +
      `PIX: ${formatCurrency(f.total_pix)}\n` +
      `Cartão: ${formatCurrency(f.total_cartao)}\n` +
      `Outros: ${formatCurrency(f.total_outros)}` +
      (f.tem_divergencia ? `\n⚠️ Fechamento com divergência de estoque` : "");
    navigator.clipboard?.writeText(msg);
    toast({
      title: "Resumo copiado",
      description: "Cole no WhatsApp ou e-mail para reenviar o fechamento.",
    });
  };

  const hasFilters = search !== "" || tipo !== "all" || somenteDivergencia;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            placeholder="Buscar por data"
          />
        </div>

        <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="total">Somente totais</SelectItem>
            <SelectItem value="partial">Somente parciais</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant={somenteDivergencia ? "default" : "outline"}
          onClick={() => setSomenteDivergencia((v) => !v)}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Divergências
        </Button>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setTipo("all");
              setSomenteDivergencia(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : fechamentos.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            {hasFilters
              ? "Nenhum fechamento encontrado com esses filtros"
              : "Nenhum fechamento de caixa registrado"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Dinheiro</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fechamentos.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(f.data_fechamento)}
                    {f.retroativo && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        retroativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={f.tipo === "total" ? "default" : "secondary"}>
                      {f.tipo === "total" ? "Total" : "Parcial"}
                    </Badge>
                    {f.tem_divergencia && (
                      <Badge variant="destructive" className="ml-2 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        divergência
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(f.total_vendas)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(f.total_dinheiro)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {f.fechado_por_nome || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => baixarPdf(f)}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => reenviar(f)}
                        title="Copiar resumo para reenviar"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
