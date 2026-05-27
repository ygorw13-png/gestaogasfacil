
import { BarChart3, Users, ShoppingCart, Store, Package, ReceiptText, 
        Truck, CalendarCheck, FileBarChart, Settings, Repeat } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavigationItem {
  to: string;
  icon: LucideIcon;
  label: string;
  ariaLabel?: string;
}

export interface AccordionNavItem {
  icon: LucideIcon;
  label: string;
  value: string;
  items: {
    to: string;
    label: string;
    isEnd?: boolean;
  }[];
}

// Main navigation links
export const mainNavItems: NavigationItem[] = [
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/clients", icon: Users, label: "Clientes" },
  { to: "/recompra", icon: Repeat, label: "Recompra" }
];


// Orders navigation with accordion items
export const ordersNavItems: AccordionNavItem[] = [
  {
    icon: ShoppingCart,
    label: "Pedidos",
    value: "orders",
    items: [
      { to: "/orders", label: "Lista de Pedidos", isEnd: true },
      { to: "/orders/map", label: "Mapa de Entregas" }
    ]
  },
  {
    icon: Store,
    label: "Portaria",
    value: "entrance",
    items: [
      { to: "/entrance", label: "Vendas", isEnd: true },
      { to: "/entrance/history", label: "Histórico" },
      { to: "/entrance/acerto-entregadores", label: "Acerto Entregadores" }
    ]
  }
];

// Inventory navigation links
export const inventoryNavItems: NavigationItem[] = [
  { to: "/inventory", icon: Package, label: "Estoque" },
  { to: "/promissory", icon: ReceiptText, label: "Promissórias" },
  { to: "/routes", icon: Truck, label: "Rotas" },
  { to: "/resellers", icon: CalendarCheck, label: "Revendedores" },
  { to: "/fleet", icon: Truck, label: "Frota" }
];

// Admin navigation links
export const adminNavItems: NavigationItem[] = [
  { 
    to: "/colaboradores", 
    icon: Users, 
    label: "Colaboradores", 
    ariaLabel: "Gerenciar colaboradores"
  },
  { 
    to: "/settings", 
    icon: Settings, 
    label: "Configurações", 
    ariaLabel: "Configurações do sistema"
  }
];
