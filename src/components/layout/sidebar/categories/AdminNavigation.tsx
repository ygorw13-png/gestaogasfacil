
import { useState } from "react";
import { Users, Settings } from "lucide-react";
import { SidebarLink } from "../SidebarLink";
import { AccordionMenu, AccordionMenuItem } from "../AccordionMenu";

export const AdminNavigation = () => {
  const [accordionValue, setAccordionValue] = useState("");
  
  return (
    <>
      <SidebarLink
        to="/colaboradores"
        icon={Users}
        label="Colaboradores"
        aria-label="Gerenciar colaboradores"
      />
      
      <AccordionMenu
        icon={Settings}
        label="Configurações"
        value="settings"
        accordionValue={accordionValue}
        onValueChange={setAccordionValue}
        aria-label="Menu de configurações do sistema"
      >
        <AccordionMenuItem 
          to="/settings" 
          label="Gerais" 
          aria-label="Configurações gerais do sistema"
        />
      </AccordionMenu>
    </>
  );
};
