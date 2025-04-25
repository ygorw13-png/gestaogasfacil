
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, DollarSign, User, Plus, ShoppingCart, CreditCard, FileText, Package, Clock, Droplet, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import NewSaleForm from "./NewSaleForm";
import CashierClosing from "./CashierClosing";

// Mock data
const cashierData = {
  cash: 2345.50,
  credit: 1250.00,
  debit: 985.75,
  pix: 1500.00,
  promissory: 850.00,
  gasVoucher: 520.00,
  totalSales: 7451.25,
  quantities: {
    cash: { p13: 15, p20: 2, p45: 1, water: 10 },
    credit: { p13: 8, p20: 1, p45: 0, water: 5 },
    debit: { p13: 6, p20: 1, p45: 0, water: 3 },
    pix: { p13: 10, p20: 0, p45: 1, water: 7 },
    promissory: { p13: 5, p20: 1, p45: 0, water: 4 },
    gasVoucher: { p13: 3, p20: 0, p45: 0, water: 2 }
  },
  inventoryMovements: [
    { product: 'P13', quantity: 2, type: 'loan' as const, timestamp: '2025-04-25T15:30:00' },
    { product: 'P13', quantity: 1, type: 'return' as const, timestamp: '2025-04-25T16:00:00' },
    { product: 'P20', quantity: 1, type: 'loan' as const, timestamp: '2025-04-25T14:45:00' }
  ]
};

const salesByType = [
  { type: 'Dinheiro', amount: 2345.50, icon: <DollarSign className="h-4 w-4 text-green-600" /> },
  { type: 'Crédito', amount: 1250.00, icon: <CreditCard className="h-4 w-4 text-blue-600" /> },
  { type: 'Débito', amount: 985.75, icon: <CreditCard className="h-4 w-4 text-purple-600" /> },
  { type: 'PIX', amount: 1500.00, icon: <CreditCard className="h-4 w-4 text-yellow-600" /> },
  { type: 'Promissória', amount: 850.00, icon: <FileText className="h-4 w-4 text-red-600" /> },
  { type: 'Vale Gás', amount: 520.00, icon: <CreditCard className="h-4 w-4 text-orange-600" /> },
];

const recentSales = [
  { id: 1, time: '16:45', client: 'Maria Silva', product: 'GLP P13', quantity: 1, payment: 'PIX', amount: 120.00 },
  { id: 2, time: '16:30', client: 'João Oliveira', product: 'Água 20L', quantity: 2, payment: 'Dinheiro', amount: 24.00 },
  { id: 3, time: '16:15', client: 'André Santos', product: 'GLP P13', quantity: 1, payment: 'Crédito', amount: 120.00 },
  { id: 4, time: '15:50', client: 'Carla Pereira', product: 'GLP P13', quantity: 1, payment: 'Vale Gás', amount: 120.00 },
  { id: 5, time: '15:30', client: 'Roberto Alves', product: 'GLP P45', quantity: 1, payment: 'Promissória', amount: 360.00 },
];

export default function EntranceSales() {
  const { toast } = useToast();
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [cashierClosingOpen, setCashierClosingOpen] = useState(false);

  const handleNewSaleSubmit = () => {
    setNewSaleOpen(false);
    toast({
      title: "Venda registrada",
      description: "A venda foi registrada com sucesso.",
      variant: "default",
    });
  };

  const handleCashierClosingSubmit = () => {
    setCashierClosingOpen(false);
    toast({
      title: "Fechamento de caixa",
      description: "O caixa foi fechado com sucesso.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Portaria</h1>
        <div className="flex flex-wrap gap-2">
          <NewSaleForm 
            isOpen={newSaleOpen} 
            onOpenChange={setNewSaleOpen} 
            onSubmit={handleNewSaleSubmit} 
          />
          
          <CashierClosing
            isOpen={cashierClosingOpen}
            onOpenChange={setCashierClosingOpen}
            onSubmit={handleCashierClosingSubmit}
            cashierData={cashierData}
          />

          <Button variant="outline" asChild>
            <Link to="/orders" className="flex items-center gap-2">
              <Truck size={16} />
              <span>Ver Pedidos</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {cashierData.totalSales.toFixed(2).replace('.', ',')}</div>
            <p className="text-xs text-muted-foreground">
              +12% desde ontem
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas de GLP</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42 unidades</div>
            <p className="text-xs text-muted-foreground">
              38 P13 | 2 P20 | 2 P45
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas de Água</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28 galões</div>
            <p className="text-xs text-muted-foreground">
              Média de 3 galões/hora
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart size={14} />
            <span>Vendas</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign size={14} />
            <span>Pagamentos</span>
          </TabsTrigger>
          <TabsTrigger value="attendants" className="flex items-center gap-2">
            <User size={14} />
            <span>Atendentes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Vendas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium py-2">Horário</th>
                      <th className="text-left font-medium py-2">Cliente</th>
                      <th className="text-left font-medium py-2">Produto</th>
                      <th className="text-center font-medium py-2">Qtd</th>
                      <th className="text-left font-medium py-2">Pagamento</th>
                      <th className="text-right font-medium py-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map(sale => (
                      <tr key={sale.id} className="border-b">
                        <td className="py-2">{sale.time}</td>
                        <td className="py-2">{sale.client}</td>
                        <td className="py-2">{sale.product}</td>
                        <td className="py-2 text-center">{sale.quantity}</td>
                        <td className="py-2">{sale.payment}</td>
                        <td className="py-2 text-right">R$ {sale.amount.toFixed(2).replace('.', ',')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm">Ver todas as vendas</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Tipo de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesByType.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.type}</span>
                      </div>
                      <div className="font-medium">
                        R$ {item.amount.toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Gráfico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="text-center py-10 text-muted-foreground">
                  <p>Gráfico em desenvolvimento.</p>
                  <p className="text-sm">Será implementado na próxima versão.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="attendants">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Atendentes da Portaria</CardTitle>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Plus size={14} />
                  <span>Adicionar Atendente</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>Módulo de atendentes em desenvolvimento.</p>
                <p className="text-sm">Será implementado na próxima versão.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

