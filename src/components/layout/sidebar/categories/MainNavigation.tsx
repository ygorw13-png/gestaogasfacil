
import { SidebarLink } from "../SidebarLink";
import { mainNavItems } from "../navigation-config";

export const MainNavigation = () => {
  return (
    <>
      {mainNavItems.map((item) => (
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
