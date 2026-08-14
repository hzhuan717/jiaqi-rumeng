import { loveData } from "./data/loveData.js";
import { escapeHtml, icon } from "./utils/dom.js";
import { playPocketChime, softVibrate, animateCounters } from "./utils/animation.js";

const STORAGE_KEY = "jiaqi-rumeng-storybook-v3";
const root = document.getElementById("root");

/* ---------------- 工具 ---------------- */

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const stored = readStored();

const state = {
  unlocked: Boolean(stored.unlocked),
  page: Number(stored.page || 0),
  finalUnlocked: Boolean(stored.finalUnlocked),
  received: Boolean(stored.received),
  soundOn: Boolean(stored.soundOn),
  musicOn: false,
  musicAvailable: false,
  musicVolume: Number(stored.musicVolume ?? 0.6),
  unlockName: "",
  unlockMsg: "",
  unlockStatus: "",
  puzzleValue: "",
  puzzleMsg: "",
  puzzleSolved: Boolean(stored.puzzleSolved),
  openGadget: 0,
  blessingName: "",
  blessingCard: "",
  signIndex: null,
  drawingSign: false,
  copied: false,
  particles: []
};

const TOTAL_PAGES = loveData.storyPages.length + 2;

function saveState() {
  if (!state.unlocked) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    unlocked: state.unlocked,
    page: state.page,
    finalUnlocked: state.finalUnlocked,
    received: state.received,
    soundOn: state.soundOn,
    musicVolume: state.musicVolume,
    puzzleSolved: state.puzzleSolved
  }));
}

/* ---------------- 日期引擎 ---------------- */

function parseYMD(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function dayCount(fromDateStr) {
  const diff = Math.floor((Date.now() - parseYMD(fromDateStr)) / 86400000);
  return Math.max(1, diff + 1);
}

function daysUntil(dateStr) {
  const diff = Math.floor((parseYMD(dateStr) - Date.now()) / 86400000);
  return diff;
}

function todayYMD() {
  const t = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
}

function todaySpecial() {
  const today = todayYMD();
  const specials = loveData.specialDates.concat([
    { date: today.slice(0, 4) + "-02-14", label: "情人节" },
    { date: today.slice(0, 4) + "-05-20", label: "520" },
    { date: today.slice(0, 4) + "-12-25", label: "圣诞" },
    { date: today.slice(0, 4) + "-01-01", label: "元旦" }
  ]);
  const hit = specials.find((s) => s.date === today);
  if (hit) return hit.label;
  const future = specials
    .filter((s) => s.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return future[0] ? future[0].label : "";
}

function nextSpecialInfo() {
  const today = todayYMD();
  const specials = loveData.specialDates.concat([
    { date: today.slice(0, 4) + "-02-14", label: "情人节" },
    { date: today.slice(0, 4) + "-05-20", label: "520" },
    { date: today.slice(0, 4) + "-12-25", label: "圣诞" }
  ]);
  return specials
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
}

function dailyLine() {
  const now = new Date();
  const start = Date.UTC(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000);
  return loveData.dailyLines[dayOfYear % loveData.dailyLines.length];
}

function dateSeed() {
  return parseInt(todayYMD().replace(/-/g, ""), 10);
}

function hashSeed(n) {
  let h = n;
  h ^= h >> 16;
  h = Math.imul(h, 0x45d9b3b);
  h ^= h >> 16;
  return Math.abs(h);
}

function todaySignIndex() {
  return hashSeed(dateSeed()) % loveData.lotterySigns.length;
}

/* ---------------- 声音 ---------------- */

let audioCtx = null;
function chime() {
  if (!state.soundOn) return;
  playPocketChime(true);
}

let musicEl = null;
let musicCheckDone = false;
let musicStarting = false;
let musicMissingNotified = false;

function preloadMusic() {
  if (musicEl) return;
  musicEl = new Audio(loveData.musicPath);
  musicEl.loop = true;
  musicEl.volume = state.musicVolume;
  musicEl.preload = "auto";
  musicEl.load();
}

function probeMusic() {
  if (musicCheckDone) return;
  musicCheckDone = true;
  fetch(loveData.musicPath, { method: "HEAD" })
    .then((r) => {
      state.musicAvailable = r.ok;
      if (r.ok) preloadMusic();
    })
    .catch(() => {
      state.musicAvailable = false;
    });
}

function markMusicState() {
  document.body.dataset.music = state.musicOn ? "playing" : "paused";
}

function startMusic() {
  if (!musicEl) {
    musicEl = new Audio(loveData.musicPath);
    musicEl.loop = true;
    musicEl.volume = state.musicVolume;
    musicEl.preload = "auto";
  }
  if (!musicEl.paused) {
    state.musicOn = true;
    state.musicAvailable = true;
    markMusicState();
    return;
  }
  if (musicStarting) return;
  musicStarting = true;
  musicEl.play().then(() => {
    state.musicOn = true;
    state.musicAvailable = true;
    musicStarting = false;
    markMusicState();
    chime();
  }).catch(() => {
    musicStarting = false;
    state.musicAvailable = false;
    state.musicOn = false;
    markMusicState();
    if (!musicMissingNotified) {
      musicMissingNotified = true;
      toast("没有找到音乐文件，把音乐放到 assets/music/music.mp3");
    }
  });
}

function stopMusic() {
  if (musicEl) musicEl.pause();
  state.musicOn = false;
  markMusicState();
}

/* ---------------- 粒子 ---------------- */

function celebrate(kind) {
  chime();
  const glyphs = kind === "heart" ? ["♡", "♥", "✦", "❀"] : ["✦", "✧", "♡", "·"];
  const colors = kind === "heart" ? ["#d4a5a5", "#e8b8a0", "#e0b56c", "#ffffff"] : ["#7a9cc6", "#d4a5a5", "#e0b56c", "#ffffff"];
  const count = kind === "heart" ? 20 : 14;
  const list = Array.from({ length: count }, (_, i) => ({
    id: Date.now() + Math.random() * 10000 + i,
    left: 15 + Math.random() * 70,
    top: 40 + Math.random() * 35,
    delay: Math.round(Math.random() * 160),
    glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
  const layer = root.querySelector(".celebration-layer");
  if (!layer) return;
  layer.innerHTML = list.map((p) => '<span class="celebration-particle" style="left:' + p.left + '%;top:' + p.top + '%;color:' + p.color + ';animation-delay:' + p.delay + 'ms">' + p.glyph + '</span>').join("");
  window.setTimeout(() => {
    if (layer) layer.innerHTML = "";
  }, 1800);
}

function bigCelebrate() {
  chime();
  const glyphs = ["♥", "✦", "❀", "🌸", "♡"];
  const colors = ["#e8b8a0", "#d4a5a5", "#ffd9c0", "#ffffff", "#e0b56c"];
  const layer = root.querySelector(".celebration-layer");
  if (!layer) return;
  layer.innerHTML = Array.from({ length: 56 }, () => {
    const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = 4 + Math.random() * 92;
    const delay = Math.random() * 0.9;
    const size = 16 + Math.random() * 22;
    return '<span class="big-particle" style="left:' + left + '%;top:-' + (4 + Math.random() * 20) + '%;color:' + color + ';font-size:' + size + 'px;animation-delay:' + delay + 's">' + glyph + "</span>";
  }).join("");
  window.setTimeout(() => {
    if (layer) layer.innerHTML = "";
  }, 3400);
}

function toast(text) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 2200);
}

/* ---------------- 照片渲染 ---------------- */

function photoStrip(photos, stamp) {
  if (!photos || !photos.length) return "";
  const frames = photos.map((p, i) =>
    '<figure class="photo-frame' + (photos.length === 1 ? " single" : "") + '" style="--rot:' + ((i % 2 === 0 ? -2 : 2)) + 'deg">' +
    '<img src="' + loveData.photosDir + p.file + '" alt="' + escapeHtml(p.caption || "照片") + '" loading="lazy" />' +
    (stamp ? '<span class="photo-stamp">' + escapeHtml(stamp) + "</span>" : "") +
    '<figcaption>' + escapeHtml(p.caption || "") + "</figcaption>" +
    "</figure>"
  ).join("");
  return '<div class="photo-strip">' + frames + "</div>";
}

/* ---------------- 渲染：顶栏与横幅 ---------------- */

function liveBanner() {
  const together = dayCount(loveData.dates.start);
  const ann = daysUntil(loveData.dates.anniversary);
  const special = todaySpecial();
  return '<div class="live-banner">和小佳在一起 <strong>第 ' + together + " 天</strong>" +
    (ann > 0 ? " · 距离一周年还有 <strong>" + ann + " 天</strong>" : "") +
    (special ? ' <span class="today-flag">' + escapeHtml(special) + "</span>" : "") +
    "</div>";
}

function topControls() {
  const soundBtn = '<button class="icon-button ' + (state.soundOn ? "is-on" : "") + '" data-action="toggle-sound" aria-label="提示音">' + icon("music") + "</button>";
  const musicBtn = '<button class="icon-button ' + (state.musicOn ? "is-on" : "") + '" data-action="toggle-music" aria-label="背景音乐">' + icon("disc") + "</button>";
  if (!state.unlocked) return '<div class="top-controls">' + soundBtn + "</div>";
  const dots = Array.from({ length: TOTAL_PAGES }, (_, i) => {
    const cls = i === state.page ? "is-current" : i < state.page ? "is-past" : "";
    return '<button class="progress-dot ' + cls + '" data-action="jump-page" data-page="' + i + '"></button>';
  }).join("");
  return '<div class="top-controls">' + soundBtn + musicBtn +
    '<div class="story-progress"><span>' + (state.page + 1) + "/" + TOTAL_PAGES + "</span><div class=\"progress-dots\">" + dots + "</div></div>" +
    '<button class="icon-button" data-action="restart" aria-label="重新体验">' + icon("restart") + "</button>" +
    "</div>";
}

/* ---------------- 渲染：章节页 ---------------- */

function artSVG(kind) {
  if (kind === "capybara") {
    return '<div class="art"><svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="160" cy="150" rx="120" ry="14" fill="rgba(61,125,209,0.12)"/>' +
      '<circle cx="160" cy="108" r="46" fill="#b98a5f"/>' +
      '<circle cx="160" cy="96" r="40" fill="#c99a6b"/>' +
      '<circle cx="160" cy="92" r="34" fill="#d4a878"/>' +
      '<ellipse cx="150" cy="104" rx="5" ry="7" fill="#5b4632"/>' +
      '<ellipse cx="172" cy="104" rx="5" ry="7" fill="#5b4632"/>' +
      '<path d="M150 118 Q160 124 172 118" stroke="#5b4632" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="178" cy="82" rx="9" ry="7" fill="#e8c97a"/>' +
      '<ellipse cx="150" cy="78" rx="9" ry="7" fill="#e8c97a"/>' +
      '<path d="M128 118 Q110 96 116 80" stroke="#a87a4a" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M192 118 Q210 96 204 80" stroke="#a87a4a" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="196" cy="52" r="16" fill="#ff8a3c"/><path d="M196 36 l6 10 -10 3z" fill="#7bc98a"/>' +
      '<path d="M196 46 q7 5 0 10 q-7 -5 0 -10" fill="#f5a25c"/>' +
      "</svg></div>";
  }
  if (kind === "book") {
    return '<div class="art"><svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="70" y="30" width="180" height="120" rx="8" fill="#fffdf6" stroke="#1f3a5f" stroke-width="3"/>' +
      '<line x1="90" y1="52" x2="230" y2="52" stroke="#1f3a5f" stroke-width="4"/>' +
      '<line x1="90" y1="64" x2="210" y2="64" stroke="#e8c97a" stroke-width="3"/>' +
      '<line x1="90" y1="74" x2="220" y2="74" stroke="#b9c2d4" stroke-width="2"/>' +
      '<line x1="90" y1="84" x2="200" y2="84" stroke="#b9c2d4" stroke-width="2"/>' +
      '<line x1="90" y1="94" x2="215" y2="94" stroke="#b9c2d4" stroke-width="2"/>' +
      '<path d="M160 120 l14 10 -4 16 -10 -8 -10 8 -4 -16z" fill="#ff8eb6"/>' +
      '<circle cx="256" cy="44" r="10" fill="#e8c97a"/>' +
      '<circle cx="262" cy="38" r="3" fill="#fff"/>' +
      "</svg></div>";
  }
  if (kind === "album") {
    return '<div class="art"><svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="60" y="30" width="200" height="120" rx="10" fill="#fff" stroke="#e8c97a" stroke-width="2"/>' +
      '<rect x="76" y="46" width="168" height="88" rx="6" fill="#f4f9ff"/>' +
      '<circle cx="118" cy="80" r="8" fill="#e8c97a"/><circle cx="140" cy="80" r="8" fill="#ff8eb6"/><circle cx="162" cy="80" r="8" fill="#a8d8f0"/><circle cx="184" cy="80" r="8" fill="#e8c97a"/>' +
      '<path d="M100 108 l16 -14 14 10 14 -16 22 20" stroke="#8ec3ea" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      "</svg></div>";
  }
  return "";
}

function puzzlePageDef() {
  return loveData.storyPages.find((p) => p.puzzle) || null;
}

function puzzleHTML() {
  const def = puzzlePageDef();
  if (!def) return "";
  return '<div class="puzzle-box">' +
    '<div class="puzzle-hint">🔑 ' + escapeHtml(def.puzzle.hint) + "</div>" +
    '<input data-puzzle-input maxlength="4" inputmode="numeric" placeholder="____" value="' + escapeHtml(state.puzzleValue) + '" />' +
    '<div class="puzzle-feedback">' + escapeHtml(state.puzzleMsg) + "</div>" +
    "</div>";
}

function factRow() {
  const together = dayCount(loveData.dates.start);
  const meet = dayCount(loveData.dates.firstMeet);
  const ann = Math.max(0, daysUntil(loveData.dates.anniversary));
  return '<div class="fact-row">' +
    '<div class="fact-card"><div class="fact-value" data-count-to="' + meet + '">0</div><div class="fact-unit">天</div><div class="fact-title">初识以来</div></div>' +
    '<div class="fact-card highlight"><div class="fact-value" data-count-to="' + together + '">0</div><div class="fact-unit">天</div><div class="fact-title">陪在小佳身边</div></div>' +
    '<div class="fact-card"><div class="fact-value" data-count-to="' + ann + '">0</div><div class="fact-unit">天</div><div class="fact-title">距离一周年纪念</div></div>' +
    "</div>";
}

function countdownBar() {
  const next = nextSpecialInfo();
  const ann = daysUntil(loveData.dates.anniversary);
  let html = '<div class="countdown-bar">';
  if (ann > 0) {
    html += "距离 <strong>2027.01.07 一周年</strong> 还有 <strong>" + ann + " 天</strong>。";
  }
  if (next) {
    const d = daysUntil(next.date);
    if (d >= 0 && d < 400) html += (ann > 0 ? " " : "") + "下一个 <strong>" + escapeHtml(next.label) + "</strong> 还有 <strong>" + d + " 天</strong>。";
  }
  html += "</div>";
  return html;
}

function albumHTML() {
  const slots = Array.from({ length: 6 }, (_, i) => {
    const file = "0" + (i + 1) + ".jpg";
    const src = loveData.photosDir + file;
    return '<div class="album-slot" data-album-slot="' + i + '"><img src="' + src + '" alt="照片 ' + (i + 1) + '" data-photo>' +
      '<div class="album-slot-fallback" data-fallback>🌟</div><div class="album-tag">PHOTO ' + (i + 1) + "</div></div>";
  }).join("");
  return '<div class="album-grid">' + slots + "</div>" +
    '<div class="album-note">' +
    "把照片放到 <code>assets/photos/01.jpg ~ 06.jpg</code> 就会自动出现。" +
    "<br/>没有照片的格子先由星星守着，点一下星星，它就会亮起来。" +
    "</div>";
}

function lotteryHTML() {
  const today = todayYMD();
  const idx = state.signIndex === null ? todaySignIndex() : state.signIndex;
  const sign = loveData.lotterySigns[idx];
  const drawing = state.drawingSign ? " is-drawing" : "";
  return '<div class="lottery-zone">' +
    '<div class="sign-paper">' +
    '<div class="sign-title">' + escapeHtml(sign.title) + "</div>" +
    '<div class="sign-text">' + escapeHtml(sign.text) + "</div>" +
    "</div>" +
    '<button class="lottery-btn' + drawing + '" data-action="redraw-sign">再抽一次</button>' +
    '<div class="lottery-date">今日心签 · ' + today + " · 每日一签，不重样</div>" +
    "</div>";
}

function blessingHTML() {
  return '<div class="bless-box">' +
    "<h4>✉️ 给书外的人留一页</h4>" +
    '<div class="b-sub">写下你的名字，书会替你送出一句专属祝福</div>' +
    '<div class="b-input-row">' +
    '<input data-bless-input maxlength="8" placeholder="你的名字" value="' + escapeHtml(state.blessingName) + '" />' +
    '<button class="b-go" data-action="make-blessing">写给我</button>' +
    "</div>" +
    (state.blessingCard ? '<div class="bless-card">' + state.blessingCard + "</div>" : "") +
    "</div>";
}

function renderChapter(index) {
  const p = loveData.storyPages[index];
  const parts = [];
  parts.push('<div class="chapter-kicker">' + escapeHtml(p.chapter) + "</div>");
  parts.push('<div class="chapter-title">' + escapeHtml(p.title) + "</div>");
  if (p.date) parts.push('<div class="chapter-date">' + escapeHtml(p.date) + "</div>");
  if (p.kind !== "album") parts.push(photoStrip(p.photos, p.date ? p.date.replace(/-/g, ".") : null));
  parts.push('<div class="chapter-body">' + p.paragraphs.map((t) => "<p>" + escapeHtml(t) + "</p>").join("") + "</div>");
  if (p.art && p.kind !== "album") parts.push(artSVG(p.art));

  switch (p.kind) {
    case "prologue":
      parts.push('<div class="daily-line">' + escapeHtml(dailyLine()) + "</div>");
      break;
    case "facts":
      parts.push(factRow());
      parts.push(countdownBar());
      break;
    case "puzzle":
      parts.push(factRow());
      parts.push(countdownBar());
      parts.push(puzzleHTML());
      break;
    case "gadgets":
      parts.push(gadgetListHTML());
      break;
    case "album":
      parts.push(albumHTML());
      break;
    case "lottery":
      parts.push(lotteryHTML());
      parts.push(blessingHTML());
      break;
    default:
      break;
  }

  const isFinalPage = index === loveData.storyPages.length - 1;
  const footer = '<div class="page-footer">' +
    '<span class="page-num">第 ' + (index + 2) + " 页 / " + TOTAL_PAGES + "</span>" +
    '<button class="page-nav-btn" data-action="next-page">' + (isFinalPage ? "前往终章" : "下一章") + " →</button>" +
    "</div>";
  return '<div class="page"><div class="page-scroll">' + parts.join("") + "</div>" + footer + "</div>";
}

function gadgetListHTML() {
  return '<div class="gadget-list">' + loveData.gadgets.map((g, i) =>
    '<div class="gadget-card ' + (state.openGadget === i ? "is-open" : "") + '">' +
    '<button class="gadget-head" data-action="toggle-gadget" data-index="' + i + '">' +
    '<span class="gadget-icon">' + ["😤", "😂", "🔵", "💰", "🍬", "📣"][i] + "</span>" +
    '<span class="g-name">' + escapeHtml(g.name) + "</span>" +
    '<span class="g-arrow">›</span>' +
    "</button>" +
    '<div class="gadget-body"><p>' + escapeHtml(g.description) + "</p></div>" +
    "</div>"
  ).join("") + "</div>";
}

function renderFinalPage() {
  const prevFooter = '<div class="page-footer"><span class="page-num">封底 · 未完待续</span>' +
    '<button class="page-nav-btn" data-action="prev-page">← 上一页</button></div>';
  if (!state.finalUnlocked) {
    const orbitDots = Array.from({ length: 8 }, (_, i) => "<span></span>").join("");
    return '<div class="page"><div class="page-scroll"><div class="final-lock">' +
      '<div class="hold-hint">长按爱心 2 秒，翻开最后一页</div>' +
      '<div class="final-heart" data-long-heart aria-label="长按解锁">' +
      '<svg viewBox="0 0 100 100">' +
      '<path class="heart-base" d="M50 85 C25 65 10 48 10 30 C10 18 20 10 30 10 C40 10 47 16 50 24 C53 16 60 10 70 10 C80 10 90 18 90 30 C90 48 75 65 50 85 Z"/>' +
      '<path class="heart-fill" d="M50 85 C25 65 10 48 10 30 C10 18 20 10 30 10 C40 10 47 16 50 24 C53 16 60 10 70 10 C80 10 90 18 90 30 C90 48 75 65 50 85 Z"/>' +
      "</svg>" +
      '<div class="orbit-dots">' + orbitDots + "</div>" +
      "</div>" +
      '<div class="hold-percent" data-progress-percent>0%</div>' +
      '<div class="hold-hint">只有足够认真的人，才能打开这页书。</div>' +
      "</div></div>" + prevFooter + "</div>";
  }
  const letter = loveData.finalLetter;
  const copied = state.copied ? "已复制" : "复制全文";
  return '<div class="page"><div class="page-scroll"><div class="final-letter">' +
    "<h2>" + escapeHtml(letter.title) + "</h2>" +
    photoStrip([loveData.finalPhoto], "∞") +
    letter.paragraphs.map((t) => '<p class="f-para">' + escapeHtml(t) + "</p>").join("") +
    '<div class="f-sign">' + escapeHtml(letter.signature) + '<span class="sign-seal">♥</span></div>' +
    '<div class="final-actions">' +
    '<button class="is-primary" data-action="copy-letter">📋 ' + copied + "</button>" +
    (state.received ? '<button class="is-primary">💙 ' + escapeHtml(letter.receivedText) + "</button>" : '<button class="is-primary" data-action="receive-love">♥ 收下这份喜欢</button>') +
    "</div>" +
    (state.received ? '<div class="received-note">' + escapeHtml(letter.receivedText) + "</div>" : "") +
    "</div></div>" +
    '<div class="page-footer"><span class="page-num">终章 · 完 · 故事未止</span>' +
    '<button class="page-nav-btn" data-action="prev-page">← 回看</button></div></div>';
}

function renderCover() {
  const today = todayYMD();
  const together = dayCount(loveData.dates.start);
  const stamp = loveData.dates.start.replace(/-/g, ".");
  const orbitDots = Array.from({ length: 24 }, (_, i) =>
    '<span class="orbit-dot" style="left:' + ((i * 41 + 5) % 92) + "%;top:" + ((i * 37 + 9) % 88) + "%;animation-delay:" + ((i * 0.8) % 9) + "s;animation-duration:" + (7 + (i % 4)) + 's"></span>'
  ).join("");
  return '<div class="cover">' +
    '<div class="cover-orbit">' + orbitDots + "</div>" +
    '<div class="cover-eyebrow">LOVE LETTER · 2026</div>' +
    '<div class="cover-title">佳期如梦</div>' +
    '<div class="cover-sub">一本写给时间的情书</div>' +
    '<div class="cover-goldline">◆</div>' +
    '<div class="cover-sub">' + escapeHtml(loveData.coverTagline) + "</div>" +
    '<div class="cover-photo">' + photoStrip([loveData.coverPhoto], stamp) + "</div>" +
    '<button class="cover-btn" data-action="open-book"><span class="seal-heart">♥</span>翻开这本书</button>' +
    '<div class="cover-live">今天 ' + today + "<br/>已经和小佳在一起 <b>第 " + together + " 天</b></div>" +
    "</div>";
}

function renderUnlock() {
  return '<div class="unlock-page">' +
    '<div class="u-eyebrow">一本只属于小佳的书</div>' +
    '<div class="u-title">佳期如梦</div>' +
    '<div class="u-sub">请输入你的名字，翻开这本书</div>' +
    '<input class="u-input" data-unlock-input placeholder="小佳 / 噜妹 / 宝宝…" autocomplete="off" />' +
    '<button class="u-btn" data-action="try-unlock">打开书</button>' +
    '<div class="u-msg">' + escapeHtml(state.unlockMsg) + "</div>" +
    '<div class="u-hint">提示：小果果给你的备注，或者他一直喊你的名字<br/>打开书的那一刻，音乐会自动响起 ♪</div>' +
    "</div>";
}

function renderMain() {
  if (!state.unlocked) return renderUnlock();
  if (state.page === 0) return renderCover();
  if (state.page <= loveData.storyPages.length) return renderChapter(state.page - 1);
  return renderFinalPage();
}

function renderSceneBg() {
  const far = Array.from({ length: 16 }, (_, i) =>
    '<span class="twinkle" style="left:' + ((i * 61 + 11) % 95) + "%;top:" + ((i * 41 + 7) % 88) + "%;animation-delay:" + ((i * 0.53) % 4) + 's">✦</span>'
  ).join("");
  const near = Array.from({ length: 6 }, (_, i) =>
    '<span class="twinkle near" style="left:' + ((i * 137 + 23) % 92) + "%;top:" + ((i * 73 + 31) % 80) + "%;animation-delay:" + ((i * 0.71 + 0.2) % 3) + 's">✧</span>'
  ).join("");
  return '<div class="scene-bg" aria-hidden="true">' + far + near + '<div class="moon"></div></div>';
}

let meteorTimer = null;
function scheduleMeteors() {
  if (meteorTimer) return;
  const spawn = () => {
    const bg = document.querySelector(".scene-bg");
    if (!bg) return;
    const m = document.createElement("span");
    m.className = "meteor";
    m.style.top = 4 + Math.random() * 26 + "%";
    m.style.left = 45 + Math.random() * 50 + "%";
    bg.appendChild(m);
    window.setTimeout(() => m.remove(), 1200);
  };
  window.setTimeout(spawn, 4200);
  meteorTimer = window.setInterval(() => {
    spawn();
    window.setTimeout(spawn, 900 + Math.random() * 900);
  }, 16000 + Math.random() * 14000);
}

function render() {
  probeMusic();
  scheduleMeteors();
  root.innerHTML = '<main class="app-shell"><div class="phone-shell">' +
    renderSceneBg() +
    topControls() +
    (state.unlocked && state.page > 0 ? liveBanner() : "") +
    '<div class="book-wrap">' + renderMain() + "</div>" +
    "</div></main>" +
    '<div class="celebration-layer"></div>' +
    (state.unlocked && state.page > 0 && state.musicAvailable && state.musicOn ? musicTrayHTML() : "");
  window.requestAnimationFrame(() => animateCounters(root));
}

function musicTrayHTML() {
  return '<div class="music-tray">' +
    '<div class="m-row"><span class="m-name">🎵 ' + escapeHtml(loveData.musicTitle) + "</span>" +
    '<span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
    '<input type="range" min="0" max="1" step="0.05" value="' + state.musicVolume + '" data-music-volume aria-label="音量" />' +
    '<button class="m-close" data-action="close-music">✕</button></div>' +
    "</div>";
}

/* ---------------- 事件 ---------------- */

function fullLetterText() {
  return [loveData.finalLetter.title]
    .concat(loveData.finalLetter.paragraphs, [loveData.finalLetter.signature])
    .join("\n\n");
}

async function copyLetter() {
  const text = fullLetterText();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const oldSelect = document.body.style.userSelect;
      const oldWebkitSelect = document.body.style.webkitUserSelect;
      document.body.style.userSelect = "text";
      document.body.style.webkitUserSelect = "text";

      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      ta.style.pointerEvents = "none";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, 999999);
      const ok = document.execCommand("copy");
      ta.remove();

      document.body.style.userSelect = oldSelect || "";
      document.body.style.webkitUserSelect = oldWebkitSelect || "";
      if (!ok) throw new Error("copy failed");
    }
    state.copied = true;
    render();
    celebrate("heart");
    window.setTimeout(() => { state.copied = false; render(); }, 1600);
  } catch {
    state.copied = false;
    toast("复制失败，请手动长按文字选择复制");
  }
}

function makeBlessing() {
  const name = state.blessingName.trim();
  if (!name) {
    toast("先写下你的名字吧～");
    return;
  }
  const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const tpl = loveData.blessingTemplates;
  state.blessingCard = "<span class=\"b-name\">" + escapeHtml(name) + "</span>，" +
    r(tpl.opening) + escapeHtml(name) + r(tpl.middle) +
    "<span class=\"b-sign\">" + r(tpl.closing) + "</span>";
  chime();
    render();

  celebrate("heart");
}

function nextPage() {
  if (state.page === 0) {
    state.page = 1;
  } else if (state.page < TOTAL_PAGES) {
    state.page += 1;
  }
  saveState();
  render();
}

function handleAction(action, el) {
  switch (action) {
    case "toggle-sound":
      state.soundOn = !state.soundOn;
      saveState();
      chime();
      render();
      break;
    case "toggle-music":
      if (state.musicOn) stopMusic();
      else startMusic();
      render();
      break;
    case "close-music":
      stopMusic();
      render();
      break;
    case "restart":
      localStorage.removeItem(STORAGE_KEY);
      state.unlocked = false;
      state.page = 0;
      state.finalUnlocked = false;
      state.received = false;
      state.puzzleMsg = "";
      state.puzzleValue = "";
      state.puzzleSolved = false;
      render();
      break;
    case "jump-page":
      state.page = Math.max(0, Math.min(TOTAL_PAGES, Number(el.dataset.page)));
      saveState();
      render();
      break;
    case "open-book":
      state.page = 1;
      saveState();
      softVibrate(12);
      if (!state.musicOn) {
        startMusic();
        saveState();
      }
      render();
      celebrate("spark");
      break;
    case "next-page":
      nextPage();
      break;
    case "prev-page":
      state.page = Math.max(1, state.page - 1);
      saveState();
      render();
      break;
    case "try-unlock": {
      if (state.unlockStatus === "opening") return;
      const name = state.unlockName.trim();
      if (loveData.acceptedUnlockNames.some((n) => name.toLowerCase() === n.toLowerCase())) {
        state.unlockStatus = "opening";
        state.unlockMsg = "叮咚！认证成功。这本时光之书正在为你打开……";
        softVibrate([16, 30, 16]);
        render();
        celebrate("unlock");
        if (!state.musicOn) {
          startMusic();
          saveState();
        }
        window.setTimeout(() => {
          state.unlocked = true;
          state.page = 0;
          state.unlockStatus = "";
          state.unlockMsg = "";
          saveState();
          render();
        }, 1250);
      } else {
        state.unlockStatus = "error";
        state.unlockMsg = "这个名字好像不对哦，再想想～";
        softVibrate(12);
        render();
      }
      break;
    }
    case "toggle-gadget":
      state.openGadget = Number(el.dataset.index || 0) === state.openGadget ? -1 : Number(el.dataset.index || 0);
      softVibrate(8);
      render();
      break;
    case "redraw-sign": {
      if (state.drawingSign) return;
      state.drawingSign = true;
      softVibrate(12);
      render();
      window.setTimeout(() => {
        let next = Math.floor(Math.random() * loveData.lotterySigns.length);
        if (next === state.signIndex) next = (next + 1) % loveData.lotterySigns.length;
        state.signIndex = next;
        state.drawingSign = false;
                render();

        celebrate("heart");
      }, 520);
      break;
    }
    case "make-blessing":
      makeBlessing();
      break;
    case "copy-letter":
      copyLetter();
      break;
    case "receive-love":
      state.received = true;
      saveState();
      softVibrate([18, 32, 18]);
            render();

      bigCelebrate();
      break;
    default:
      break;
  }
}

root.addEventListener("click", (event) => {
  const actionEl = event.target.closest("[data-action]");
  if (actionEl && root.contains(actionEl)) {
    handleAction(actionEl.dataset.action, actionEl);
    return;
  }
  const star = event.target.closest("[data-fallback]");
  if (star && root.contains(star)) {
    if (star.dataset.done) return;
    star.dataset.done = "1";
    softVibrate(8);
    celebrate("spark");
    star.classList.add("is-lit");
    return;
  }
});

root.addEventListener("input", (event) => {
  const t = event.target;
  if (t.matches("[data-unlock-input]")) state.unlockName = t.value;
  if (t.matches("[data-puzzle-input]")) {
    state.puzzleValue = t.value.replace(/\D/g, "").slice(0, 4);
    t.value = state.puzzleValue;
    const def = puzzlePageDef();
    let won = false;
    if (state.puzzleValue.length === 4) {
      if (def && state.puzzleValue === def.puzzle.answer) {
        state.puzzleMsg = "✅ 正确！在一起的日子，永远记得。";
        state.puzzleSolved = true;
        saveState();
        softVibrate([14, 22, 14]);
        won = true;
      } else {
        state.puzzleMsg = "❌ 再想想……是 2026 年的那一天。";
        softVibrate(10);
      }
    } else {
      state.puzzleMsg = "";
    }
    render();
    if (won) celebrate("heart");
  }
  if (t.matches("[data-bless-input]")) state.blessingName = t.value;
  if (t.matches("[data-music-volume]")) {
    state.musicVolume = Number(t.value);
    if (musicEl) musicEl.volume = state.musicVolume;
    saveState();
  }
});

/* 相册照片存在性 */
root.addEventListener("load", (event) => {
  if (event.target.matches("[data-photo]")) {
    const slot = event.target.closest("[data-album-slot]");
    if (slot) {
      const fb = slot.querySelector("[data-fallback]");
      if (fb) fb.style.display = "none";
    }
  }
}, true);

root.addEventListener("error", (event) => {
  if (event.target.matches("[data-photo]")) {
    event.target.style.display = "none";
  }
}, true);

/* 长按爱心 */
const holdState = { target: null, frame: 0, start: 0 };

function setHoldProgress(progress) {
  const fill = root.querySelector(".heart-fill");
  const percent = root.querySelector("[data-progress-percent]");
  if (fill) fill.style.clipPath = "inset(" + ((1 - progress) * 100) + "% 0 0 0)";
  if (percent) percent.textContent = Math.round(progress * 100) + "%";
}

function cancelHold() {
  if (!holdState.target) return;
  cancelAnimationFrame(holdState.frame);
  holdState.target.classList.remove("is-holding");
  setHoldProgress(0);
  holdState.target = null;
  render();
}

function finishHold() {
  cancelAnimationFrame(holdState.frame);
  state.finalUnlocked = true;
  saveState();
  softVibrate([20, 28, 20]);
  holdState.target = null;
  render();
  celebrate("heart");
}

function tickHold(now) {
  const progress = Math.min(1, (now - holdState.start) / 2000);
  setHoldProgress(progress);
  if (progress >= 1) {
    finishHold();
    return;
  }
  holdState.frame = requestAnimationFrame(tickHold);
}

root.addEventListener("pointerdown", (event) => {
  const heart = event.target.closest("[data-long-heart]");
  if (!heart || !root.contains(heart)) return;
  event.preventDefault();
  holdState.target = heart;
  holdState.start = performance.now();
  heart.classList.add("is-holding");
  heart.setPointerCapture?.(event.pointerId);
  holdState.frame = requestAnimationFrame(tickHold);
});

root.addEventListener("pointerup", (event) => {
  if (holdState.target && (event.target === holdState.target || event.target.closest("[data-long-heart]"))) {
    cancelHold();
  }
});
root.addEventListener("pointercancel", (event) => {
  if (holdState.target) cancelHold();
});

render();
