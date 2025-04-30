
/**
 * Utilitários de segurança para proteção contra ataques comuns
 */

/**
 * Sanitiza texto para prevenir XSS (Cross-Site Scripting)
 * Remove tags HTML e caracteres especiais potencialmente perigosos
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Remove tags HTML e scripts
  const sanitized = input
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/&lt;script/gi, '')
    .replace(/&#x/gi, '');
    
  return sanitized;
};

/**
 * Gera um token CSRF para proteção contra ataques CSRF
 */
export const generateCsrfToken = (): string => {
  // Criar um token aleatório (32 caracteres)
  return Array(32)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');
};

/**
 * Sanitiza parâmetros de consulta SQL para evitar injeção SQL
 * Este é principalmente um auxiliar para quando não estamos usando o cliente Supabase
 */
export const sanitizeSqlParam = (param: string): string => {
  if (!param) return '';
  
  // Remove caracteres que poderiam ser usados para injeção SQL
  return param
    .replace(/'/g, "''") // Escapa aspas simples
    .replace(/;/g, '') // Remove ponto e vírgula
    .replace(/--/g, '') // Remove comentários SQL
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
};

/**
 * Valida se uma string contém apenas caracteres alfanuméricos, traços e sublinhados
 * Útil para validar IDs e outros parâmetros sensíveis
 */
export const isValidId = (id: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(id);
};

/**
 * Força redirecionamento para HTTPS quando a aplicação está em produção
 * e o usuário está em uma conexão HTTP.
 */
export const enforceHttps = (): void => {
  if (typeof window !== 'undefined' && 
      window.location.protocol === 'http:' && 
      process.env.NODE_ENV === 'production') {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
};

/**
 * Valida se uma senha atende aos requisitos de segurança
 * @param password Senha a ser validada
 * @returns Um objeto com o resultado da validação e mensagem de erro, se houver
 */
export const validatePasswordStrength = (password: string): { 
  valid: boolean; 
  message?: string;
} => {
  if (!password) {
    return { valid: false, message: 'A senha é obrigatória' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos um número' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos um caractere especial' };
  }

  // Lista comum de senhas fracas
  const commonPasswords = [
    'password', 'senha123', 'admin123', '12345678', 'qwerty123', '123456789', 'abc12345'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, message: 'Esta senha é muito comum e facilmente adivinhável' };
  }

  return { valid: true };
};

/**
 * Gera um hash de senha seguro (simulação - na prática o Supabase lida com isso)
 * Apenas para referência de implementação
 */
export const hashPassword = (password: string): string => {
  // Na prática, a autenticação do Supabase já usa bcrypt para senhas
  // Esta função é apenas para demonstração
  console.warn('AVISO: Esta função é apenas para demonstração. O Supabase já implementa hashing seguro de senhas.');
  
  // O código abaixo seria usado se precisássemos implementar nosso próprio hashing
  // const salt = crypto.randomBytes(16).toString('hex');
  // const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  // return `${salt}:${hash}`;
  
  return '[HASH SEGURO]';
};

/**
 * Gera uma senha aleatória segura
 * @param length Comprimento da senha (padrão: 12)
 * @returns Uma senha segura aleatória
 */
export const generateSecurePassword = (length: number = 12): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let password = '';
  
  // Garantir pelo menos um de cada tipo
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*()-_=+'[Math.floor(Math.random() * 14)];
  
  // Preencher o resto
  for (let i = 4; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Embaralhar a senha
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Verifica se a rota atual é segura (HTTPS)
 * @returns True se a rota for segura
 */
export const isSecureRoute = (): boolean => {
  return typeof window !== 'undefined' && 
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
};

/**
 * Verifica se a aplicação está em ambiente de produção
 * @returns True se em produção
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Gera um ID único com prefixo para identificação de elementos
 * @param prefix Prefixo para o ID
 * @returns ID único
 */
export const generateSecureId = (prefix: string = 'sec'): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
};
