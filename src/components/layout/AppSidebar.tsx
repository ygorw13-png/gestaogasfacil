
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  ShoppingCart,
  CalendarCheck,
  Users,
  FileBarChart,
  ReceiptText,
  Truck,
  Settings,
  LucideIcon,
  Package,
  DollarSign,
  Briefcase,
  Menu,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

const SidebarLink = ({ to, icon: Icon, label, className }: SidebarLinkProps) => {
  const sidebar = useSidebar();
  const isOpen = sidebar.state === "expanded";
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
          isActive ? "text-foreground bg-accent" : "hover:bg-muted",
          className
        )
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {isOpen && label && <span className="truncate">{label}</span>}
    </NavLink>
  );
};

export function AppSidebar() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const sidebar = useSidebar();
  const isOpen = sidebar.state === "expanded";
  const toggleSidebar = sidebar.toggleSidebar;
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        sidebar.toggleSidebar();
      }
    } else {
      if (!isOpen) {
        sidebar.toggleSidebar();
      }
    }
  }, [isMobile, isOpen, sidebar]);
  
  if (!user) return null;

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-background transition-all duration-300",
      isOpen ? "w-64" : "w-16",
      isMobile ? "transform -translate-x-full md:translate-x-0" : ""
    )}>
      <div className="flex items-center justify-between p-4">
        {isOpen && (
          <h2 className="text-xl font-bold tracking-tight">GasFlow Aqua</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      
      <Separator />
      
      <nav className="flex-1 overflow-auto p-3 space-y-2">
        <SidebarLink to="/dashboard" icon={BarChart3} label="Dashboard" />
        <SidebarLink to="/clients" icon={Users} label="Clientes" />
        <SidebarLink to="/colaboradores" icon={Briefcase} label="Colaboradores" />
        
        {isOpen ? (
          <Accordion 
            type="single" 
            collapsible 
            className="w-full"
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            <AccordionItem value="orders" className="border-none">
              <AccordionTrigger className="py-2 hover:bg-muted rounded-lg px-3 hover:no-underline">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Pedidos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-9 space-y-2 pt-2">
                <NavLink
                  to="/orders"
                  className={({ isActive }) => 
                    cn(
                      "block rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
                      isActive ? "text-foreground bg-accent" : "hover:bg-muted"
                    )
                  }
                  end
                >
                  Lista de Pedidos
                </NavLink>
                <NavLink
                  to="/orders/map"
                  className={({ isActive }) => 
                    cn(
                      "block rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
                      isActive ? "text-foreground bg-accent" : "hover:bg-muted"
                    )
                  }
                >
                  Mapa de Entregas
                </NavLink>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="entrance" className="border-none">
              <AccordionTrigger className="py-2 hover:bg-muted rounded-lg px-3 hover:no-underline">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <DollarSign className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Portaria</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-9 space-y-2 pt-2">
                <NavLink
                  to="/entrance"
                  className={({ isActive }) => 
                    cn(
                      "block rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
                      isActive ? "text-foreground bg-accent" : "hover:bg-muted"
                    )
                  }
                  end
                >
                  Vendas
                </NavLink>
                <NavLink
                  to="/entrance/history"
                  className={({ isActive }) => 
                    cn(
                      "block rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
                      isActive ? "text-foreground bg-accent" : "hover:bg-muted"
                    )
                  }
                >
                  Histórico
                </NavLink>
                <NavLink
                  to="/entrance/cashier"
                  className={({ isActive }) => 
                    cn(
                      "block rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
                      isActive ? "text-foreground bg-accent" : "hover:bg-muted"
                    )
                  }
                >
                  Fechamento
                </NavLink>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <>
            <SidebarLink to="/orders" icon={ShoppingCart} label="Pedidos" />
            <SidebarLink to="/entrance" icon={DollarSign} label="Portaria" />
          </>
        )}
        
        <SidebarLink to="/inventory" icon={Package} label="Estoque" />
        <SidebarLink to="/promissory" icon={ReceiptText} label="Promissórias" />
        <SidebarLink to="/routes" icon={Truck} label="Rotas" />
        <SidebarLink to="/resellers" icon={CalendarCheck} label="Revendedores" />
        <SidebarLink to="/fleet" icon={Truck} label="Frota" />
        <SidebarLink to="/finance/expenses" icon={FileBarChart} label="Finanças" />
      </nav>
      
      <div className="p-4">
        <Separator className="my-2" />
        <SidebarLink to="/settings" icon={Settings} label="Configurações" className="mt-2" />
      </div>
    </aside>
  );
}
