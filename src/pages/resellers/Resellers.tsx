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
import { ContaAgregadosTab } from "./components/ContaAgregadosTab";
import { Reseller } from "./types";
import { ResellerDetailsDialog } from "./components/ResellerDetailsDialog";
import { useResellers } from "./hooks/useResellers";
import { useEhAdmin } from "@/hooks/useEhAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Resellers() {
  const { resellers, isLoading, createReseller, removeReseller } = useResellers();
  const [isNewResellerOpen, setIsNewResellerOpen] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const canManageResellers = true;
  const { ehAdmin } = useEhAdmin();
  // Preço sigiloso: só o administrador consulta (o banco devolve nada aos demais).
  const { data: precos } = useQuery({
    queryKey: ["agregado-precos"],
    enabled: ehAdmin,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("agregado_precos").select("reseller_id, preco").eq("produto", "P13");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((p: { reseller_id: string; preco: number }) => [p.reseller_id, Number(p.preco)])) as Record<string, number>;
    },
  });

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
          <NewResellerForm onSubmit={handleAddReseller} isSubmitting={createReseller.isPending} mostrarPreco={ehAdmin} />
        </DialogContent>
      </Dialog>

      <ResellerDetailsDialog 
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        reseller={selectedReseller}
      />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Agregados</TabsTrigger>
          <TabsTrigger value="conta">Conta / Acerto</TabsTrigger>
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
                  precos={ehAdmin ? precos ?? {} : undefined}
                  onViewReseller={handleViewReseller}
                  onRemoveReseller={(id) => removeReseller.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="conta" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Conta dos agregados (quantidades)</CardTitle>
            </CardHeader>
            <CardContent>
              <ContaAgregadosTab resellers={resellers} onAbrir={handleViewReseller} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
