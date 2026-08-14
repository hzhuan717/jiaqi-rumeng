import { escapeHtml, icon, lines } from "../utils/dom.js";
import { renderProgressHeart } from "./ProgressHeart.js";

export function renderFinalLetter(data, state) {
  if (!state.finalUnlocked) {
    return [
      '<section class="scene final-scene scene-enter"><div class="scene-scroll"><div class="scene-center final-lock">',
      '<p class="eyebrow">最后一页</p><h2>长按这颗小心心</h2><p class="soft-copy narrow">长按 2 秒，解锁小果果的悄悄话。</p>',
      renderProgressHeart(),
      '<p class="tiny-note">松开会重新开始，像认真攒满一颗心。</p>',
      '</div></div></section>'
    ].join("");
  }

  const paragraphs = data.finalLetter.paragraphs.map((paragraph) => '<p>' + lines(paragraph) + '</p>').join("");
  const received = state.received ? '<div class="received-toast">' + escapeHtml(data.finalLetter.receivedText) + '<span>把这个页面收藏起来，以后还可以再看。</span></div>' : "";
  return [
    '<section class="scene final-scene scene-enter"><div class="scene-scroll"><div class="letter-wrap">',
    '<div class="letter-card"><p class="eyebrow">' + icon("spark") + ' 小果果的悄悄话</p><h2>' + escapeHtml(data.finalLetter.title) + '</h2><div class="letter-body">' + paragraphs + '</div><p class="letter-signature">' + escapeHtml(data.finalLetter.signature) + '</p></div>',
    '<div class="letter-actions"><button class="primary-button" data-action="receive-love">' + icon("check") + ' 把这份喜欢收好</button><button class="secondary-button" data-action="copy-letter">' + icon("copy") + ' ' + (state.copied ? "已经复制好啦" : "复制祝福文案") + '</button><button class="ghost-button" data-action="restart">' + icon("restart") + ' 重新体验</button></div>',
    received,
    '</div></div></section>'
  ].join("");
}
