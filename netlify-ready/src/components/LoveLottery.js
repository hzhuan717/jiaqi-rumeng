import { escapeHtml, icon } from "../utils/dom.js";

export function renderLoveLottery(data, state) {
  const sign = state.currentSignIndex === null ? null : data.lotterySigns[state.currentSignIndex];
  const signHtml = sign
    ? '<span class="mini-icon" aria-hidden="true">✦</span><strong>' + escapeHtml(sign.title) + '</strong><p>' + escapeHtml(sign.text) + '</p>'
    : '<span class="mini-icon" aria-hidden="true">✦</span><strong>还没抽签的小口袋</strong><p>轻轻点一下，小果果就把今日份心动递给小乖。</p>';
  return [
    '<section class="scene lottery-scene scene-enter"><div class="scene-scroll scene-center lottery-layout">',
    '<div class="scene-header compact"><p class="eyebrow">心动小抽签</p><h2>抽一张小果果的心动签</h2><p class="soft-copy">可以多点几次，每一次都是小果果认真放进来的偏爱。</p></div>',
    '<div class="lottery-stack ' + (state.drawing ? "is-shuffling" : "") + '" aria-hidden="true"><span class="lottery-paper paper-one"></span><span class="lottery-paper paper-two"></span><span class="lottery-paper paper-three"></span></div>',
    '<button class="primary-button" data-action="draw-sign" ' + (state.drawing ? "disabled" : "") + '>' + icon("shuffle") + (state.drawing ? " 正在把喜欢洗一洗" : " 抽取今日心动签") + '</button>',
    '<div class="sign-card">' + signHtml + '</div>',
    '<button class="secondary-button bottom-action" data-action="next">去解锁悄悄话 ' + icon("arrow") + '</button>',
    '</div></section>'
  ].join("");
}
