
/**
 * Utilitário de logging para a aplicação
 * Permite logs consistentes e seguros em toda a aplicação
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  user?: string | null;
  module?: string;
  metadata?: Record<string, any>;
}

const isProduction = import.meta.env.PROD;

// Função para mascarar dados sensíveis
const maskSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;
  
  const masked = { ...data };
  
  // Lista de chaves que contêm dados sensíveis
  const sensitiveKeys = ['password', 'senha', 'token', 'secret', 'authorization', 'cartao', 'card', 'cvv', 'cpf', 'cnpj'];
  
  Object.keys(masked).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(k => lowerKey.includes(k))) {
      masked[key] = '******';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  });
  
  return masked;
};

// Formata a mensagem de log
const formatLogMessage = (level: LogLevel, message: string, options?: LogOptions): string => {
  const timestamp = new Date().toISOString();
  const userInfo = options?.user ? `[Usuário: ${options.user}]` : '';
  const moduleInfo = options?.module ? `[Módulo: ${options.module}]` : '';
  
  return `${timestamp} ${level.toUpperCase()}: ${userInfo}${moduleInfo} ${message}`;
};

// Log básico com nível
const log = (level: LogLevel, message: string, options?: LogOptions, data?: any) => {
  // Em produção, não exibimos logs de debug
  if (isProduction && level === 'debug') return;
  
  const formattedMessage = formatLogMessage(level, message, options);
  
  // Mascaramos dados sensíveis se houver
  const safeData = data ? maskSensitiveData(data) : undefined;
  
  switch (level) {
    case 'debug':
      console.debug(formattedMessage, safeData);
      break;
    case 'info':
      console.info(formattedMessage, safeData);
      break;
    case 'warn':
      console.warn(formattedMessage, safeData);
      break;
    case 'error':
      console.error(formattedMessage, safeData);
      break;
  }
  
  // Aqui poderíamos implementar integração com serviços de log externos
  // como Sentry, LogRocket, etc.
};

// API pública do logger
export const logger = {
  debug: (message: string, options?: LogOptions, data?: any) => log('debug', message, options, data),
  info: (message: string, options?: LogOptions, data?: any) => log('info', message, options, data),
  warn: (message: string, options?: LogOptions, data?: any) => log('warn', message, options, data),
  error: (message: string, options?: LogOptions, data?: any) => log('error', message, options, data),
  
  // Logs específicos para autenticação
  auth: {
    loginAttempt: (email: string) => {
      log('info', `Tentativa de login`, { module: 'auth' }, { email });
    },
    loginSuccess: (userId: string) => {
      log('info', `Login realizado com sucesso`, { module: 'auth', user: userId });
    },
    loginFailure: (email: string, reason: string) => {
      log('warn', `Falha no login: ${reason}`, { module: 'auth' }, { email });
    },
    logout: (userId: string) => {
      log('info', `Logout realizado`, { module: 'auth', user: userId });
    },
    sessionExpired: (userId: string) => {
      log('info', `Sessão expirada`, { module: 'auth', user: userId });
    }
  },
  
  // Logs específicos para operações de usuário
  user: {
    created: (userId: string) => {
      log('info', `Novo usuário criado`, { module: 'user', user: userId });
    },
    updated: (userId: string, fields: string[]) => {
      log('info', `Perfil atualizado`, { module: 'user', user: userId }, { updated_fields: fields });
    }
  }
};
