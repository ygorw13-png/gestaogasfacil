
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Suspense, lazy } from "react";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CashierData } from "./pages/entrance/types/cashierTypes";

// Lazy loaded pages for better performance
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
const RoutesPage = lazy(() => import("./pages/routes/RoutesPage"));
const Resellers = lazy(() => import("./pages/resellers/Resellers"));
const Fleet = lazy(() => import("./pages/fleet/Fleet"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Expenses = lazy(() => import("./pages/finance/Expenses"));
const Colaboradores = lazy(() => import("./pages/colaboradores/Colaboradores"));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Initial empty cashier data with all required properties
const initialCashierData: CashierData = {
  cash: 0,
  credit: 0,
  debit: 0,
  pix: 0,
  promissory: 0,
  gasVoucher: 0,
  totalSales: 0,
  quantities: {
    cash: { p13: 0, p20: 0, p45: 0, water: 0 },
    credit: { p13: 0, p20: 0, p45: 0, water: 0 },
    debit: { p13: 0, p20: 0, p45: 0, water: 0 },
    pix: { p13: 0, p20: 0, p45: 0, water: 0 },
    promissory: { p13: 0, p20: 0, p45: 0, water: 0 },
    gasVoucher: { p13: 0, p20: 0, p45: 0, water: 0 }
  },
  inventoryMovements: []
};

// Componente de proteção para rotas autenticadas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-gasflow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          {/* Rota raiz redireciona para dashboard (que é protegido) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/404" element={<NotFound />} />
          
          {/* Rotas protegidas com AppLayout */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="/clients" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Clients />
              </Suspense>
            } />
            <Route path="/orders" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Orders />
              </Suspense>
            } />
            <Route path="/orders/map" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <OrdersMap orders={[]} />
              </Suspense>
            } />
            <Route path="/orders/new" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <NewOrderForm onSubmit={() => {}} />
              </Suspense>
            } />
            <Route path="/orders/:id" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <OrderDetails orderId="" orders={[]} isOpen={false} onOpenChange={() => {}} />
              </Suspense>
            } />
            <Route path="/entrance" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <EntranceSales />
              </Suspense>
            } />
            <Route path="/entrance/new-sale" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <NewSaleForm isOpen={false} onOpenChange={() => {}} onSubmit={() => {}} />
              </Suspense>
            } />
            <Route path="/entrance/history" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <SalesHistory />
              </Suspense>
            } />
            <Route path="/entrance/cashier" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <CashierClosing isOpen={false} onOpenChange={() => {}} onSubmit={() => {}} cashierData={initialCashierData} />
              </Suspense>
            } />
            <Route path="/inventory" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Inventory />
              </Suspense>
            } />
            <Route path="/promissory" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Promissory />
              </Suspense>
            } />
            <Route path="/routes" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <RoutesPage />
              </Suspense>
            } />
            <Route path="/resellers" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Resellers />
              </Suspense>
            } />
            <Route path="/fleet" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Fleet />
              </Suspense>
            } />
            <Route path="/finance/expenses" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Expenses />
              </Suspense>
            } />
            <Route path="/settings" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Settings />
              </Suspense>
            } />
            <Route path="/colaboradores" element={
              <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
                <Colaboradores />
              </Suspense>
            } />
          </Route>
          
          {/* Rota coringa para páginas não encontradas */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <Toaster richColors closeButton position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
