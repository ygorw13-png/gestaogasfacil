
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AdminSection() {
  return (
    <Card className="border-gasflow-200 bg-gasflow-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-gasflow-700" />
          <CardTitle className="text-gasflow-700">Área de Administração</CardTitle>
        </div>
        <CardDescription>
          Esta seção só é visível para usuários com permissão de Administrador
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Aqui você tem acesso a informações administrativas e relatórios avançados.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Faturamento Total</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">R$ 42.580,00</div>
              <p className="text-xs text-muted-foreground">Último mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Média de Vendas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">R$ 1.580,00</div>
              <p className="text-xs text-muted-foreground">Por dia</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">+2% desde semana passada</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
