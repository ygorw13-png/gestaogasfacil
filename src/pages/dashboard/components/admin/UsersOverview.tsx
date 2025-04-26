
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function UsersOverview() {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-base">Usuários Ativos</CardTitle>
        <CardDescription>Total de 24 usuários registrados no sistema</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Administradores</span>
            </div>
            <span className="text-sm font-medium">3</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Gerentes</span>
            </div>
            <span className="text-sm font-medium">8</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Operadores</span>
            </div>
            <span className="text-sm font-medium">13</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
