import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResellersList } from "./components/ResellersList";
import { NewResellerForm } from "./components/NewResellerForm";
import { ResellersSalesHistory } from "./components/ResellersSalesHistory";
import { Reseller } from "./types";
import { ResellerDetailsDialog } from "./components/ResellerDetailsDialog";
import { useResellers } from "./hooks/useResellers";

export default function Resellers() {
  const { resellers, isLoading, createReseller, removeReseller } = useResellers();
  const [isNewResellerOpen, setIsNewResellerOpen] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const canManageResellers = true;

  const handleAddReseller = async (data: any) => {
    await createReseller.mutateAsync({
      name: data.name,
      phone: data.phone,
      contactPerson: data.contactPerson,
      address: data.address,
      priceP13: data.priceP13,
      notes: data.notes,
    });
    setIsNewResellerOpen(false);
  };

  const handleViewReseller = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6 animate-in pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Agregados</h1>
        {canManageResellers && (
          <Button onClick={() => setIsNewResellerOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agregado
          </Button>
        )}
      </div>

      <Dialog open={isNewResellerOpen} onOpenChange={setIsNewResellerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Agregado</DialogTitle>
          </DialogHeader>
          <NewResellerForm onSubmit={handleAddReseller} isSubmitting={createReseller.isPending} />
        </DialogContent>
      </Dialog>

      <ResellerDetailsDialog 
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        reseller={selectedReseller}
        canViewPrices={canManageResellers}
      />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Agregados</TabsTrigger>
          <TabsTrigger value="sales">Histórico de Vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Agregados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <ResellersList 
                  resellers={resellers} 
                  canViewPrices={canManageResellers}
                  onViewReseller={handleViewReseller}
                  onRemoveReseller={(id) => removeReseller.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vendas para Agregados</CardTitle>
            </CardHeader>
            <CardContent>
              <ResellersSalesHistory canViewPrices={canManageResellers} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
