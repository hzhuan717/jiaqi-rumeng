import { escapeHtml, icon } from "../utils/dom.js";

export function renderTimelineCards(data, state) {
  const cards = data.timelineCards.map((card, index) => [
    '<div class="timeline-item"><span class="timeline-dot"></span>',
    '<button class="flip-card ' + (state.flippedTimeline[index] ? "is-flipped" : "") + '" data-action="flip-timeline" data-index="' + index + '" aria-label="' + escapeHtml(card.title) + '，点击翻转">',
    '<span class="flip-card-inner"><span class="flip-face flip-front"><small>' + String(index + 1).padStart(2, "0") + '</small><strong>' + escapeHtml(card.title) + '</strong><span>' + escapeHtml(card.front) + '</span><em>轻点翻面</em></span>',
    '<span class="flip-face flip-back"><strong>' + escapeHtml(card.title) + '</strong><span>' + escapeHtml(card.back) + '</span><em>再点回来</em></span></span></button></div>'
  ].join("")).join("");
  return [
    '<section class="scene timeline-scene scene-enter"><div class="scene-scroll">',
    '<div class="scene-header"><p class="eyebrow">我们的时间线</p><h2>从遇见，到喜欢</h2><p class="soft-copy">点开每一张小卡片，看看小果果悄悄翻到背面的那句话。</p></div>',
    '<div class="timeline-list">' + cards + '</div>',
    '<button class="primary-button bottom-action" data-action="next">去小乖的时间温泉 ' + icon("arrow") + '</button>',
    '</div></section>'
  ].join("");
}
