/**
 * Alerta de entrega em primeiro plano: som sintetizado (sem arquivo) + vibração.
 * Navegadores de celular só tocam som depois de um toque do usuário: `desbloquearSom()`
 * é chamado no botão "Ativar notificações"/"Testar aviso" e o mesmo contexto de áudio é reutilizado.
 * Em segundo plano quem avisa é a notificação do sistema (push-sw.js), não este som.
 */
let ctxCompartilhado: AudioContext | null = null;

function contexto(): AudioContext | null {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctxCompartilhado) ctxCompartilhado = new AudioCtx();
  return ctxCompartilhado;
}

/** Chamar dentro de um toque do usuário. */
export function desbloquearSom() {
  try {
    const ctx = contexto();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    /* sem áudio */
  }
}

export function playDeliveryAlert() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    }
    const ctx = contexto();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);

    const playBeep = (startTime: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    };

    const now = ctx.currentTime;
    playBeep(now, 880);
    playBeep(now + 0.35, 1100);
    playBeep(now + 0.7, 1320);
  } catch (e) {
    console.warn("Não foi possível tocar alerta:", e);
  }
}
