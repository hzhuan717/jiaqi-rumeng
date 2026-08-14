export function normalizeUnlockName(value) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

export function canUnlock(value, acceptedNames) {
  const normalized = normalizeUnlockName(value);
  return acceptedNames.some((name) => normalizeUnlockName(name) === normalized);
}

export function softVibrate(pattern = 18) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

let audioContext;

export function playPocketChime(enabled) {
  if (!enabled) return;
  const AudioConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioConstructor) return;
  audioContext = audioContext || new AudioConstructor();
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.075, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  gain.connect(audioContext.destination);
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.07);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.07);
    oscillator.stop(now + 0.42 + index * 0.04);
  });
}

export function animateCounters(scope = document) {
  scope.querySelectorAll("[data-count-to]").forEach((node) => {
    const target = Number(node.dataset.countTo || 0);
    const start = performance.now();
    const duration = 1300;
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
