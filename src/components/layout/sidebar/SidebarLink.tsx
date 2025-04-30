
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { LucideIcon } from "lucide-react";

interface SidebarLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

export const SidebarLink = ({ to, icon: Icon, label, className }: SidebarLinkProps) => {
  const sidebar = useSidebar();
  const isOpen = sidebar.state === "expanded";
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
          isActive ? "text-foreground bg-accent" : "hover:bg-muted",
          className
        )
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {isOpen && label && <span className="truncate">{label}</span>}
    </NavLink>
  );
};
