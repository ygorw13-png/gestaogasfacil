
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
