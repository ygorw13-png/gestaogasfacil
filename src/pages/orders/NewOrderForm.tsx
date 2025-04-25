import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PlusCircle, Search, PhoneCall } from "lucide-react";
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
import { Order } from "./Orders";
import { Order } from "./types";

// Mock client data
const mockClients = [
  { 
    id: "1", 
    name: "Maria Oliveira", 
    phone: "(11) 98765-4321",
    address: {
      street: "Rua das Flores",
      number: "123",
      complement: "Apto 45",
      neighborhood: "Centro"
    }
  },
  { 
    id: "2", 
    name: "João Silva", 
    phone: "(11) 91234-5678",
    address: {
      street: "Avenida Paulista",
      number: "1500",
      complement: "Bloco B",
      neighborhood: "Bela Vista"
    }
  },
  { 
    id: "3", 
    name: "Restaurante Sabor", 
    phone: "(11) 3333-4444",
    address: {
      street: "Rua Augusta",
      number: "890",
      neighborhood: "Consolação"
    }
  },
  { 
    id: "4", 
    name: "Ana Souza", 
    phone: "(11) 99876-5432",
    address: {
      street: "Rua Direita",
      number: "45",
      complement: "Casa",
      neighborhood: "Jardim Europa"
    }
  },
  { 
    id: "5", 
    name: "Mercado Bom Preço", 
    phone: "(11) 3222-1111",
    address: {
      street: "Avenida Brasil",
      number: "789",
      neighborhood: "Moema"
    }
  },
];

// Product options
const products = [
  { id: "p13", name: "GLP P13", price: 120.00 },
  { id: "p20", name: "GLP P20", price: 190.00 },
  { id: "p45", name: "GLP P45", price: 360.00 },
  { id: "water", name: "Água 20L", price: 12.00 },
];

interface NewOrderFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: Order) => void;
}

export default function NewOrderForm({ isOpen, onOpenChange, onSubmit }: NewOrderFormProps) {
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<typeof mockClients[0] | null>(null);
  const [hasEmptyCylinder, setHasEmptyCylinder] = useState(true);
  const [isCompletePackage, setIsCompletePackage] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  
  // Manual address input fields
  const [street, setStreet] = useState<string>("");
  const [number, setNumber] = useState<string>("");
  const [complement, setComplement] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");

  // Update price when product or quantity changes
  useEffect(() => {
    const product = products.find(p => p.id === selectedProduct);
    if (product) {
      setUnitPrice(product.price);
    }
  }, [selectedProduct]);

  const handleSelectClient = (client: typeof mockClients[0]) => {
    setSelectedClient(client);
    setClientSearchOpen(false);
    setClientName(client.name);
    setStreet(client.address.street);
    setNumber(client.address.number);
    setComplement(client.address.complement || "");
    setNeighborhood(client.address.neighborhood || "");
    setPhone(client.phone);
  };

  const calculateTotalPrice = () => {
    return unitPrice * quantity;
  };

  const handlePackageTypeChange = (value: string) => {
    if (value === "complete") {
      setIsCompletePackage(true);
      setHasEmptyCylinder(false);
    } else if (value === "exchange") {
      setIsCompletePackage(false);
      setHasEmptyCylinder(true);
    } else {
      setIsCompletePackage(false);
      setHasEmptyCylinder(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newOrder: Order = {
      id: "",  // Will be set by parent component
      clientName: clientName,
      clientPhone: phone,
      address: {
        street,
        number,
        complement,
        neighborhood,
      },
      product: products.find(p => p.id === selectedProduct)?.name || "",
      quantity,
      price: calculateTotalPrice(),
      hasEmptyCylinder,
      isCompletePackage,
      createdAt: new Date(),
      status: "pending",
      notes,
    };
    
    onSubmit(newOrder);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedClient(null);
    setClientName("");
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setPhone("");
    setSelectedProduct("");
    setQuantity(1);
    setUnitPrice(0);
    setHasEmptyCylinder(true);
    setIsCompletePackage(false);
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle size={16} />
          <span>Novo Pedido</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Novo Pedido</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente e do pedido. Você pode buscar por um cliente existente ou cadastrar um novo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente */}
            <div className="space-y-2 md:col-span-2">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedClient ? selectedClient.name : "Buscar cliente"}
                      <Search className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandList>
                        <CommandGroup heading="Clientes">
                          {mockClients.map((client) => (
                            <CommandItem
                              key={client.id}
                              onSelect={() => handleSelectClient(client)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span>{client.name}</span>
                                <span className="text-xs text-muted-foreground">{client.phone}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="outline" size="icon">
                  <PhoneCall className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Nome do cliente */}
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input 
                id="clientName" 
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)} 
                placeholder="Nome do cliente"
                required
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Rua</Label>
              <Input 
                id="street" 
                value={street} 
                onChange={(e) => setStreet(e.target.value)} 
                placeholder="Rua"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input 
                id="number" 
                value={number} 
                onChange={(e) => setNumber(e.target.value)} 
                placeholder="Número"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input 
                id="neighborhood" 
                value={neighborhood} 
                onChange={(e) => setNeighborhood(e.target.value)} 
                placeholder="Bairro"
              />
            </div>
          </div>
          <div>
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input 
                id="complement" 
                value={complement} 
                onChange={(e) => setComplement(e.target.value)} 
                placeholder="Apartamento, casa, etc."
              />
            </div>
          </div>

          {/* Dados do pedido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Produto</Label>
              <Select 
                value={selectedProduct} 
                onValueChange={setSelectedProduct}
                required
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice">Valor Total (R$)</Label>
              <Input 
                id="totalPrice" 
                type="text" 
                value={calculateTotalPrice().toFixed(2).replace(".", ",")}
                readOnly 
                className="bg-muted"
              />
            </div>
          </div>

          {/* Tipo de venda */}
          {selectedProduct && selectedProduct !== "water" && (
            <div className="space-y-2 border-t pt-4">
              <Label>Tipo de Venda</Label>
              <RadioGroup 
                defaultValue="exchange"
                onValueChange={handlePackageTypeChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="exchange" id="exchange" />
                  <Label htmlFor="exchange" className="font-normal">Troca (cliente entrega vasilhame vazio)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="loan" id="loan" />
                  <Label htmlFor="loan" className="font-normal">Empréstimo (cliente não tem vasilhame para trocar)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="complete" id="complete" />
                  <Label htmlFor="complete" className="font-normal">Venda completa (gás + vasilhame)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea 
              id="notes" 
              placeholder="Observações adicionais sobre o pedido" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

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
              <Button type="submit">Registrar Pedido</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
