import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Clipboard, Clock, Truck, X, Undo2 } from "lucide-react";
import { estadoEntrega, ROTULO_ESTADO, type DadosEntrega } from "@/lib/entregas";

/** Estado real da entrega (aguardando atribuição / aceite, recusada, em rota, entregue, cancelada, revisão). */
export function EstadoEntregaBadge({ entrega }: { entrega: DadosEntrega }) {
  const e = estadoEntrega(entrega);
  const r = ROTULO_ESTADO[e];
  switch (e) {
    case "aguardando_atribuicao": return <Badge variant="outline" className="gap-1"><Clock size={12} /> {r}</Badge>;
    case "recusada": return <Badge variant="outline" className="gap-1 border-destructive text-destructive"><Undo2 size={12} /> {r}</Badge>;
    case "aguardando_aceite": return <Badge variant="outline" className="gap-1 border-primary text-primary"><Clipboard size={12} /> {r}</Badge>;
    case "em_rota": return <Badge className="gap-1"><Truck size={12} /> {r}</Badge>;
    case "entregue": return <Badge variant="secondary" className="gap-1"><Check size={12} /> {r}</Badge>;
    case "cancelada": return <Badge variant="destructive" className="gap-1"><X size={12} /> {r}</Badge>;
    default: return <Badge variant="destructive" className="gap-1"><AlertTriangle size={12} /> {r}</Badge>;
  }
}
