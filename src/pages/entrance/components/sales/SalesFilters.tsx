
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { DateRange } from "react-day-picker";

interface SalesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  productFilter: string;
  onProductFilterChange: (value: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function SalesFilters({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  productFilter,
  onProductFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  onClearFilters
}: SalesFiltersProps) {
  const hasActiveFilters = searchTerm || dateRange || productFilter || paymentFilter;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por cliente"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        <DateRangePicker 
          date={dateRange}
          onDateChange={onDateRangeChange}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={productFilter} onValueChange={onProductFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os produtos</SelectItem>
            <SelectItem value="GLP P13">GLP P13</SelectItem>
            <SelectItem value="GLP P20">GLP P20</SelectItem>
            <SelectItem value="GLP P45">GLP P45</SelectItem>
            <SelectItem value="Água 20L">Água 20L</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Forma de Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
            <SelectItem value="Crédito">Crédito</SelectItem>
            <SelectItem value="Débito">Débito</SelectItem>
            <SelectItem value="PIX">PIX</SelectItem>
            <SelectItem value="Vale Gás">Vale Gás</SelectItem>
            <SelectItem value="Promissória">Promissória</SelectItem>
          </SelectContent>
        </Select>
        
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="icon"
            onClick={onClearFilters}
            className="h-10 w-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
