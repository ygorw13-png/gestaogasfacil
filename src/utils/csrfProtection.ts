
import { useState, useEffect, useCallback } from 'react';
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

  // Use useCallback para evitar recriação da função em cada renderização
  const refreshCsrfToken = useCallback((): string => {
    const newToken = generateCsrfToken();
    localStorage.setItem(CSRF_TOKEN_KEY, newToken);
    setCsrfToken(newToken);
    return newToken;
  }, []);

  // Use useCallback para evitar recriação da função em cada renderização
  const addCsrfHeader = useCallback((headers: Record<string, string> = {}): Record<string, string> => {
    return {
      ...headers,
      'X-CSRF-Token': csrfToken,
    };
  }, [csrfToken]);

  return {
    csrfToken,
    validateCsrfToken,
    refreshCsrfToken,
    addCsrfHeader
  };
};
