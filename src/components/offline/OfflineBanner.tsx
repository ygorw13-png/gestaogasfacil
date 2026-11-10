import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Faixa fina no topo avisando que o app está offline, sincronizando ou com pendências. */
export function OfflineBanner() {
  const { online, pendingCount, conflicts, blocked, progress } = useOfflineSync();

  if (online && pendingCount === 0 && conflicts.length === 0 && blocked.length === 0) return null;

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  let texto: string;
  if (progress.running) {
    texto = `Enviando ${progress.done}/${progress.total} lançamento(s)… ${pct}%`;
  } else if (conflicts.length > 0) {
    texto = `${conflicts.length} lançamento(s) precisam da sua confirmação — toque para revisar`;
  } else if (blocked.length > 0) {
    texto = `${blocked.length} lançamento(s) antigo(s) não enviado(s) — toque para conferir`;
  } else if (online) {
    texto = `${pendingCount} lançamento(s) aguardando envio — toque para ver`;
  } else {
    texto = `Sem internet — trabalhando offline${pendingCount ? ` (${pendingCount} na fila)` : ''}`;
  }

  return (
    <Link
      to="/offline"
      className="bg-amber-500/15 text-amber-600 dark:text-amber-400 relative flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium"
    >
      {progress.running ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : conflicts.length > 0 || blocked.length > 0 ? (
        <AlertTriangle className="h-3.5 w-3.5" />
      ) : online ? (
        <RefreshCw className="h-3.5 w-3.5" />
      ) : (
        <CloudOff className="h-3.5 w-3.5" />
      )}
      {texto}
      {progress.running && (
        <span
          className="bg-amber-500 absolute bottom-0 left-0 h-0.5 transition-all"
          style={{ width: `${pct}%` }}
        />
      )}
    </Link>
  );
}
