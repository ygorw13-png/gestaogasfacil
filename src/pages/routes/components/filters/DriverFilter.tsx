
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { fetchFromTable } from "@/services/supabaseSDK";

interface Driver {
  id: string;
  nome: string;
}

interface DriverFilterProps {
  driverId: string;
  onDriverIdChange: (id: string) => void;
}

export function DriverFilter({ driverId, onDriverIdChange }: DriverFilterProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      try {
        // Fetch drivers with the role of 'entregador'
        const { data, error } = await fetchFromTable<Driver[]>('colaboradores', {
          columns: 'id, nome',
          where: { cargo: 'entregador', situacao: 'ativo' },
          orderBy: { column: 'nome' }
        });
        
        if (error) throw error;
        
        if (data) {
          setDrivers(data as Driver[]);
        }
      } catch (error) {
        console.error("Erro ao carregar motoristas:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrivers();
  }, []);
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Motorista</label>
      <Select value={driverId} onValueChange={onDriverIdChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Carregando..." : "Selecione um motorista"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos os Motoristas</SelectItem>
          
          {drivers.map((driver) => (
            <SelectItem key={driver.id} value={driver.id}>
              {driver.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
