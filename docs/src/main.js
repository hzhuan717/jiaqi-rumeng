import { loveData } from "./data/loveData.js";
import { escapeHtml, icon } from "./utils/dom.js";
import { playPocketChime, softVibrate } from "./utils/animation.js";

const STORAGE_KEY = "jiaqi-rumeng-storybook-v2";
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
  fragments: Array.isArray(stored.fragments) ? stored.fragments : [],
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
  openGadget: 0,
  blessingName: "",
  blessingCard: "",
  signIndex: null,
  drawingSign: false,
  albumStars: Number(stored.albumStars || 0),
  copied: false,
  particles: []
};

const TOTAL_PAGES = loveData.storyPages.length + 2;

function saveState() {
  if (!state.unlocked) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    unlocked: state.unlocked,
    page: state.page,
    fragments: state.fragments,
    finalUnlocked: state.finalUnlocked,
    received: state.received,
    soundOn: state.soundOn,
    musicVolume: state.musicVolume,
    albumStars: state.albumStars
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

function probeMusic() {
  if (musicCheckDone) return;
  musicCheckDone = true;
  const probe = new Image();
  probe.onerror = () => {
    fetch(loveData.musicPath, { method: "HEAD" })
      .then((r) => { state.musicAvailable = r.ok; })
      .catch(() => { state.musicAvailable = false; });
  };
  probe.src = loveData.musicPath;
  probe.onload = () => { state.musicAvailable = true; };
  if (probe.complete && probe.naturalWidth === 0) {
    fetch(loveData.musicPath, { method: "HEAD" })
      .then((r) => { state.musicAvailable = r.ok; })
      .catch(() => { state.musicAvailable = false; });
  }
}

function startMusic() {
  if (!musicEl) {
    musicEl = new Audio(loveData.musicPath);
    musicEl.loop = true;
    musicEl.volume = state.musicVolume;
  }
  musicEl.play().then(() => {
    state.musicOn = true;
    chime();
  }).catch(() => {
    state.musicAvailable = false;
  });
}

function stopMusic() {
  if (musicEl) musicEl.pause();
  state.musicOn = false;
}

/* ---------------- 粒子 ---------------- */

function celebrate(kind) {
  chime();
  const glyphs = kind === "heart" ? ["♡", "♥", "✦", "❀"] : ["✦", "✧", "♡", "·"];
  const colors = kind === "heart" ? ["#ff8eb6", "#ffb35c", "#48a9ff", "#ffffff"] : ["#4daeff", "#ff8eb6", "#ffc86b", "#ffffff"];
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

function toast(text) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 2200);
}

/* ---------------- 碎片 ---------------- */

function hasFragment(i) { return state.fragments.includes(i); }

function addFragment(i) {
  if (hasFragment(i)) return false;
  state.fragments.push(i);
  saveState();
  softVibrate(16);
  celebrate("heart");
  return true;
}

function fragmentRack() {
  const slots = loveData.fragments.names.map((name, i) =>
    '<div class="fragment-slot ' + (hasFragment(i) ? "filled" : "") + '" title="' + escapeHtml(name) + '">' + (hasFragment(i) ? "✦" : "·") + "</div>"
  ).join("");
  return '<div class="fragment-rack">' + slots + "</div>" +
    '<div class="fragment-hint">时光碎片 ' + state.fragments.length + " / " + loveData.fragments.total + " · 集齐后可打开终章</div>";
}

/* ---------------- 渲染：顶栏与横幅 ---------------- */

function liveBanner() {
  const t = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const clock = pad(t.getHours()) + ":" + pad(t.getMinutes()) + ":" + pad(t.getSeconds());
  const together = dayCount(loveData.dates.start);
  const ann = daysUntil(loveData.dates.anniversary);
  const special = todaySpecial();
  return '<div class="live-banner">' + clock + " · 今天 " + todayYMD() +
    " · 和小佳在一起 <strong>第 " + together + " 天</strong>" +
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

function puzzleHTML() {
  return '<div class="puzzle-box">' +
    '<div class="puzzle-hint">🔑 ' + escapeHtml(loveData.storyPages[2].puzzle.hint) + "</div>" +
    '<input data-puzzle-input maxlength="4" inputmode="numeric" placeholder="____" value="' + escapeHtml(state.puzzleValue) + '" />' +
    '<div class="puzzle-feedback">' + escapeHtml(state.puzzleMsg) + "</div>" +
    "</div>";
}

function factRow() {
  const together = dayCount(loveData.dates.start);
  const meet = dayCount(loveData.dates.firstMeet);
  const ann = Math.max(0, daysUntil(loveData.dates.anniversary));
  return '<div class="fact-row">' +
    '<div class="fact-card"><div class="fact-value">' + meet + '</div><div class="fact-unit">天</div><div class="fact-title">遇见小佳以来</div></div>' +
    '<div class="fact-card highlight"><div class="fact-value">' + together + '</div><div class="fact-unit">天</div><div class="fact-title">陪在小佳身边</div></div>' +
    '<div class="fact-card"><div class="fact-value">' + ann + '</div><div class="fact-unit">天</div><div class="fact-title">距离一周年纪念</div></div>' +
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
    "<br/>没有照片的格子先由星星守着。点亮 <strong>3 颗星星</strong>，可收获一枚时光碎片。" +
    "</div>";
}

function gameShell(inner, statHTML) {
  return '<div class="game-area">' +
    '<div class="game-head"><span>' + statHTML + "</span></div>" +
    inner +
    "</div>";
}

function renderMemoryGame() {
  const symbols = ["♡", "♥", "❀", "✦", "♢", "♣"];
  const picked = symbols.slice(0, loveData.gameConfig.memory.pairs).concat(symbols.slice(0, loveData.gameConfig.memory.pairs)).sort(() => Math.random() - 0.5);
  const cards = picked.map((s, i) =>
    '<div class="memory-card" data-memory-card data-symbol="' + s + '" data-idx="' + i + '">' +
    '<div class="m-inner"><div class="m-face m-front">?</div><div class="m-face m-back">' + s + "</div></div>" +
    "</div>"
  ).join("");
  return gameShell('<div class="memory-grid" data-memory-grid>' + cards + "</div>", '记忆翻牌 · 配对全部爱心即通关 <span class="game-stat" data-memory-stat></span>');
}

function renderCatchGame() {
  return gameShell(
    '<div class="catch-stage" data-catch-stage><div class="heart-basket" data-basket>🧺</div></div>',
    '接爱心 · 接住 ' + loveData.gameConfig.catch.goal + ' 颗 <span class="game-stat" data-catch-stat></span>'
  );
}

function renderBubbleGame() {
  return gameShell(
    '<div class="bubble-stage" data-bubble-stage><div class="capybara">🦫<span style="font-size:18px">🍊</span></div></div>',
    '戳泡泡 · 戳破 ' + loveData.gameConfig.bubbles.goal + ' 个 <span class="game-stat" data-bubble-stat></span>'
  );
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
  parts.push('<div class="chapter-body">' + p.paragraphs.map((t) => "<p>" + escapeHtml(t) + "</p>").join("") + "</div>");
  if (p.art) parts.push(artSVG(p.art));
  if (index === 0) {
    parts.push('<div class="daily-line">' + escapeHtml(dailyLine()) + "</div>");
  }
  if (index === 1 || index === 2) {
    parts.push(factRow());
    parts.push(countdownBar());
  }
  if (index === 1 && hasFragment(0) && !hasFragment(1)) {
    parts.push(fragmentRack());
  }
  if (index === 2) {
    parts.push(puzzleHTML());
  }
  if (index === 3) {
    parts.push(albumHTML());
    if (!hasFragment(4)) parts.push(fragmentRack());
  }
  if (index === 4) {
    parts.push(renderMemoryGame());
    parts.push(renderCatchGame());
    parts.push(renderBubbleGame());
    if (!hasFragment(3)) parts.push(fragmentRack());
  }
  if (index === 5) {
    parts.push(gadgetListHTML());
  }
  if (index === 6) {
    parts.push(lotteryHTML());
    parts.push(blessingHTML());
  }
  const nextLocked = index === 4 && !hasFragment(3);
  const isFinalPage = index === loveData.storyPages.length - 1;
  const footer = '<div class="page-footer">' +
    '<span class="page-num">第 ' + (index + 2) + " 页 / " + TOTAL_PAGES + "</span>" +
    '<button class="page-nav-btn' + (nextLocked ? " is-locked" : "") + '" data-action="next-page">' + (isFinalPage ? "前往终章" : "下一章") + " →</button>" +
    "</div>";
  return '<div class="page"><div class="page-scroll">' + parts.join("") + "</div>" + footer + "</div>";
}

function gadgetListHTML() {
  return '<div class="gadget-list">' + loveData.gadgets.map((g, i) =>
    '<div class="gadget-card ' + (state.openGadget === i ? "is-open" : "") + '">' +
    '<button class="gadget-head" data-action="toggle-gadget" data-index="' + i + '">' +
    '<span class="gadget-icon">' + ["🔍", "🌀", "🔔", "🛡️", "📖"][i] + "</span>" +
    '<span class="g-name">' + escapeHtml(g.name) + "</span>" +
    '<span class="g-arrow">›</span>' +
    "</button>" +
    '<div class="gadget-body"><p>' + escapeHtml(g.description) + "</p></div>" +
    "</div>"
  ).join("") + "</div>";
}

function renderFinalPage() {
  const ready = state.fragments.length >= loveData.fragments.total;
  const prevFooter = '<div class="page-footer"><span class="page-num">封底 · 未完待续</span>' +
    '<button class="page-nav-btn" data-action="prev-page">← 上一页</button></div>';
  if (!ready && !state.finalUnlocked) {
    return '<div class="page"><div class="page-scroll">' +
      '<div class="chapter-kicker">终章</div>' +
      '<div class="chapter-title">被封印的情书</div>' +
      '<div class="chapter-body"><p>这本书的最后一页，被五枚时光碎片封印着。</p>' +
      "<p>只有读完序章、翻过初见、打开在一起的门、通关记忆小屋、点亮相册星光的人，才能翻开它。</p></div>" +
      fragmentRack() +
      '<div class="lock-note">你已集齐 ' + state.fragments.length + " / " + loveData.fragments.total + " 枚碎片。" + (state.fragments.length === 0 ? "先去前几页看看吧。" : "还差一点，继续翻书吧。") + "</div>" +
      "</div>" + prevFooter + "</div>";
  }
  if (!state.finalUnlocked) {
    return '<div class="page"><div class="page-scroll"><div class="final-lock">' +
      '<div class="hold-hint">长按爱心 2 秒，解开最后一页</div>' +
      '<div class="final-heart" data-long-heart aria-label="长按解锁"></div>' +
      '<div class="hold-percent" data-progress-percent>0%</div>' +
      '<div class="hold-hint">只有足够认真的人，才能打开这页书。</div>' +
      "</div></div>" + prevFooter + "</div>";
  }
  const letter = loveData.finalLetter;
  const copied = state.copied ? "已复制" : "复制全文";
  return '<div class="page"><div class="page-scroll"><div class="final-letter">' +
    "<h2>" + escapeHtml(letter.title) + "</h2>" +
    letter.paragraphs.map((t) => '<p class="f-para">' + escapeHtml(t) + "</p>").join("") +
    '<div class="f-sign">' + escapeHtml(letter.signature) + "</div>" +
    '<div class="final-actions">' +
    '<button class="is-primary" data-action="copy-letter">📋 ' + copied + "</button>" +
    (state.received ? '<button class="is-primary">💙 ' + escapeHtml(letter.receivedText) + "</button>" : '<button class="is-primary" data-action="receive-love">💙 收下这份喜欢</button>') +
    "</div>" +
    (state.received ? '<div class="received-note">' + escapeHtml(letter.receivedText) + "</div>" : "") +
    "</div></div>" +
    '<div class="page-footer"><span class="page-num">终章 · 完 · 故事未止</span>' +
    '<button class="page-nav-btn" data-action="prev-page">← 回看</button></div></div>';
}

function renderCover() {
  const today = todayYMD();
  const together = dayCount(loveData.dates.start);
  return '<div class="cover">' +
    '<div class="cover-eyebrow">LOVE LETTER · 2026</div>' +
    '<div class="cover-title">佳期如梦</div>' +
    '<div class="cover-sub">一本写给时间的情书</div>' +
    '<div class="cover-ornament">✦ ✧ ✦</div>' +
    '<div class="cover-sub">' + escapeHtml(loveData.coverTagline) + "</div>" +
    '<button class="cover-btn" data-action="open-book">翻开这本书</button>' +
    '<div class="cover-live">今天 ' + today + "<br/>已经和小佳在一起 <b>第 " + together + " 天</b></div>" +
    "</div>";
}

function renderUnlock() {
  return '<div class="unlock-page">' +
    '<div class="u-eyebrow">一本只属于小佳的书</div>' +
    '<div class="u-title">佳期如梦</div>' +
    '<div class="u-sub">请输入你的名字，翻开这本书</div>' +
    '<input class="u-input" data-unlock-input placeholder="小佳 / 小乖 / 罗佳…" autocomplete="off" />' +
    '<button class="u-btn" data-action="try-unlock">打开书</button>' +
    '<div class="u-msg">' + escapeHtml(state.unlockMsg) + "</div>" +
    '<div class="u-hint">提示：小果果一直喊你的那个名字</div>' +
    "</div>";
}

function renderMain() {
  if (!state.unlocked) return renderUnlock();
  if (state.page === 0) return renderCover();
  if (state.page <= loveData.storyPages.length) return renderChapter(state.page - 1);
  return renderFinalPage();
}

function render() {
  probeMusic();
  root.innerHTML = '<main class="app-shell"><div class="phone-shell">' +
    '<div class="scene-bg" aria-hidden="true">' + Array.from({ length: 14 }, (_, i) =>
      '<span class="twinkle" style="left:' + (i * 7 + 3) + "%;top:" + ((i * 17) % 90) + "%;animation-delay:" + (i * 0.37) + 's">✦</span>'
    ).join("") + '<div class="moon"></div></div>' +
    topControls() +
    (state.unlocked && state.page > 0 ? liveBanner() : "") +
    '<div class="book-wrap">' + renderMain() + "</div>" +
    "</div></main>" +
    '<div class="celebration-layer"></div>' +
    (state.unlocked && state.page > 0 && state.musicAvailable && state.musicOn ? musicTrayHTML() : "");
}

function musicTrayHTML() {
  return '<div class="music-tray">' +
    '<div class="m-row"><span class="m-name">🎵 ' + escapeHtml(loveData.musicTitle) + "</span>" +
    '<input type="range" min="0" max="1" step="0.05" value="' + state.musicVolume + '" data-music-volume aria-label="音量" />' +
    '<button class="m-close" data-action="close-music">✕</button></div>' +
    "</div>";
}

/* ---------------- 游戏引擎 ---------------- */

const games = { memory: null, catchGame: null, bubbles: null };

function memoryWon() { return state.fragments.includes(3); }

function handleMemoryClick(el) {
  if (memoryWon()) return;
  if (games.memory && games.memory.locked) return;
  const g = games.memory = games.memory || {
    flipped: [],
    matched: 0,
    busy: false
  };
  if (g.busy) return;
  const card = el;
  if (card.classList.contains("is-flipped") || card.classList.contains("is-matched")) return;
  card.classList.add("is-flipped");
  g.flipped.push(card);
  softVibrate(8);
  if (g.flipped.length === 2) {
    g.busy = true;
    const [a, b] = g.flipped;
    if (a.dataset.symbol === b.dataset.symbol) {
      window.setTimeout(() => {
        a.classList.add("is-matched");
        b.classList.add("is-matched");
        g.matched += 1;
        g.flipped = [];
        g.busy = false;
        updateMemoryStat();
        chime();
        if (g.matched === loveData.gameConfig.memory.pairs) {
          const stage = card.closest(".game-area");
          if (stage) showGameOver(stage, true, "记忆小屋 · 翻牌", "全部配对成功！");
        }
      }, 420);
    } else {
      window.setTimeout(() => {
        a.classList.remove("is-flipped");
        b.classList.remove("is-flipped");
        g.flipped = [];
        g.busy = false;
      }, 850);
    }
  }
}

function updateMemoryStat() {
  const el = root.querySelector("[data-memory-stat]");
  if (el) el.textContent = (games.memory ? games.memory.matched : 0) + " / " + loveData.gameConfig.memory.pairs + " 对";
}

function startCatchGame() {
  const stage = root.querySelector("[data-catch-stage]");
  if (!stage || games.catchGame) return;
  const basket = root.querySelector("[data-basket]");
  const cfg = loveData.gameConfig.catch;
  const g = games.catchGame = {
    caught: 0,
    time: cfg.time,
    hearts: [],
    lastSpawn: 0,
    over: false,
    raf: 0,
    lastT: 0
  };
  const statEl = root.querySelector("[data-catch-stat]");
  const updateStat = () => {
    if (statEl) statEl.textContent = g.caught + " / " + cfg.goal + " 颗 · " + g.time + "s";
  };
  updateStat();
  const timer = window.setInterval(() => {
    if (g.over) { window.clearInterval(timer); return; }
    g.time -= 1;
    updateStat();
    if (g.time <= 0) {
      window.clearInterval(timer);
      g.over = true;
      showGameOver(stage, g.caught >= cfg.goal, "接爱心", g.caught + " / " + cfg.goal + " 颗");
    }
  }, 1000);

  function spawn() {
    const heart = document.createElement("div");
    heart.className = "falling-heart";
    heart.textContent = ["♥", "💙", "❀", "✦"][Math.floor(Math.random() * 4)];
    heart.style.left = 8 + Math.random() * 76 + "%";
    const speed = 90 + Math.random() * 70;
    heart.dataset.speed = String(speed);
    stage.appendChild(heart);
    g.hearts.push({ el: heart, x: heart.offsetLeft, y: -30, speed });
  }

  g.lastT = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - g.lastT) / 1000);
    g.lastT = now;
    if (!g.over && now - g.lastSpawn > 700) {
      g.lastSpawn = now;
      if (g.hearts.length < 4) spawn();
    }
    const brect = basket.getBoundingClientRect();
    const srect = stage.getBoundingClientRect();
    g.hearts = g.hearts.filter((h) => {
      h.y += h.speed * dt;
      h.el.style.transform = "translateY(" + h.y + "px)";
      const hx = srect.left + h.x;
      const hy = srect.top + h.y;
      if (hx > brect.left - 20 && hx < brect.right + 20 && hy > brect.top - 14 && hy < brect.bottom) {
        h.el.remove();
        g.caught += 1;
        updateStat();
        softVibrate(10);
        if (g.caught >= cfg.goal) {
          g.over = true;
          showGameOver(stage, true, "接爱心", g.caught + " 颗全部接住！");
          return false;
        }
        return false;
      }
      if (h.y > 320) { h.el.remove(); return false; }
      return true;
    });
    if (!g.over) g.raf = requestAnimationFrame(loop);
  }
  g.raf = requestAnimationFrame(loop);

  const moveBasket = (clientX) => {
    const srect = stage.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - srect.left - 42, 4), srect.width - 88);
    basket.style.left = x + "px";
    basket.style.transform = "none";
  };
  stage.addEventListener("pointermove", (e) => moveBasket(e.clientX));
  stage.addEventListener("pointerdown", (e) => moveBasket(e.clientX));
}

function startBubbleGame() {
  const stage = root.querySelector("[data-bubble-stage]");
  if (!stage || games.bubbles) return;
  const cfg = loveData.gameConfig.bubbles;
  const words = ["爱", "想", "抱", "乖", "甜", "暖", "你", "我", "♡", "✦"];
  const g = games.bubbles = {
    count: 0,
    time: cfg.time,
    bubbles: [],
    over: false,
    lastSpawn: 0
  };
  const statEl = root.querySelector("[data-bubble-stat]");
  const updateStat = () => {
    if (statEl) statEl.textContent = g.count + " / " + cfg.goal + " 个 · " + g.time + "s";
  };
  updateStat();
  const timer = window.setInterval(() => {
    if (g.over) { window.clearInterval(timer); return; }
    g.time -= 1;
    updateStat();
    if (g.time <= 0) {
      window.clearInterval(timer);
      g.over = true;
      showGameOver(stage, g.count >= cfg.goal, "戳泡泡", g.count + " / " + cfg.goal + " 个");
    }
  }, 1000);

  function spawn() {
    if (g.bubbles.length >= 6) return;
    const b = document.createElement("div");
    b.className = "bubble";
    const size = 46 + Math.random() * 30;
    b.style.width = size + "px";
    b.style.height = size + "px";
    b.style.left = 6 + Math.random() * 78 + "%";
    b.style.top = 30 + Math.random() * 60 + "%";
    b.textContent = words[Math.floor(Math.random() * words.length)];
    b.dataset.bubble = "1";
    stage.appendChild(b);
    g.bubbles.push({ el: b, born: Date.now() });
  }
  window.setInterval(() => {
    if (!g.over) spawn();
  }, 900);
  spawn();

  stage.addEventListener("click", (e) => {
    const b = e.target.closest("[data-bubble]");
    if (!b || g.over) return;
    g.count += 1;
    updateStat();
    softVibrate(8);
    b.remove();
    g.bubbles = g.bubbles.filter((x) => x.el !== b);
    if (g.count >= cfg.goal) {
      g.over = true;
      showGameOver(stage, true, "戳泡泡", "全戳破了！水豚宝宝很开心");
    }
  });
}

function showGameOver(stage, won, name, detail) {
  if (stage.querySelector(".game-overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "game-overlay";
  overlay.innerHTML = won
    ? "<h3>🎉 通关了！</h3><p>" + escapeHtml(name) + " · " + escapeHtml(detail) + "</p>" +
      '<button data-action="replay-game">再玩一次</button>'
    : "<h3>还差一点点</h3><p>" + escapeHtml(name) + " · " + escapeHtml(detail) + "</p>" +
      '<button data-action="replay-game">再来一次</button>';
  stage.appendChild(overlay);
  if (won && addFragment(3)) {
    const toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.textContent = "获得时光碎片「记忆小屋」✨";
    document.body.appendChild(toastEl);
    window.setTimeout(() => toastEl.remove(), 2400);
  }
}

function stopAllGames() {
  if (games.catchGame) {
    games.catchGame.over = true;
    cancelAnimationFrame(games.catchGame.raf);
    games.catchGame = null;
  }
  if (games.bubbles) {
    games.bubbles.over = true;
    games.bubbles = null;
  }
  if (games.memory) games.memory = null;
  root.querySelectorAll(".falling-heart, [data-bubble]").forEach((el) => el.remove());
  root.querySelectorAll(".game-overlay").forEach((el) => el.remove());
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
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    state.copied = true;
    celebrate("heart");
    render();
    window.setTimeout(() => { state.copied = false; render(); }, 1600);
  } catch {
    state.copied = false;
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
  celebrate("heart");
  render();
}

function nextPage() {
  const idx = state.page - 1;
  if (state.page === 0) {
    state.page = 1;
  } else {
    if (idx === 1) addFragment(1);
    if (idx === 4 && !hasFragment(3)) {
      toast("先去记忆小屋玩一局，集齐碎片才能前进");
      return;
    }
    if (state.page < TOTAL_PAGES) state.page += 1;
  }
  saveState();
  stopAllGames();
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
      if (!state.musicAvailable) {
        toast("把音乐文件放到 assets/music/music.mp3 后刷新即可");
        return;
      }
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
      state.fragments = [];
      state.finalUnlocked = false;
      state.received = false;
      state.albumStars = 0;
      state.puzzleMsg = "";
      state.puzzleValue = "";
      stopAllGames();
      render();
      break;
    case "jump-page":
      stopAllGames();
      state.page = Math.max(0, Math.min(TOTAL_PAGES, Number(el.dataset.page)));
      saveState();
      render();
      break;
    case "open-book":
      state.page = 1;
      saveState();
      softVibrate(12);
      celebrate("spark");
      render();
      break;
    case "next-page":
      nextPage();
      break;
    case "prev-page":
      stopAllGames();
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
        celebrate("unlock");
        render();
        window.setTimeout(() => {
          state.unlocked = true;
          state.page = 0;
          state.unlockStatus = "";
          state.unlockMsg = "";
          addFragment(0);
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
        celebrate("heart");
        render();
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
      celebrate("heart");
      render();
      break;
    case "replay-game":
      stopAllGames();
      render();
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
  const memoryCard = event.target.closest("[data-memory-card]");
  if (memoryCard && root.contains(memoryCard)) {
    handleMemoryClick(memoryCard);
    return;
  }
  const star = event.target.closest("[data-fallback]");
  if (star && root.contains(star)) {
    if (star.dataset.done) return;
    star.dataset.done = "1";
    state.albumStars += 1;
    softVibrate(8);
    celebrate("spark");
    star.textContent = "✦";
    star.style.color = "#e8c97a";
    if (state.albumStars >= 3 && addFragment(4)) {
      const rack = root.querySelector(".fragment-rack");
      if (rack) rack.outerHTML = fragmentRack();
      window.setTimeout(() => toast("获得时光碎片「相册星光」✨"), 600);
    }
    return;
  }
});

root.addEventListener("input", (event) => {
  const t = event.target;
  if (t.matches("[data-unlock-input]")) state.unlockName = t.value;
  if (t.matches("[data-puzzle-input]")) {
    state.puzzleValue = t.value.replace(/\D/g, "").slice(0, 4);
    t.value = state.puzzleValue;
    if (state.puzzleValue.length === 4) {
      if (state.puzzleValue === loveData.storyPages[2].puzzle.answer) {
        state.puzzleMsg = "✅ 正确！在一起的日子，永远记得。";
        softVibrate([14, 22, 14]);
        if (addFragment(2)) {
          window.setTimeout(() => toast("获得时光碎片「在一起之门」✨"), 700);
        }
      } else {
        state.puzzleMsg = "❌ 再想想……是 2026 年的那一天。";
        softVibrate(10);
      }
    } else {
      state.puzzleMsg = "";
    }
    render();
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
  const heart = holdState.target;
  const percent = root.querySelector("[data-progress-percent]");
  if (heart) heart.style.transform = "scale(" + (1 + progress * 0.15) + ")";
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
  celebrate("heart");
  holdState.target = null;
  render();
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

/* 页内小游戏自动启动 */
root.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-catch-stage]")) {
    startCatchGame();
  }
  if (event.target.closest("[data-bubble-stage]")) {
    startBubbleGame();
  }
});

window.addEventListener("beforeunload", () => {
  stopAllGames();
});

render();
