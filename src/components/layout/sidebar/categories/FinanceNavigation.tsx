import { DollarSign, Truck, Wallet } from "lucide-react";
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
      </>
    );
  }

  return (
    <AccordionMenu icon={Wallet} label="Financeiro" value="financeiro">
      <AccordionMenuItem to="/finance/expenses" label="Despesas" />
      <AccordionMenuItem to="/fleet" label="Frota (veículos e custos)" />
    </AccordionMenu>
  );
};
