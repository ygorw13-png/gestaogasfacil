
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, ShoppingCart, DollarSign } from "lucide-react";
import { RecentSalesTable } from "../sales/RecentSalesTable";
import { PaymentsByType } from "../payments/PaymentsByType";
import type { Sale, SalesByType } from "../../types/entranceTypes";

interface TabContentProps {
  recentSales: Sale[];
  salesByType: SalesByType[];
}

export function TabContent({ recentSales, salesByType }: TabContentProps) {
  return (
    <Tabs defaultValue="sales" className="space-y-4">
      <TabsList className="mb-2">
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
      
      <TabsContent value="sales" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSalesTable sales={recentSales} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="payments" className="mt-0">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Tipo de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentsByType payments={salesByType} />
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
      
      <TabsContent value="attendants" className="mt-0">
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
  );
}
