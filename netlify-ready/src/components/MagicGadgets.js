import { escapeHtml, icon } from "../utils/dom.js";

function glyph(iconName) {
  return '<span class="gadget-glyph gadget-' + iconName + '" aria-hidden="true"><span class="glyph-core"></span><span class="glyph-detail"></span></span>';
}

export function renderMagicGadgets(data, state) {
  const gadgets = data.gadgets.map((gadget, index) => [
    '<button class="gadget-card ' + (state.openGadget === index ? "is-open" : "") + '" data-action="gadget" data-index="' + index + '">',
    glyph(gadget.icon),
    '<span class="gadget-copy"><strong>' + escapeHtml(gadget.name) + '</strong><span>' + escapeHtml(gadget.description) + '</span></span></button>'
  ].join("")).join("");
  return [
    '<section class="scene gadgets-scene scene-enter"><div class="scene-scroll">',
    '<div class="scene-header compact"><p class="eyebrow">蓝色口袋里</p><h2>小果果的秘密道具</h2><p class="soft-copy">这些不是普通道具，是小果果想送给小乖的小小超能力。</p></div>',
    '<div class="gadget-pocket" aria-hidden="true"><span class="gadget-pocket-lid"></span><span class="gadget-pocket-shine">✦</span></div>',
    '<div class="gadget-list">' + gadgets + '</div>',
    '<button class="primary-button bottom-action" data-action="next">抽一张心动签 ' + icon("arrow") + '</button>',
    '</div></section>'
  ].join("");
}
