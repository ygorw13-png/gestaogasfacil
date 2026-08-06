import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Order } from "../types";

const LIMIT_MS = 5 * 60 * 1000;

export function getLateOrders(orders: Order[], now: number) {
  return orders.filter(
    (o) => o.status === "pending" && now - o.createdAt.getTime() > LIMIT_MS
  );
}

export default function PendingAlert({ orders }: { orders: Order[] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const late = getLateOrders(orders, now);
  if (late.length === 0) return null;

  return (
    <Alert variant="destructive" className="animate-in">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {late.length} pedido{late.length > 1 ? "s" : ""} sem entregador há mais de 5 minutos
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
