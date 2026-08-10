import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Estado controlável do "servidor" fake */
const server = {
  rows: [] as Record<string, unknown>[],
  insertError: null as { message: string } | null,
  inserts: 0,
};

vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    const filters: Record<string, unknown> = {};
    const api: Record<string, unknown> = {
      insert: async (payload: Record<string, unknown>) => {
        server.inserts++;
        if (server.insertError) return { error: server.insertError };
        server.rows.push({ table, ...payload });
        return { error: null };
      },
      select: () => api,
      eq: (col: string, val: unknown) => {
        filters[col] = val;
        return api;
      },
      limit: () => ({
        data: server.rows.filter((r) =>
          Object.entries(filters).every(([k, v]) => (r as Record<string, unknown>)[k] === v),
        ),
      }),
      maybeSingle: async () => ({
        data:
          server.rows.find((r) =>
            Object.entries(filters).every(([k, v]) => (r as Record<string, unknown>)[k] === v),
          ) ?? null,
      }),
    };
    return api;
  };
  return { supabase: { from: (t: string) => builder(t) } };
});

import { backoffDelayMs, saveRetryConfig, DEFAULT_RETRY_CONFIG } from '@/lib/offline/config';
import {
  clearQueue,
  getQueue,
  processQueue,
  retryOperation,
  runOrQueue,
  subscribeSyncResult,
} from '@/lib/offline/queue';

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

describe('fila offline', () => {
  beforeEach(async () => {
    server.rows = [];
    server.insertError = null;
    server.inserts = 0;
    await clearQueue();
    await saveRetryConfig({ ...DEFAULT_RETRY_CONFIG, baseDelaySec: 0, maxAttempts: 2 });
    setOnline(true);
  });

  it('guarda a operação quando está offline e não envia nada', async () => {
    setOnline(false);
    const res = await runOrQueue({
      target: 'vendas',
      action: 'insert',
      payload: { valor: 100 },
      description: 'Venda de rua',
    });

    expect(res.queued).toBe(true);
    expect(server.inserts).toBe(0);
    expect(await getQueue()).toHaveLength(1);
  });

  it('envia a fila quando a conexão volta e avisa o resultado', async () => {
    setOnline(false);
    await runOrQueue({ target: 'vendas', action: 'insert', payload: { valor: 50 }, description: 'Venda' });

    const eventos: unknown[] = [];
    const unsub = subscribeSyncResult((r) => eventos.push(r));

    setOnline(true);
    const result = await processQueue();
    unsub();

    expect(result.sent).toBe(1);
    expect(await getQueue()).toHaveLength(0);
    expect(server.rows).toHaveLength(1);
    expect(eventos).toHaveLength(1);
  });

  it('respeita o limite de tentativas e marca como excedido', async () => {
    setOnline(false);
    await runOrQueue({ target: 'vendas', action: 'insert', payload: { valor: 10 }, description: 'Venda' });
    setOnline(true);
    server.insertError = { message: 'coluna invalida' };

    const r1 = await processQueue();
    expect(r1.failed).toBe(1);
    expect((await getQueue())[0].attempts).toBe(1);
    expect((await getQueue())[0].status).toBe('pendente');

    await processQueue();
    const op = (await getQueue())[0];
    expect(op.attempts).toBe(2);
    expect(op.status).toBe('excedido');

    // não tenta mais depois de excedido
    const antes = server.inserts;
    await processQueue();
    expect(server.inserts).toBe(antes);
  });

  it('detecta duplicidade e só envia após confirmação do usuário', async () => {
    server.rows.push({ table: 'vendas', ticket: 'A-1' });

    setOnline(false);
    await runOrQueue({
      target: 'vendas',
      action: 'insert',
      payload: { ticket: 'A-1', valor: 30 },
      dedupe: { column: 'ticket', value: 'A-1' },
      description: 'Venda duplicada',
    });

    setOnline(true);
    const res = await processQueue();
    expect(res.conflicts).toBe(1);
    const conflito = (await getQueue())[0];
    expect(conflito.status).toBe('conflito');
    expect(server.inserts).toBe(0);

    await retryOperation(conflito.id, true);
    expect(server.inserts).toBe(1);
    expect(await getQueue()).toHaveLength(0);
  });

  it('não duplica quando o servidor recusa por chave repetida', async () => {
    setOnline(false);
    await runOrQueue({ target: 'vendas', action: 'insert', payload: { valor: 5 }, description: 'Venda' });
    setOnline(true);
    server.insertError = { message: 'duplicate key value violates unique constraint' };

    const res = await processQueue();
    expect(res.sent).toBe(1);
    expect(await getQueue()).toHaveLength(0);
  });
});

describe('backoff', () => {
  const cfg = { ...DEFAULT_RETRY_CONFIG, baseDelaySec: 10, factor: 2, maxDelaySec: 60 };

  it('cresce a cada tentativa', () => {
    const t1 = backoffDelayMs(1, cfg);
    const t3 = backoffDelayMs(3, cfg);
    expect(t1).toBeGreaterThanOrEqual(8_000);
    expect(t1).toBeLessThanOrEqual(12_000);
    expect(t3).toBeGreaterThan(t1);
  });

  it('respeita o teto configurado', () => {
    expect(backoffDelayMs(20, cfg)).toBeLessThanOrEqual(60_000 * 1.15 + 1);
  });
});
