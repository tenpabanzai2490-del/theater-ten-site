// トップページの特集セクションを FEATURED_PRODUCTION(js/featured-production.js)の内容で描画する。
// status:"none" の間は、公演の告知がない通常時のブランドコピーに自動的に戻る。

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", function () {
  var data = window.FEATURED_PRODUCTION;
  var titleEl = document.getElementById("featured-title");
  var metaEl = document.getElementById("featured-meta");
  var leadEl = document.getElementById("featured-lead");
  var linksEl = document.getElementById("featured-links");
  if (!titleEl) return;

  if (!data || data.status !== "open") {
    titleEl.innerHTML = "20年、<br>那覇の舞台から。";
    metaEl.style.display = "none";
    leadEl.className = "lead bordered";
    leadEl.textContent = "うちなー芝居、現代劇、市民ミュージカル、そして次世代の育成。沖縄・那覇を拠点に20年以上、伝統と現代のあいだで舞台をつくり続けています。";
    linksEl.innerHTML = '<a class="cta-inline" href="performances.html" style="color:var(--accent-blue)">最新の公演情報を見る <span style="font-size:18px">→</span></a>';
    if (window.autofitHeading) autofitHeading(titleEl);
    return;
  }

  titleEl.textContent = data.title;
  if (window.autofitHeading) autofitHeading(titleEl);

  var metaParts = [];
  if (data.subtitle) metaParts.push(data.subtitle);
  if (data.dates) metaParts.push(data.dates);
  if (data.venue) metaParts.push(data.venue);
  metaEl.innerHTML = metaParts.map(escapeHTML).join("<br>");
  metaEl.style.fontSize = "13px";
  metaEl.style.lineHeight = "1.9";
  metaEl.style.marginTop = "20px";
  metaEl.style.color = "var(--sub-warm-light)";

  leadEl.className = "lead bordered";
  leadEl.textContent = data.leadText || "";

  linksEl.innerHTML =
    '<a class="btn-primary" href="ticket.html">チケットを予約する <span>→</span></a>' +
    '<a class="btn-secondary" href="' + escapeHTML(data.detailPageUrl) + '">公演詳細を見る<span class="badge">◯</span></a>';
});
