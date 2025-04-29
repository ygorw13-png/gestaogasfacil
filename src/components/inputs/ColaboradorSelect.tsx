
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customTables } from "@/integrations/supabase/customClient";
import { Colaborador } from "@/types/supabaseTypes";
import { Skeleton } from "@/components/ui/skeleton";

interface ColaboradorSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  cargo?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ColaboradorSelect({
  value,
  onValueChange,
  cargo,
  required = false,
  placeholder = "Selecione um colaborador",
  className = "",
  disabled = false
}: ColaboradorSelectProps) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const { data, error } = await customTables.colaboradores.selectAtivos();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Se tiver filtro por cargo, aplica
          const filteredData = cargo 
            ? (data as Colaborador[]).filter(c => c.cargo.toLowerCase() === cargo.toLowerCase())
            : (data as Colaborador[]);
          
          setColaboradores(filteredData);
        }
      } catch (error) {
        console.error("Erro ao carregar colaboradores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchColaboradores();
  }, [cargo]);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {colaboradores.length === 0 ? (
          <SelectItem value="no-option" disabled>
            {cargo 
              ? `Nenhum colaborador encontrado com o cargo ${cargo}`
              : "Nenhum colaborador cadastrado"}
          </SelectItem>
        ) : (
          colaboradores.map((colaborador) => (
            <SelectItem key={colaborador.id} value={colaborador.id}>
              {colaborador.nome} - {colaborador.cargo}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
