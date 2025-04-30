
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClosingFiltersProps {
  searchDate: string;
  filterType: "all" | "partial" | "total";
  onSearchChange: (value: string) => void;
  onFilterChange: (value: "all" | "partial" | "total") => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function ClosingFilters({
  searchDate,
  filterType,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  hasActiveFilters
}: ClosingFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto" role="search" aria-label="Filtros de fechamento de caixa">
      <div className="w-full sm:w-auto">
        <label htmlFor="date-filter" className="sr-only">Filtrar por data</label>
        <Input 
          id="date-filter"
          value={searchDate} 
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filtrar por data (dd/mm/aaaa)"
          className="max-w-xs"
          aria-label="Filtrar por data no formato dd/mm/aaaa"
        />
      </div>
      <div className="w-full sm:w-auto">
        <Select 
          value={filterType} 
          onValueChange={(v) => onFilterChange(v as any)}
          aria-label="Filtrar por tipo de fechamento"
        >
          <SelectTrigger className="w-[160px]" aria-label="Selecione o tipo de fechamento">
            <SelectValue placeholder="Tipo de Fechamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="total">Total</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        className="h-10"
        aria-label="Limpar todos os filtros aplicados"
      >
        Limpar
      </Button>
    </div>
  );
}
