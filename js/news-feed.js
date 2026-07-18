// ニュース欄をGoogleスプレッドシート(公開CSV)から自動読み込みする仕組み。
//
// 使い方:
// 1. Googleフォームの回答をスプレッドシートにリンクする
// 2. スプレッドシートを「ファイル」→「共有」→「ウェブに公開」→ CSV形式で公開
// 3. 発行されたURLを下の SHEET_CSV_URL に設定する
//
// SHEET_CSV_URL が未設定の間は、HTML側に書かれた仮のニュースがそのまま表示される
// (何も壊れない)。URLを設定すると、次回アクセス時から自動でスプレッドシートの
// 内容に置き換わる。

var SHEET_CSV_URL = ""; // 例: "https://docs.google.com/spreadsheets/d/e/xxxxx/pub?output=csv"

document.addEventListener("DOMContentLoaded", function () {
  if (!SHEET_CSV_URL) return; // 未設定なら何もしない(HTML内の仮データのまま)

  var container = document.querySelector(".news-list");
  if (!container) return;

  fetch(SHEET_CSV_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("シートの取得に失敗しました");
      return res.text();
    })
    .then(function (csvText) {
      var rows = parseCSV(csvText);
      if (rows.length < 2) return; // ヘッダーのみ、または空

      // 1行目はヘッダー(タイムスタンプ, タイトル, 日付, 本文)想定。2列目以降がフォームの質問に対応。
      var entries = rows.slice(1).filter(function (r) {
        return r.length >= 4 && r[1];
      });

      entries.reverse(); // 新しい回答ほど下に追加されるため、新しい順に並べ替える

      container.innerHTML = entries
        .map(function (r) {
          var title = escapeHTML(r[1] || "");
          var date = escapeHTML(r[2] || "");
          var body = escapeHTML(r[3] || "");
          return (
            '<div class="news-row">' +
            '<div class="date">' + date + "</div>" +
            "<h2>" + title + "</h2>" +
            "<p>" + body + "</p>" +
            "</div>"
          );
        })
        .join("");
    })
    .catch(function (err) {
      console.error("ニュース欄の読み込みに失敗しました:", err);
      // 失敗時はHTML内の仮データをそのまま残す(何もしない)
    });
});

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
