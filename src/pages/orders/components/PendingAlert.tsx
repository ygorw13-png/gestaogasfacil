import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Order } from "../types";
import { playDeliveryAlert } from "@/utils/deliveryAlert";

const WARN_MS = 5 * 60 * 1000;
const CRITICAL_MS = 10 * 60 * 1000;

export function getLateOrders(orders: Order[], now: number) {
  return orders.filter(
    (o) => o.status === "pending" && now - o.createdAt.getTime() > WARN_MS
  );
}

export function getCriticalOrders(orders: Order[], now: number) {
  return orders.filter(
    (o) => o.status === "pending" && now - o.createdAt.getTime() > CRITICAL_MS
  );
}

export default function PendingAlert({ orders }: { orders: Order[] }) {
  const [now, setNow] = useState(() => Date.now());
  const alertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const late = getLateOrders(orders, now);
  const critical = getCriticalOrders(orders, now);

  // Alerta sonoro quando um pedido novo entra na lista de atrasados
  useEffect(() => {
    const fresh = late.filter((o) => !alertedRef.current.has(o.id));
    if (fresh.length > 0) {
      fresh.forEach((o) => alertedRef.current.add(o.id));
      playDeliveryAlert();
    }
    // limpa ids que já não estão atrasados
    const ids = new Set(late.map((o) => o.id));
    alertedRef.current.forEach((id) => {
      if (!ids.has(id)) alertedRef.current.delete(id);
    });
  }, [late]);

  if (late.length === 0) return null;

  const isCritical = critical.length > 0;

  return (
    <Alert
      variant={isCritical ? "destructive" : "default"}
      className={
        isCritical
          ? "animate-in"
          : "animate-in border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 [&>svg]:text-amber-600"
      }
    >
      {isCritical ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      <AlertTitle>
        {isCritical
          ? `${critical.length} pedido${critical.length > 1 ? "s" : ""} crítico${
              critical.length > 1 ? "s" : ""
            } (+10 min sem entregador)`
          : `${late.length} pedido${late.length > 1 ? "s" : ""} sem entregador há mais de 5 minutos`}
      </AlertTitle>
      <AlertDescription>
        {late
          .slice(0, 3)
          .map(
            (o) =>
              `${o.clientName} (${Math.floor((now - o.createdAt.getTime()) / 60000)} min)`
          )
          .join(" • ")}
        {late.length > 3 && ` • +${late.length - 3}`}
      </AlertDescription>
    </Alert>
  );
}
