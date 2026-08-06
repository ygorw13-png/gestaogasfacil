
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AccordionMenu, AccordionMenuItem } from "../AccordionMenu";
import { ordersNavItems } from "../navigation-config";

export const OrdersNavigation = () => {
  const { pathname } = useLocation();

  // Mantém aberto o grupo que contém a rota atual
  const activeSection = ordersNavItems.find((section) =>
    section.items.some((item) => pathname.startsWith(item.to))
  )?.value;

  const [accordionValue, setAccordionValue] = useState<string | undefined>(activeSection);

  return (
    <>
      {ordersNavItems.map((section) => (
        <AccordionMenu 
          key={section.value}
          icon={section.icon} 
          label={section.label} 
          value={section.value}
          accordionValue={accordionValue ?? activeSection} 
          onValueChange={(value) => setAccordionValue(value)}
        >
          {section.items.map((item) => (
            <AccordionMenuItem 
              key={item.to}
              to={item.to} 
              label={item.label} 
              isEnd={item.isEnd} 
            />
          ))}
        </AccordionMenu>
      ))}
    </>
  );
};
