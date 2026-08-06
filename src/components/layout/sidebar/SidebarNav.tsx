
import { NavCategory } from "./NavCategory";
import { MainNavigation } from "./categories/MainNavigation";
import { OrdersNavigation } from "./categories/OrdersNavigation";
import { InventoryNavigation } from "./categories/InventoryNavigation"; 
import { FinanceNavigation } from "./categories/FinanceNavigation";
import { AdminNavigation } from "./categories/AdminNavigation";
import { EntregadorNavigation } from "./categories/EntregadorNavigation";
import { SidebarLink } from "./SidebarLink";
import { useUserRole } from "@/hooks/useUserRole";
import { Users, Package, Repeat } from "lucide-react";

export const SidebarNav = () => {
  const { isEntregador, isPortaria } = useUserRole();

  if (isEntregador) {
    return (
      <nav className="flex-1 overflow-auto p-3 space-y-4">
        <NavCategory>
          <EntregadorNavigation />
        </NavCategory>
      </nav>
    );
  }

  // Portaria: foco total no fluxo de vendas/pedidos
  if (isPortaria) {
    return (
      <nav className="flex-1 overflow-auto p-3 space-y-4">
        <NavCategory>
          <OrdersNavigation />
        </NavCategory>
        <NavCategory showSeparator>
          <SidebarLink to="/clients" icon={Users} label="Clientes" />
          <SidebarLink to="/recompra" icon={Repeat} label="Recompra" />
          <SidebarLink to="/inventory" icon={Package} label="Estoque" />
        </NavCategory>
      </nav>
    );
  }

  return (
    <nav className="flex-1 overflow-auto p-3 space-y-4">
      <NavCategory>
        <OrdersNavigation />
      </NavCategory>
      <NavCategory>
        <MainNavigation />
      </NavCategory>
      <NavCategory>
        <InventoryNavigation />
      </NavCategory>
      <NavCategory>
        <FinanceNavigation />
      </NavCategory>
      <NavCategory showSeparator>
        <AdminNavigation />
      </NavCategory>
    </nav>
  );
};
