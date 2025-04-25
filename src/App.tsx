
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
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
import RoutesPage from "./pages/routes/RoutesPage";

const queryClient = new QueryClient();

const PrivateRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: 'admin' | 'manager' }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

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
            <Route path="/login" element={<Login />} />
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
              <Route path="entrance" element={<EntranceSales />} />
              <Route path="entrance/sales" element={<SalesHistory />} />
              <Route path="orders" element={<Orders />} />
              <Route path="clients" element={<Clients />} />
              <Route path="resellers" element={<Resellers />} />
              <Route path="promissory" element={<Promissory />} />
              <Route path="expenses" element={<Expenses />} />
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
