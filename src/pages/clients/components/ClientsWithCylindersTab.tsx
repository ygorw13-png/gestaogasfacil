
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Client } from "../hooks/useClients";

interface ClientsWithCylindersTabProps {
  filteredClients: Client[];
  onReturnCylinders: (clientId: string) => void;
  onViewClientDetails: (client: Client) => void;
}

export function ClientsWithCylindersTab({
  filteredClients,
  onReturnCylinders,
  onViewClientDetails
}: ClientsWithCylindersTabProps) {
  const clientsWithCylinders = filteredClients.filter(client => client.cylinderCount > 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes com Vasilhames</CardTitle>
        <CardDescription>
          Apenas clientes que possuem vasilhames em comodato
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Vasilhames</TableHead>
              <TableHead>Tipos</TableHead>
              <TableHead>Data do Comodato</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsWithCylinders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Nenhum cliente com vasilhames encontrado
                </TableCell>
              </TableRow>
            ) : (
              clientsWithCylinders.map((client) => (
                <TableRow key={client.id} 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => onViewClientDetails(client)}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{client.cylinderCount}</span>
                      {client.cylinderCount >= 3 && (
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full" 
                              title="Este cliente está com muitos vasilhames" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{client.cylinderTypes.join(", ")}</TableCell>
                  <TableCell>{new Date(client.loanDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onReturnCylinders(client.id);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Devolver
                    </Button>
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
