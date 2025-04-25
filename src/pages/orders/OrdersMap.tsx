import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "./types";
import { MapPin } from "lucide-react";

interface OrdersMapProps {
  orders: Order[];
}

export default function OrdersMap({ orders }: OrdersMapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Entregas</CardTitle>
        <CardDescription>
          Visualização das entregas no mapa (implementação futura)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full border rounded-md bg-muted flex items-center justify-center">
          <div className="text-center">
            <MapPin size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Mapa de entregas</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A visualização em mapa será implementada em uma versão futura.
              Este recurso permitirá acompanhar em tempo real a localização dos entregadores e otimizar as rotas de entrega.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
