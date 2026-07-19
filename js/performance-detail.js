// 公演詳細ページ(performance.html)用。
// URLの ?id= (投稿のタイムスタンプをそのままIDとして使う) を手がかりに、
// /api/news から該当する投稿を探して、チラシ画像を原寸大に近い形で・本文を全文表示する。
// processBody / escapeHTML / cloudinaryOptimized / isApproved は news-feed.js のものを利用する。

document.addEventListener("DOMContentLoaded", function () {
  var container = document.getElementById("performance-detail");
  var titleEl = document.getElementById("detail-title");
  if (!container) return;

  var id = new URLSearchParams(location.search).get("id");
  if (!id) {
    showError("公演が指定されていません。");
    return;
  }

  fetch("/api/news")
    .then(function (res) {
      if (!res.ok) throw new Error("読み込みに失敗しました");
      return res.json();
    })
    .then(function (data) {
      var rows = data.values || [];
      var match = rows.find(function (r) {
        return r[0] === id && r.length >= 4 && r[3] && isApproved(r[6]);
      });

      if (!match) {
        showError("該当する公演情報が見つかりませんでした。");
        return;
      }

      render(match);
    })
    .catch(function () {
      showError("読み込みに失敗しました。時間をおいてもう一度お試しください。");
    });

  function showError(message) {
    if (titleEl) titleEl.textContent = "公演が見つかりません";
    if (window.autofitHeading) autofitHeading(titleEl);
    container.innerHTML = "<p>" + escapeHTML(message) + "</p>";
  }

  function render(r) {
    var title = escapeHTML(r[3] || "");
    var processed = processBody(r[5] || "");

    document.title = (r[3] || "公演詳細") + " | Theater TEN Company";
    if (titleEl) titleEl.textContent = r[3] || "";
    // タイトルは非同期で後から差し替わるため、DOMContentLoaded時の自動判定だけでは
    // 間に合わない。ここで明示的にフォントサイズの再計算を呼ぶ。
    if (window.autofitHeading) autofitHeading(titleEl);

    var imagesHtml = processed.imageUrls.length
      ? '<div class="detail-flyers">' +
        processed.imageUrls
          .map(function (url) {
            var safeUrl = escapeHTML(url);
            var bigUrl = escapeHTML(cloudinaryOptimized(url, 1000));
            return '<a href="' + safeUrl + '" target="_blank" rel="noopener"><img src="' + bigUrl + '" alt="' + title + '"></a>';
          })
          .join("") +
        "</div>"
      : "";

    container.innerHTML = imagesHtml + '<div class="detail-text">' + processed.bodyHtml + "</div>";
  }
});
