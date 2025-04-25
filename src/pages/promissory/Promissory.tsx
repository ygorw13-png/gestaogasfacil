
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Promissory() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Promissórias</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Promissórias</CardTitle>
          <CardDescription>
            Gerencie as promissórias e pagamentos pendentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade está em desenvolvimento. Em breve você poderá gerenciar promissórias.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
