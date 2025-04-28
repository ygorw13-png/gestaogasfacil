
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CylinderLoanFormData, Client } from "./types";

interface CylinderLoanFormProps {
  clients: Client[];
  loading: boolean;
  onSubmit: (data: CylinderLoanFormData) => Promise<void>;
}

export function CylinderLoanForm({ clients, loading, onSubmit }: CylinderLoanFormProps) {
  const [clientId, setClientId] = useState("");
  const [tipoCliente, setTipoCliente] = useState<"cliente" | "agregado">("cliente");
  const [tipoVasilhame, setTipoVasilhame] = useState<"P13" | "P20" | "P45" | "agua">("P13");
  const [quantidade, setQuantidade] = useState(1);

  const handleSubmit = async () => {
    if (!clientId) return;
    await onSubmit({ clientId, tipoCliente, tipoVasilhame, quantidade });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Empréstimo de Vasilhame</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Cliente</label>
            <Select 
              value={tipoCliente} 
              onValueChange={(val: "cliente" | "agregado") => setTipoCliente(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente Final</SelectItem>
                <SelectItem value="agregado">Agregado/Revenda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Vasilhame</label>
            <Select 
              value={tipoVasilhame} 
              onValueChange={(val: "P13" | "P20" | "P45" | "agua") => setTipoVasilhame(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Vasilhame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="P13">GLP P13</SelectItem>
                <SelectItem value="P20">GLP P20</SelectItem>
                <SelectItem value="P45">GLP P45</SelectItem>
                <SelectItem value="agua">Água 20L</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quantidade</label>
            <Input 
              type="number" 
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
              min={1}
            />
          </div>
        </div>

        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Registrando..." : "Registrar Empréstimo"}
        </Button>
      </CardContent>
    </Card>
  );
}
