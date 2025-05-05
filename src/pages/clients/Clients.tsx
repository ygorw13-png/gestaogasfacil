
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Search, UserPlus, Bell, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientDetailDialog } from "./components/ClientDetailDialog";

// Mock data for clients with cylinder loans
const mockClients = [
  { 
    id: "1", 
    name: "João Silva", 
    phone: "(79) 99999-1234", 
    address: "Rua das Flores, 123, Centro", 
    cylinderCount: 2,
    cylinderTypes: ["P13", "P13"],
    loanDate: "2025-04-10",
    notes: "Cliente regular, compra sempre aos domingos"
  },
  { 
    id: "2", 
    name: "Maria Santos", 
    phone: "(79) 99999-5678", 
    address: "Av. Principal, 456, Bairro Novo", 
    cylinderCount: 3,
    cylinderTypes: ["P13", "P20", "Água 20L"],
    loanDate: "2025-04-15",
    notes: "Prefere entregas pela manhã"
  },
  { 
    id: "3", 
    name: "Pedro Oliveira", 
    phone: "(79) 99999-9876", 
    address: "Travessa das Palmeiras, 78, Jardim", 
    cylinderCount: 1,
    cylinderTypes: ["P45"],
    loanDate: "2025-04-18",
    notes: "Cliente comercial - restaurante"
  },
  { 
    id: "4", 
    name: "Ana Pereira", 
    phone: "(79) 99999-4321", 
    address: "Rua do Comércio, 321, Centro", 
    cylinderCount: 4,
    cylinderTypes: ["P13", "P13", "Água 20L", "Água 20L"],
    loanDate: "2025-04-05",
    notes: "Cliente com histórico de atraso na devolução"
  }
];

export default function Clients() {
  const [clients, setClients] = useState(mockClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isCylinderDialogOpen, setIsCylinderDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<typeof mockClients[0] | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [newCylinders, setNewCylinders] = useState<{type: string, quantity: number}[]>([{type: "P13", quantity: 1}]);
  const { toast } = useToast();

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Alert clients with more than 3 cylinders (example threshold)
  const clientsWithManyLoans = clients.filter(client => client.cylinderCount >= 3);

  const handleAddNewClient = () => {
    toast({
      title: "Cliente adicionado com sucesso",
      description: "O novo cliente foi registrado no sistema."
    });
    setIsNewClientDialogOpen(false);
  };

  const handleAddCylinders = () => {
    if (selectedClient) {
      toast({
        title: "Comodato registrado",
        description: `Vasilhames adicionados para ${selectedClient.name}`
      });
      setIsCylinderDialogOpen(false);
    }
  };

  const handleReturnCylinders = (clientId: string) => {
    toast({
      title: "Devolução registrada",
      description: "A devolução de vasilhames foi registrada com sucesso."
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Relatório gerado",
      description: "O relatório de comodatos foi gerado e está pronto para download."
    });
  };

  const handleViewClientDetails = (client: typeof mockClients[0]) => {
    setSelectedClient(client);
    setIsClientDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerateReport} variant="outline" className="flex items-center gap-2">
            <FileText size={16} />
            <span>Relatório</span>
          </Button>
          <Button 
            onClick={() => setIsAlertDialogOpen(true)} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={clientsWithManyLoans.length === 0}
          >
            <Bell size={16} />
            <span>Alertas</span>
            {clientsWithManyLoans.length > 0 && (
              <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {clientsWithManyLoans.length}
              </span>
            )}
          </Button>
          <Button onClick={() => setIsNewClientDialogOpen(true)} className="flex items-center gap-2">
            <UserPlus size={16} />
            <span>Novo Cliente</span>
          </Button>
        </div>
      </div>
      
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar cliente por nome, telefone ou endereço..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos os Clientes</TabsTrigger>
          <TabsTrigger value="with-cylinders">Com Vasilhames</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
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
                        onClick={() => handleViewClientDetails(client)}>
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
                                setSelectedClient(client);
                                setIsCylinderDialogOpen(true);
                              }} 
                              variant="outline" 
                              size="sm"
                            >
                              Adicionar
                            </Button>
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReturnCylinders(client.id);
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
        </TabsContent>
        
        <TabsContent value="with-cylinders">
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
                  {filteredClients
                    .filter(client => client.cylinderCount > 0)
                    .map((client) => (
                      <TableRow key={client.id} 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleViewClientDetails(client)}>
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
                              handleReturnCylinders(client.id);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Devolver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for adding a new client */}
      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Nome completo do cliente" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(99) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" placeholder="Endereço completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" placeholder="Observações sobre o cliente" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewClientDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddNewClient}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for managing cylinders */}
      <Dialog open={isCylinderDialogOpen} onOpenChange={setIsCylinderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Vasilhames</DialogTitle>
            <DialogDescription>
              {selectedClient && `Registrar comodato para ${selectedClient.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {newCylinders.map((cylinder, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Vasilhame</Label>
                  <Select 
                    defaultValue={cylinder.type}
                    onValueChange={(value) => {
                      const updated = [...newCylinders];
                      updated[index].type = value;
                      setNewCylinders(updated);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P13">GLP P13</SelectItem>
                      <SelectItem value="P20">GLP P20</SelectItem>
                      <SelectItem value="P45">GLP P45</SelectItem>
                      <SelectItem value="Água 20L">Água 20L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    defaultValue={cylinder.quantity} 
                    onChange={(e) => {
                      const updated = [...newCylinders];
                      updated[index].quantity = parseInt(e.target.value);
                      setNewCylinders(updated);
                    }}
                  />
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              type="button" 
              className="w-full" 
              onClick={() => setNewCylinders([...newCylinders, {type: "P13", quantity: 1}])}
            >
              + Adicionar Outro Tipo
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCylinderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCylinders}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert dialog for clients with many cylinders */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alertas de Comodato</AlertDialogTitle>
            <AlertDialogDescription>
              Os seguintes clientes estão com um número elevado de vasilhames:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vasilhames</TableHead>
                  <TableHead>Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsWithManyLoans.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.cylinderCount}</TableCell>
                    <TableCell>{new Date(client.loanDate).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateReport}>Gerar Relatório</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for client details */}
      <ClientDetailDialog 
        open={isClientDetailOpen} 
        onOpenChange={setIsClientDetailOpen} 
        client={selectedClient} 
      />
    </div>
  );
}
