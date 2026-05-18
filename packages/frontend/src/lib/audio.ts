// Singleton AudioContext — ブラウザの自動再生ポリシー対策として
// ユーザー操作時に resume() してから再利用する
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;

  if (!audioCtx) {
    audioCtx = new AC();
  }
  return audioCtx;
}

/**
 * ページ上の最初のユーザー操作で AudioContext を resume する。
 * 教員画面の useEffect 等で一度だけ呼び出す。
 */
export function initAudioOnInteraction(): () => void {
  const handler = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  };
  document.addEventListener('click', handler, { once: true });
  document.addEventListener('keydown', handler, { once: true });

  return () => {
    document.removeEventListener('click', handler);
    document.removeEventListener('keydown', handler);
  };
}

export const playAlertSound = async () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // suspended の場合は resume を試みる
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // First beep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(660, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain1.gain.linearRampToValueAtTime(0, now + 0.2);

    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, now + 0.25);

    gain2.gain.setValueAtTime(0, now + 0.25);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.3);
    gain2.gain.linearRampToValueAtTime(0, now + 0.45);

    osc2.start(now + 0.25);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.error('Failed to play alert sound:', e);
  }
};
