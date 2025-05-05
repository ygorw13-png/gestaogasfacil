
import { FileBarChart, DollarSign } from "lucide-react";
import { SidebarLink } from "../SidebarLink";

export const FinanceNavigation = () => {
  return (
    <>
      <SidebarLink to="/finance/expenses" icon={DollarSign} label="Despesas" />
      <SidebarLink to="/finance/dashboard" icon={FileBarChart} label="Dashboard" />
    </>
  );
};
