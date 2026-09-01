/**
 * Atalhos globais de teclado (F1–F10).
 * F11 e F12 são reservados pelo navegador e não são usados.
 */
export interface ShortcutDef {
  key: string;
  label: string;
  /** rota para navegar (quando não for uma ação especial) */
  to?: string;
  /** ação especial tratada no GlobalShortcuts */
  action?: "nova-venda" | "ajuda";
}

export const SHORTCUTS: ShortcutDef[] = [
  { key: "F1", label: "Nova Venda (Portaria)", action: "nova-venda" },
  { key: "F2", label: "Novo Pedido", to: "/orders/new" },
  { key: "F3", label: "Lançar Despesa", to: "/entrance?tab=despesas" },
  { key: "F4", label: "Novo Cliente", to: "/clients?new=1" },
  { key: "F5", label: "Histórico da Portaria", to: "/entrance/historico-portaria" },
  { key: "F6", label: "Estoque", to: "/inventory" },
  { key: "F7", label: "Painel do Dia", to: "/painel" },
  { key: "F8", label: "Ver todos os atalhos", action: "ajuda" },
  { key: "F9", label: "Promissórias", to: "/promissory" },
  { key: "F10", label: "Recompra (CRM)", to: "/recompra" },
];

/** Mapa rota -> tecla, para exibir no menu lateral */
export const SHORTCUT_BY_PATH: Record<string, string> = SHORTCUTS.reduce(
  (acc, s) => {
    if (s.to) acc[s.to] = s.key;
    return acc;
  },
  {} as Record<string, string>
);
