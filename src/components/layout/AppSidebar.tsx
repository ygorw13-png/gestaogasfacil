
import { useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar/SidebarNav";
import { useSidebarOpen } from "@/hooks/useSidebarOpen";
import { useLocation } from "react-router-dom";

function AppSidebarComponent() {
  const { user } = useAuth();
  const { isMobile, isOpen, showLabels, toggle, close } = useSidebarOpen();
  const location = useLocation();

  // Fecha a gaveta ao navegar no celular/tablet
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!user) return null;

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50"
          onClick={toggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-[100dvh] flex-col border-r bg-background transition-transform duration-300",
          isMobile ? "w-72 max-w-[85vw]" : showLabels ? "w-64" : "w-16",
          isMobile ? (isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full") : "translate-x-0"
        )}
        aria-hidden={isMobile && !isOpen}
      >
        <div className="flex items-center justify-between p-4">
          {showLabels && <h2 className="text-xl font-bold tracking-tight">GásFácil</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 max-md:h-11 max-md:w-11"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isMobile ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
        <Separator />
        <SidebarNav />
      </aside>
    </>
  );
}

export const AppSidebar = memo(AppSidebarComponent);
