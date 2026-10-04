// ===== نظام الصوت لـ KmaKimo =====
// كل الأصوات هون متولّدة برمجيًا (Web Audio API) بدون أي ملفات صوتية خارجية

const GameAudio = (() => {
  let ctxA = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let muted = false;
  let musicTimer = null;
  let noteIndex = 0;
  let heartbeatActive = false;
  let heartbeatTimer = null;

  function ensureCtx() {
    if (!ctxA) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctxA = new AC();
      masterGain = ctxA.createGain();
      masterGain.gain.value = muted ? 0 : 1;
      masterGain.connect(ctxA.destination);
      musicGain = ctxA.createGain();
      musicGain.gain.value = 0.16;
      musicGain.connect(masterGain);
      sfxGain = ctxA.createGain();
      sfxGain.gain.value = 0.4;
      sfxGain.connect(masterGain);
    }
    if (ctxA.state === 'suspended') ctxA.resume();
  }

  function tone(freq, dur, type, gainNode, delay, vol) {
    if (!ctxA) return;
    delay = delay || 0;
    vol = vol === undefined ? 1 : vol;
    const t0 = ctxA.currentTime + delay;
    const osc = ctxA.createOscillator();
    const g = ctxA.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    osc.connect(g);
    g.connect(gainNode);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function playCoin() {
    ensureCtx();
    tone(880, 0.09, 'triangle', sfxGain, 0, 0.5);
    tone(1320, 0.12, 'triangle', sfxGain, 0.05, 0.4);
  }

  function playFishCatch() {
    ensureCtx();
    tone(660, 0.1, 'square', sfxGain, 0, 0.32);
    tone(880, 0.1, 'square', sfxGain, 0.08, 0.32);
    tone(1100, 0.18, 'square', sfxGain, 0.16, 0.36);
  }

  function playHit() {
    ensureCtx();
    tone(180, 0.25, 'sawtooth', sfxGain, 0, 0.5);
    tone(90, 0.35, 'sawtooth', sfxGain, 0.05, 0.5);
  }

  function playGameOver() {
    ensureCtx();
    [440, 370, 310, 220].forEach((f, i) => tone(f, 0.32, 'triangle', sfxGain, i * 0.16, 0.4));
  }

  function playStart() {
    ensureCtx();
    [440, 550, 660, 880].forEach((f, i) => tone(f, 0.14, 'triangle', sfxGain, i * 0.08, 0.38));
  }

  function playClick() {
    ensureCtx();
    tone(520, 0.06, 'square', sfxGain, 0, 0.22);
  }

  function playPurchase() {
    ensureCtx();
    tone(700, 0.1, 'triangle', sfxGain, 0, 0.4);
    tone(1050, 0.14, 'triangle', sfxGain, 0.07, 0.4);
  }

  function playDeny() {
    ensureCtx();
    tone(200, 0.15, 'square', sfxGain, 0, 0.3);
  }

  function playTeleport() {
    ensureCtx();
    [520, 660, 830, 1040, 1300].forEach((f, i) => tone(f, 0.22, 'sine', sfxGain, i * 0.07, 0.4));
    tone(120, 0.5, 'sawtooth', sfxGain, 0, 0.2);
  }

  // ---- موسيقى خلفية بسيطة، لحن مغامرة مكرر (أصلي بالكامل) ----
  const musicNotes = [220, 262, 330, 262, 294, 262, 330, 392];

  function scheduleMusic() {
    if (!ctxA) return;
    const noteDur = 0.38;
    const freq = musicNotes[noteIndex % musicNotes.length];
    tone(freq, noteDur * 0.9, 'sine', musicGain, 0, 0.45);
    tone(freq / 2, noteDur * 0.9, 'sine', musicGain, 0, 0.22);
    noteIndex++;
    musicTimer = setTimeout(scheduleMusic, noteDur * 1000);
  }

  function startMusic() {
    ensureCtx();
    if (musicTimer) return;
    noteIndex = 0;
    scheduleMusic();
  }

  function stopMusic() {
    if (musicTimer) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  }

  // ---- نبضة قلب لما الأوكسجين يقرب يخلص ----
  function heartbeatBeat() {
    if (!heartbeatActive) return;
    tone(70, 0.12, 'sine', sfxGain, 0, 0.5);
    tone(58, 0.14, 'sine', sfxGain, 0.16, 0.36);
    heartbeatTimer = setTimeout(heartbeatBeat, 550);
  }

  function startHeartbeat() {
    ensureCtx();
    if (heartbeatActive) return;
    heartbeatActive = true;
    heartbeatBeat();
  }

  function stopHeartbeat() {
    heartbeatActive = false;
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function toggleMute() {
    ensureCtx();
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : 1;
    return muted;
  }

  function isMuted() {
    return muted;
  }

  return {
    ensureCtx, playCoin, playFishCatch, playHit, playGameOver,
    playStart, playClick, playPurchase, playDeny, playTeleport,
    startMusic, stopMusic, startHeartbeat, stopHeartbeat,
    toggleMute, isMuted
  };
})();
