
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collectors } from "./data/mockData";
import { PendingPromissoriesTable } from "./components/PendingPromissoriesTable";
import { AssignPromissoryDialog } from "./components/AssignPromissoryDialog";
import { AssignedPromissoriesTable } from "./components/AssignedPromissoriesTable";
import { PaidPromissoriesTable } from "./components/PaidPromissoriesTable";
import { PaymentDialog } from "./components/PaymentDialog";
import { ClientFidelityReport } from "./components/ClientFidelityReport";
import { PromissoryFilters } from "./components/PromissoryFilters";
import { NewPromissoryDialog } from "./components/NewPromissoryDialog";
import { PromissoryHeader } from "./components/PromissoryHeader";
import { usePromissoryNotes } from "./hooks/usePromissoryNotes";

export default function Promissory() {
  const {
    notes,
    filteredNotes,
    pendingNotes,
    assignedNotes,
    paidNotes,
    clients,
    selectedStatus,
    selectedClient,
    selectedNoteId,
    setSelectedStatus,
    setSelectedClient,
    setSelectedNoteId,
    handleAssign,
    handlePayment,
    handleNewPromissory
  } = usePromissoryNotes();

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isNewPromissoryDialogOpen, setIsNewPromissoryDialogOpen] = useState(false);

  const handleAssignClick = (id: string) => {
    setSelectedNoteId(id);
    setIsAssignDialogOpen(true);
  };

  const handlePaymentClick = (id: string) => {
    setSelectedNoteId(id);
    setIsPaymentDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in">
      <PromissoryHeader 
        filteredNotes={filteredNotes}
        selectedStatus={selectedStatus}
        onNewPromissory={() => setIsNewPromissoryDialogOpen(true)}
      />

      <PromissoryFilters 
        selectedStatus={selectedStatus}
        selectedClient={selectedClient}
        onStatusChange={setSelectedStatus}
        onClientChange={setSelectedClient}
        clients={clients}
      />

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingNotes.length})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Atribuídas ({assignedNotes.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Pagas ({paidNotes.length})
          </TabsTrigger>
          <TabsTrigger value="fidelity">
            Fidelidade de Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <PendingPromissoriesTable 
            promissories={pendingNotes} 
            onAssign={handleAssignClick}
            onPayment={handlePaymentClick}
          />
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          <AssignedPromissoriesTable 
            promissories={assignedNotes} 
            onPayment={handlePaymentClick} 
          />
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <PaidPromissoriesTable promissories={paidNotes} />
        </TabsContent>

        <TabsContent value="fidelity" className="space-y-4">
          <ClientFidelityReport notes={notes} />
        </TabsContent>
      </Tabs>

      <AssignPromissoryDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        collectors={collectors}
        onSubmit={handleAssign}
      />

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handlePayment}
        noteId={selectedNoteId}
        notes={notes}
      />

      <NewPromissoryDialog 
        open={isNewPromissoryDialogOpen}
        onOpenChange={setIsNewPromissoryDialogOpen}
        onSubmit={handleNewPromissory}
        collectors={collectors}
        clients={clients}
      />
    </div>
  );
}
