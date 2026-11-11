import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { Suspense } from "react";
import { lazyRetry as lazy } from "./utils/lazyRetry";
import { Toaster } from "sonner";
import { Toaster as AppToaster } from "@/components/ui/toaster";
import { OfflineSyncToasts } from "@/components/offline/OfflineSyncToasts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "./components/ui/sidebar";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { enforceHttps } from "./utils/securityUtils";
import { SecurityHeaders } from "./components/security/SecurityHeaders";
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from "react";
import { AuthGuard } from "./components/ui/AuthGuard";
import { RoleGuard } from "./components/auth/RoleGuard";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

// Authentication pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

// Lazy loading pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/clients/Clients"));
const Orders = lazy(() => import("./pages/orders/Orders"));
const OrdersMap = lazy(() => import("./pages/orders/OrdersMap"));
const EntranceSales = lazy(() => import("./pages/entrance/EntranceSales"));
const SalesHistory = lazy(() => import("./pages/entrance/SalesHistory"));
const Inventory = lazy(() => import("./pages/inventory/Inventory"));
const Promissory = lazy(() => import("./pages/promissory/Promissory"));
const RoutesPage = lazy(() => import("./pages/routes/routes/RoutesPage"));
const Resellers = lazy(() => import("./pages/resellers/Resellers"));
const Fleet = lazy(() => import("./pages/fleet/Fleet"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Expenses = lazy(() => import("./pages/finance/Expenses"));
const Comissoes = lazy(() => import("./pages/comissoes/Comissoes"));
const TrocaCheques = lazy(() => import("./pages/cheques/TrocaCheques"));

const Colaboradores = lazy(() => import("./pages/colaboradores/Colaboradores"));
const MinhasEntregas = lazy(() => import("./pages/entregador/MinhasEntregas"));
const CadastroRapido = lazy(() => import("./pages/entregador/CadastroRapido"));
const VendaRua = lazy(() => import("./pages/entregador/VendaRua"));
const PerfilEntregador = lazy(() => import("./pages/entregador/PerfilEntregador"));
const AcertoEntregadores = lazy(() => import("./pages/entrance/AcertoEntregadores"));
const Cargas = lazy(() => import("./pages/entrance/Cargas"));
const MinhaCarga = lazy(() => import("./pages/entregador/MinhaCarga"));
const Reversoes = lazy(() => import("./pages/reversoes/Reversoes"));
const HistoricoPortaria = lazy(() => import("./pages/entrance/HistoricoPortaria"));
const Recompra = lazy(() => import("./pages/recompra/Recompra"));
const RelatorioVasilhames = lazy(() => import("./pages/relatorios/RelatorioVasilhames"));
const Formularios = lazy(() => import("./pages/formularios/Formularios"));
const PontosRevenda = lazy(() => import("./pages/pontos/PontosRevenda"));
const PainelDoDia = lazy(() => import("./pages/admin/PainelDoDia"));
const StatusOffline = lazy(() => import("./pages/offline/StatusOffline"));
const ResponsiveTest = lazy(() => import("./pages/dev/ResponsiveTest"));


// Loading component for lazy loading
const LoadingComponent = () => (
  <div className="flex justify-center items-center p-8 h-screen">
    <LoadingSpinner size="lg" message="Carregando..." />
  </div>
);

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Force HTTPS in production environment
  useEffect(() => {
    enforceHttps();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="w-full min-h-screen bg-background">
            <SecurityHeaders />
            <ErrorBoundary>
            <Routes>
              {/* Root route checks authentication and redirects */}
              <Route path="/" element={<Index />} />
              
              {/* Public authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/404" element={<NotFound />} />
              
              {/* Protected routes with AppLayout - all accessible to authenticated users */}
              <Route element={<AuthGuard><RoleGuard><AppLayout /></RoleGuard></AuthGuard>}>
                <Route path="/dashboard" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Dashboard />
                  </Suspense>
                } />
                <Route path="/clients" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Clients />
                  </Suspense>
                } />
                <Route path="/orders" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Orders />
                  </Suspense>
                } />
                <Route path="/orders/map" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <OrdersMap />
                  </Suspense>
                } />
                {/* Acesso direto: o formulário fica no diálogo da tela de pedidos (antes abria um formulário que não gravava nada). */}
                <Route path="/orders/new" element={<Navigate to="/orders?novo=1" replace />} />
                {/* Detalhe sem dados carregados: volta para a lista. */}
                <Route path="/orders/:id" element={<Navigate to="/orders" replace />} />
                <Route path="/entrance" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <EntranceSales />
                  </Suspense>
                } />
                {/* Acesso direto: a venda é registrada no diálogo da portaria (antes o formulário não gravava nada). */}
                <Route path="/entrance/new-sale" element={<Navigate to="/entrance?venda=1" replace />} />
                <Route path="/entrance/history" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <SalesHistory />
                  </Suspense>
                } />
                {/* Fechamento de caixa: abre o diálogo real da portaria (antes renderizava sem dados). */}
                <Route path="/entrance/cashier" element={<Navigate to="/entrance?fechamento=1" replace />} />
                <Route path="/inventory" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Inventory />
                  </Suspense>
                } />
                <Route path="/promissory" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Promissory />
                  </Suspense>
                } />
                <Route path="/routes" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <RoutesPage />
                  </Suspense>
                } />
                <Route path="/painel" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <PainelDoDia />
                  </Suspense>
                } />
                <Route path="/pontos-revenda" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <PontosRevenda />
                  </Suspense>
                } />
                <Route path="/resellers" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Resellers />
                  </Suspense>
                } />
                <Route path="/fleet" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Fleet />
                  </Suspense>
                } />
                <Route path="/finance/expenses" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Expenses />
                  </Suspense>
                } />
                <Route path="/comissoes" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Comissoes />
                  </Suspense>
                } />
                <Route path="/finance/cheques" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <TrocaCheques />
                  </Suspense>
                } />

                <Route path="/settings" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Settings />
                  </Suspense>
                } />
                <Route path="/colaboradores" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <Colaboradores />
                  </Suspense>
                } />
                <Route path="/entregador/entregas" element={
                  <Suspense fallback={<LoadingComponent />}><MinhasEntregas /></Suspense>
                } />
                <Route path="/entregador/cadastro" element={
                  <Suspense fallback={<LoadingComponent />}><CadastroRapido /></Suspense>
                } />
                <Route path="/entregador/venda-rua" element={
                  <Suspense fallback={<LoadingComponent />}><VendaRua /></Suspense>
                } />
                <Route path="/entregador/perfil" element={
                  <Suspense fallback={<LoadingComponent />}><PerfilEntregador /></Suspense>
                } />
                <Route path="/entrance/cargas" element={
                  <Suspense fallback={<LoadingComponent />}><Cargas /></Suspense>
                } />
                <Route path="/entregador/carga" element={
                  <Suspense fallback={<LoadingComponent />}><MinhaCarga /></Suspense>
                } />
                <Route path="/reversoes" element={
                  <Suspense fallback={<LoadingComponent />}><Reversoes /></Suspense>
                } />
                <Route path="/entrance/acerto-entregadores" element={
                  <Suspense fallback={<LoadingComponent />}><AcertoEntregadores /></Suspense>
                } />
                <Route path="/entrance/historico-portaria" element={
                  <Suspense fallback={<LoadingComponent />}><HistoricoPortaria /></Suspense>
                } />
                <Route path="/relatorios/vasilhames" element={
                  <Suspense fallback={<LoadingComponent />}><RelatorioVasilhames /></Suspense>
                } />
                <Route path="/formularios" element={
                  <Suspense fallback={<LoadingComponent />}><Formularios /></Suspense>
                } />
                <Route path="/offline" element={
                  <Suspense fallback={<LoadingComponent />}><StatusOffline /></Suspense>
                } />
                <Route path="/dev/responsive" element={
                  <Suspense fallback={<LoadingComponent />}><ResponsiveTest /></Suspense>
                } />
                <Route path="/recompra" element={
                  <Suspense fallback={<LoadingComponent />}><Recompra /></Suspense>
                } />

              </Route>
              
              {/* Wildcard route for pages not found */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
            </ErrorBoundary>
            <Toaster richColors closeButton position="top-right" />
            {/* Avisos de useToast (erros e confirmações das telas) */}
            <AppToaster />
            <OfflineSyncToasts />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
