// 投稿窓口(Googleフォーム)のスプレッドシートから、複数の場所に自動反映する仕組み。
//
// 使い方: HTML側に data-feed-categories="ニュース,公演情報の追加・修正依頼" のように
// 表示したい「種別」をカンマ区切りで指定した要素(class="news-list")を置いておくと、
// 該当する投稿だけがそこに自動的に一覧表示される。
// 該当する投稿がまだ無ければ、HTML内の仮データがそのまま表示される(何も壊れない)。

// 投稿窓口(Googleフォーム)の回答スプレッドシート、公開CSVのURL。
// 列構成: タイムスタンプ, 名前, 種別, タイトル, 日付, 本文
var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnXDIT36e-TruQSj5JC4Wv02oLFaKhSfS6IuQDgSK-2-iYGZ35gICMlsCYTTvC_1BqI9t5xUZRkEKe/pub?output=csv";

document.addEventListener("DOMContentLoaded", function () {
  if (!SHEET_CSV_URL) return;

  var targets = document.querySelectorAll("[data-feed-categories]");
  if (targets.length === 0) return;

  fetch(SHEET_CSV_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("シートの取得に失敗しました");
      return res.text();
    })
    .then(function (csvText) {
      var rows = parseCSV(csvText);
      if (rows.length < 2) return; // ヘッダーのみ、または空

      // 列: 0=タイムスタンプ 1=名前 2=種別 3=タイトル 4=日付 5=本文
      var all = rows.slice(1).filter(function (r) {
        return r.length >= 6 && r[3];
      });
      all.reverse(); // 新しい回答ほど下に追加されるため、新しい順に並べ替える

      targets.forEach(function (container) {
        var categories = container
          .getAttribute("data-feed-categories")
          .split(",")
          .map(function (c) { return c.trim(); });

        var entries = all.filter(function (r) {
          return categories.indexOf(r[2]) !== -1;
        });

        if (entries.length === 0) return; // 該当投稿がまだ無ければ仮データのまま

        container.innerHTML = entries.map(renderRow).join("");
      });
    })
    .catch(function (err) {
      console.error("投稿窓口データの読み込みに失敗しました:", err);
      // 失敗時はHTML内の仮データをそのまま残す(何もしない)
    });
});

function renderRow(r) {
  var title = escapeHTML(r[3] || "");
  var date = escapeHTML(r[4] || "");
  var rawBody = r[5] || "";

  // 本文の中から "[添付画像] URL" という行を抜き出し、実際の画像として表示する
  var imageUrls = [];
  var textLines = rawBody.split("\n").filter(function (line) {
    var m = line.match(/^\[添付画像\]\s*(\S+)/);
    if (m) {
      imageUrls.push(m[1]);
      return false;
    }
    return true;
  });

  var body = escapeHTML(textLines.join("\n").trim()).replace(/\n/g, "<br>");

  var imagesHTML = imageUrls.length
    ? '<div class="news-images">' +
      imageUrls
        .map(function (url) {
          var safeUrl = escapeHTML(url);
          return '<a href="' + safeUrl + '" target="_blank" rel="noopener"><img src="' + safeUrl + '" alt="' + title + '" loading="lazy"></a>';
        })
        .join("") +
      "</div>"
    : "";

  return (
    '<div class="news-row">' +
    '<div class="date">' + date + "</div>" +
    "<h2>" + title + "</h2>" +
    imagesHTML +
    "<p>" + body + "</p>" +
    "</div>"
  );
}

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// 簡易CSVパーサー(ダブルクォート・カンマ・改行を含むセルに対応)
function parseCSV(text) {
  var rows = [];
  var row = [];
  var field = "";
  var inQuotes = false;

  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    var next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && next === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
