
import { useState } from "react";
import { format } from "date-fns";
import { customTables } from "@/integrations/supabase/customClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ColaboradorFormFields, 
  ColaboradorFormValues 
} from "@/components/forms/ColaboradorFormFields";

interface NovoColaboradorProps {
  onSuccess: () => void;
}

export default function NovoColaborador({ onSuccess }: NovoColaboradorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { organization } = useAuth();
  const { toast } = useToast();

  const defaultValues: ColaboradorFormValues = {
    nome: "",
    cargo: "",
    telefone: "",
    cpf: "",
    data_admissao: new Date(),
    situacao: true,
    observacoes: "",
  };

  const handleSubmit = async (values: ColaboradorFormValues): Promise<void> => {
    if (!organization) {
      toast({
        title: "Erro",
        description: "Organização não encontrada.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await customTables.colaboradores.insert({
        nome: values.nome,
        cargo: values.cargo,
        telefone: values.telefone || null,
        cpf: values.cpf || null,
        data_admissao: format(values.data_admissao, 'yyyy-MM-dd'),
        situacao: values.situacao ? 'ativo' : 'inativo',
        observacoes: values.observacoes || null,
        organization_id: organization.id,
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Colaborador cadastrado com sucesso!",
      });
      
      onSuccess();
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Erro ao cadastrar",
        description: err.message || "Ocorreu um erro ao cadastrar o colaborador",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <ColaboradorFormFields
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={onSuccess}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Colaborador"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
