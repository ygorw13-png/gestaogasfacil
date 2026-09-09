import { useCallback } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Estado unificado do menu lateral.
 * No celular/tablet o menu é uma gaveta (openMobile); no desktop ele expande/recolhe.
 */
export function useSidebarOpen() {
  const sidebar = useSidebar();
  const isMobile = useIsMobile();

  const isOpen = isMobile ? sidebar.openMobile : sidebar.state === "expanded";
  // No celular a gaveta sempre mostra os textos completos
  const showLabels = isMobile ? true : sidebar.state === "expanded";

  const toggle = useCallback(() => {
    if (isMobile) sidebar.setOpenMobile(!sidebar.openMobile);
    else sidebar.setOpen(sidebar.state !== "expanded");
  }, [isMobile, sidebar]);

  const close = useCallback(() => {
    if (isMobile) sidebar.setOpenMobile(false);
  }, [isMobile, sidebar]);

  return { isMobile, isOpen, showLabels, toggle, close };
}
