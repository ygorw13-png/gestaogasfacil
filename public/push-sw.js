/* Service worker dedicado aos avisos (Web Push) do entregador.
   Escopo próprio (/push/) para não disputar o escopo "/" com o modo offline (sw.js).
   Não faz cache de nada. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "GásFácil", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "GásFácil";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    // Som e vibração seguem a configuração do aparelho (modo silencioso / Não Perturbe são respeitados).
    vibrate: [300, 100, 300, 100, 500],
    silent: false,
    // Uma notificação por pedido: reenvio substitui em vez de empilhar.
    tag: payload.tag || "gasfacil",
    renotify: true,
    requireInteraction: true,
    data: { url: payload.url || "/entregador/entregas", orderId: payload.orderId || null },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/entregador/entregas";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (lista) => {
      for (const client of lista) {
        if (!("focus" in client)) continue;
        // A janela não é controlada por este worker: pede para ela abrir o pedido.
        client.postMessage({ tipo: "abrir-pedido", url });
        try {
          return await client.focus();
        } catch {
          /* sem foco permitido: abre nova janela abaixo */
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
