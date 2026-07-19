// チケットページ(ticket.html)。FEATURED_PRODUCTION(js/featured-production.js)の
// status に応じて「予約受付中」「次回公演未定」の2状態を切り替える。
//
// チケットURLは、投稿窓口から「チケットURL更新」種別で投稿・公開OKされたものがあれば
// そちらを優先して使う(コードを直さずスプレッドシートの承認だけで更新できるようにするため)。
// 無ければ js/featured-production.js の ticketUrl を使う。

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

  resolveTicketUrl(data.ticketUrl, startIframe);
});

// 投稿窓口経由の「チケットURL更新」で公開OKされた最新の投稿があればそのURLを、無ければ既定のURLを返す。
function resolveTicketUrl(fallbackUrl, callback) {
  fetch("/api/news")
    .then(function (res) {
      if (!res.ok) throw new Error("failed");
      return res.json();
    })
    .then(function (data) {
      var rows = data.values || [];
      var updates = rows.filter(function (r) {
        return r.length >= 6 && r[2] === "チケットURL更新" && isApproved(r[6]);
      });
      if (updates.length === 0) {
        callback(fallbackUrl);
        return;
      }
      // シートは古い順に並んでいるため、最後に一致した行が最新の承認済み投稿になる
      var latest = updates[updates.length - 1];
      var m = String(latest[5] || "").match(/https?:\/\/\S+/);
      callback(m ? m[0] : fallbackUrl);
    })
    .catch(function () {
      callback(fallbackUrl);
    });
}

function isApproved(value) {
  var v = String(value || "").trim().toUpperCase();
  return v === "TRUE" || v === "1";
}

function startIframe(ticketUrl) {
  var errorLink = document.getElementById("ticket-iframe-error-link");
  errorLink.href = ticketUrl;

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

  iframe.src = ticketUrl;
}

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
