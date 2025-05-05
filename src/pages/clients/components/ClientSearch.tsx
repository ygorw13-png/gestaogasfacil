
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClientSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function ClientSearch({ searchTerm, setSearchTerm }: ClientSearchProps) {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar cliente por nome, telefone ou endereço..."
        className="pl-8"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}
