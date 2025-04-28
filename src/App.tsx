
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/inventory/Inventory";
import EntranceSales from "./pages/entrance/EntranceSales";
import SalesHistory from "./pages/entrance/SalesHistory";
import Orders from "./pages/orders/Orders";
import Clients from "./pages/clients/Clients";
import Resellers from "./pages/resellers/Resellers";
import Promissory from "./pages/promissory/Promissory";
import Expenses from "./pages/finance/Expenses";
import Settings from "./pages/settings/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import RoutesPage from "./pages/routes/RoutesPage";
import Fleet from "./pages/fleet/Fleet";
import { useEffect } from "react";

const queryClient = new QueryClient();

const PrivateRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: 'admin' | 'manager' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Se ainda estiver carregando, poderia mostrar um spinner ou tela de loading
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  // Se não estiver logado, redireciona para a página de login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se precisar de uma role específica e o usuário não tiver, redireciona
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Se estiver tudo ok, renderiza o componente filho
  return <>{children}</>;
};

// Componente para redirecionar usuários já logados para a página inicial
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Se ainda estiver carregando, pode mostrar um spinner
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  // Se já estiver logado, redireciona para a página inicial
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Se não estiver logado, renderiza o componente filho (página de login, registro, etc)
  return <>{children}</>;
};

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouterRoutes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } 
            />
            <Route path="/" element={<AppLayout />}>
              <Route 
                index 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="inventory" 
                element={
                  <PrivateRoute requiredRole="admin">
                    <Inventory />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="entrance" 
                element={
                  <PrivateRoute>
                    <EntranceSales />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="entrance/sales" 
                element={
                  <PrivateRoute>
                    <SalesHistory />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="orders" 
                element={
                  <PrivateRoute>
                    <Orders />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="clients" 
                element={
                  <PrivateRoute>
                    <Clients />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="resellers" 
                element={
                  <PrivateRoute>
                    <Resellers />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="promissory" 
                element={
                  <PrivateRoute>
                    <Promissory />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="expenses" 
                element={
                  <PrivateRoute>
                    <Expenses />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="fleet" 
                element={
                  <PrivateRoute>
                    <Fleet />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="routes" 
                element={
                  <PrivateRoute requiredRole="admin">
                    <RoutesPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="settings" 
                element={
                  <PrivateRoute requiredRole="admin">
                    <Settings />
                  </PrivateRoute>
                } 
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
