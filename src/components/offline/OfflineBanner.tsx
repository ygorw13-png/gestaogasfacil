import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CloudOff, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Faixa fina no topo avisando que o app está offline ou com envios pendentes. */
export function OfflineBanner() {
  const { online, pendingCount, syncing } = useOfflineSync();

  if (online && pendingCount === 0) return null;

  return (
    <Link
      to="/offline"
      className="bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium"
    >
      {online ? (
        <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
      ) : (
        <CloudOff className="h-3.5 w-3.5" />
      )}
      {online
        ? `${pendingCount} lançamento(s) aguardando envio — toque para ver`
        : `Sem internet — trabalhando offline${pendingCount ? ` (${pendingCount} na fila)` : ''}`}
    </Link>
  );
}
