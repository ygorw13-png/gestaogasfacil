import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { subscribeSyncResult } from '@/lib/offline/queue';

/**
 * Mostra avisos simples quando a sincronização offline termina
 * ou quando algum lançamento precisa da sua confirmação.
 */
export function OfflineSyncToasts() {
  const navigate = useNavigate();
  const navRef = useRef(navigate);
  navRef.current = navigate;

  useEffect(() => {
    const abrirFila = { label: 'Ver fila', onClick: () => navRef.current('/offline') };

    const unsub = subscribeSyncResult(({ sent, failed, conflicts }) => {
      if (sent > 0) {
        toast.success(
          sent === 1 ? '1 lançamento enviado para a nuvem' : `${sent} lançamentos enviados para a nuvem`,
          { description: 'Sincronização concluída.', action: abrirFila },
        );
      }
      if (conflicts > 0) {
        toast.warning(
          conflicts === 1
            ? '1 lançamento precisa da sua confirmação'
            : `${conflicts} lançamentos precisam da sua confirmação`,
          {
            description: 'Pode ser repetição de algo que já está na nuvem.',
            duration: 10000,
            action: abrirFila,
          },
        );
      }
      if (failed > 0) {
        toast.error(
          failed === 1 ? '1 lançamento não foi enviado' : `${failed} lançamentos não foram enviados`,
          { description: 'O app vai tentar de novo automaticamente.', action: abrirFila },
        );
      }
    });
  }, []);

  return null;
}
