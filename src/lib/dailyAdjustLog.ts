import { hojePortaria } from "@/lib/g1/dataPortaria";
// Registro local de correções manuais de estoque.
// Zera automaticamente a cada dia (guardado por data).

export interface DailyAdjustEntry {
  id: string;
  at: string; // ISO timestamp
  who: string;
  produto: string;
  de: number;
  para: number;
  motivo: string;
}

const today = () => hojePortaria();
const storageKey = (scope: string) => `ajustes_estoque:${scope}:${today()}`;

function cleanupOldKeys(scope: string) {
  const prefix = `ajustes_estoque:${scope}:`;
  const keep = storageKey(scope);
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(prefix) && k !== keep) localStorage.removeItem(k);
    });
  } catch {
    /* ignore */
  }
}

export function getDailyAdjustments(scope: string): DailyAdjustEntry[] {
  try {
    cleanupOldKeys(scope);
    const raw = localStorage.getItem(storageKey(scope));
    return raw ? (JSON.parse(raw) as DailyAdjustEntry[]) : [];
  } catch {
    return [];
  }
}

export function addDailyAdjustment(
  scope: string,
  entry: Omit<DailyAdjustEntry, "id" | "at">
): DailyAdjustEntry[] {
  const list = getDailyAdjustments(scope);
  const next = [
    { ...entry, id: crypto.randomUUID(), at: new Date().toISOString() },
    ...list,
  ].slice(0, 50);
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
