
import { useState, useEffect, useRef, useCallback } from 'react';

interface SecurityTimeoutOptions {
  timeoutMinutes?: number;
  onTimeout?: () => void;
  events?: string[];
}

/**
 * Hook para gerenciar timeout de segurança por inatividade do usuário
 * Útil para realizar logout automático após período de inatividade
 */
export function useSecurityTimeout({
  timeoutMinutes = 30,
  onTimeout,
  events = ['mousedown', 'keydown', 'touchstart', 'scroll']
}: SecurityTimeoutOptions = {}) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Função para resetar o timer
  const resetTimer = useCallback(() => {
    setIsIdle(false);
    
    // Limpar o timeout anterior, se existir
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    // Configurar um novo timeout
    const timeoutId = window.setTimeout(() => {
      setIsIdle(true);
      if (onTimeout) onTimeout();
    }, timeoutMinutes * 60 * 1000);
    
    timeoutRef.current = timeoutId;
  }, [timeoutMinutes, onTimeout]);

  // Configurar listeners de eventos para resetar o timer
  useEffect(() => {
    // Inicializar o timer
    resetTimer();
    
    // Adicionar listeners para os eventos especificados
    const resetTimerBound = resetTimer;
    events.forEach(event => {
      window.addEventListener(event, resetTimerBound);
    });
    
    // Cleanup: remover os listeners e limpar o timeout
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimerBound);
      });
      
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer, events]);

  return { isIdle, resetTimer };
}
