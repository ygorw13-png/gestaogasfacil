
import { NavCategory } from "./NavCategory";
import { MainNavigation } from "./categories/MainNavigation";
import { OrdersNavigation } from "./categories/OrdersNavigation";
import { InventoryNavigation } from "./categories/InventoryNavigation"; 
import { FinanceNavigation } from "./categories/FinanceNavigation";
import { AdminNavigation } from "./categories/AdminNavigation";
import { EntregadorNavigation } from "./categories/EntregadorNavigation";
import { useUserRole } from "@/hooks/useUserRole";

export const SidebarNav = () => {
  const { isEntregador } = useUserRole();

  if (isEntregador) {
    return (
      <nav className="flex-1 overflow-auto p-3 space-y-4">
        <NavCategory>
          <EntregadorNavigation />
        </NavCategory>
      </nav>
    );
  }

  return (
    <nav className="flex-1 overflow-auto p-3 space-y-4">
      <NavCategory>
        <MainNavigation />
      </NavCategory>
      <NavCategory>
        <OrdersNavigation />
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
