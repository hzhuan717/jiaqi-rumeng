import { escapeHtml } from "../utils/dom.js";

export function renderFloatingDecorations(particles) {
  const clouds = ["cloud-a", "cloud-b", "cloud-c", "cloud-d"].map((name) => '<span class="cloud ' + name + '"></span>').join("");
  const bubbles = ["bubble-a", "bubble-b", "bubble-c", "bubble-d", "bubble-e", "bubble-f"].map((name) => '<span class="ambient-bubble ' + name + '"></span>').join("");
  const stars = ["star-a", "star-b", "star-c", "star-d", "star-e"].map((name) => '<span class="ambient-star ' + name + '">✦</span>').join("");
  const particleHtml = particles.map((particle) => '<span class="celebration-particle" style="left:' + particle.left + '%;top:' + particle.top + '%;color:' + particle.color + ';animation-delay:' + particle.delay + 'ms">' + escapeHtml(particle.glyph) + '</span>').join("");
  return [
    '<div class="floating-decorations" aria-hidden="true">',
    '<div class="sky-glow sky-glow-one"></div><div class="sky-glow sky-glow-two"></div>',
    clouds, bubbles, stars,
    '<span class="drifting-heart heart-a">♡</span><span class="drifting-heart heart-b">♡</span>',
    '</div>',
    '<div class="celebration-layer" aria-hidden="true">' + particleHtml + '</div>'
  ].join("");
}
