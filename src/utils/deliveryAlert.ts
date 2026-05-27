/**
 * Toca um som de alerta sintetizado (sem precisar de arquivo mp3)
 * e vibra o celular se suportado.
 */
export function playDeliveryAlert() {
  try {
    // Vibração
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    }

    // Som sintetizado (3 beeps agudos)
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

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
