
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClients } from "./hooks/useClients";
import { ClientsHeader } from "./components/ClientsHeader";
import { ClientSearch } from "./components/ClientSearch";
import { AllClientsTab } from "./components/AllClientsTab";
import { ClientsWithCylindersTab } from "./components/ClientsWithCylindersTab";
import { NewClientDialog } from "./components/NewClientDialog";
import { CylinderDialog } from "./components/CylinderDialog";
import { ClientsAlertDialog } from "./components/AlertDialog";
import { ClientDetailDialog } from "./components/client-details/ClientDetailDialog";
import { EditClientDialog } from "./components/EditClientDialog";
import { useState } from "react";

export default function Clients() {
  const {
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
  } = useClients();

  const [editClient, setEditClient] = useState<any>(null);

  return (
    <div className="space-y-6">
      <ClientsHeader 
        onNewClient={() => setIsNewClientDialogOpen(true)}
        onOpenAlerts={() => setIsAlertDialogOpen(true)}
        onGenerateReport={handleGenerateReport}
        alertCount={clientsWithManyLoans.length}
      />
      
      <ClientSearch 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos os Clientes</TabsTrigger>
          <TabsTrigger value="with-cylinders">Com Vasilhames</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <AllClientsTab 
            filteredClients={filteredClients}
            onAddCylinders={(client) => {
              setSelectedClient(client);
              setIsCylinderDialogOpen(true);
            }}
            onReturnCylinders={handleReturnCylinders}
            onViewClientDetails={handleViewClientDetails}
            onEditClient={(c) => setEditClient(c)}
          />
        </TabsContent>
        
        <TabsContent value="with-cylinders">
          <ClientsWithCylindersTab 
            filteredClients={filteredClients}
            onReturnCylinders={handleReturnCylinders}
            onViewClientDetails={handleViewClientDetails}
          />
        </TabsContent>
      </Tabs>

      <EditClientDialog
        open={!!editClient}
        onOpenChange={(o) => !o && setEditClient(null)}
        client={editClient}
        onSaved={handleAddNewClient}
      />

      <NewClientDialog 
        open={isNewClientDialogOpen} 
        onOpenChange={setIsNewClientDialogOpen}
        onSubmit={handleAddNewClient}
      />

      <CylinderDialog 
        open={isCylinderDialogOpen} 
        onOpenChange={setIsCylinderDialogOpen}
        client={selectedClient}
        onSubmit={handleAddCylinders}
        cylinders={newCylinders}
        onChangeCylinders={setNewCylinders}
      />

      <ClientsAlertDialog 
        open={isAlertDialogOpen} 
        onOpenChange={setIsAlertDialogOpen}
        clientsWithManyLoans={clientsWithManyLoans}
        onGenerateReport={handleGenerateReport}
      />

      <ClientDetailDialog 
        open={isClientDetailOpen} 
        onOpenChange={setIsClientDetailOpen}
        client={selectedClient}
      />
    </div>
  );
}
