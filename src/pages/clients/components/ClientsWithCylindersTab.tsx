
import { Client } from "../hooks/useClients";
import { ClientsList } from "./ClientsList";

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
    <ClientsList
      clients={clientsWithCylinders}
      title="Clientes com Vasilhames"
      description="Apenas clientes que possuem vasilhames em comodato"
      showAddButton={false}
      onReturnCylinders={onReturnCylinders}
      onViewClientDetails={onViewClientDetails}
    />
  );
}
