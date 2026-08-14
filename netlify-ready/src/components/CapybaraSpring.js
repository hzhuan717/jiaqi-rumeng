import { escapeHtml, icon } from "../utils/dom.js";

export function renderCapybaraSpring(data, state) {
  const selected = data.springBubbles[state.selectedBubble] || data.springBubbles[0];
  const bubbles = data.springBubbles.map((bubble, index) => '<button class="spring-bubble ' + (state.selectedBubble === index ? "is-selected" : "") + '" data-action="spring-bubble" data-index="' + index + '">' + escapeHtml(bubble.label) + '</button>').join("");
  return [
    '<section class="scene spring-scene scene-enter"><div class="scene-scroll">',
    '<div class="scene-header compact"><p class="eyebrow">治愈时间</p><h2>小乖的时间温泉</h2><p class="soft-copy">点一点泡泡，看看小果果藏在里面的话。</p></div>',
    '<div class="spring-illustration" aria-label="原创戴橘子帽的水豚宝宝泡在温泉里"><span class="steam steam-one"></span><span class="steam steam-two"></span><span class="steam steam-three"></span>',
    '<div class="spring-water"><span class="ripple ripple-one"></span><span class="ripple ripple-two"></span><span class="ripple ripple-three"></span></div>',
    '<div class="capybara-baby"><span class="orange-hat"><span class="orange-leaf"></span></span><span class="capy-ear capy-ear-left"></span><span class="capy-ear capy-ear-right"></span><span class="capy-head"><span class="capy-eye capy-eye-left"></span><span class="capy-eye capy-eye-right"></span><span class="capy-nose"></span><span class="capy-cheek capy-cheek-left"></span><span class="capy-cheek capy-cheek-right"></span></span><span class="capy-body"></span></div></div>',
    '<div class="bubble-actions">' + bubbles + '</div>',
    '<div class="bubble-message"><strong>' + escapeHtml(selected.label) + '</strong><p>' + escapeHtml(selected.text) + '</p></div>',
    '<button class="primary-button bottom-action" data-action="next">看小果果的秘密道具 ' + icon("arrow") + '</button>',
    '</div></section>'
  ].join("");
}
