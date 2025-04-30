
import { SidebarLink } from "../SidebarLink";
import { adminNavItems } from "../navigation-config";

export const AdminNavigation = () => {
  return (
    <>
      {adminNavItems.map((item) => (
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
