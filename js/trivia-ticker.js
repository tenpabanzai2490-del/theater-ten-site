// 画面下の電光掲示板風「雑学」ティッカー。
// 日本語の雑学専用APIが見当たらなかったため、英語の雑学API(uselessfacts.jsph.pl)から
// 取得した文章を、翻訳API(MyMemory)で日本語に訳して流す2段構成にしている。
// どちらもAPIキー不要・クライアント側から直接叩けるので、サーバー側の秘密は発生しない。
// 一度閉じたら、そのタブを開いている間(sessionStorage)は再表示しない。

(function () {
  var DISMISS_KEY = "tt-trivia-dismissed";
  if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    injectStyle();
    var bar = buildBar();
    document.body.appendChild(bar);
    loadNext(bar.querySelector(".trivia-text"));
  }

  function injectStyle() {
    var style = document.createElement("style");
    style.textContent =
      "#trivia-ticker{position:fixed;left:0;right:0;bottom:0;height:38px;background:#1a1a1a;" +
      "display:flex;align-items:center;overflow:hidden;z-index:9999;font-family:'Noto Sans JP',sans-serif;}" +
      "#trivia-ticker .trivia-label{flex-shrink:0;padding:0 14px;height:100%;display:flex;align-items:center;" +
      "background:oklch(58% 0.12 35);color:#efece5;font-size:12px;letter-spacing:0.08em;font-weight:700;}" +
      "#trivia-ticker .trivia-track{flex:1;overflow:hidden;position:relative;height:100%;}" +
      "#trivia-ticker .trivia-text{position:absolute;top:0;left:0;height:100%;display:flex;align-items:center;" +
      "white-space:nowrap;color:oklch(75% 0.13 80);font-size:13px;padding-right:40px;" +
      "transform:translateX(100%);}" +
      "#trivia-ticker .trivia-text.is-scrolling{animation-name:trivia-scroll;animation-timing-function:linear;" +
      "animation-fill-mode:forwards;}" +
      "@keyframes trivia-scroll{from{transform:translateX(var(--tx-start));}to{transform:translateX(var(--tx-end));}}" +
      "#trivia-ticker .trivia-close{flex-shrink:0;width:38px;height:100%;border:none;background:transparent;" +
      "color:#9a968d;font-size:16px;cursor:pointer;}" +
      "#trivia-ticker .trivia-close:hover{color:#efece5;}" +
      "body{padding-bottom:38px;}" +
      "@media (max-width:600px){" +
      "#trivia-ticker .trivia-label{display:none;}" +
      "#trivia-ticker .trivia-text{font-size:12px;}" +
      "}";
    document.head.appendChild(style);
  }

  function buildBar() {
    var bar = document.createElement("div");
    bar.id = "trivia-ticker";
    bar.innerHTML =
      '<span class="trivia-label">雑学</span>' +
      '<div class="trivia-track"><span class="trivia-text">読み込み中...</span></div>' +
      '<button type="button" class="trivia-close" aria-label="閉じる">×</button>';

    bar.querySelector(".trivia-close").addEventListener("click", function () {
      sessionStorage.setItem(DISMISS_KEY, "1");
      bar.remove();
      document.body.style.paddingBottom = "";
    });

    return bar;
  }

  function loadNext(textEl) {
    fetchFact()
      .then(function (fact) {
        return translateToJapanese(fact);
      })
      .then(function (translated) {
        setText(textEl, translated);
      })
      .catch(function () {
        setText(textEl, "雑学の読み込みに失敗しました。しばらくしてから再読み込みしてください。");
      });
  }

  function setText(textEl, text) {
    // 一旦アニメーションを止めてから中身を差し替える(進行中のまま書き換えると
    // 表示位置がおかしくなるため)。
    textEl.classList.remove("is-scrolling");
    textEl.textContent = text;

    // 実際のトラック幅・文章幅(px)から移動距離を出す。
    // 「文章の幅に対する相対%」で動かしていた旧実装では、文章がトラックより
    // 短いと画面外まで届く前にループが巻き戻り、「途中で消える」ように見えていた。
    var trackWidth = textEl.parentElement.clientWidth;
    var textWidth = textEl.scrollWidth;
    var distance = trackWidth + textWidth; // 右端の外→左端の外まで、の合計距離

    textEl.style.setProperty("--tx-start", trackWidth + "px");
    textEl.style.setProperty("--tx-end", "-" + textWidth + "px");

    var pixelsPerSecond = 90;
    var duration = Math.max(10, Math.min(60, distance / pixelsPerSecond));
    textEl.style.animationDuration = duration + "s";

    // reflowを挟んでからクラスを付け直すことで、確実にアニメーションを最初から開始させる
    void textEl.offsetWidth;
    textEl.classList.add("is-scrolling");

    // 画面外まで流れ切ったら次の雑学を読み込む
    textEl.addEventListener(
      "animationend",
      function handler() {
        textEl.removeEventListener("animationend", handler);
        loadNext(textEl);
      },
      { once: true }
    );
  }

  function fetchFact() {
    return fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en")
      .then(function (res) {
        if (!res.ok) throw new Error("fact fetch failed");
        return res.json();
      })
      .then(function (data) {
        return data.text;
      });
  }

  function translateToJapanese(text) {
    var url =
      "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(text) +
      "&langpair=en|ja";
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("translate failed");
        return res.json();
      })
      .then(function (data) {
        var translated = data && data.responseData && data.responseData.translatedText;
        return translated || text;
      });
  }
})();
