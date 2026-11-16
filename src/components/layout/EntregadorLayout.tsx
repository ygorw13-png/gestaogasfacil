import { NavLink, Outlet } from "react-router-dom";
import { Bike, Package, LogOut, Trophy, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useUserRole } from "@/hooks/useUserRole";
import { useTrackMyLocation } from "@/hooks/useEntregadorLocation";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { cn } from "@/lib/utils";
import { useAbrirPedidoDoAviso } from "@/hooks/usePushNotifications";

const tabs = [
  { to: "/entregador/entregas", icon: Package, label: "Entregas" },
  { to: "/entregador/venda-rua", icon: Bike, label: "Venda na Rua" },
  { to: "/entregador/carga", icon: Truck, label: "Minha Carga" },
  { to: "/entregador/perfil", icon: Trophy, label: "Desempenho" },
];

/**
 * Layout exclusivo do entregador: sem menu lateral, sem dashboard.
 * Atualiza a posição no mapa sempre que o app está aberto.
 */
export function EntregadorLayout() {
  const { signOut } = useAuth();
  const { name } = useUserRole();
  useTrackMyLocation(true, name);
  useAbrirPedidoDoAviso();

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background">
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b bg-card px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Entregador</p>
          <p className="truncate text-base font-semibold">{name ?? "Minhas entregas"}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()} aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <OfflineBanner />

      <ErrorBoundary>
        <main className="w-full flex-1 overflow-x-hidden p-3 pb-24">
          <Outlet />
        </main>
      </ErrorBoundary>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-card"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
