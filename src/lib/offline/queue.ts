/**
 * Fila de operações offline.
 * Enquanto estiver sem internet as gravações ficam guardadas no aparelho
 * e são enviadas automaticamente para a nuvem quando a conexão volta.
 *
 * Recursos: retentativa com backoff configurável, detecção de conflitos
 * (evita lançar a mesma coisa duas vezes) e sincronização em segundo plano.
 */
import { supabase } from '@/integrations/supabase/client';
import { STORE_META, STORE_QUEUE, idbDelete, idbGet, idbGetAll, idbPut } from './db';
import { backoffDelayMs, getConfigSync, loadRetryConfig } from './config';

export type QueueAction = 'insert' | 'update' | 'delete' | 'rpc';
export type QueueStatus = 'pendente' | 'excedido' | 'conflito';

export interface QueuedOperation {
  id: string;
  /** Nome da tabela ou da função (quando action = 'rpc') */
  target: string;
  action: QueueAction;
  payload?: Record<string, unknown>;
  /** Filtro de igualdade usado em update/delete */
  match?: Record<string, unknown>;
  /** Checagem anti-duplicidade: se já existir registro com essa coluna/valor, vira conflito */
  dedupe?: { column: string; value: unknown };
  description: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
  status?: QueueStatus;
  /** Momento (timestamp) a partir do qual pode tentar de novo */
  nextAttemptAt?: number;
  /** Usuário confirmou o envio mesmo com conflito detectado */
  forced?: boolean;
}

const META_LAST_SYNC = 'lastSyncAt';
const listeners = new Set<() => void>();

export interface SyncProgress {
  running: boolean;
  total: number;
  done: number;
  failed: number;
}
let progress: SyncProgress = { running: false, total: 0, done: 0, failed: 0 };
const progressListeners = new Set<(p: SyncProgress) => void>();

export function subscribeProgress(fn: (p: SyncProgress) => void) {
  progressListeners.add(fn);
  fn(progress);
  return () => progressListeners.delete(fn);
}
function setProgress(p: Partial<SyncProgress>) {
  progress = { ...progress, ...p };
  progressListeners.forEach((l) => l(progress));
}

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
    status: op.status ?? 'pendente',
  };
  await idbPut(STORE_QUEUE, item);
  emit();
  void requestBackgroundSync();
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

/** Reenvia agora um item (usado para "tentar de novo" e para confirmar conflitos). */
export async function retryOperation(id: string, force = false) {
  const all = await getQueue();
  const op = all.find((o) => o.id === id);
  if (!op) return;
  await idbPut(STORE_QUEUE, {
    ...op,
    attempts: 0,
    status: 'pendente' as QueueStatus,
    nextAttemptAt: 0,
    lastError: undefined,
    forced: force || op.forced,
  });
  emit();
  await processQueue();
}

function isDuplicateError(message: string) {
  return /duplicate key|23505|already exists/i.test(message);
}
export function isNetworkError(message: string) {
  return /network|fetch|failed to fetch|timeout|offline/i.test(message);
}

class ConflictError extends Error {}

/** Verifica se a operação já foi aplicada na nuvem (evita duplicidade). */
async function checkConflict(op: QueuedOperation) {
  if (op.forced || op.action === 'rpc') return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const pk = (op.payload as Record<string, unknown> | undefined)?.id;
  if (op.action === 'insert' && typeof pk === 'string') {
    const { data } = await client.from(op.target).select('id').eq('id', pk).maybeSingle();
    if (data) throw new ConflictError('Este lançamento já está na nuvem (enviado antes).');
  }

  if (op.dedupe) {
    const { data } = await client
      .from(op.target)
      .select('id')
      .eq(op.dedupe.column, op.dedupe.value as never)
      .limit(1);
    if (Array.isArray(data) && data.length > 0) {
      throw new ConflictError('Já existe um registro parecido na nuvem. Confirme se deseja enviar mesmo assim.');
    }
  }
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
    if (error) {
      // Já existe = já foi enviado antes: considera concluído em vez de duplicar
      if (isDuplicateError(error.message)) return;
      throw new Error(error.message);
    }
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
  conflicts: number;
  skipped: boolean;
}

/** Avisos de fim de sincronização / conflitos, para o app mostrar notificações. */
const resultListeners = new Set<(r: SyncResult) => void>();
export function subscribeSyncResult(fn: (r: SyncResult) => void) {
  resultListeners.add(fn);
  return () => resultListeners.delete(fn);
}
function emitResult(r: SyncResult) {
  resultListeners.forEach((l) => l(r));
}


export async function processQueue(): Promise<SyncResult> {
  if (syncing) return { sent: 0, failed: 0, conflicts: 0, skipped: true };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { sent: 0, failed: 0, conflicts: 0, skipped: true };
  }

  const cfg = getConfigSync();
  syncing = true;
  let sent = 0;
  let failed = 0;
  let conflicts = 0;
  try {
    const queue = await getQueue();
    const now = Date.now();
    const due = queue.filter(
      (op) => op.status !== 'conflito' && op.status !== 'excedido' && (op.nextAttemptAt ?? 0) <= now,
    );
    if (due.length === 0) return { sent: 0, failed: 0, conflicts: 0, skipped: true };

    setProgress({ running: true, total: due.length, done: 0, failed: 0 });

    for (const op of due) {
      try {
        await checkConflict(op);
        await runOperation(op);
        await idbDelete(STORE_QUEUE, op.id);
        sent++;
        setProgress({ done: sent });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        const attempts = op.attempts + 1;

        if (err instanceof ConflictError) {
          conflicts++;
          await idbPut(STORE_QUEUE, { ...op, attempts, status: 'conflito' as QueueStatus, lastError: message });
          continue;
        }

        failed++;
        setProgress({ failed });
        const excedeu = attempts >= cfg.maxAttempts && !isNetworkError(message);

        if (excedeu && cfg.onExceed === 'descartar') {
          await idbDelete(STORE_QUEUE, op.id);
        } else {
          await idbPut(STORE_QUEUE, {
            ...op,
            attempts,
            lastError: message,
            status: (excedeu ? 'excedido' : 'pendente') as QueueStatus,
            nextAttemptAt: Date.now() + backoffDelayMs(attempts, cfg),
          });
        }

        // Sem rede: para o processamento e tenta depois
        if (typeof navigator !== 'undefined' && !navigator.onLine) break;
      }
    }
    if (sent > 0 || queue.length === 0) await setLastSyncAt(Date.now());
  } finally {
    syncing = false;
    setProgress({ running: false });
    emit();
  }
  return { sent, failed, conflicts, skipped: false };
}

/**
 * Pede ao navegador para tentar sincronizar em segundo plano quando a conexão voltar.
 * Se o navegador não tiver esse recurso, a fila continua tentando sozinha pelo app.
 */
export async function requestBackgroundSync() {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sync = (reg as any)?.sync;
    if (sync?.register) await sync.register('gasfacil-offline-queue');
  } catch {
    /* recurso opcional */
  }
}

/** Roda a fila em segundo plano assim que a conexão voltar, sem precisar abrir nenhuma tela. */
let watcherStarted = false;
export function startBackgroundQueueWatcher() {
  if (watcherStarted || typeof window === 'undefined') return;
  watcherStarted = true;

  void loadRetryConfig().then(() => void processQueue());

  window.addEventListener('online', () => {
    void requestBackgroundSync();
    void processQueue();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) void processQueue();
  });
  window.setInterval(() => {
    if (navigator.onLine) void processQueue();
  }, Math.max(10, getConfigSync().pollIntervalSec) * 1000);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
      if (event.data?.type === 'offline-sync') void processQueue();
    });
  }
}

/**
 * Executa a operação agora se houver internet; caso contrário guarda na fila.
 * Retorna `queued: true` quando ficou pendente de sincronização.
 */
export async function runOrQueue(
  op: Omit<QueuedOperation, 'id' | 'createdAt' | 'attempts'>,
): Promise<{ queued: boolean; error?: string }> {
  // Chave própria para inserts: se subir duas vezes, a nuvem recusa a duplicata
  const prepared: Omit<QueuedOperation, 'id' | 'createdAt' | 'attempts'> =
    op.action === 'insert' && op.payload && !op.payload.id
      ? { ...op, payload: { ...op.payload, id: crypto.randomUUID() } }
      : op;

  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (!offline) {
    try {
      await runOperation({ ...prepared, id: 'direct', createdAt: Date.now(), attempts: 0 });
      await setLastSyncAt(Date.now());
      emit();
      return { queued: false };
    } catch (err) {
      // Falha de rede -> guarda na fila; erro do servidor -> devolve o erro
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      if (!isNetworkError(message)) return { queued: false, error: message };
    }
  }
  await enqueueOperation(prepared);
  return { queued: true };
}
