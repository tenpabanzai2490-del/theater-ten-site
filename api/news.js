// 投稿窓口(Googleフォーム)の回答スプレッドシートを、サーバー側からGoogle Sheets APIで取得して返す。
// Googleの実APIキーはここ(Vercelの環境変数)にしか存在しない。クライアントには一切渡さない。

var SHEET_ID = "1XySdy-4mA60sUlF5ONDQJO_8aNgWl8dhLoVgDORkqo4";
var SHEET_RANGE = "フォームの回答 1!A2:G";

module.exports = async function handler(req, res) {
  var apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "server not configured" });
    return;
  }

  var url =
    "https://sheets.googleapis.com/v4/spreadsheets/" + SHEET_ID +
    "/values/" + encodeURIComponent(SHEET_RANGE) + "?key=" + apiKey;

  try {
    var sheetRes = await fetch(url);
    if (!sheetRes.ok) {
      res.status(502).json({ error: "upstream failed" });
      return;
    }
    var data = await sheetRes.json();
    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");
    res.status(200).json({ values: data.values || [] });
  } catch (err) {
    res.status(502).json({ error: "upstream failed" });
  }
};
