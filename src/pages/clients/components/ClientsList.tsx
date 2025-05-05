
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Client } from "../hooks/useClients";

interface ClientsListProps {
  clients: Client[];
  title: string;
  description: string;
  showAddButton?: boolean;
  onAddCylinders?: (client: Client) => void;
  onReturnCylinders: (clientId: string) => void;
  onViewClientDetails: (client: Client) => void;
}

export function ClientsList({
  clients,
  title,
  description,
  showAddButton = false,
  onAddCylinders,
  onReturnCylinders,
  onViewClientDetails
}: ClientsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>{showAddButton ? "Endereço" : "Vasilhames"}</TableHead>
              <TableHead>{showAddButton ? "Vasilhames" : "Tipos"}</TableHead>
              {!showAddButton && <TableHead>Data do Comodato</TableHead>}
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showAddButton ? 5 : 6} className="text-center py-4 text-muted-foreground">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => onViewClientDetails(client)}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  
                  {showAddButton ? (
                    <TableCell className="max-w-[200px] truncate">{client.address}</TableCell>
                  ) : (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{client.cylinderCount}</span>
                        {client.cylinderCount >= 3 && (
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full" 
                                title="Este cliente está com muitos vasilhames" />
                        )}
                      </div>
                    </TableCell>
                  )}
                  
                  {showAddButton ? (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{client.cylinderCount}</span>
                        {client.cylinderCount >= 3 && (
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full" 
                                title="Este cliente está com muitos vasilhames" />
                        )}
                      </div>
                    </TableCell>
                  ) : (
                    <TableCell>{client.cylinderTypes.join(", ")}</TableCell>
                  )}
                  
                  {!showAddButton && (
                    <TableCell>{new Date(client.loanDate).toLocaleDateString('pt-BR')}</TableCell>
                  )}
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {showAddButton ? (
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddCylinders && onAddCylinders(client);
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
                    ) : (
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
                    )}
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
