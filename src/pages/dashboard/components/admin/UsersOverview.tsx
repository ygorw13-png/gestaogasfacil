
import { Users, User, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export function UsersOverview() {
  return (
    <Card className="border-purple-100">
      <CardHeader className="p-4 bg-purple-50/50">
        <CardTitle className="text-base">Usuários Ativos</CardTitle>
        <CardDescription>Total de 24 usuários registrados no sistema</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-white rounded-lg hover:bg-purple-50 transition-colors">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-red-500" />
              <span>Administradores</span>
            </div>
            <span className="text-sm font-medium">3</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg hover:bg-purple-50 transition-colors">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span>Gerentes</span>
            </div>
            <span className="text-sm font-medium">8</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg hover:bg-purple-50 transition-colors">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span>Operadores</span>
            </div>
            <span className="text-sm font-medium">13</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <button className="text-sm text-purple-500 hover:text-purple-700 transition-colors">
          Gerenciar usuários
        </button>
      </CardFooter>
    </Card>
  );
}
