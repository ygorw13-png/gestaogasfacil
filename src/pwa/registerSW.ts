/**
 * Registro do service worker (modo offline).
 * Só registra no app publicado — nunca no preview/dev do Lovable.
 */
const SW_URL = '/sw.js';

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === 'undefined') return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }

  const host = window.location.hostname;
  if (host.startsWith('id-preview--') || host.startsWith('preview--')) return true;
  if (host === 'lovableproject.com' || host.endsWith('.lovableproject.com')) return true;
  if (host === 'lovableproject-dev.com' || host.endsWith('.lovableproject-dev.com')) return true;
  if (host === 'beta.lovable.dev' || host.endsWith('.beta.lovable.dev')) return true;
  if (new URLSearchParams(window.location.search).has('sw')) {
    if (new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  }
  return false;
}

async function unregisterAppSW() {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || '').endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export function registerOfflineSupport() {
  if (!('serviceWorker' in navigator)) return;

  if (isBlockedContext()) {
    void unregisterAppSW();
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL).catch(() => {
      /* offline opcional: falha silenciosa */
    });
  });
}
