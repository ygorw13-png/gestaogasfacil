
import { SidebarLink } from "../SidebarLink";
import { inventoryNavItems } from "../navigation-config";

export const InventoryNavigation = () => {
  return (
    <>
      {inventoryNavItems.map((item) => (
        <SidebarLink 
          key={item.to}
          to={item.to} 
          icon={item.icon} 
          label={item.label}
          aria-label={item.ariaLabel}
        />
      ))}
    </>
  );
};
