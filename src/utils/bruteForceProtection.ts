
type FailedAttempt = {
  timestamp: number;
  count: number;
  blockExpiresAt: number | null;
};

// Armazena tentativas falhas por email
const failedAttempts = new Map<string, FailedAttempt>();

const MAX_ATTEMPTS = 5;         // Máximo de tentativas permitidas
const BLOCK_TIME = 15 * 60000;  // Tempo de bloqueio em ms (15 minutos)
const ATTEMPT_WINDOW = 30 * 60000; // Janela de tempo para contar tentativas (30 minutos)

/**
 * Registra uma tentativa falha de login
 * @param email O email que tentou fazer login
 * @returns Objeto com status de bloqueio e tentativas restantes
 */
export const registerFailedAttempt = (email: string): { 
  blocked: boolean; 
  attemptsLeft: number;
  blockExpiresAt: number | null;
} => {
  const now = Date.now();
  const attempt = failedAttempts.get(email) || { timestamp: now, count: 0, blockExpiresAt: null };
  
  // Verificar se já passou o tempo de bloqueio
  if (attempt.blockExpiresAt && now > attempt.blockExpiresAt) {
    // Reset if the block has expired
    attempt.count = 1;
    attempt.blockExpiresAt = null;
  } else if (!attempt.blockExpiresAt) {
    // Se não estiver bloqueado, incrementa as tentativas
    attempt.count += 1;
    
    // Se exceder o limite, bloqueia
    if (attempt.count >= MAX_ATTEMPTS) {
      attempt.blockExpiresAt = now + BLOCK_TIME;
    }
  }
  
  attempt.timestamp = now;
  failedAttempts.set(email, attempt);
  
  return {
    blocked: attempt.blockExpiresAt !== null && now < attempt.blockExpiresAt,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempt.count),
    blockExpiresAt: attempt.blockExpiresAt
  };
};

/**
 * Verifica se um email está bloqueado para login
 */
export const checkLoginStatus = (email: string): { 
  blocked: boolean; 
  blockExpiresAt: number | null;
  attemptsLeft: number;
} => {
  const now = Date.now();
  const attempt = failedAttempts.get(email);
  
  if (!attempt) {
    return { blocked: false, blockExpiresAt: null, attemptsLeft: MAX_ATTEMPTS };
  }
  
  // Limpar tentativas antigas
  if (now - attempt.timestamp > ATTEMPT_WINDOW && !attempt.blockExpiresAt) {
    failedAttempts.delete(email);
    return { blocked: false, blockExpiresAt: null, attemptsLeft: MAX_ATTEMPTS };
  }
  
  // Verificar se o bloqueio expirou
  if (attempt.blockExpiresAt && now > attempt.blockExpiresAt) {
    failedAttempts.delete(email);
    return { blocked: false, blockExpiresAt: null, attemptsLeft: MAX_ATTEMPTS };
  }
  
  return {
    blocked: attempt.blockExpiresAt !== null && now < attempt.blockExpiresAt,
    blockExpiresAt: attempt.blockExpiresAt,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempt.count)
  };
};

/**
 * Reseta as tentativas falhas para um email após login bem-sucedido
 */
export const resetFailedAttempts = (email: string): void => {
  failedAttempts.delete(email);
};
