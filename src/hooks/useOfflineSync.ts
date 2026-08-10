import { useCallback, useEffect, useState } from 'react';
import {
  QueuedOperation,
  getLastSyncAt,
  getQueue,
  processQueue,
  removeOperation,
  subscribeQueue,
} from '@/lib/offline/queue';

export function useOfflineSync() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

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

  useEffect(() => {
    void refresh();
    const unsub = subscribeQueue(() => void refresh());

    const goOnline = () => {
      setOnline(true);
      void sync();
    };
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Tentativa periódica enquanto houver pendências
    const interval = window.setInterval(() => {
      if (navigator.onLine) void processQueue();
    }, 60_000);

    if (navigator.onLine) void processQueue();

    return () => {
      unsub();
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.clearInterval(interval);
    };
  }, [refresh, sync]);

  return {
    online,
    queue,
    pendingCount: queue.length,
    errors: queue.filter((q) => q.lastError),
    lastSyncAt,
    syncing,
    sync,
    discard,
    refresh,
  };
}
