
import React, { useEffect, useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar/SidebarNav";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface SidebarHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SidebarHeader = memo(({ isOpen, onToggle }: SidebarHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4">
      {isOpen && (
        <h2 className="text-xl font-bold tracking-tight">GasFlow Aqua</h2>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="h-8 w-8"
        aria-label="Alternar menu"
      >
        <Menu className="h-4 w-4" />
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
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    try {
      if (isMobile) {
        if (isOpen) {
          sidebar.toggleSidebar();
        }
      }
    } catch (err) {
      console.error("Erro na operação do sidebar:", err);
      setError(err instanceof Error ? err : new Error("Erro ao manipular o menu lateral"));
    }
  }, [isMobile, isOpen, sidebar]);
  
  if (!user) return null;

  return (
    <>
      {error && (
        <Alert variant="destructive" className="fixed top-5 left-5 right-5 z-50 max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao manipular o menu lateral. Tente recarregar a página.
          </AlertDescription>
        </Alert>
      )}
      
      <aside className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-background transition-all duration-300",
        isOpen ? "w-64" : "w-16",
        isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
      )}>
        <SidebarHeader isOpen={isOpen} onToggle={toggleSidebar} />
        <Separator />
        <SidebarNav />
      </aside>
    </>
  );
}

export const AppSidebar = memo(AppSidebarComponent);
