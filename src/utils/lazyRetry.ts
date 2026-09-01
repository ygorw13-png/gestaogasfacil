import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "chunk-reload-at";

/**
 * lazy() com recuperação automática: se o chunk falhar por causa de um deploy novo
 * (Failed to fetch dynamically imported module), recarrega a página uma vez.
 */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
        // evita renderizar erro antes do reload
        return await new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
