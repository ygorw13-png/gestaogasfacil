
import { Store, Receipt, CreditCard } from "lucide-react";
import { SidebarLink } from "../SidebarLink";

export const EntranceNavigation = () => {
  return (
    <>
      <SidebarLink to="/entrance" icon={Store} label="Vendas Balcão" />
      <SidebarLink to="/entrance/history" icon={Receipt} label="Histórico" />
      <SidebarLink to="/entrance/cashier" icon={CreditCard} label="Caixa" />
    </>
  );
};
