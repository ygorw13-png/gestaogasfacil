
import { NavCategory } from "./NavCategory";
import { MainNavigation } from "./categories/MainNavigation";
import { OrdersNavigation } from "./categories/OrdersNavigation";
import { EntranceNavigation } from "./categories/EntranceNavigation";
import { InventoryNavigation } from "./categories/InventoryNavigation"; 
import { FinanceNavigation } from "./categories/FinanceNavigation";

export const SidebarNav = () => {
  return (
    <nav className="flex-1 overflow-auto p-3 space-y-4">
      <NavCategory>
        <MainNavigation />
      </NavCategory>
      
      <NavCategory>
        <OrdersNavigation />
      </NavCategory>
      
      <NavCategory>
        <EntranceNavigation />
      </NavCategory>
      
      <NavCategory>
        <InventoryNavigation />
      </NavCategory>
      
      <NavCategory showSeparator>
        <FinanceNavigation />
      </NavCategory>
    </nav>
  );
};
