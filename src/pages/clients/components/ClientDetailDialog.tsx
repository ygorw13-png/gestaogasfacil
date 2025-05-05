
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { FilePlus, Clock } from "lucide-react";

interface ClientDetails {
  id: string;
  name: string;
  phone: string;
  address: string;
  cylinderCount: number;
  cylinderTypes: string[];
  notes: string;
}

interface ClientPurchase {
  id: string;
  date: string;
  product: string;
  quantity: number;
  amount: number;
  paymentMethod: string;
}

interface ClientPromissory {
  id: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
}

interface ClientDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientDetails | null;
}

// Mock data - em uma implementação real, isso viria do backend
const mockPurchases: ClientPurchase[] = [
  { id: "1", date: "2025-05-01", product: "P13", quantity: 1, amount: 110, paymentMethod: "Dinheiro" },
  { id: "2", date: "2025-04-22", product: "P13", quantity: 2, amount: 220, paymentMethod: "Cartão de crédito" },
  { id: "3", date: "2025-04-10", product: "P20", quantity: 1, amount: 180, paymentMethod: "Dinheiro" },
];

const mockPromissories: ClientPromissory[] = [
  { id: "1", amount: 110, dueDate: "2025-05-10", status: "pending" },
  { id: "2", amount: 120, dueDate: "2025-04-15", status: "paid" },
  { id: "3", amount: 95, dueDate: "2025-04-01", status: "overdue" },
];

export function ClientDetailDialog({ open, onOpenChange, client }: ClientDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("details");

  if (!client) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "overdue":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Telefone</Label>
                <p className="font-medium">{client.phone}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Endereço</Label>
                <p className="font-medium">{client.address}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Vasilhames em Comodato</Label>
                <p className="font-medium">{client.cylinderCount} ({client.cylinderTypes.join(", ")})</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Observações</Label>
                <p className="font-medium">{client.notes || "Sem observações"}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="purchases" className="py-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Histórico de Compras</h3>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Clock size={16} />
                <span>Ver Todas</span>
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Nenhuma compra registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  mockPurchases.map(purchase => (
                    <TableRow key={purchase.id}>
                      <TableCell>{formatDate(purchase.date)}</TableCell>
                      <TableCell>{purchase.product}</TableCell>
                      <TableCell>{purchase.quantity}</TableCell>
                      <TableCell>{formatCurrency(purchase.amount)}</TableCell>
                      <TableCell>{purchase.paymentMethod}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="promissories" className="py-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Notas Promissórias</h3>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <FilePlus size={16} />
                <span>Nova Promissória</span>
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPromissories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Nenhuma promissória registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  mockPromissories.map(promissory => (
                    <TableRow key={promissory.id}>
                      <TableCell>{formatDate(promissory.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(promissory.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span 
                            className={`h-2 w-2 rounded-full mr-2 ${getStatusBadgeColor(promissory.status)}`} 
                          />
                          {promissory.status === "pending" && "Pendente"}
                          {promissory.status === "paid" && "Paga"}
                          {promissory.status === "overdue" && "Vencida"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Detalhes</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
