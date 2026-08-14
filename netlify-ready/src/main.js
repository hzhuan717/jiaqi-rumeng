import { loveData } from "./data/loveData.js";
import { renderFloatingDecorations } from "./components/FloatingDecorations.js";
import { renderUnlockScreen } from "./components/UnlockScreen.js";
import { renderTimeDoor } from "./components/TimeDoor.js";
import { renderNumberDashboard } from "./components/NumberDashboard.js";
import { renderTimelineCards } from "./components/TimelineCards.js";
import { renderCapybaraSpring } from "./components/CapybaraSpring.js";
import { renderMagicGadgets } from "./components/MagicGadgets.js";
import { renderLoveLottery } from "./components/LoveLottery.js";
import { renderFinalLetter } from "./components/FinalLetter.js";
import { escapeHtml, icon } from "./utils/dom.js";
import { animateCounters, canUnlock, playPocketChime, softVibrate } from "./utils/animation.js";

const STORAGE_KEY = "jiaqi-rumeng-pocket-state-v2";
const root = document.getElementById("root");

function readStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const stored = readStoredState();
const state = {
  unlocked: Boolean(stored.unlocked),
  scene: stored.unlocked ? Math.min(7, Math.max(1, Number(stored.scene || 1))) : 0,
  finalUnlocked: Boolean(stored.finalUnlocked),
  received: Boolean(stored.received),
  soundOn: false,
  particles: [],
  unlockName: "",
  unlockMessage: "",
  unlockStatus: "",
  unlockOpening: false,
  doorOpen: false,
  activeNumber: null,
  flippedTimeline: {},
  selectedBubble: 0,
  openGadget: 0,
  drawing: false,
  currentSignIndex: null,
  copied: false
};

function saveState() {
  if (!state.unlocked) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    unlocked: state.unlocked,
    scene: state.scene,
    finalUnlocked: state.finalUnlocked,
    received: state.received
  }));
}

function makeParticles(kind) {
  const glyphs = kind === "heart" ? ["♡", "♥", "✦"] : ["✦", "✧", "♡", "·"];
  const colors = kind === "unlock" ? ["#48a9ff", "#ff94b9", "#ffb35c", "#ffffff"] : ["#4daeff", "#ff8eb6", "#ffc86b", "#ffffff"];
  const count = kind === "heart" ? 22 : 16;
  return Array.from({ length: count }, (_, index) => ({
    id: Date.now() + Math.random() * 10000 + index,
    left: 18 + Math.random() * 64,
    top: 34 + Math.random() * 34,
    delay: Math.round(Math.random() * 180),
    glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
}

function renderParticlesOnly() {
  const layer = root.querySelector(".celebration-layer");
  if (!layer) return;
  layer.innerHTML = state.particles.map((particle) => '<span class="celebration-particle" style="left:' + particle.left + '%;top:' + particle.top + '%;color:' + particle.color + ';animation-delay:' + particle.delay + 'ms">' + escapeHtml(particle.glyph) + '</span>').join("");
}

function celebrate(kind) {
  playPocketChime(state.soundOn);
  const next = makeParticles(kind || "spark");
  const ids = new Set(next.map((particle) => particle.id));
  state.particles = state.particles.concat(next);
  renderParticlesOnly();
  window.setTimeout(() => {
    state.particles = state.particles.filter((particle) => !ids.has(particle.id));
    renderParticlesOnly();
  }, 1700);
}

function renderTopControls() {
  const soundButton = '<button class="icon-button" type="button" data-action="toggle-sound" aria-label="' + (state.soundOn ? "关闭提示音" : "打开提示音") + '">' + icon(state.soundOn ? "music" : "mute") + '</button>';
  if (!state.unlocked) return '<div class="top-controls">' + soundButton + '</div>';
  const dots = Array.from({ length: 7 }, (_, index) => {
    const dot = index + 1;
    const className = dot === state.scene ? "is-current" : dot < state.scene ? "is-past" : "";
    return '<button class="progress-dot ' + className + '" type="button" data-action="jump-scene" data-scene="' + dot + '" aria-label="跳到第' + dot + '页"></button>';
  }).join("");
  return [
    '<div class="top-controls">',
    soundButton,
    '<div class="story-progress" aria-label="故事进度"><span>' + state.scene + '/7</span><div class="progress-dots">' + dots + '</div></div>',
    '<button class="icon-button" type="button" data-action="restart" aria-label="重新体验">' + icon("restart") + '</button>',
    '</div>'
  ].join("");
}

function renderScene() {
  if (!state.unlocked) return renderUnlockScreen(loveData, state);
  if (state.scene === 1) return renderTimeDoor(loveData, state);
  if (state.scene === 2) return renderNumberDashboard(loveData, state);
  if (state.scene === 3) return renderTimelineCards(loveData, state);
  if (state.scene === 4) return renderCapybaraSpring(loveData, state);
  if (state.scene === 5) return renderMagicGadgets(loveData, state);
  if (state.scene === 6) return renderLoveLottery(loveData, state);
  return renderFinalLetter(loveData, state);
}

function render() {
  root.innerHTML = [
    '<main class="app-shell"><div class="phone-shell">',
    renderFloatingDecorations(state.particles),
    renderTopControls(),
    '<div class="brand-chip" aria-hidden="true"><span>' + escapeHtml(loveData.subtitle) + '</span></div>',
    '<div class="scene-host">' + renderScene() + '</div>',
    '</div></main>'
  ].join("");

  if (state.unlocked && state.scene === 2) animateCounters(root);
}

function restart() {
  localStorage.removeItem(STORAGE_KEY);
  state.unlocked = false;
  state.scene = 0;
  state.finalUnlocked = false;
  state.received = false;
  state.particles = [];
  state.unlockName = "";
  state.unlockMessage = "";
  state.unlockStatus = "";
  state.unlockOpening = false;
  state.doorOpen = false;
  state.currentSignIndex = null;
  render();
}

function nextScene() {
  state.scene = Math.min(7, Math.max(1, state.scene + 1));
  saveState();
  render();
}

function fullLetterText() {
  return [loveData.finalLetter.title].concat(loveData.finalLetter.paragraphs, [loveData.finalLetter.signature]).join("\n\n");
}

async function copyLetter() {
  const text = fullLetterText();
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    state.copied = true;
    celebrate("heart");
    render();
    window.setTimeout(() => {
      state.copied = false;
      render();
    }, 1500);
  } catch {
    state.copied = false;
  }
}

function handleAction(action, element) {
  if (action === "toggle-sound") {
    state.soundOn = !state.soundOn;
    playPocketChime(state.soundOn);
    render();
    return;
  }
  if (action === "restart") {
    restart();
    return;
  }
  if (action === "jump-scene") {
    state.scene = Math.min(7, Math.max(1, Number(element.dataset.scene || 1)));
    saveState();
    render();
    return;
  }
  if (action === "open-door") {
    if (state.doorOpen) return;
    state.doorOpen = true;
    softVibrate([12, 24, 12]);
    celebrate("unlock");
    render();
    window.setTimeout(() => {
      state.doorOpen = false;
      state.scene = 2;
      saveState();
      render();
    }, 1180);
    return;
  }
  if (action === "next") {
    nextScene();
    return;
  }
  if (action === "number-card") {
    state.activeNumber = Number(element.dataset.index || 0);
    softVibrate(10);
    celebrate("spark");
    render();
    window.setTimeout(() => {
      state.activeNumber = null;
      render();
    }, 380);
    return;
  }
  if (action === "flip-timeline") {
    const index = Number(element.dataset.index || 0);
    state.flippedTimeline[index] = !state.flippedTimeline[index];
    softVibrate(10);
    celebrate("spark");
    render();
    return;
  }
  if (action === "spring-bubble") {
    state.selectedBubble = Number(element.dataset.index || 0);
    softVibrate(10);
    celebrate("spark");
    render();
    return;
  }
  if (action === "gadget") {
    state.openGadget = Number(element.dataset.index || 0);
    softVibrate(10);
    celebrate("spark");
    render();
    return;
  }
  if (action === "draw-sign") {
    if (state.drawing) return;
    state.drawing = true;
    softVibrate(12);
    render();
    window.setTimeout(() => {
      let next = Math.floor(Math.random() * loveData.lotterySigns.length);
      if (state.currentSignIndex !== null && next === state.currentSignIndex) next = (next + 1) % loveData.lotterySigns.length;
      state.currentSignIndex = next;
      state.drawing = false;
      celebrate("heart");
      render();
    }, 520);
    return;
  }
  if (action === "receive-love") {
    state.received = true;
    saveState();
    softVibrate([18, 32, 18]);
    celebrate("heart");
    render();
    return;
  }
  if (action === "copy-letter") {
    copyLetter();
  }
}

root.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement || !root.contains(actionElement)) return;
  handleAction(actionElement.dataset.action, actionElement);
});

root.addEventListener("input", (event) => {
  if (event.target && event.target.id === "unlock-name") state.unlockName = event.target.value;
});

root.addEventListener("submit", (event) => {
  const form = event.target;
  if (!form.matches('[data-form="unlock"]')) return;
  event.preventDefault();
  if (state.unlockOpening) return;
  if (canUnlock(state.unlockName, loveData.acceptedUnlockNames)) {
    state.unlockOpening = true;
    state.unlockStatus = "success";
    state.unlockMessage = "叮咚！小乖认证成功。小果果的520礼物正在打开……";
    softVibrate([16, 30, 16]);
    celebrate("unlock");
    render();
    window.setTimeout(() => {
      state.unlocked = true;
      state.scene = 1;
      state.unlockOpening = false;
      state.unlockMessage = "";
      saveState();
      render();
    }, 1250);
    return;
  }
  state.unlockStatus = "error";
  state.unlockMessage = "这个名字好像不是小乖哦，再试一次～";
  softVibrate(12);
  render();
});

const holdState = { target: null, percent: null, frame: 0, start: 0, progress: 0 };

function setHeartProgress(progress) {
  holdState.progress = progress;
  if (holdState.target) {
    holdState.target.style.background = "conic-gradient(#ff8eb6 " + progress * 360 + "deg, rgba(255,255,255,0.66) 0deg)";
  }
  if (holdState.percent) holdState.percent.textContent = Math.round(progress * 100) + "%";
}

function cancelLongPress() {
  if (!holdState.target) return;
  cancelAnimationFrame(holdState.frame);
  holdState.target.classList.remove("is-holding");
  setHeartProgress(0);
  holdState.target = null;
}

function finishLongPress() {
  cancelAnimationFrame(holdState.frame);
  state.finalUnlocked = true;
  saveState();
  softVibrate([20, 28, 20]);
  celebrate("heart");
  holdState.target = null;
  render();
}

function tickLongPress(now) {
  const progress = Math.min(1, (now - holdState.start) / 2000);
  setHeartProgress(progress);
  if (progress >= 1) {
    finishLongPress();
    return;
  }
  holdState.frame = requestAnimationFrame(tickLongPress);
}

root.addEventListener("pointerdown", (event) => {
  const heart = event.target.closest("[data-long-heart]");
  if (!heart || !root.contains(heart)) return;
  event.preventDefault();
  holdState.target = heart;
  holdState.percent = root.querySelector("[data-progress-percent]");
  holdState.start = performance.now();
  heart.classList.add("is-holding");
  heart.setPointerCapture?.(event.pointerId);
  setHeartProgress(0);
  holdState.frame = requestAnimationFrame(tickLongPress);
});

root.addEventListener("pointerup", cancelLongPress);
root.addEventListener("pointercancel", cancelLongPress);

render();
