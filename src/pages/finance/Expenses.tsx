
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Expenses() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Controle de Despesas</CardTitle>
          <CardDescription>
            Gerencie despesas fixas e variáveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade está em desenvolvimento. Em breve você poderá registrar e controlar despesas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
