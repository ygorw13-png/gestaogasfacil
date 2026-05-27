import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMovimentacoesPortaria,
  produtoLabel,
  tipoLabel,
} from "../../hooks/usePortariaStock";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function MovementsHistory({ open, onOpenChange }: Props) {
  const { data, isLoading } = useMovimentacoesPortaria();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Histórico de movimentações</SheetTitle>
          <SheetDescription>
            Todas as movimentações registradas hoje na portaria.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-4">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && (!data || data.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma movimentação registrada hoje.
            </p>
          )}
          <div className="space-y-2">
            {data?.map((m) => {
              const isPos = (n: number) => n > 0;
              return (
                <div
                  key={m.id}
                  className="border rounded-lg p-3 text-sm bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{tipoLabel(m.tipo)}</Badge>
                      <span className="font-medium">{produtoLabel(m.produto)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(m.criado_em), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex gap-3 text-xs flex-wrap">
                    {m.delta_cheios !== 0 && (
                      <span className={isPos(m.delta_cheios) ? "text-green-600" : "text-red-600"}>
                        {isPos(m.delta_cheios) ? "+" : ""}
                        {m.delta_cheios} cheios
                      </span>
                    )}
                    {m.delta_vazios !== 0 && (
                      <span className={isPos(m.delta_vazios) ? "text-green-600" : "text-red-600"}>
                        {isPos(m.delta_vazios) ? "+" : ""}
                        {m.delta_vazios} vazios
                      </span>
                    )}
                    {m.delta_emprestados !== 0 && (
                      <span className={isPos(m.delta_emprestados) ? "text-amber-600" : "text-green-600"}>
                        {isPos(m.delta_emprestados) ? "+" : ""}
                        {m.delta_emprestados} emprestados
                      </span>
                    )}
                  </div>

                  {(m.cliente_nome || m.registrado_por_nome || m.observacoes) && (
                    <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                      {m.cliente_nome && <div>Cliente: {m.cliente_nome}</div>}
                      {m.registrado_por_nome && <div>Por: {m.registrado_por_nome}</div>}
                      {m.observacoes && <div className="italic">"{m.observacoes}"</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
