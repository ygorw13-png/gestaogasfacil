/**
 * Cache seguro e mínimo do usuário para permitir acesso básico offline.
 * Guarda apenas dados não sensíveis (id, nome, e-mail e papel) —
 * nunca senha. O token de sessão continua sob responsabilidade do backend.
 */
const KEY = 'gasfacil.offline.user';

export interface CachedUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  cachedAt: number;
}

export function saveCachedUser(user: CachedUser) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    /* ignora */
  }
}

export function getCachedUser(): CachedUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedUser;
    // Validade do acesso offline: 7 dias
    if (Date.now() - parsed.cachedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearCachedUser() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
