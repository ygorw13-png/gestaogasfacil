
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
      />
      
      <AccordionMenu
        icon={Settings}
        label="Configurações"
        value="settings"
        accordionValue={accordionValue}
        onValueChange={setAccordionValue}
      >
        <AccordionMenuItem 
          to="/settings" 
          label="Gerais" 
        />
      </AccordionMenu>
    </>
  );
};
