
import { useState } from "react";
import { 
  BarChart3, 
  ShoppingCart, 
  CalendarCheck, 
  Users, 
  FileBarChart, 
  ReceiptText, 
  Truck, 
  Settings, 
  Package, 
  DollarSign, 
  Briefcase 
} from "lucide-react";

import { SidebarLink } from "./SidebarLink";
import { AccordionMenu, AccordionMenuItem } from "./AccordionMenu";
import { Separator } from "@/components/ui/separator";

export const SidebarNav = () => {
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);

  return (
    <nav className="flex-1 overflow-auto p-3 space-y-2">
      <SidebarLink to="/dashboard" icon={BarChart3} label="Dashboard" />
      <SidebarLink to="/clients" icon={Users} label="Clientes" />
      <SidebarLink to="/colaboradores" icon={Briefcase} label="Colaboradores" />
      
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
      
      <AccordionMenu 
        icon={DollarSign} 
        label="Portaria" 
        value="entrance"
        accordionValue={accordionValue} 
        onValueChange={(value) => setAccordionValue(value)}
      >
        <AccordionMenuItem to="/entrance" label="Vendas" isEnd />
        <AccordionMenuItem to="/entrance/history" label="Histórico" />
        <AccordionMenuItem to="/entrance/cashier" label="Fechamento" />
      </AccordionMenu>
      
      <SidebarLink to="/inventory" icon={Package} label="Estoque" />
      <SidebarLink to="/promissory" icon={ReceiptText} label="Promissórias" />
      <SidebarLink to="/routes" icon={Truck} label="Rotas" />
      <SidebarLink to="/resellers" icon={CalendarCheck} label="Revendedores" />
      <SidebarLink to="/fleet" icon={Truck} label="Frota" />
      <SidebarLink to="/finance/expenses" icon={FileBarChart} label="Finanças" />
      
      <div className="p-4 mt-auto">
        <Separator className="my-2" />
        <SidebarLink to="/settings" icon={Settings} label="Configurações" className="mt-2" />
      </div>
    </nav>
  );
};
