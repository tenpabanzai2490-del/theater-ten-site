// お問い合わせフォーム(contact.html)の送信を代理で受け取り、Googleフォームへ転送する。
// 投稿窓口(submit.js)と同じ理由: Googleフォームの実URL・entry IDをクライアント側に
// 露出させないため、ここを経由させる。

var GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdOg6zbTtdCX56vm1HeFXkpBuPY4-su8JR_quhNTBOd8JWI3Q/formResponse";

var ENTRY = {
  name: "entry.618737199",
  email: "entry.364837156",
  category: "entry.647223899",
  message: "entry.1855476971"
};

var ALLOWED_CATEGORIES = ["公演について", "取材・メディア", "ワークショップについて", "その他"];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method not allowed" });
    return;
  }

  var data = req.body || {};

  // ハニーポット: 人間には見えない項目。自動送信スクリプトはよく埋めてしまうため検出に使う。
  if (data.hp) {
    res.status(200).json({ ok: true });
    return;
  }

  var name = String(data.name || "").trim();
  var email = String(data.email || "").trim();
  var category = String(data.category || "").trim();
  var message = String(data.message || "").trim();

  if (!name || !email || !message) {
    res.status(400).json({ ok: false, error: "required fields missing" });
    return;
  }
  if (name.length > 100 || email.length > 200 || message.length > 20000) {
    res.status(400).json({ ok: false, error: "input too long" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "invalid email" });
    return;
  }
  if (category && ALLOWED_CATEGORIES.indexOf(category) === -1) {
    res.status(400).json({ ok: false, error: "invalid category" });
    return;
  }

  var params = new URLSearchParams();
  params.append(ENTRY.name, name);
  params.append(ENTRY.email, email);
  params.append(ENTRY.category, category || ALLOWED_CATEGORIES[0]);
  params.append(ENTRY.message, message);

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
