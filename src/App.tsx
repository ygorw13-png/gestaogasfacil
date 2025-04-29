
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/clients/Clients";
import Orders from "./pages/orders/Orders";
import OrderDetails from "./pages/orders/OrderDetails";
import NewOrderForm from "./pages/orders/NewOrderForm";
import OrdersMap from "./pages/orders/OrdersMap";
import EntranceSales from "./pages/entrance/EntranceSales";
import NewSaleForm from "./pages/entrance/NewSaleForm";
import SalesHistory from "./pages/entrance/SalesHistory";
import CashierClosing from "./pages/entrance/CashierClosing";
import Inventory from "./pages/inventory/Inventory";
import Promissory from "./pages/promissory/Promissory";
import RoutesPage from "./pages/routes/RoutesPage";
import Resellers from "./pages/resellers/Resellers";
import Fleet from "./pages/fleet/Fleet";
import Settings from "./pages/settings/Settings";
import Expenses from "./pages/finance/Expenses";
import Colaboradores from "./pages/colaboradores/Colaboradores";

import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CashierData } from "./pages/entrance/types/cashierTypes";

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

function App() {
  const navigate = useNavigate();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/map" element={<OrdersMap orders={[]} />} />
            <Route path="/orders/new" element={<NewOrderForm onSubmit={() => {}} />} />
            <Route path="/orders/:id" element={<OrderDetails orderId="" orders={[]} isOpen={false} onOpenChange={() => {}} />} />
            <Route path="/entrance" element={<EntranceSales />} />
            <Route path="/entrance/new-sale" element={<NewSaleForm isOpen={false} onOpenChange={() => {}} onSubmit={() => {}} />} />
            <Route path="/entrance/history" element={<SalesHistory />} />
            <Route path="/entrance/cashier" element={<CashierClosing isOpen={false} onOpenChange={() => {}} onSubmit={() => {}} cashierData={initialCashierData} />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/promissory" element={<Promissory />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/resellers" element={<Resellers />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/finance/expenses" element={<Expenses />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/colaboradores" element={<Colaboradores />} />
          </Route>
          
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <Toaster richColors closeButton position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
