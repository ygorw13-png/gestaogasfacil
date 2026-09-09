
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { SHORTCUT_BY_PATH } from "@/lib/shortcuts";
import { useSidebarOpen } from "@/hooks/useSidebarOpen";

interface SidebarLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

export const SidebarLink = ({ to, icon: Icon, label, className }: SidebarLinkProps) => {
  const { showLabels, isMobile } = useSidebarOpen();
  const shortcut = SHORTCUT_BY_PATH[to];

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
      {showLabels && label && <span className="truncate">{label}</span>}
      {showLabels && shortcut && !isMobile && (
        <span className="ml-auto text-[10px] leading-none text-muted-foreground/70">
          {shortcut}
        </span>
      )}
    </NavLink>
  );
};
