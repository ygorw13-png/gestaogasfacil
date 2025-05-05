
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  cylinderCount: number;
  cylinderTypes: string[];
  loanDate: string;
  notes: string;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isCylinderDialogOpen, setIsCylinderDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [newCylinders, setNewCylinders] = useState<{type: string, quantity: number}[]>([{type: "P13", quantity: 1}]);
  const { toast } = useToast();

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clients with more than 3 cylinders (example threshold)
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

  const handleViewClientDetails = (client: Client) => {
    setSelectedClient(client);
    setIsClientDetailOpen(true);
  };

  return {
    clients,
    setClients,
    searchTerm,
    setSearchTerm,
    isNewClientDialogOpen,
    setIsNewClientDialogOpen,
    isAlertDialogOpen,
    setIsAlertDialogOpen,
    isCylinderDialogOpen,
    setIsCylinderDialogOpen,
    selectedClient,
    setSelectedClient,
    isClientDetailOpen,
    setIsClientDetailOpen,
    newCylinders,
    setNewCylinders,
    filteredClients,
    clientsWithManyLoans,
    handleAddNewClient,
    handleAddCylinders,
    handleReturnCylinders,
    handleGenerateReport,
    handleViewClientDetails
  };
}
