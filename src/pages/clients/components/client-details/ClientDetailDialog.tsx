
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientDetailsTab } from "./ClientDetailsTab";
import { ClientPurchasesTab } from "./ClientPurchasesTab";
import { ClientPromissoriesTab } from "./ClientPromissoriesTab";

interface ClientDetails {
  id: string;
  name: string;
  phone: string;
  address: string;
  cylinderCount: number;
  cylinderTypes: string[];
  notes: string;
}

interface ClientDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientDetails | null;
}

export function ClientDetailDialog({ open, onOpenChange, client }: ClientDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("details");

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{client.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="purchases">Histórico de Compras</TabsTrigger>
            <TabsTrigger value="promissories">Notas Promissórias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <ClientDetailsTab client={client} />
          </TabsContent>
          
          <TabsContent value="purchases" className="py-4">
            <ClientPurchasesTab />
          </TabsContent>
          
          <TabsContent value="promissories" className="py-4">
            <ClientPromissoriesTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
