
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
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
      <Input 
        value={searchDate} 
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Filtrar por data (dd/mm/aaaa)"
        className="max-w-xs"
      />
      <Select value={filterType} onValueChange={(v) => onFilterChange(v as any)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Tipo de Fechamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="partial">Parcial</SelectItem>
          <SelectItem value="total">Total</SelectItem>
        </SelectContent>
      </Select>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        className="h-10"
      >
        Limpar
      </Button>
    </div>
  );
}
