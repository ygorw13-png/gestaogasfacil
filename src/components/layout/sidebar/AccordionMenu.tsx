
import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { LucideIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AccordionMenuItemProps {
  to: string;
  label: string;
  isEnd?: boolean;
  badge?: number;
}

const AccordionMenuItem = ({ to, label, isEnd = false, badge }: AccordionMenuItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        cn(
          "flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
          isActive ? "text-foreground bg-accent" : "hover:bg-muted"
        )
      }
      end={isEnd}
    >
      <span>{label}</span>
      {!!badge && badge > 0 && (
        <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

interface AccordionMenuProps {
  icon: LucideIcon;
  label: string;
  value: string;
  badge?: number;
  accordionValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export const AccordionMenu = ({ 
  icon: Icon, 
  label, 
  value, 
  badge,
  accordionValue, 
  onValueChange, 
  children 
}: AccordionMenuProps) => {
  const sidebar = useSidebar();
  const isOpen = sidebar.state === "expanded";
  
  if (!isOpen) {
    return (
      <NavLink
        to={`/${value.toLowerCase()}`}
        className={({ isActive }) => 
          cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
            isActive ? "text-foreground bg-accent" : "hover:bg-muted"
          )
        }
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
      </NavLink>
    );
  }

  return (
    <Accordion 
      type="single" 
      collapsible 
      className="w-full"
      value={accordionValue === value ? value : undefined}
      onValueChange={onValueChange ? (val) => onValueChange(val === value ? value : "") : undefined}
    >
      <AccordionItem value={value} className="border-none">
        <AccordionTrigger className="py-2 hover:bg-muted rounded-lg px-3 hover:no-underline">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
            {!!badge && badge > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground">
                {badge}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pl-9 space-y-2 pt-2">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export { AccordionMenuItem };
