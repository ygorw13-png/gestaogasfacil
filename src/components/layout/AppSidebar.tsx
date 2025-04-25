
import { useLocation, Link } from "react-router-dom";
import { 
  Home, 
  Box, 
  Store, 
  Users, 
  FileText, 
  DollarSign, 
  Settings,
  Truck,
  MapPin
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  
  // Itens do menu baseados na permissão
  const baseMenuItems = [
    { title: "Dashboard", path: "/", icon: Home },
    { title: "Portaria", path: "/entrance", icon: Store },
    { title: "Pedidos", path: "/orders", icon: Truck },
    { title: "Clientes", path: "/clients", icon: Users },
    { title: "Promissórias", path: "/promissory", icon: FileText },
    { title: "Despesas", path: "/expenses", icon: DollarSign },
  ];

  // Itens do menu apenas para admin e manager
  const adminMenuItems = [
    { title: "Estoque", path: "/inventory", icon: Box },
    { title: "Rotas", path: "/routes", icon: MapPin },
    { title: "Configurações", path: "/settings", icon: Settings },
  ];

  // Combina os menus baseado no papel do usuário
  const menuItems = [
    ...baseMenuItems,
    ...(user?.role === 'admin' || user?.role === 'manager' ? adminMenuItems : [])
  ];

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-center p-2">
        <div className="flex items-center gap-2 pl-2">
          <div className="bg-gasflow-600 text-white p-1.5 rounded-md">
            <Box size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg text-gasflow-700">
            GasFlow Aqua
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3",
                          isActive && "font-medium"
                        )}
                      >
                        <item.icon size={20} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="py-4 px-3 text-xs text-muted-foreground">
        <div className="text-center">
          <p>GasFlow Aqua Manager v1.0</p>
          <p>© 2025 Todos os direitos reservados</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
