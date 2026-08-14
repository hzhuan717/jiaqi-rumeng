export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function lines(value = "") {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

export function icon(name) {
  const icons = {
    spark: "✦",
    heart: "♡",
    arrow: "›",
    lock: "⌁",
    music: "♪",
    mute: "×",
    restart: "↺",
    copy: "⧉",
    check: "✓",
    shuffle: "⇄"
  };
  return '<span class="mini-icon" aria-hidden="true">' + (icons[name] || "✦") + '</span>';
}
