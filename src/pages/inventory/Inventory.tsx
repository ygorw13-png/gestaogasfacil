
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  Droplet, 
  Search, 
  Plus, 
  ArrowDown, 
  ArrowUp,
  Clock
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import InventoryTable from "./InventoryTable";

// Mock data
const glpInventory = [
  { id: 1, type: 'P13', status: 'Cheio', location: 'Pátio', quantity: 35, lastUpdate: '2025-04-24 14:30:00' },
  { id: 2, type: 'P13', status: 'Vazio', location: 'Pátio', quantity: 25, lastUpdate: '2025-04-24 13:45:00' },
  { id: 3, type: 'P13', status: 'Defeituoso', location: 'Pátio', quantity: 2, lastUpdate: '2025-04-23 09:20:00' },
  { id: 4, type: 'P13', status: 'Cheio', location: 'Portaria', quantity: 10, lastUpdate: '2025-04-24 16:00:00' },
  { id: 5, type: 'P13', status: 'Vazio', location: 'Portaria', quantity: 5, lastUpdate: '2025-04-24 16:05:00' },
  { id: 6, type: 'P20', status: 'Cheio', location: 'Pátio', quantity: 12, lastUpdate: '2025-04-24 11:30:00' },
  { id: 7, type: 'P20', status: 'Vazio', location: 'Pátio', quantity: 8, lastUpdate: '2025-04-24 10:15:00' },
  { id: 8, type: 'P45', status: 'Cheio', location: 'Pátio', quantity: 8, lastUpdate: '2025-04-23 15:40:00' },
  { id: 9, type: 'P45', status: 'Vazio', location: 'Pátio', quantity: 4, lastUpdate: '2025-04-24 14:10:00' },
];

const waterInventory = [
  { id: 1, type: 'Galão 20L', status: 'Cheio', location: 'Pátio', quantity: 50, lastUpdate: '2025-04-24 14:30:00' },
  { id: 2, type: 'Galão 20L', status: 'Vazio', location: 'Pátio', quantity: 30, lastUpdate: '2025-04-24 13:45:00' },
  { id: 3, type: 'Galão 20L', status: 'Defeituoso', location: 'Pátio', quantity: 3, lastUpdate: '2025-04-23 09:20:00' },
  { id: 4, type: 'Galão 20L', status: 'Cheio', location: 'Portaria', quantity: 15, lastUpdate: '2025-04-24 16:00:00' },
  { id: 5, type: 'Galão 20L', status: 'Vazio', location: 'Portaria', quantity: 10, lastUpdate: '2025-04-24 16:05:00' },
];

const Inventory = () => {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [filterText, setFilterText] = useState("");
  const { toast } = useToast();

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenAddDialog(false);
    toast({
      title: "Estoque atualizado",
      description: "Os itens foram adicionados ao inventário com sucesso.",
    });
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenTransferDialog(false);
    toast({
      title: "Transferência realizada",
      description: "Os itens foram transferidos com sucesso.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Controle de Estoque</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={openTransferDialog} onOpenChange={setOpenTransferDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowDown size={16} />
                <span>Transferir</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transferência de Estoque</DialogTitle>
                <DialogDescription>
                  Transferir itens entre pátio e portaria. O sistema registrará data, hora e responsável.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromLocation">De</Label>
                    <Select defaultValue="patio">
                      <SelectTrigger id="fromLocation">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patio">Pátio</SelectItem>
                        <SelectItem value="portaria">Portaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toLocation">Para</Label>
                    <Select defaultValue="portaria">
                      <SelectTrigger id="toLocation">
                        <SelectValue placeholder="Selecione o destino" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portaria">Portaria</SelectItem>
                        <SelectItem value="patio">Pátio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productType">Tipo de Produto</Label>
                  <Select defaultValue="p13">
                    <SelectTrigger id="productType">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="p13">GLP P13</SelectItem>
                      <SelectItem value="p20">GLP P20</SelectItem>
                      <SelectItem value="p45">GLP P45</SelectItem>
                      <SelectItem value="agua">Água 20L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue="cheio">
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cheio">Cheio</SelectItem>
                      <SelectItem value="vazio">Vazio</SelectItem>
                      <SelectItem value="defeituoso">Defeituoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input type="number" id="quantity" min={1} defaultValue={1} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input type="text" id="responsible" placeholder="Nome do responsável" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenTransferDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Transferir</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                <span>Adicionar</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar ao Estoque</DialogTitle>
                <DialogDescription>
                  Adicione novos itens ao inventário. Todos os registros incluirão data e hora automáticas.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddInventory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addProductType">Tipo de Produto</Label>
                  <Select defaultValue="p13">
                    <SelectTrigger id="addProductType">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="p13">GLP P13</SelectItem>
                      <SelectItem value="p20">GLP P20</SelectItem>
                      <SelectItem value="p45">GLP P45</SelectItem>
                      <SelectItem value="agua">Água 20L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addStatus">Status</Label>
                  <Select defaultValue="cheio">
                    <SelectTrigger id="addStatus">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cheio">Cheio</SelectItem>
                      <SelectItem value="vazio">Vazio</SelectItem>
                      <SelectItem value="defeituoso">Defeituoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addLocation">Localização</Label>
                  <Select defaultValue="patio">
                    <SelectTrigger id="addLocation">
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patio">Pátio</SelectItem>
                      <SelectItem value="portaria">Portaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addQuantity">Quantidade</Label>
                  <Input type="number" id="addQuantity" min={1} defaultValue={1} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Adicionar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total GLP P13</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">45</div>
              <Package className="h-5 w-5 text-gasflow-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              35 cheios | 8 vazios | 2 defeituosos
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total GLP P20/P45</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">20</div>
              <Package className="h-5 w-5 text-gasflow-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              12 P20 | 8 P45
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Água</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">65</div>
              <Droplet className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              50 cheios | 12 vazios | 3 defeituosos
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portaria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">40</div>
              <ArrowDown className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              25 GLP | 15 Água
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar por tipo, status ou localização..."
            className="pl-8"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="glp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="glp" className="flex items-center gap-2">
            <Package size={16} />
            <span>GLP</span>
          </TabsTrigger>
          <TabsTrigger value="water" className="flex items-center gap-2">
            <Droplet size={16} />
            <span>Água</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock size={16} />
            <span>Histórico</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="glp">
          <Card>
            <CardContent className="p-0">
              <InventoryTable 
                data={glpInventory}
                filterText={filterText}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="water">
          <Card>
            <CardContent className="p-0">
              <InventoryTable 
                data={waterInventory}
                filterText={filterText}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>Histórico de movimentações em desenvolvimento.</p>
                <p className="text-sm">Será implementado na próxima versão.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;
