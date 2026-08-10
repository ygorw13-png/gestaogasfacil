
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tags, Search } from "lucide-react";
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
import { Reseller } from "../../../resellers/types";

interface ResellerSelectionProps {
  selectedReseller: Reseller | null;
  onSelectReseller: (reseller: Reseller) => void;
  resellers: Reseller[];
  showPrices: boolean;
}

export function ResellerSelection({ selectedReseller, onSelectReseller, resellers, showPrices }: ResellerSelectionProps) {
  const [resellerSearchOpen, setResellerSearchOpen] = useState(false);

  const handleSelectReseller = (reseller: Reseller) => {
    onSelectReseller(reseller);
    setResellerSearchOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>Agregado</Label>
      <div className="flex gap-2">
        <Popover open={resellerSearchOpen} onOpenChange={setResellerSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              className="w-full justify-between"
            >
              {selectedReseller ? selectedReseller.name : "Selecionar agregado"}
              <Search className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0">
            <Command>
              <CommandInput placeholder="Buscar agregado..." />
              <CommandEmpty>Nenhum agregado encontrado.</CommandEmpty>
              <CommandList>
                <CommandGroup heading="Agregados">
                  {resellers.map((reseller) => (
                    <CommandItem
                      key={reseller.id}
                      onSelect={() => handleSelectReseller(reseller)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span>{reseller.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {reseller.phone} 
                          {showPrices && reseller.priceP13 > 0 && (
                            <span className="ml-2 text-green-600">
                              P13: R${reseller.priceP13.toFixed(2)}
                            </span>
                          )}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon">
          <Tags className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
