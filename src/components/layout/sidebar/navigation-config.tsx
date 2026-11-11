
import { BarChart3, Users, Store, Package, ReceiptText, ListChecks,
        Truck, CalendarCheck, Settings, Repeat, FileBarChart, MapPin, Printer , CloudOff } from "lucide-react";
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
  { to: "/painel", icon: ListChecks, label: "Painel do Dia" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/clients", icon: Users, label: "Clientes" },
  { to: "/recompra", icon: Repeat, label: "Recompra" },
  { to: "/formularios", icon: Printer, label: "Formulários" }
];


// Portaria: tudo relacionado a vendas e pedidos em um único menu
export const ordersNavItems: AccordionNavItem[] = [
  {
    icon: Store,
    label: "Portaria",
    value: "entrance",
    items: [
      { to: "/entrance", label: "Vendas (Balcão)", isEnd: true },
      { to: "/orders", label: "Pedidos", isEnd: true },
      { to: "/orders/map", label: "Mapa de Entregas" },
      { to: "/entrance/cargas", label: "Cargas dos Entregadores" },
      { to: "/entrance/acerto-entregadores", label: "Acerto Entregadores" },
      { to: "/entrance/history", label: "Histórico de Vendas" },
      { to: "/entrance/historico-portaria", label: "Histórico da Portaria" },
      { to: "/relatorios/vasilhames", label: "Relatório de Vasilhames" },
      { to: "/formularios", label: "Formulários para Imprimir" }
    ]
  }
];

// Inventory navigation links
export const inventoryNavItems: NavigationItem[] = [
  { to: "/inventory", icon: Package, label: "Estoque" },
  { to: "/promissory", icon: ReceiptText, label: "Promissórias" },
  { to: "/routes", icon: Truck, label: "Rotas" },
  { to: "/resellers", icon: CalendarCheck, label: "Revendedores" },
  { to: "/pontos-revenda", icon: MapPin, label: "Pontos de Revenda" },
  { to: "/relatorios/vasilhames", icon: FileBarChart, label: "Relatório Vasilhames" }
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
    to: "/offline", 
    icon: CloudOff, 
    label: "Modo Offline", 
    ariaLabel: "Status do modo offline e sincronização"
  },
  { 
    to: "/settings", 
    icon: Settings, 
    label: "Configurações", 
    ariaLabel: "Configurações do sistema"
  }
];
