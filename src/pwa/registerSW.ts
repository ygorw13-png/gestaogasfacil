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

  // Havia controlador antigo? Então uma troca de controlador = versão nova publicada.
  // Só conta troca entre duas versões do sw.js do app (o push-sw.js do entregador
  // usa o mesmo escopo e não é "versão nova").
  const ehDoApp = (sw: ServiceWorker | null | undefined) => !!sw && sw.scriptURL.endsWith(SW_URL);
  const hadController = ehDoApp(navigator.serviceWorker.controller);
  let avisado = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || avisado || !ehDoApp(navigator.serviceWorker.controller)) return;
    avisado = true;
    avisarNovaVersao();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_URL)
      .then((reg) => {
        const checar = () => {
          if (navigator.onLine) reg.update().catch(() => undefined);
        };
        // Procura versão nova ao voltar para a aba e a cada 15 minutos.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checar();
        });
        window.setInterval(checar, 15 * 60 * 1000);
      })
      .catch(() => {
        /* offline opcional: falha silenciosa */
      });
  });
}

/**
 * Versão nova ativa: oferece "Atualizar" e recarrega sozinho quando a aba fica em segundo
 * plano sem janela aberta (a fila offline fica salva no aparelho; formulário aberto não é perdido).
 */
function avisarNovaVersao() {
  const recarregar = () => window.location.reload();
  void import('sonner').then(({ toast }) => {
    toast('Nova versão do GásFácil disponível', {
      duration: Infinity,
      action: { label: 'Atualizar', onClick: recarregar },
    });
  });
  const aoOcultar = () => {
    if (document.visibilityState === 'hidden' && !document.querySelector('[role="dialog"]')) recarregar();
  };
  document.addEventListener('visibilitychange', aoOcultar);
}
