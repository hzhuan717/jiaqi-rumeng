import { escapeHtml, icon } from "../utils/dom.js";

export function renderUnlockScreen(data, state) {
  const message = state.unlockMessage ? '<p class="micro-message ' + state.unlockStatus + '">' + escapeHtml(state.unlockMessage) + '</p>' : "";
  return [
    '<section class="scene unlock-scene scene-enter"><div class="scene-scroll scene-center">',
    '<div class="pocket-sprite ' + (state.unlockOpening ? "is-opening" : "") + '" aria-hidden="true">',
    '<span class="pocket-ear pocket-ear-left"></span><span class="pocket-ear pocket-ear-right"></span>',
    '<span class="pocket-face"><span class="pocket-eye pocket-eye-left"></span><span class="pocket-eye pocket-eye-right"></span><span class="pocket-smile"></span></span>',
    '<span class="pocket-body"></span><span class="pocket-belly"></span><span class="pocket-pocket"></span>',
    '<span class="pocket-spark spark-one">✦</span><span class="pocket-spark spark-two">♡</span><span class="pocket-spark spark-three">✧</span></div>',
    '<div class="hero-copy"><p class="eyebrow">' + icon("spark") + ' 2026.05.20</p><h1>' + escapeHtml(data.title) + '</h1><p class="subtitle">' + escapeHtml(data.subtitle) + '</p>',
    '<p class="soft-copy">这里有一个小果果偷偷准备的520小惊喜。只有罗佳小乖可以打开。</p></div>',
    '<form class="unlock-form" data-form="unlock"><label class="sr-only" for="unlock-name">输入小乖的名字</label>',
    '<input id="unlock-name" value="' + escapeHtml(state.unlockName) + '" placeholder="输入：罗佳 / 小乖 / 小宝宝 / 佳期如梦" autocomplete="off" ' + (state.unlockOpening ? "disabled" : "") + ' />',
    '<button class="primary-button" type="submit" ' + (state.unlockOpening ? "disabled" : "") + '>' + icon("lock") + ' 打开小果果的时光口袋</button></form>',
    message,
    '</div></section>'
  ].join("");
}
