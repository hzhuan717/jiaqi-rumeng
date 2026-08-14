import { escapeHtml, icon } from "../utils/dom.js";

export function renderTimeDoor(data, state) {
  return [
    '<section class="scene door-scene scene-enter"><div class="scene-scroll scene-center">',
    '<p class="eyebrow">时光小门</p><h2>小乖，请打开这扇门。</h2>',
    '<p class="soft-copy narrow">门后面，是小果果记住的第' + escapeHtml(data.importantDates.firstMeetDays) + '天和第' + escapeHtml(data.importantDates.togetherDays) + '天。</p>',
    '<div class="time-door ' + (state.doorOpen ? "is-open" : "") + '" aria-hidden="true"><div class="door-aura"></div><div class="door-frame"><span class="door-panel door-left"></span><span class="door-panel door-right"></span><span class="door-glow">✦</span><span class="door-knob door-knob-left"></span><span class="door-knob door-knob-right"></span></div><div class="door-floor"></div></div>',
    '<button class="primary-button" data-action="open-door" ' + (state.doorOpen ? "disabled" : "") + '>轻轻打开 ' + icon("arrow") + '</button>',
    '</div></section>'
  ].join("");
}
