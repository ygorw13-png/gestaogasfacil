
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Clients() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Clientes</CardTitle>
          <CardDescription>
            Gerencie seus clientes, agregados e conveniados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade está em desenvolvimento. Em breve você poderá cadastrar e gerenciar clientes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
