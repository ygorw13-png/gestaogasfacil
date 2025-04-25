import { useState } from "react";
import { Order } from "./types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewOrderFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: Order) => void;
}

export default function NewOrderForm({ isOpen, onOpenChange, onSubmit }: NewOrderFormProps) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [product, setProduct] = useState("GLP P13");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(120.00);
  const [hasEmptyCylinder, setHasEmptyCylinder] = useState(false);
  const [isCompletePackage, setIsCompletePackage] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    const newOrder: Order = {
      id: "",
      clientName,
      clientPhone,
      address: {
        street,
        number,
        complement,
        neighborhood,
      },
      product,
      quantity,
      price,
      hasEmptyCylinder,
      isCompletePackage,
      createdAt: new Date(),
      status: "pending",
      notes,
    };

    onSubmit(newOrder);
    onOpenChange(false);
    clearForm();
  };

  const clearForm = () => {
    setClientName("");
    setClientPhone("");
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setProduct("GLP P13");
    setQuantity(1);
    setPrice(120.00);
    setHasEmptyCylinder(false);
    setIsCompletePackage(false);
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para registrar um novo pedido.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientName" className="text-right">
              Cliente
            </Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientPhone" className="text-right">
              Telefone
            </Label>
            <Input
              type="tel"
              id="clientPhone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="street" className="text-right">
              Rua
            </Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="number" className="text-right">
              Número
            </Label>
            <Input
              id="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="complement" className="text-right">
              Complemento
            </Label>
            <Input
              id="complement"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="neighborhood" className="text-right">
              Bairro
            </Label>
            <Input
              id="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right">
              Produto
            </Label>
            <Select value={product} onValueChange={setProduct} className="col-span-3">
              <SelectTrigger id="product">
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLP P13">GLP P13</SelectItem>
                <SelectItem value="GLP P45">GLP P45</SelectItem>
                <SelectItem value="Água 20L">Água 20L</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantidade
            </Label>
            <Input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Preço
            </Label>
            <Input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hasEmptyCylinder" className="text-right">
              <span className="inline-block text-right">
                Possui <br />
                Vasilhame
              </span>
            </Label>
            <Checkbox
              id="hasEmptyCylinder"
              checked={hasEmptyCylinder}
              onCheckedChange={(checked) => setHasEmptyCylinder(!!checked)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isCompletePackage" className="text-right">
              Pacote Completo
            </Label>
            <Checkbox
              id="isCompletePackage"
              checked={isCompletePackage}
              onCheckedChange={(checked) => setIsCompletePackage(!!checked)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right mt-2">
              Observações
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Alguma observação?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => { onOpenChange(false); clearForm(); }}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
