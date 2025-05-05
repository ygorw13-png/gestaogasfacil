
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  fixedExpenseSchema, 
  type FixedExpenseFormData 
} from "./schemas/fixedExpenseSchema";
import { DescriptionAndCategory } from "./fixed/DescriptionAndCategory";
import { AmountAndDueDay } from "./fixed/AmountAndDueDay";
import { LastPaymentDate } from "./fixed/LastPaymentDate";
import { NotesField } from "./fixed/NotesField";

interface NewFixedExpenseFormProps {
  onSuccess: () => void;
}

export default function NewFixedExpenseForm({ onSuccess }: NewFixedExpenseFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FixedExpenseFormData>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: {
      description: "",
      category: "",
      amount: 0,
      dueDay: 1,
      notes: "",
    },
  });

  const onSubmit = (data: FixedExpenseFormData) => {
    // Em um ambiente real, enviaríamos para o backend
    console.log("Despesa fixa cadastrada:", data);
    
    // Mostrar toast de sucesso
    toast({
      title: "Despesa fixa cadastrada",
      description: `${data.description} foi adicionada com sucesso.`,
    });
    
    // Fechar o formulário
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DescriptionAndCategory form={form} />
        <AmountAndDueDay form={form} />
        <LastPaymentDate form={form} />
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
