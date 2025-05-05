
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { DescriptionAndCategory } from "./misc/DescriptionAndCategory";
import { DateAndPaymentMethod } from "./misc/DateAndPaymentMethod";
import { NotesField } from "./misc/NotesField";
import { miscExpenseSchema, MiscExpenseFormData } from "./schemas/miscExpenseSchema";

interface NewMiscExpenseFormProps {
  onSuccess: () => void;
}

export default function NewMiscExpenseForm({ onSuccess }: NewMiscExpenseFormProps) {
  const form = useForm<MiscExpenseFormData>({
    resolver: zodResolver(miscExpenseSchema),
    defaultValues: {
      description: "",
      category: "",
      amount: 0,
      date: new Date(),
      paymentMethod: "",
      notes: "",
    },
  });

  const { toast } = useToast();

  const onSubmit = (data: MiscExpenseFormData) => {
    // Em um ambiente real, enviaríamos para o backend
    console.log("Despesa diversa cadastrada:", data);
    
    // Mostrar toast de sucesso
    toast({
      title: "Despesa diversa cadastrada",
      description: `${data.description} foi adicionada com sucesso.`,
    });
    
    // Fechar o formulário
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DescriptionAndCategory form={form} />
        <DateAndPaymentMethod form={form} />
        <NotesField form={form} />
        
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
