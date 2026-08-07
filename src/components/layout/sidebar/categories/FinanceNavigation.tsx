import { DollarSign, Truck, Wallet, BadgePercent } from "lucide-react";
import { AccordionMenu, AccordionMenuItem } from "../AccordionMenu";
import { SidebarLink } from "../SidebarLink";
import { useSidebar } from "@/components/ui/sidebar";

export const FinanceNavigation = () => {
  const sidebar = useSidebar();

  if (sidebar.state !== "expanded") {
    return (
      <>
        <SidebarLink to="/finance/expenses" icon={DollarSign} label="Despesas" />
        <SidebarLink to="/fleet" icon={Truck} label="Frota" />
        <SidebarLink to="/comissoes" icon={BadgePercent} label="Comissões" />
      </>
    );
  }

  return (
    <AccordionMenu icon={Wallet} label="Financeiro" value="financeiro">
      <AccordionMenuItem to="/finance/expenses" label="Despesas" />
      <AccordionMenuItem to="/fleet" label="Frota (veículos e custos)" />
      <AccordionMenuItem to="/comissoes" label="Comissões" />
    </AccordionMenu>
  );
};

