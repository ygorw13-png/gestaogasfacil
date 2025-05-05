
import { Client } from "../hooks/useClients";
import { ClientsList } from "./ClientsList";

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
    <ClientsList
      clients={filteredClients}
      title="Gestão de Clientes"
      description="Gerencie seus clientes e controle os vasilhames em comodato"
      showAddButton={true}
      onAddCylinders={onAddCylinders}
      onReturnCylinders={onReturnCylinders}
      onViewClientDetails={onViewClientDetails}
    />
  );
}
