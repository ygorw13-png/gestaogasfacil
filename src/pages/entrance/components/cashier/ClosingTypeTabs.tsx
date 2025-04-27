
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CalendarClock, Calendar, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClosingTypeTabsProps {
  type: "partial" | "total";
  setType: (type: "partial" | "total") => void;
  partialCount: number;
}

export function ClosingTypeTabs({ type, setType, partialCount }: ClosingTypeTabsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Tipo de Fechamento</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={16} className="text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>Fechamento Parcial: Mantém o caixa aberto para continuar as vendas do dia.</p>
              <p>Fechamento Total: Encerra o caixa do dia por completo.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Tabs value={type} onValueChange={(value) => setType(value as "partial" | "total")} className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="partial" className="flex items-center gap-2">
            <Clock size={16} />
            <span>Parcial</span>
            {partialCount > 0 && (
              <span className="ml-1 bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs">
                {partialCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="total" className="flex items-center gap-2">
            <CalendarClock size={16} />
            <span>Total do Dia</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="text-sm text-muted-foreground mt-1">
        {type === "partial" ? (
          <p>O fechamento parcial permite contabilizar as vendas realizadas até o momento, mantendo o caixa aberto para novas vendas.</p>
        ) : (
          <p>O fechamento total encerra as atividades do dia, zera o caixa e transfere o saldo restante para o próximo dia.</p>
        )}
      </div>
    </div>
  );
}
