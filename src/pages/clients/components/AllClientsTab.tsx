
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Client } from "../hooks/useClients";

interface AllClientsTabProps {
  filteredClients: Client[];
  onAddCylinders: (client: Client) => void;
  onReturnCylinders: (clientId: string) => void;
  onViewClientDetails: (client: Client) => void;
}

export function AllClientsTab({
  filteredClients,
  onAddCylinders,
  onReturnCylinders,
  onViewClientDetails
}: AllClientsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Clientes</CardTitle>
        <CardDescription>
          Gerencie seus clientes e controle os vasilhames em comodato
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Vasilhames</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => onViewClientDetails(client)}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{client.address}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{client.cylinderCount}</span>
                      {client.cylinderCount >= 3 && (
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full" 
                              title="Este cliente está com muitos vasilhames" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddCylinders(client);
                        }} 
                        variant="outline" 
                        size="sm"
                      >
                        Adicionar
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onReturnCylinders(client.id);
                        }}
                        variant="outline"
                        size="sm"
                        disabled={client.cylinderCount === 0}
                      >
                        Devolver
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
