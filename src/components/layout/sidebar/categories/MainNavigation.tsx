
import { BarChart3, Users, Briefcase } from "lucide-react";
import { SidebarLink } from "../SidebarLink";

export const MainNavigation = () => {
  return (
    <>
      <SidebarLink to="/dashboard" icon={BarChart3} label="Dashboard" />
      <SidebarLink to="/clients" icon={Users} label="Clientes" />
      <SidebarLink to="/colaboradores" icon={Briefcase} label="Colaboradores" />
    </>
  );
};
