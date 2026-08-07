
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
import { PontosSection } from './form-sections/PontosSection';
import { supabase } from '@/integrations/supabase/client';
import { useRegistrarEntregaConta } from '@/hooks/useContaBotijoes';

export function NewRouteForm() {
  const { toast } = useToast();
  const registrarEntrega = useRegistrarEntregaConta();

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
      pontos: [],
      notes: "",
    },
  });

  async function onSubmit(values: RouteFormSchema) {
    const { data: colaborador } = await supabase
      .from("colaboradores")
      .select("nome")
      .eq("id", values.driverId)
      .maybeSingle();

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      toast({ title: "Sessão expirada", description: "Faça login novamente.", variant: "destructive" });
      return;
    }

    const { data: rota, error } = await supabase
      .from("rotas")
      .insert({
        data: new Date().toISOString().slice(0, 10),
        motorista_id: null,
        motorista_nome: colaborador?.nome ?? "Motorista",
        destino: values.destination,
        clientes_count: values.pontos.length,
        status: "em_andamento",
        hora_saida: values.departureTime,
        inventario: values.inventory,
        observacoes: values.notes ?? null,
        criado_por: userId,
      })
      .select("id")
      .single();

    if (error || !rota) {
      toast({
        title: "Erro ao criar rota",
        description: error?.message ?? "Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    if (values.pontos.length > 0) {
      await supabase.from("rota_pontos" as any).insert(
        values.pontos.map((p) => ({
          rota_id: rota.id,
          ponto_id: p.pontoId,
          ponto_nome: p.nome,
          cheios_entregues: p.cheios,
        })) as any
      );

      values.pontos
        .filter((p) => p.cheios > 0)
        .forEach((p) =>
          registrarEntrega.mutate({
            parceiro_tipo: "ponto",
            parceiro_id: p.pontoId,
            parceiro_nome: p.nome,
            quantidade: p.cheios,
            rota_id: rota.id,
            observacoes: `Rota para ${values.destination}`,
          })
        );
    }

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
              <h3 className="text-lg font-medium mb-4">Pontos de Revenda</h3>
              <PontosSection control={form.control} />
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
