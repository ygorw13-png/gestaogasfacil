
import { Package, ReceiptText, Truck, CalendarCheck } from "lucide-react";
import { SidebarLink } from "../SidebarLink";

export const InventoryNavigation = () => {
  return (
    <>
      <SidebarLink to="/inventory" icon={Package} label="Estoque" />
      <SidebarLink to="/promissory" icon={ReceiptText} label="Promissórias" />
      <SidebarLink to="/routes" icon={Truck} label="Rotas" />
      <SidebarLink to="/resellers" icon={CalendarCheck} label="Revendedores" />
      <SidebarLink to="/fleet" icon={Truck} label="Frota" />
    </>
  );
};
