// チケットページ(ticket.html)。FEATURED_PRODUCTION(js/featured-production.js)の
// status に応じて「予約受付中」「次回公演未定」の2状態を切り替える。

document.addEventListener("DOMContentLoaded", function () {
  var data = window.FEATURED_PRODUCTION;
  var openEl = document.getElementById("ticket-open");
  var noneEl = document.getElementById("ticket-none");

  if (!data || data.status !== "open") {
    noneEl.style.display = "";
    return;
  }

  openEl.style.display = "";

  document.getElementById("ticket-title").textContent = data.title || "";

  var metaParts = [];
  if (data.dates) metaParts.push(data.dates);
  if (data.venue) metaParts.push(data.venue);
  document.getElementById("ticket-meta").innerHTML = metaParts
    .map(function (t) { return escapeHTML(t); })
    .join("<br>");

  var fallbackLink = document.getElementById("ticket-fallback-link");
  fallbackLink.href = data.ticketUrl;

  var errorLink = document.getElementById("ticket-iframe-error-link");
  errorLink.href = data.ticketUrl;

  var iframe = document.getElementById("ticket-iframe");
  var embedWrap = document.getElementById("ticket-embed-wrap");
  var errorBox = document.getElementById("ticket-iframe-error");

  // iframeの読み込み失敗はload/errorイベントだけでは確実に検知できないため、
  // 一定時間経っても読み込み完了イベントが来なければフォールバック表示に切り替える。
  var loaded = false;
  var failTimer = setTimeout(function () {
    if (loaded) return;
    embedWrap.style.display = "none";
    errorBox.style.display = "";
  }, 8000);

  iframe.addEventListener("load", function () {
    loaded = true;
    clearTimeout(failTimer);
  });

  iframe.src = data.ticketUrl;
});

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
