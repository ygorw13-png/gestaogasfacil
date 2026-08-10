/**
 * Fila de operações offline.
 * Enquanto estiver sem internet as gravações ficam guardadas no aparelho
 * e são enviadas automaticamente para a nuvem quando a conexão volta.
 */
import { supabase } from '@/integrations/supabase/client';
import { STORE_META, STORE_QUEUE, idbDelete, idbGet, idbGetAll, idbPut } from './db';

export type QueueAction = 'insert' | 'update' | 'delete' | 'rpc';

export interface QueuedOperation {
  id: string;
  /** Nome da tabela ou da função (quando action = 'rpc') */
  target: string;
  action: QueueAction;
  payload?: Record<string, unknown>;
  /** Filtro de igualdade usado em update/delete */
  match?: Record<string, unknown>;
  description: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

const META_LAST_SYNC = 'lastSyncAt';
const listeners = new Set<() => void>();

export function subscribeQueue(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  listeners.forEach((l) => l());
}

export async function getQueue(): Promise<QueuedOperation[]> {
  try {
    const all = await idbGetAll<QueuedOperation>(STORE_QUEUE);
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export async function getLastSyncAt(): Promise<number | null> {
  try {
    const row = await idbGet<{ key: string; value: number }>(STORE_META, META_LAST_SYNC);
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function setLastSyncAt(ts: number) {
  try {
    await idbPut(STORE_META, { key: META_LAST_SYNC, value: ts });
  } catch {
    /* ignora */
  }
}

export async function enqueueOperation(
  op: Omit<QueuedOperation, 'id' | 'createdAt' | 'attempts'>,
): Promise<QueuedOperation> {
  const item: QueuedOperation = {
    ...op,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
  };
  await idbPut(STORE_QUEUE, item);
  emit();
  return item;
}

export async function removeOperation(id: string) {
  await idbDelete(STORE_QUEUE, id);
  emit();
}

export async function clearQueue() {
  const all = await getQueue();
  await Promise.all(all.map((o) => idbDelete(STORE_QUEUE, o.id)));
  emit();
}

async function runOperation(op: QueuedOperation) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  if (op.action === 'rpc') {
    const { error } = await client.rpc(op.target, op.payload ?? {});
    if (error) throw new Error(error.message);
    return;
  }

  let query = client.from(op.target);
  if (op.action === 'insert') {
    const { error } = await query.insert(op.payload ?? {});
    if (error) throw new Error(error.message);
    return;
  }
  if (op.action === 'update') {
    query = query.update(op.payload ?? {});
  } else {
    query = query.delete();
  }
  Object.entries(op.match ?? {}).forEach(([k, v]) => {
    query = query.eq(k, v);
  });
  const { error } = await query;
  if (error) throw new Error(error.message);
}

let syncing = false;

export interface SyncResult {
  sent: number;
  failed: number;
  skipped: boolean;
}

export async function processQueue(): Promise<SyncResult> {
  if (syncing) return { sent: 0, failed: 0, skipped: true };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { sent: 0, failed: 0, skipped: true };
  }

  syncing = true;
  let sent = 0;
  let failed = 0;
  try {
    const queue = await getQueue();
    for (const op of queue) {
      try {
        await runOperation(op);
        await idbDelete(STORE_QUEUE, op.id);
        sent++;
      } catch (err) {
        failed++;
        await idbPut(STORE_QUEUE, {
          ...op,
          attempts: op.attempts + 1,
          lastError: err instanceof Error ? err.message : 'Erro desconhecido',
        });
        // Sem rede: para o processamento e tenta depois
        if (typeof navigator !== 'undefined' && !navigator.onLine) break;
      }
    }
    if (sent > 0 || queue.length === 0) await setLastSyncAt(Date.now());
  } finally {
    syncing = false;
    emit();
  }
  return { sent, failed, skipped: false };
}

/**
 * Executa a operação agora se houver internet; caso contrário guarda na fila.
 * Retorna `queued: true` quando ficou pendente de sincronização.
 */
export async function runOrQueue(
  op: Omit<QueuedOperation, 'id' | 'createdAt' | 'attempts'>,
): Promise<{ queued: boolean; error?: string }> {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (!offline) {
    try {
      await runOperation({ ...op, id: 'direct', createdAt: Date.now(), attempts: 0 });
      await setLastSyncAt(Date.now());
      emit();
      return { queued: false };
    } catch (err) {
      // Falha de rede -> guarda na fila; erro do servidor -> devolve o erro
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      const isNetwork = /network|fetch|failed to fetch|timeout/i.test(message);
      if (!isNetwork) return { queued: false, error: message };
    }
  }
  await enqueueOperation(op);
  return { queued: true };
}
