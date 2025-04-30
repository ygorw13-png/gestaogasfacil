
/**
 * Proteção contra ataques de força bruta, com limite de tentativas de login
 */

interface FailedLoginAttempt {
  count: number;
  lastAttempt: number;
  blocked: boolean;
  blockExpiresAt: number | null;
}

// Chave para armazenamento no localStorage
const FAILED_ATTEMPTS_KEY = 'failed_login_attempts';

// Configurações
const MAX_ATTEMPTS = 5; // Número máximo de tentativas
const BLOCK_DURATION = 15 * 60 * 1000; // Tempo de bloqueio em ms (15 minutos)
const RESET_AFTER = 60 * 60 * 1000; // Tempo para resetar contagem (1 hora)

/**
 * Registra uma tentativa falha de login
 * @param identifier Identificador único do usuário (geralmente email ou username)
 * @returns Objeto com informações sobre o status da conta
 */
export const registerFailedAttempt = (identifier: string): { 
  blocked: boolean; 
  attemptsLeft: number;
  blockExpiresAt: number | null;
} => {
  // Sanitizar o identificador para evitar manipulação do localStorage
  const safeIdentifier = identifier.trim().toLowerCase().replace(/[^a-z0-9@._-]/gi, '');
  const storageKey = `${FAILED_ATTEMPTS_KEY}_${safeIdentifier}`;
  
  // Obter dados existentes ou criar um novo objeto
  let attemptData: FailedLoginAttempt;
  const storedData = localStorage.getItem(storageKey);
  
  if (storedData) {
    attemptData = JSON.parse(storedData);
    
    // Verificar se o bloqueio expirou
    if (attemptData.blocked && attemptData.blockExpiresAt) {
      if (Date.now() > attemptData.blockExpiresAt) {
        // Bloqueio expirou, resetar
        attemptData = {
          count: 1,
          lastAttempt: Date.now(),
          blocked: false,
          blockExpiresAt: null
        };
      } else {
        // A conta ainda está bloqueada
        return {
          blocked: true,
          attemptsLeft: 0,
          blockExpiresAt: attemptData.blockExpiresAt
        };
      }
    } 
    // Verificar se devemos resetar a contagem por inatividade
    else if (Date.now() - attemptData.lastAttempt > RESET_AFTER) {
      attemptData = {
        count: 1,
        lastAttempt: Date.now(),
        blocked: false,
        blockExpiresAt: null
      };
    } 
    // Incrementar a contagem de tentativas
    else {
      attemptData.count += 1;
      attemptData.lastAttempt = Date.now();
      
      // Verificar se atingiu o limite de tentativas
      if (attemptData.count >= MAX_ATTEMPTS) {
        attemptData.blocked = true;
        attemptData.blockExpiresAt = Date.now() + BLOCK_DURATION;
      }
    }
  } else {
    // Primeira tentativa falha
    attemptData = {
      count: 1,
      lastAttempt: Date.now(),
      blocked: false,
      blockExpiresAt: null
    };
  }
  
  // Salvar os dados atualizados
  localStorage.setItem(storageKey, JSON.stringify(attemptData));
  
  return {
    blocked: attemptData.blocked,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attemptData.count),
    blockExpiresAt: attemptData.blockExpiresAt
  };
};

/**
 * Verifica se uma conta está bloqueada
 * @param identifier Identificador único do usuário
 * @returns Status do bloqueio e tentativas restantes
 */
export const checkLoginStatus = (identifier: string): { 
  blocked: boolean; 
  attemptsLeft: number;
  blockExpiresAt: number | null;
} => {
  const safeIdentifier = identifier.trim().toLowerCase().replace(/[^a-z0-9@._-]/gi, '');
  const storageKey = `${FAILED_ATTEMPTS_KEY}_${safeIdentifier}`;
  
  const storedData = localStorage.getItem(storageKey);
  if (!storedData) {
    return { blocked: false, attemptsLeft: MAX_ATTEMPTS, blockExpiresAt: null };
  }
  
  const attemptData: FailedLoginAttempt = JSON.parse(storedData);
  
  // Verificar se o bloqueio expirou
  if (attemptData.blocked && attemptData.blockExpiresAt) {
    if (Date.now() > attemptData.blockExpiresAt) {
      // Bloqueio expirou, limpar dados
      localStorage.removeItem(storageKey);
      return { blocked: false, attemptsLeft: MAX_ATTEMPTS, blockExpiresAt: null };
    }
  }
  
  // Verificar se devemos resetar por inatividade
  if (Date.now() - attemptData.lastAttempt > RESET_AFTER) {
    localStorage.removeItem(storageKey);
    return { blocked: false, attemptsLeft: MAX_ATTEMPTS, blockExpiresAt: null };
  }
  
  return {
    blocked: attemptData.blocked,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attemptData.count),
    blockExpiresAt: attemptData.blockExpiresAt
  };
};

/**
 * Reseta o contador de tentativas falhas para um usuário específico
 * Deve ser chamado após um login bem-sucedido
 * @param identifier Identificador único do usuário
 */
export const resetFailedAttempts = (identifier: string): void => {
  const safeIdentifier = identifier.trim().toLowerCase().replace(/[^a-z0-9@._-]/gi, '');
  const storageKey = `${FAILED_ATTEMPTS_KEY}_${safeIdentifier}`;
  localStorage.removeItem(storageKey);
};
