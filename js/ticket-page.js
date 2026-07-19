// チケットページ(ticket.html)。FEATURED_PRODUCTION(js/featured-production.js)の
// ticketPageStatus に応じて「hidden(何も表示しない)」「waiting(次回公演をお待ちください)」
// 「open(予約受付中)」の3状態を切り替える。ホームの特集セクション用の status とは別の値なので、
// ホームの表示に影響を与えずにチケットページだけの状態を切り替えられる。
//
// iframeは日程・料金を確認する閲覧用プレビューとして表示する。予約フォームはセッション
// Cookieに依存する多段階フォームのため、別ドメインのiframe内だとブラウザのサードパーティ
// Cookie制限で予約が正しく完了しないことを実際に確認済み。そのため予約の確定操作自体は
// 必ず新しいタブで開く本家ページ側で行ってもらう(iframe内では完結させない)。
//
// チケットURLは、投稿窓口から「チケットURL更新」種別で投稿・公開OKされたものがあれば
// そちらを優先して使う(コードを直さずスプレッドシートの承認だけで更新できるようにするため)。
// 無ければ js/featured-production.js の ticketUrl を使う。

document.addEventListener("DOMContentLoaded", function () {
  var data = window.FEATURED_PRODUCTION;
  var openEl = document.getElementById("ticket-open");
  var noneEl = document.getElementById("ticket-none");

  var ticketPageStatus = data && data.ticketPageStatus;

  // hidden、または未設定の間は何も表示しない(準備中)。
  if (!ticketPageStatus || ticketPageStatus === "hidden") return;

  if (ticketPageStatus !== "open") {
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

  var iframe = document.getElementById("ticket-iframe");
  var ticketLink = document.getElementById("ticket-link");
  iframe.src = data.ticketUrl;
  ticketLink.href = data.ticketUrl;

  resolveTicketUrl(data.ticketUrl, function (ticketUrl) {
    iframe.src = ticketUrl;
    ticketLink.href = ticketUrl;
  });
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

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
