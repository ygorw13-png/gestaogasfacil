
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users, Search } from "lucide-react";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Mock clients for search
const clients = [
  { id: 1, name: "Maria Silva", phone: "(11) 98765-4321", type: "Regular" },
  { id: 2, name: "João Oliveira", phone: "(11) 91234-5678", type: "Regular" },
  { id: 3, name: "Supermercado ABC", phone: "(11) 3333-4444", type: "Convênio" },
  { id: 4, name: "José Distribuidora", phone: "(11) 97777-8888", type: "Agregado" },
  { id: 5, name: "Restaurante Sabor", phone: "(11) 95555-6666", type: "Convênio" },
];

interface NewSaleFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export default function NewSaleForm({ isOpen, onOpenChange, onSubmit }: NewSaleFormProps) {
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);
  const [loanGas, setLoanGas] = useState(false);

  const handleSelectClient = (client: typeof clients[0]) => {
    setSelectedClient(client);
    setClientSearchOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          <span>Nova Venda</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Nova Venda</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para registrar uma nova venda na portaria.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedClient ? selectedClient.name : "Selecionar cliente"}
                      <Search className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandList>
                        <CommandGroup heading="Clientes">
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              onSelect={() => handleSelectClient(client)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span>{client.name}</span>
                                <span className="text-xs text-muted-foreground">{client.phone}</span>
                              </div>
                              <span className="text-xs ml-auto bg-muted px-2 py-0.5 rounded-full">
                                {client.type}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="outline" size="icon">
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="promissory">Promissória</SelectItem>
                  <SelectItem value="voucher">Vale Gás</SelectItem>
                  <SelectItem value="partner">Convênio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Produto</Label>
              <Select>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p13">GLP P13</SelectItem>
                  <SelectItem value="p20">GLP P20</SelectItem>
                  <SelectItem value="p45">GLP P45</SelectItem>
                  <SelectItem value="water">Água 20L</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input type="number" id="quantity" defaultValue="1" min="1" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Valor Unitário (R$)</Label>
              <Input type="number" id="unitPrice" step="0.01" defaultValue="120.00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice">Valor Total (R$)</Label>
              <Input type="number" id="totalPrice" step="0.01" defaultValue="120.00" readOnly />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="loanGas" checked={loanGas} onCheckedChange={(checked) => setLoanGas(!!checked)} />
            <Label htmlFor="loanGas" className="text-sm font-normal">
              Empréstimo de casco (cliente não está devolvendo casco vazio)
            </Label>
          </div>

          {loanGas && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-amber-800 text-sm">
                Empréstimo de casco registrado. Um casco vazio ficará pendente para este cliente.
              </p>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <div className="hidden sm:block">
              <Button 
                type="button" 
                variant="link"
                className="text-destructive"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Venda</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
