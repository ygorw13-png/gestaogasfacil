import { useCallback, useEffect, useState } from 'react';
import {
  QueuedOperation,
  SyncProgress,
  getLastSyncAt,
  getQueue,
  processQueue,
  removeOperation,
  retryOperation,
  startBackgroundQueueWatcher,
  subscribeProgress,
  subscribeQueue,
} from '@/lib/offline/queue';
import {
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  getConfigSync,
  loadRetryConfig,
  saveRetryConfig,
  subscribeConfig,
} from '@/lib/offline/config';

export function useOfflineSync() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [config, setConfig] = useState<RetryConfig>(getConfigSync() ?? DEFAULT_RETRY_CONFIG);
  const [progress, setProgressState] = useState<SyncProgress>({
    running: false,
    total: 0,
    done: 0,
    failed: 0,
  });

  const refresh = useCallback(async () => {
    const [q, last] = await Promise.all([getQueue(), getLastSyncAt()]);
    setQueue(q);
    setLastSyncAt(last);
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      return await processQueue();
    } finally {
      setSyncing(false);
      await refresh();
    }
  }, [refresh]);

  const discard = useCallback(
    async (id: string) => {
      await removeOperation(id);
      await refresh();
    },
    [refresh],
  );

  const retry = useCallback(
    async (id: string, force = false) => {
      await retryOperation(id, force);
      await refresh();
    },
    [refresh],
  );

  const updateConfig = useCallback(async (patch: Partial<RetryConfig>) => {
    setConfig(await saveRetryConfig(patch));
  }, []);

  useEffect(() => {
    startBackgroundQueueWatcher();
    void refresh();
    void loadRetryConfig().then(setConfig);

    const unsubQueue = subscribeQueue(() => void refresh());
    const unsubConfig = subscribeConfig(() => setConfig(getConfigSync()));
    const unsubProgress = subscribeProgress(setProgressState);

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      unsubQueue();
      unsubConfig();
      unsubProgress();
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [refresh]);

  return {
    online,
    queue,
    pendingCount: queue.filter((q) => q.status !== 'conflito' && q.status !== 'bloqueado').length,
    conflicts: queue.filter((q) => q.status === 'conflito' || q.status === 'bloqueado'),
    exceeded: queue.filter((q) => q.status === 'excedido'),
    errors: queue.filter((q) => q.lastError),
    lastSyncAt,
    syncing: syncing || progress.running,
    progress,
    config,
    updateConfig,
    sync,
    retry,
    discard,
    refresh,
  };
}
