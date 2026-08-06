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

interface NewOrderFormProps {
  onSubmit: (order: Order) => void;
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
      paymentMethod: "",
      saleValue: undefined,
      observations: "",

    },
  });

  const [hasGasP13, setHasGasP13] = useState(false);
  const [hasGasP20, setHasGasP20] = useState(false);
  const [hasGasP45, setHasGasP45] = useState(false);
  const [hasWater, setHasWater] = useState(false);

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

  const handleSubmit = (values: FormValues) => {
    const hasProducts = values.gasP13 || values.gasP20 || values.gasP45 || values.water;
    
    if (!hasProducts) {
      toast.error("Selecione pelo menos um produto");
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
      id: (Math.random() * 1000).toFixed(0),
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
      price: 0,
      hasEmptyCylinder: true,
      isCompletePackage: false,
      createdAt: new Date(),
      status: "pending",
      notes: values.observations
    };
    
    onSubmit(order);
    form.reset();
    setHasGasP13(false);
    setHasGasP20(false);
    setHasGasP45(false);
    setHasWater(false);
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
        
        <div className="flex justify-end gap-4">
          <Button type="submit">
            Cadastrar Pedido
          </Button>
        </div>
      </form>
    </Form>
  );
}
