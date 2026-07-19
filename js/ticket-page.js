// チケットページ(ticket.html)。FEATURED_PRODUCTION(js/featured-production.js)の
// ticketPageStatus に応じて「hidden(何も表示しない)」「waiting(次回公演をお待ちください)」
// 「open(予約受付中)」の3状態を切り替える。ホームの特集セクション用の status とは別の値なので、
// ホームの表示に影響を与えずにチケットページだけの状態を切り替えられる。
//
// 予約は自サイトの予約フォーム→ /api/ticket-reserve 経由でGoogleフォームへ転送する
// (決済は含まず座席確保のみ・当日精算のため、以前iframe埋め込みで問題になった
// 外部予約システムのサードパーティCookie制限は発生しない)。
// 日時の残席数は /api/ticket-reserve (GET) から取得し、満席の日時は選べないようにする。

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

  loadSlots();
  setupForm();
});

function loadSlots() {
  var select = document.getElementById("t-slot");

  fetch("/api/ticket-reserve")
    .then(function (res) {
      if (!res.ok) throw new Error("failed");
      return res.json();
    })
    .then(function (data) {
      var remaining = data.remaining || {};
      var slots = Object.keys(remaining);
      if (slots.length === 0) {
        select.innerHTML = '<option value="">現在ご案内できる日時がありません</option>';
        return;
      }
      select.innerHTML = slots
        .map(function (slot) {
          var seats = remaining[slot];
          var full = seats <= 0;
          var label = full ? slot + "(満席)" : slot + "(残り" + seats + "席)";
          return '<option value="' + escapeHTML(slot) + '"' + (full ? " disabled" : "") + ">" + escapeHTML(label) + "</option>";
        })
        .join("");
    })
    .catch(function () {
      select.innerHTML = '<option value="">読み込みに失敗しました。再読み込みしてください</option>';
    });
}

function setupForm() {
  var form = document.getElementById("ticket-form");
  var status = document.getElementById("ticket-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    submitBtn.disabled = true;
    status.textContent = "送信中...";
    status.style.color = "var(--sub-warm-light)";

    var payload = {
      name: document.getElementById("t-name").value,
      email: document.getElementById("t-email").value,
      slot: document.getElementById("t-slot").value,
      count: document.getElementById("t-count").value,
      note: document.getElementById("t-note").value,
      hp: document.getElementById("t-hp").value
    };

    fetch("/api/ticket-reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (res.status === 409) {
          throw new Error("full");
        }
        if (!res.ok) throw new Error("submit failed");
        return res.json();
      })
      .then(function () {
        status.textContent = "ご予約を受け付けました。確認メールをご確認ください。";
        status.style.color = "var(--accent-blue)";
        form.reset();
        loadSlots();
      })
      .catch(function (err) {
        if (err.message === "full") {
          status.textContent = "申し訳ございません、その日時は満席になりました。別の日時をお選びください。";
          loadSlots();
        } else {
          status.textContent = "送信に失敗しました。もう一度お試しください。";
        }
        status.style.color = "var(--accent-red)";
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
}

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
