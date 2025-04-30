
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar/SidebarNav";

export function AppSidebar() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const sidebar = useSidebar();
  const isOpen = sidebar.state === "expanded";
  const toggleSidebar = sidebar.toggleSidebar;
  
  useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        sidebar.toggleSidebar();
      }
    } else {
      if (!isOpen) {
        sidebar.toggleSidebar();
      }
    }
  }, [isMobile, isOpen, sidebar]);
  
  if (!user) return null;

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-background transition-all duration-300",
      isOpen ? "w-64" : "w-16",
      isMobile ? "transform -translate-x-full md:translate-x-0" : ""
    )}>
      <div className="flex items-center justify-between p-4">
        {isOpen && (
          <h2 className="text-xl font-bold tracking-tight">GasFlow Aqua</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      
      <Separator />
      
      <SidebarNav />
    </aside>
  );
}
