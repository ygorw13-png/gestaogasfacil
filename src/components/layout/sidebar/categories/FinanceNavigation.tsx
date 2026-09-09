import { DollarSign, Truck, Wallet, BadgePercent, ScrollText } from "lucide-react";
import { AccordionMenu, AccordionMenuItem } from "../AccordionMenu";
import { SidebarLink } from "../SidebarLink";
import { useSidebarOpen } from "@/hooks/useSidebarOpen";

export const FinanceNavigation = () => {
  const { showLabels } = useSidebarOpen();

  if (!showLabels) {

    return (
      <>
        <SidebarLink to="/finance/expenses" icon={DollarSign} label="Despesas" />
        <SidebarLink to="/fleet" icon={Truck} label="Frota" />
        <SidebarLink to="/comissoes" icon={BadgePercent} label="Comissões" />
        <SidebarLink to="/finance/cheques" icon={ScrollText} label="Troca de Cheques" />
      </>
    );
  }

  return (
    <AccordionMenu icon={Wallet} label="Financeiro" value="financeiro">
      <AccordionMenuItem to="/finance/expenses" label="Despesas" />
      <AccordionMenuItem to="/fleet" label="Frota (veículos e custos)" />
      <AccordionMenuItem to="/comissoes" label="Comissões" />
      <AccordionMenuItem to="/finance/cheques" label="Troca de Cheques" />
    </AccordionMenu>
  );
};
