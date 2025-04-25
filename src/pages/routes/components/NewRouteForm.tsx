
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { RouteFormSchema, routeFormSchema } from './schemas/routeFormSchema';
import { DriverSelection } from './form-sections/DriverSelection';
import { RouteDetails } from './form-sections/RouteDetails';
import { InventorySection } from './form-sections/InventorySection';
import { PromissoryNotesSection } from './form-sections/PromissoryNotesSection';
import { NotesSection } from './form-sections/NotesSection';

export function NewRouteForm() {
  const { toast } = useToast();

  const form = useForm<RouteFormSchema>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      driverId: "",
      destination: "",
      departureTime: "",
      inventory: {
        gasP13: 0,
        gasP20: 0,
        gasP45: 0,
        water: 0,
      },
      promissoryNotesToCollect: [],
      notes: "",
    },
  });

  function onSubmit(values: RouteFormSchema) {
    console.log("Form values:", values);
    
    toast({
      title: "Rota criada com sucesso!",
      description: `Rota para ${values.destination} foi criada.`,
    });

    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Rota de Entrega</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <DriverSelection control={form.control} />
              <RouteDetails control={form.control} />
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="text-lg font-medium mb-4">Inventário de Saída</h3>
              <InventorySection control={form.control} />
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="text-lg font-medium mb-4">Notas Promissórias a Receber</h3>
              <PromissoryNotesSection control={form.control} />
            </div>

            <NotesSection control={form.control} />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Limpar
              </Button>
              <Button type="submit">Iniciar Nova Rota</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
