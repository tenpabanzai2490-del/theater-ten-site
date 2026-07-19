// 投稿窓口の送信を代理で受け取り、Googleフォームへ転送するサーバーレス関数。
//
// これを挟む理由: これまでは koushin-55901123.html の中に Google フォームの
// 送信先URLとentry IDがそのまま書かれており、ページのソースを見れば誰でも
// 直接その送信先にPOSTできてしまっていた(サイトのパスワードや見た目とは無関係に)。
// この関数を経由させることで、ブラウザ側は自サイトの /api/submit しか知らず、
// Google側の実URLはサーバー側にしか存在しない状態にする。

var GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSc81T0wM91qnmgqYJulaUoqWA-IxqnB5lGDpDatl3BU1NKPjg/formResponse";

var ENTRY = {
  name: "entry.328992978",
  category: "entry.1448683413",
  title: "entry.756854158",
  dateYear: "entry.336099288_year",
  dateMonth: "entry.336099288_month",
  dateDay: "entry.336099288_day",
  body: "entry.1105532969"
};

var ALLOWED_CATEGORIES = ["ニュース", "公演情報", "チケットURL更新", "プロフィール変更依頼", "その他・要望"];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method not allowed" });
    return;
  }

  var data = req.body || {};

  // ハニーポット: 人間には見えない項目。自動送信スクリプトはよくすべての項目を埋めるため、
  // ここに値が入っていたら機械的な投稿とみなして黙って弾く(見た目上は成功扱いにする)。
  if (data.hp) {
    res.status(200).json({ ok: true });
    return;
  }

  var name = String(data.name || "").trim();
  var title = String(data.title || "").trim();
  var body = String(data.body || "").trim();
  var category = String(data.category || "").trim();
  var date = String(data.date || "").trim();

  if (!name || !title || !body) {
    res.status(400).json({ ok: false, error: "required fields missing" });
    return;
  }
  if (name.length > 100 || title.length > 200 || body.length > 20000) {
    res.status(400).json({ ok: false, error: "input too long" });
    return;
  }
  if (category && ALLOWED_CATEGORIES.indexOf(category) === -1) {
    res.status(400).json({ ok: false, error: "invalid category" });
    return;
  }

  var params = new URLSearchParams();
  params.append(ENTRY.name, name);
  params.append(ENTRY.category, category || ALLOWED_CATEGORIES[0]);
  params.append(ENTRY.title, title);
  params.append(ENTRY.body, body);

  if (date) {
    var parts = date.split("-");
    if (parts.length === 3) {
      params.append(ENTRY.dateYear, parts[0]);
      params.append(ENTRY.dateMonth, parts[1]);
      params.append(ENTRY.dateDay, parts[2]);
    }
  }

  try {
    await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ ok: false, error: "upstream failed" });
  }
};
