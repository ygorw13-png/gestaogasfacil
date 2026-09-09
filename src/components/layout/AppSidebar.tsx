
import React, { useEffect, useCallback, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar/SidebarNav";
import { useLocation } from "react-router-dom";

interface SidebarHeaderProps {
  isOpen: boolean;
  isMobile: boolean;
  onToggle: () => void;
}

const SidebarHeader = memo(({ isOpen, isMobile, onToggle }: SidebarHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4">
      {isOpen && (
        <h2 className="text-xl font-bold tracking-tight">GásFácil</h2>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="h-8 w-8"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isMobile && isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
    </div>
  );
});

SidebarHeader.displayName = 'SidebarHeader';

function AppSidebarComponent() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const sidebar = useSidebar();
  const isOpen = sidebar.state === "expanded";
  const toggleSidebar = useCallback(() => sidebar.toggleSidebar(), [sidebar]);
  const location = useLocation();
  const wasMobile = useRef<boolean | null>(null);

  // Fecha o menu ao trocar de página no celular/tablet
  useEffect(() => {
    if (isMobile && isOpen) {
      sidebar.setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Ao mudar para celular/tablet, começa com o menu fechado (apenas uma vez)
  useEffect(() => {
    if (wasMobile.current === null) {
      wasMobile.current = isMobile;
      if (isMobile && isOpen) sidebar.setOpen(false);
      return;
    }
    if (wasMobile.current !== isMobile) {
      wasMobile.current = isMobile;
      sidebar.setOpen(!isMobile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  if (!user) return null;

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-30 flex h-[100dvh] flex-col border-r bg-background transition-transform duration-300",
        isMobile ? "w-72 max-w-[85vw]" : (isOpen ? "w-64" : "w-16"),
        isMobile ? (isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full") : "translate-x-0"
      )}>
        <SidebarHeader isOpen={isOpen || isMobile} isMobile={isMobile} onToggle={toggleSidebar} />
        <Separator />
        <SidebarNav />
      </aside>
    </>
  );
}

export const AppSidebar = memo(AppSidebarComponent);

