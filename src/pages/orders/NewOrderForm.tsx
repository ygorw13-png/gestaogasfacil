import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ClientFormSection } from "./components/ClientFormSection";
import { ProductsFormSection } from "./components/ProductsFormSection";
import { PaymentFormSection } from "./components/PaymentFormSection";
import { formSchema, type FormValues } from "./types/formTypes";
import { Order } from "./types";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { idDaChave } from "@/lib/g1/operacao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataOperacional } from "@/lib/dataOperacional";

interface NewOrderFormProps {
  onSubmit: (order: Order) => void | Promise<void>;
}

export default function NewOrderForm({ onSubmit }: NewOrderFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      gasP13: 0,
      gasP20: 0,
      gasP45: 0,
      water: 0,
      tipoVenda: "completa",
      paymentMethod: "",
      saleValue: undefined,
      observations: "",

    },
  });

  const [hasGasP13, setHasGasP13] = useState(false);
  const [hasGasP20, setHasGasP20] = useState(false);
  const [hasGasP45, setHasGasP45] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  // Um pedido por vez; reenvio do MESMO pedido usa o mesmo id (não duplica).
  const operacao = useOperacaoUnica("pedido");
  const [erro, setErro] = useState<string | null>(null);
  // Data prevista da entrega: vazio = hoje (America/Bahia). Datas futuras viram agendamento.
  const [entregaPrevista, setEntregaPrevista] = useState("");

  const handleProductToggle = (product: 'gasP13' | 'gasP20' | 'gasP45' | 'water', checked: boolean) => {
    switch (product) {
      case 'gasP13':
        setHasGasP13(checked);
        if (!checked) form.setValue("gasP13", 0);
        else form.setValue("gasP13", 1);
        break;
      case 'gasP20':
        setHasGasP20(checked);
        if (!checked) form.setValue("gasP20", 0);
        else form.setValue("gasP20", 1);
        break;
      case 'gasP45':
        setHasGasP45(checked);
        if (!checked) form.setValue("gasP45", 0);
        else form.setValue("gasP45", 1);
        break;
      case 'water':
        setHasWater(checked);
        if (!checked) form.setValue("water", 0);
        else form.setValue("water", 1);
        break;
    }
  };

  const handleSubmit = async (values: FormValues) => {
    const hasProducts = values.gasP13 || values.gasP20 || values.gasP45 || values.water;
    
    if (!hasProducts) {
      toast.error("Selecione pelo menos um produto");
      return;
    }
    
    // O pedido guarda um produto só. Antes, marcar dois produtos gravava só o primeiro, em silêncio.
    const selecionados = [values.gasP13, values.gasP20, values.gasP45, values.water].filter((q) => q && q > 0).length;
    if (selecionados > 1) {
      toast.error("Um pedido por produto. Registre este com um produto e faça outro pedido para o restante.");
      return;
    }

    let product = "";
    let quantity = 0;
    
    if (values.gasP13 && values.gasP13 > 0) {
      product = "Gás P13";
      quantity = values.gasP13;
    } else if (values.gasP20 && values.gasP20 > 0) {
      product = "Gás P20";
      quantity = values.gasP20;
    } else if (values.gasP45 && values.gasP45 > 0) {
      product = "Gás P45";
      quantity = values.gasP45;
    } else if (values.water && values.water > 0) {
      product = "Água";
      quantity = values.water;
    }
    
    const order: Order = {
      // ID provisório: o identificador real é gerado pelo banco e retornado ao salvar
      id: "",
      clientName: values.clientName,
      clientPhone: values.clientPhone,
      address: {
        street: values.street,
        number: values.number,
        complement: values.complement,
        neighborhood: values.neighborhood,
      },
      product,
      quantity,
      price: values.saleValue ?? 0,
      paymentMethod: values.paymentMethod,
      tipoVenda: values.tipoVenda,

      hasEmptyCylinder: values.tipoVenda === "recarga",
      isCompletePackage: false,
      createdAt: new Date(),
      status: "pending",
      notes: values.observations,
      origemVenda: "pedido",
      entregaPrevista: entregaPrevista || null,
    };
    
    if (operacao.enviando) return;
    setErro(null);
    const conteudo = { ...order, id: undefined, createdAt: undefined };
    try {
      // Só limpa o formulário depois da gravação confirmada
      await operacao.executar(conteudo, (chave) => Promise.resolve(onSubmit({ ...order, id: idDaChave(chave) })));
      form.reset();
      setHasGasP13(false);
      setHasGasP20(false);
      setHasGasP45(false);
      setHasWater(false);
      setEntregaPrevista("");
    } catch (e) {
      // O chamador já avisou; aqui mantém os dados e explica o que fazer
      setErro(e instanceof Error ? e.message : "Pedido não registrado. Os dados foram mantidos.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ClientFormSection control={form.control} />
        <ProductsFormSection
          control={form.control}
          hasGasP13={hasGasP13}
          hasGasP20={hasGasP20}
          hasGasP45={hasGasP45}
          hasWater={hasWater}
          onToggleProduct={handleProductToggle}
        />
        <PaymentFormSection control={form.control} />

        <div className="space-y-1">
          <Label htmlFor="entregaPrevista">Entregar em (opcional)</Label>
          <Input
            id="entregaPrevista"
            type="date"
            min={dataOperacional()}
            value={entregaPrevista}
            onChange={(e) => setEntregaPrevista(e.target.value)}
            className="w-[180px]"
          />
          <p className="text-xs text-muted-foreground">Em branco = entrega para hoje. Uma data futura fica em Agendadas.</p>
        </div>
        
        {erro && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Pedido não registrado</p>
            <p>{erro}</p>
            {operacao.duvida && (
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { operacao.descartarDuvida(); setErro(null); }}>
                Descartar a tentativa anterior e registrar como novo pedido
              </Button>
            )}
          </div>
        )}
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={operacao.enviando}>
            {operacao.enviando ? "Registrando…" : "Cadastrar Pedido"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
