import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { Suspense, lazy } from "react";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "./components/ui/sidebar";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { enforceHttps } from "./utils/securityUtils";
import { SecurityHeaders } from "./components/security/SecurityHeaders";
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from "react";
import { AuthGuard } from "./components/ui/AuthGuard";
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
const OrderDetails = lazy(() => import("./pages/orders/OrderDetails"));
const NewOrderForm = lazy(() => import("./pages/orders/NewOrderForm"));
const OrdersMap = lazy(() => import("./pages/orders/OrdersMap"));
const EntranceSales = lazy(() => import("./pages/entrance/EntranceSales"));
const NewSaleForm = lazy(() => import("./pages/entrance/NewSaleForm"));
const SalesHistory = lazy(() => import("./pages/entrance/SalesHistory"));
const CashierClosing = lazy(() => import("./pages/entrance/CashierClosing"));
const Inventory = lazy(() => import("./pages/inventory/Inventory"));
const Promissory = lazy(() => import("./pages/promissory/Promissory"));
const RoutesPage = lazy(() => import("./pages/routes/routes/RoutesPage"));
const Resellers = lazy(() => import("./pages/resellers/Resellers"));
const Fleet = lazy(() => import("./pages/fleet/Fleet"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Expenses = lazy(() => import("./pages/finance/Expenses"));
const Colaboradores = lazy(() => import("./pages/colaboradores/Colaboradores"));
const MinhasEntregas = lazy(() => import("./pages/entregador/MinhasEntregas"));
const CadastroRapido = lazy(() => import("./pages/entregador/CadastroRapido"));
const VendaRua = lazy(() => import("./pages/entregador/VendaRua"));
const AcertoEntregadores = lazy(() => import("./pages/entrance/AcertoEntregadores"));
const Recompra = lazy(() => import("./pages/recompra/Recompra"));


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
              <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
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
                    <OrdersMap orders={[]} />
                  </Suspense>
                } />
                <Route path="/orders/new" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <NewOrderForm onSubmit={() => {}} />
                  </Suspense>
                } />
                <Route path="/orders/:id" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <OrderDetails orderId="" orders={[]} isOpen={false} onOpenChange={() => {}} />
                  </Suspense>
                } />
                <Route path="/entrance" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <EntranceSales />
                  </Suspense>
                } />
                <Route path="/entrance/new-sale" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <NewSaleForm isOpen={false} onOpenChange={() => {}} onSubmit={() => {}} />
                  </Suspense>
                } />
                <Route path="/entrance/history" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <SalesHistory />
                  </Suspense>
                } />
                <Route path="/entrance/cashier" element={
                  <Suspense fallback={<LoadingComponent />}>
                    <CashierClosing isOpen={false} onOpenChange={() => {}} onSubmit={() => {}} cashierData={null} />
                  </Suspense>
                } />
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
                <Route path="/entrance/acerto-entregadores" element={
                  <Suspense fallback={<LoadingComponent />}><AcertoEntregadores /></Suspense>
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
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
