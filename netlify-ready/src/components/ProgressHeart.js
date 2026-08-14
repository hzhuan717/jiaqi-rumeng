export function renderProgressHeart() {
  return [
    '<div class="progress-heart-wrap">',
    '<button class="progress-heart" type="button" data-long-heart aria-label="长按解锁小果果的悄悄话"><span class="heart-core"><span class="heart-shape">♥</span></span></button>',
    '<span class="progress-percent" data-progress-percent>0%</span>',
    '</div>'
  ].join("");
}
