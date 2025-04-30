
import { FileBarChart, Settings } from "lucide-react";
import { SidebarLink } from "../SidebarLink";

export const FinanceNavigation = () => {
  return (
    <>
      <SidebarLink to="/finance/expenses" icon={FileBarChart} label="Finanças" />
      <SidebarLink to="/settings" icon={Settings} label="Configurações" />
    </>
  );
};
