
import { useState } from "react";
import { format } from "date-fns";
import { Colaborador } from "@/types/supabaseTypes";
import { useToast } from "@/hooks/use-toast";
import { customTables } from "@/integrations/supabase/customClient";
import { 
  ColaboradorFormFields, 
  ColaboradorFormValues 
} from "@/components/forms/ColaboradorFormFields";

interface EditarColaboradorProps {
  colaborador: Colaborador;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditarColaborador({ 
  colaborador, 
  onSuccess,
  onCancel
}: EditarColaboradorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  // Converter data de string para Date para o form
  const dataAdmissao = new Date(colaborador.data_admissao);

  const defaultValues: ColaboradorFormValues = {
    nome: colaborador.nome,
    cargo: colaborador.cargo,
    telefone: colaborador.telefone || "",
    cpf: colaborador.cpf || "",
    data_admissao: dataAdmissao,
    situacao: colaborador.situacao === 'ativo',
    observacoes: colaborador.observacoes || "",
  };

  const handleSubmit = async (values: ColaboradorFormValues): Promise<void> => {
    setIsSubmitting(true);
    
    try {
      const { error } = await customTables.colaboradores.update({
        id: colaborador.id,
        nome: values.nome,
        cargo: values.cargo,
        telefone: values.telefone || null,
        cpf: values.cpf || null,
        data_admissao: format(values.data_admissao, 'yyyy-MM-dd'),
        situacao: values.situacao ? 'ativo' : 'inativo',
        observacoes: values.observacoes || null,
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Dados do colaborador atualizados com sucesso!",
      });
      
      onSuccess();
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Erro ao atualizar",
        description: err.message || "Ocorreu um erro ao atualizar o colaborador",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <ColaboradorFormFields
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}
