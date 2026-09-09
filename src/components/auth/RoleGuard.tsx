import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/** Rotas que um entregador pode acessar. */
const ENTREGADOR_ALLOWED = [
  "/entregador/entregas",
  "/entregador/venda-rua",
  "/entregador/cadastro",
];

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { isEntregador, isLoading } = useUserRole();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" message="Carregando..." />
      </div>
    );
  }

  if (isEntregador) {
    const allowed = ENTREGADOR_ALLOWED.some((p) => location.pathname.startsWith(p));
    if (!allowed) return <Navigate to="/entregador/entregas" replace />;
  }

  return <>{children}</>;
}
