
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
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SidebarLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

const SidebarLink = ({ to, icon: Icon, label, className }: SidebarLinkProps) => {
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
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
};

export default function AppSidebar() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r h-screen fixed">
      <div className="p-4">
        <h2 className="text-xl font-bold tracking-tight">GasFlow Aqua</h2>
        <p className="text-sm text-muted-foreground">Gestão Completa para seu negócio</p>
      </div>
      <Separator />
      <nav className="flex-1 overflow-auto p-4 space-y-2">
        <SidebarLink to="/dashboard" icon={BarChart3} label="Dashboard" />
        <SidebarLink to="/clients" icon={Users} label="Clientes" />
        <SidebarLink to="/colaboradores" icon={Briefcase} label="Colaboradores" />
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="orders" className="border-none">
            <AccordionTrigger className="py-2 hover:bg-muted rounded-lg px-3 hover:no-underline">
              <div className="flex items-center gap-3 text-muted-foreground">
                <ShoppingCart className="h-4 w-4" />
                <span>Pedidos</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-9 space-y-2">
              <NavLink
                to="/orders"
                className={({ isActive }) => 
                  cn(
                    "block rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-foreground",
                    isActive ? "text-foreground bg-accent" : "hover:bg-muted"
                  )
                }
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
                <DollarSign className="h-4 w-4" />
                <span>Portaria</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-9 space-y-2">
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
