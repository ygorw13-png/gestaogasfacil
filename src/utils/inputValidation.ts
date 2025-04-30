
/**
 * Utilitários para validação de entradas
 */
import { sanitizeHtml, sanitizeSqlParam } from './securityUtils';

/**
 * Sanitiza e valida um email
 * @param email Email a ser validado
 * @returns Email sanitizado
 */
export const validateEmail = (email: string): string => {
  if (!email) return '';
  
  // Sanitizar e normalizar o email
  const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
  
  // Validação simples de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    throw new Error('Formato de email inválido');
  }
  
  return sanitizedEmail;
};

/**
 * Valida campos obrigatórios
 * @param fields Objeto com os campos a serem validados
 * @returns True se todos os campos estiverem preenchidos
 */
export const validateRequiredFields = (fields: Record<string, any>): boolean => {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      throw new Error(`Campo ${key} é obrigatório`);
    }
  }
  return true;
};

/**
 * Sanitiza valores para uso em URLs
 * @param value Valor a ser sanitizado
 * @returns Valor sanitizado
 */
export const sanitizeUrlParam = (value: string): string => {
  if (!value) return '';
  
  // Remove caracteres especiais que podem ser usados para injeção
  return encodeURIComponent(sanitizeHtml(value));
};
