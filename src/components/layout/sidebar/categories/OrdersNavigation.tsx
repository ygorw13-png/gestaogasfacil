
import { ShoppingCart, Store, Receipt, CreditCard } from "lucide-react";
import { AccordionMenu, AccordionMenuItem } from "../AccordionMenu";
import { useState } from "react";
import { SidebarLink } from "../SidebarLink";

export const OrdersNavigation = () => {
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);

  return (
    <>
      <AccordionMenu 
        icon={ShoppingCart} 
        label="Pedidos" 
        value="orders"
        accordionValue={accordionValue} 
        onValueChange={(value) => setAccordionValue(value)}
      >
        <AccordionMenuItem to="/orders" label="Lista de Pedidos" isEnd />
        <AccordionMenuItem to="/orders/map" label="Mapa de Entregas" />
      </AccordionMenu>
      
      {/* Entrance section (former EntranceNavigation) */}
      <AccordionMenu 
        icon={Store} 
        label="Portaria" 
        value="entrance"
        accordionValue={accordionValue} 
        onValueChange={(value) => setAccordionValue(value)}
      >
        <AccordionMenuItem to="/entrance" label="Vendas" isEnd />
        <AccordionMenuItem to="/entrance/history" label="Histórico" />
        <AccordionMenuItem to="/entrance/cashier" label="Fechamento" />
      </AccordionMenu>
    </>
  );
};
