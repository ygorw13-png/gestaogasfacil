
/**
 * Utilitários para validação de entradas
 */
import { sanitizeHtml, sanitizeSqlParam } from './securityUtils';

/**
 * Sanitiza e valida um email
 */
export const validateEmail = (email: string): string => {
  if (!email) return '';
  
  const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    throw new Error('Formato de email inválido');
  }
  
  return sanitizedEmail;
};

/**
 * Valida campos obrigatórios
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
 */
export const sanitizeUrlParam = (value: string): string => {
  if (!value) return '';
  
  return encodeURIComponent(sanitizeHtml(value));
};
