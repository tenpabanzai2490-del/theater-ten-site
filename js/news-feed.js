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

// 投稿窓口(Googleフォーム)の回答スプレッドシート、公開CSVのURL。
// 列構成: タイムスタンプ, 名前, 種別, タイトル, 日付, 本文
var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnXDIT36e-TruQSj5JC4Wv02oLFaKhSfS6IuQDgSK-2-iYGZ35gICMlsCYTTvC_1BqI9t5xUZRkEKe/pub?output=csv";

// このニュース欄には「種別」がこの値の行だけを表示する(公演情報の追加依頼などは除外)
var NEWS_CATEGORY = "ニュース";

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

      // 列: 0=タイムスタンプ 1=名前 2=種別 3=タイトル 4=日付 5=本文
      var entries = rows.slice(1).filter(function (r) {
        return r.length >= 6 && r[2] === NEWS_CATEGORY && r[3];
      });

      if (entries.length === 0) return; // ニュース種別の投稿がまだ無ければ仮データのまま

      entries.reverse(); // 新しい回答ほど下に追加されるため、新しい順に並べ替える

      container.innerHTML = entries
        .map(function (r) {
          var title = escapeHTML(r[3] || "");
          var date = escapeHTML(r[4] || "");
          var body = escapeHTML(r[5] || "").replace(/\n/g, "<br>");
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
