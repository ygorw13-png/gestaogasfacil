
import { useState, useEffect } from 'react';
import { generateCsrfToken } from './securityUtils';

// Chave para armazenar o token CSRF no localStorage
const CSRF_TOKEN_KEY = 'csrf_token';

/**
 * Hook que gerencia tokens CSRF para proteção contra ataques CSRF
 */
export const useCsrfProtection = () => {
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    let token = localStorage.getItem(CSRF_TOKEN_KEY);
    
    if (!token) {
      token = generateCsrfToken();
      localStorage.setItem(CSRF_TOKEN_KEY, token);
    }
    
    setCsrfToken(token);
  }, []);

  const validateCsrfToken = (token: string): boolean => {
    return token === localStorage.getItem(CSRF_TOKEN_KEY);
  };

  const refreshCsrfToken = (): string => {
    const newToken = generateCsrfToken();
    localStorage.setItem(CSRF_TOKEN_KEY, newToken);
    setCsrfToken(newToken);
    return newToken;
  };

  const addCsrfHeader = (headers: Record<string, string> = {}): Record<string, string> => {
    return {
      ...headers,
      'X-CSRF-Token': csrfToken,
    };
  };

  return {
    csrfToken,
    validateCsrfToken,
    refreshCsrfToken,
    addCsrfHeader
  };
};
