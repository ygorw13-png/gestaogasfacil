
import { Badge } from "@/components/ui/badge";
import { Clock, Check, X, Truck, Clipboard } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="flex items-center gap-1"><Clock size={12} /> Pendente</Badge>;
    case "assigned":
      return <Badge variant="secondary" className="flex items-center gap-1"><Clipboard size={12} /> Atribuído</Badge>;
    case "delivering":
    case "in-progress":
      return <Badge variant="default" className="bg-amber-500 flex items-center gap-1"><Truck size={12} /> Aceita — em entrega</Badge>;
    case "delivered":
    case "completed":
      return <Badge variant="default" className="bg-green-600 flex items-center gap-1"><Check size={12} /> Entregue</Badge>;

    case "cancelled":
      return <Badge variant="destructive" className="flex items-center gap-1"><X size={12} /> Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
