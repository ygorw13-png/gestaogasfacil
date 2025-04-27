
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PromissoryFilters } from "./components/PromissoryFilters";
import { PendingPromissoriesTable } from "./components/PendingPromissoriesTable";
import { AssignedPromissoriesTable } from "./components/AssignedPromissoriesTable";
import { PaidPromissoriesTable } from "./components/PaidPromissoriesTable";
import { AssignPromissoryDialog } from "./components/AssignPromissoryDialog";
import { PaymentDialog } from "./components/PaymentDialog";
import { ClientFidelityReport } from "./components/ClientFidelityReport";
import { promissoryNotes, collectors } from "./data/mockData";

export default function Promissory() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [activeTab, setActiveTab] = useState("vencendo");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPromissory, setSelectedPromissory] = useState<number | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState("");

  const filteredPromissories = promissoryNotes.filter(note => {
    if (selectedDate) {
      const noteDate = new Date(note.dueDate);
      if (noteDate.getDate() !== selectedDate.getDate() ||
          noteDate.getMonth() !== selectedDate.getMonth() ||
          noteDate.getFullYear() !== selectedDate.getFullYear()) {
        return false;
      }
    }
    
    if (searchQuery) {
      return note.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    if (activeTab === "vencendo") {
      return note.status === "pending" || note.status === "overdue";
    } else if (activeTab === "atribuidas") {
      return note.status === "assigned";
    } else if (activeTab === "pagas") {
      return note.status === "paid";
    } else if (activeTab === "relatorio") {
      return false;
    }
    
    return true;
  });

  const handleAssignCollector = (promissoryId: number) => {
    setSelectedPromissory(promissoryId);
    setIsAssignDialogOpen(true);
  };

  const handlePayment = (promissoryId: number) => {
    setSelectedPromissory(promissoryId);
    setIsPaymentDialogOpen(true);
  };

  const confirmAssignment = () => {
    if (selectedPromissory && selectedCollector) {
      toast.success(`Promissória atribuída a ${selectedCollector}`);
      setIsAssignDialogOpen(false);
      setSelectedCollector("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Promissórias</h1>
        <PromissoryFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Promissórias</CardTitle>
          <CardDescription>
            Gerencie as promissórias, cobranças e pagamentos pendentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="vencendo">Vencendo</TabsTrigger>
              <TabsTrigger value="atribuidas">Atribuídas</TabsTrigger>
              <TabsTrigger value="pagas">Pagas</TabsTrigger>
              <TabsTrigger value="relatorio">Relatório de Fidelidade</TabsTrigger>
            </TabsList>
            <TabsContent value="vencendo">
              <PendingPromissoriesTable 
                promissories={filteredPromissories}
                onAssign={handleAssignCollector}
                onPayment={handlePayment}
              />
            </TabsContent>
            <TabsContent value="atribuidas">
              <AssignedPromissoriesTable 
                promissories={filteredPromissories}
                onPayment={handlePayment}
              />
            </TabsContent>
            <TabsContent value="pagas">
              <PaidPromissoriesTable promissories={filteredPromissories} />
            </TabsContent>
            <TabsContent value="relatorio">
              <ClientFidelityReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <AssignPromissoryDialog 
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        selectedCollector={selectedCollector}
        onCollectorChange={setSelectedCollector}
        onSubmit={confirmAssignment}
        collectors={collectors}
      />
      
      <PaymentDialog 
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        promissoryId={selectedPromissory}
      />
    </div>
  );
}
