import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** "Servidor" fake: conta gravações diretas e chamadas de ação. */
const server = {
  inserts: [] as { table: string; payload: Record<string, unknown> }[],
  rpcs: [] as { fn: string; args: Record<string, unknown> }[],
  rpcError: null as { message: string } | null,
};

vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    const api: Record<string, unknown> = {
      insert: async (payload: Record<string, unknown>) => {
        server.inserts.push({ table, payload });
        return { error: null };
      },
      select: () => api,
      eq: () => api,
      limit: () => ({ data: [] }),
      maybeSingle: async () => ({ data: null }),
    };
    return api;
  };
  return {
    supabase: {
      from: (t: string) => builder(t),
      rpc: async (fn: string, args: Record<string, unknown>) => {
        server.rpcs.push({ fn, args });
        return { data: null, error: server.rpcError };
      },
    },
  };
});

// Ações controladas LIGADAS (como na cópia isolada com VITE_G1_ACOES=on).
vi.mock('@/lib/g1/flag', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/g1/flag')>();
  return { ...real, G1_ACOES: true, motivoBloqueioFila: (op: { action: string; target: string }) => real.motivoBloqueioFila(op, true) };
});

import { DEFAULT_RETRY_CONFIG, saveRetryConfig } from '@/lib/offline/config';
import { clearQueue, enqueueOperation, getQueue, processQueue, retryOperation, runOrQueue } from '@/lib/offline/queue';
import { motivoBloqueioFila } from '@/lib/g1/flag';

const setOnline = (v: boolean) => Object.defineProperty(navigator, 'onLine', { value: v, configurable: true });

describe('fila offline com ações controladas ligadas', () => {
  beforeEach(async () => {
    server.inserts = [];
    server.rpcs = [];
    server.rpcError = null;
    await clearQueue();
    await saveRetryConfig({ ...DEFAULT_RETRY_CONFIG, baseDelaySec: 0, maxAttempts: 2, onExceed: 'descartar' });
    setOnline(true);
  });

  it('venda antiga guardada como gravação direta no pedido não é enviada', async () => {
    // Fila de antes da chave: venda na rua gravada direto em pedidos.
    await enqueueOperation({ target: 'orders', action: 'insert', payload: { id: 'x1', status: 'completed', price: 125 }, description: 'Venda de rua' });
    const r = await processQueue();
    const [op] = await getQueue();
    expect(server.inserts).toHaveLength(0);
    expect(op.status).toBe('bloqueado');
    expect(r.blocked).toBe(1);
    expect(r.conflicts).toBe(0);
  });

  it('"enviar mesmo assim" não libera gravação direta bloqueada', async () => {
    await enqueueOperation({ target: 'promissory_notes', action: 'insert', payload: { value: 90, status: 'paid' }, description: 'Promissória' });
    await processQueue();
    const [op] = await getQueue();
    await retryOperation(op.id, true);
    expect(server.inserts).toHaveLength(0);
    expect((await getQueue())[0].status).toBe('bloqueado');
  });

  it('gravação direta nova em dívidas é recusada na hora, sem ficar na fila', async () => {
    const r = await runOrQueue({ target: 'promissory_notes', action: 'insert', payload: { value: 90 }, description: 'Promissória' });
    expect(r.queued).toBe(false);
    expect(r.error).toMatch(/não foi enviado/i);
    expect(server.inserts).toHaveLength(0);
    expect(await getQueue()).toHaveLength(0);
  });

  it('cadastro fora de vendas/estoque/dívidas continua sendo enviado', async () => {
    const r = await runOrQueue({ target: 'clients', action: 'insert', payload: { name: 'Cliente Fictício' }, description: 'Cliente' });
    expect(r.error).toBeUndefined();
    expect(server.inserts.map((i) => i.table)).toEqual(['clients']);
  });

  it('venda feita sem internet sobe com a mesma chave em cada tentativa', async () => {
    setOnline(false);
    await runOrQueue({ target: 'entregador_venda_rua', action: 'rpc', payload: { _chave: 'venda-rua:k1', _valor: 125 }, description: 'Venda de rua' });
    setOnline(true);
    server.rpcError = { message: 'Failed to fetch' };
    await processQueue();
    server.rpcError = null;
    await retryOperation((await getQueue())[0].id);
    expect(server.rpcs.map((c) => c.args._chave)).toEqual(['venda-rua:k1', 'venda-rua:k1']);
    expect(await getQueue()).toHaveLength(0);
  });

  it('venda com chave recusada pelo servidor não é descartada sozinha, mesmo com "descartar"', async () => {
    setOnline(false);
    await runOrQueue({ target: 'entregador_venda_rua', action: 'rpc', payload: { _chave: 'venda-rua:k2' }, description: 'Venda de rua' });
    setOnline(true);
    server.rpcError = { message: 'permission denied for function entregador_venda_rua' };
    await processQueue();
    await processQueue();
    const fila = await getQueue();
    expect(fila).toHaveLength(1);
    expect(fila[0].status).toBe('recusado');
  });

  it('regra pura: desligada não bloqueia; ação controlada nunca é bloqueada', () => {
    expect(motivoBloqueioFila({ action: 'insert', target: 'orders' })).toMatch(/não foi enviado/i);
    expect(motivoBloqueioFila({ action: 'rpc', target: 'venda_portaria' })).toBeNull();
  });
});
