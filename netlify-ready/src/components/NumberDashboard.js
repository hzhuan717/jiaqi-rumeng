import { escapeHtml, icon } from "../utils/dom.js";

export function renderNumberDashboard(data, state) {
  const cards = data.numberCards.map((card, index) => [
    '<button class="number-card ' + (state.activeNumber === index ? "is-active" : "") + '" data-action="number-card" data-index="' + index + '">',
    '<span class="number-value"><span data-count-to="' + card.value + '">0</span><small>' + escapeHtml(card.unit) + '</small></span>',
    '<strong>' + escapeHtml(card.title) + '</strong><span>' + escapeHtml(card.text) + '</span></button>'
  ].join("")).join("");
  return [
    '<section class="scene number-scene scene-enter"><div class="scene-scroll">',
    '<div class="scene-header"><p class="eyebrow">第212天 · 第134天 · 520</p><h2>小果果记住的数字</h2><p class="soft-copy">第一次见面第212天，在一起第134天，小果果还是很喜欢你。</p></div>',
    '<div class="number-grid">' + cards + '</div>',
    '<div class="core-line-card">小果果把喜欢装进了一个蓝色口袋，送给罗佳小宝宝。</div>',
    '<button class="primary-button bottom-action" data-action="next">去看我们的时间线 ' + icon("arrow") + '</button>',
    '</div></section>'
  ].join("");
}
