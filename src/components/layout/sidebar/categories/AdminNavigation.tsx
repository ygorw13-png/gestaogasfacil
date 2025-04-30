
import { Users, Settings } from "lucide-react";
import { SidebarLink } from "../SidebarLink";

export const AdminNavigation = () => {
  return (
    <>
      <SidebarLink
        to="/colaboradores"
        icon={Users}
        label="Colaboradores"
        aria-label="Gerenciar colaboradores"
      />
      <SidebarLink
        to="/settings"
        icon={Settings}
        label="Configurações"
        aria-label="Configurações do sistema"
      />
    </>
  );
};
