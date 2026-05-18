export const playAlertSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    
    // First beep
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(660, audioCtx.currentTime); // E5

    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
    gain1.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
    
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.25);
    
    // Second beep
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, audioCtx.currentTime + 0.25);
    
    gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.25);
    gain2.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.3);
    gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.45);
    
    osc2.start(audioCtx.currentTime + 0.25);
    osc2.stop(audioCtx.currentTime + 0.5);

  } catch (e) {
    console.error('Failed to play alert sound:', e);
  }
};
