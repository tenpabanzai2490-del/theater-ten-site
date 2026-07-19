// チケット予約フォーム(ticket.html)の送信を代理で受け取り、Googleフォームへ転送する。
// Googleフォームの実URL・entry IDをクライアントに出さないのは投稿窓口・お問い合わせと同じ理由。
// Googleフォームには「選択肢ごとの回答数制限」機能が無いため、定員管理はここで
// 既存の予約人数をスプレッドシートから集計して行う(サーバー側で必ず検証する)。
//
// GET  /api/ticket-reserve … 各日程の残席数を返す(フォーム表示用)
// POST /api/ticket-reserve … 予約を受け付ける(定員チェック→Googleフォームへ転送)

var GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSctENLBV3yI0Vs3o1bXv21iGFamAwBHYcTAhctkZVJIK3snsg/formResponse";

var ENTRY = {
  name: "entry.1405216315",
  email: "entry.862330458",
  slot: "entry.1846093871",
  count: "entry.1657069603",
  note: "entry.483807884"
};

var SHEET_ID = "1Cb8ib9uk1pr7RoITyZ2xN05jNvU85Q7Bc-j2L4hb5z0";
var SHEET_RANGE = "フォームの回答 1!A2:F";

// 公演が変わったら日程と客席数をここで書き換える
var CAPACITY = {
  "8月8日(土) 13:00": 50,
  "8月8日(土) 18:00": 50,
  "8月9日(日) 13:00": 50,
  "8月9日(日) 18:00": 50
};

async function getReservedCounts(apiKey) {
  var sheetUrl =
    "https://sheets.googleapis.com/v4/spreadsheets/" + SHEET_ID +
    "/values/" + encodeURIComponent(SHEET_RANGE) + "?key=" + apiKey;
  var sheetRes = await fetch(sheetUrl);
  if (!sheetRes.ok) throw new Error("upstream failed");
  var sheetData = await sheetRes.json();
  var rows = sheetData.values || [];

  var reserved = {};
  Object.keys(CAPACITY).forEach(function (slot) {
    reserved[slot] = 0;
  });
  rows.forEach(function (r) {
    var slot = r[3];
    if (reserved.hasOwnProperty(slot)) {
      reserved[slot] += parseInt(r[4], 10) || 0;
    }
  });
  return reserved;
}

module.exports = async function handler(req, res) {
  var apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ ok: false, error: "server not configured" });
    return;
  }

  if (req.method === "GET") {
    try {
      var reservedNow = await getReservedCounts(apiKey);
      var remaining = {};
      Object.keys(CAPACITY).forEach(function (slot) {
        remaining[slot] = Math.max(0, CAPACITY[slot] - reservedNow[slot]);
      });
      res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");
      res.status(200).json({ ok: true, remaining: remaining });
    } catch (err) {
      res.status(502).json({ ok: false, error: "upstream failed" });
    }
    return;
  }

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
  var slot = String(data.slot || "").trim();
  var count = parseInt(data.count, 10);
  var note = String(data.note || "").trim();

  if (!name || !email || !slot || !count) {
    res.status(400).json({ ok: false, error: "required fields missing" });
    return;
  }
  if (name.length > 100 || email.length > 200 || note.length > 2000) {
    res.status(400).json({ ok: false, error: "input too long" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "invalid email" });
    return;
  }
  if (!CAPACITY.hasOwnProperty(slot)) {
    res.status(400).json({ ok: false, error: "invalid slot" });
    return;
  }
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    res.status(400).json({ ok: false, error: "invalid count" });
    return;
  }

  try {
    var reserved = await getReservedCounts(apiKey);

    if (reserved[slot] + count > CAPACITY[slot]) {
      res.status(409).json({ ok: false, error: "full" });
      return;
    }

    var params = new URLSearchParams();
    params.append(ENTRY.name, name);
    params.append(ENTRY.email, email);
    params.append(ENTRY.slot, slot);
    params.append(ENTRY.count, String(count));
    params.append(ENTRY.note, note);

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
