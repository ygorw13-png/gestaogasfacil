
import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

interface NavCategoryProps {
  children: ReactNode;
  title?: string;
  showSeparator?: boolean;
}

export const NavCategory = ({ 
  children, 
  title, 
  showSeparator = false 
}: NavCategoryProps) => {
  return (
    <div className="space-y-2">
      {title && <h2 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">{title}</h2>}
      <div className="space-y-1">
        {children}
      </div>
      {showSeparator && <Separator className="my-2" />}
    </div>
  );
};
