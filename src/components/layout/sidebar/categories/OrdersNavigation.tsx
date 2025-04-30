
import { useState } from "react";
import { AccordionMenu, AccordionMenuItem } from "../AccordionMenu";
import { ordersNavItems } from "../navigation-config";

export const OrdersNavigation = () => {
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);

  return (
    <>
      {ordersNavItems.map((section) => (
        <AccordionMenu 
          key={section.value}
          icon={section.icon} 
          label={section.label} 
          value={section.value}
          accordionValue={accordionValue} 
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
