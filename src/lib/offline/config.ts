/**
 * Configurações de retentativa/backoff da fila offline.
 * Ficam salvas no próprio aparelho (IndexedDB) e podem ser ajustadas na tela "Modo Offline".
 */
import { STORE_META, idbGet, idbPut } from './db';

export type ExceedAction = 'manter' | 'descartar' | 'perguntar';

export interface RetryConfig {
  /** Espera inicial antes da 1ª retentativa (segundos) */
  baseDelaySec: number;
  /** Multiplicador do backoff (2 = dobra a cada tentativa) */
  factor: number;
  /** Teto da espera entre tentativas (segundos) */
  maxDelaySec: number;
  /** Número máximo de tentativas antes de considerar "excedido" */
  maxAttempts: number;
  /** O que fazer quando exceder o limite de tentativas */
  onExceed: ExceedAction;
  /** Intervalo da verificação automática em segundo plano (segundos) */
  pollIntervalSec: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  baseDelaySec: 30,
  factor: 2,
  maxDelaySec: 900,
  maxAttempts: 5,
  onExceed: 'perguntar',
  pollIntervalSec: 60,
};

const KEY = 'retryConfig';
const listeners = new Set<() => void>();
let cache: RetryConfig = DEFAULT_RETRY_CONFIG;

export function subscribeConfig(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getConfigSync(): RetryConfig {
  return cache;
}

export async function loadRetryConfig(): Promise<RetryConfig> {
  try {
    const row = await idbGet<{ key: string; value: Partial<RetryConfig> }>(STORE_META, KEY);
    cache = { ...DEFAULT_RETRY_CONFIG, ...(row?.value ?? {}) };
  } catch {
    cache = DEFAULT_RETRY_CONFIG;
  }
  return cache;
}

export async function saveRetryConfig(value: Partial<RetryConfig>): Promise<RetryConfig> {
  cache = { ...cache, ...value };
  try {
    await idbPut(STORE_META, { key: KEY, value: cache });
  } catch {
    /* ignora */
  }
  listeners.forEach((l) => l());
  return cache;
}

/** Espera (ms) antes da próxima tentativa, com backoff exponencial e um pouco de aleatoriedade. */
export function backoffDelayMs(attempts: number, cfg: RetryConfig = cache): number {
  const raw = cfg.baseDelaySec * Math.pow(Math.max(1, cfg.factor), Math.max(0, attempts - 1));
  const capped = Math.min(raw, cfg.maxDelaySec);
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.round(capped * jitter * 1000);
}

void loadRetryConfig();
