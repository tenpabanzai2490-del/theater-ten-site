// 画面下の電光掲示板風「雑学」ティッカー。
// 日本語の雑学専用APIが見当たらなかったため、
// ①自前で用意した日本語の雑学リスト と
// ②英語の雑学API(uselessfacts.jsph.pl)を翻訳API(MyMemory)で日本語化したもの
// を半々くらいの確率で混ぜて表示する(バリエーションを増やすため)。
// ②はネット上の投稿ベースで内容を選べないため、NGワードで簡易的にフィルタし、
// 引っかかった場合は日本語リストにフォールバックする(完全ではないが安全側に倒す)。
// どちらのAPIもキー不要・クライアント側から直接叩けるので、サーバー側の秘密は発生しない。
// 一度閉じたら、そのタブを開いている間(sessionStorage)は再表示しない。

(function () {
  var DISMISS_KEY = "tt-trivia-dismissed";
  if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

  // 自前の日本語雑学リスト。内容を選べるので基本的に安全。
  var JP_TRIVIA = [
    "富士山は今も活火山で、最後に噴火したのは1707年の宝永大噴火と言われている。",
    "日本の新幹線は、平均の遅延が1分未満と言われるほど定時運行に優れている。",
    "ハチミツについて。実は、何千年も前のものでも、まだ食べられる状態で見つかることがあるらしい。",
    "タコの心臓は1つと思われがちだけれど、実は3つあるそうだ。",
    "バナナは木になる果物と思われがちだが、じつのところ、植物学的には「草」の実にあたるという。",
    "日本には3,000か所以上の温泉があると言われている。",
    "カラスは意外と賢い鳥で、実は道具を使ったり、人の顔を覚えたりすることもあるらしい。",
    "虹の色の数え方は文化によって異なり、日本では一般的に7色とされている。",
    "京都はかつて「平安京」と呼ばれ、約1000年にわたり日本の都だったという。",
    "サメは、実は恐竜が現れるよりも前から地球に存在していたと言われている。",
    "日本は人口あたりの自動販売機の台数が、世界でも特に多い国のひとつらしい。",
    "コアラはのんびり屋というイメージ通り、実は1日20時間近く眠っていることがあるそうだ。",
    "スイカは果物のように扱われるけれど、実のところ、植物学上は野菜に分類されることもあるらしい。",
    "ひらがなとカタカナは、どちらも漢字をもとに作られたという。",
    "タコの血液について。実は、人間と違って青色をしているという。",
    "満月の夜はなんとなく特別な感じがするけれど、実は空がほんの少しだけ明るく感じられるらしい。",
    "ラクダのこぶには水が入っていると思われがちだが、じつは、たくわえられているのは脂肪らしい。",
    "日本刀は「折り返し鍛錬」という技法で、何層にも重ねて鍛えられるという。",
    "ゾウは賢い動物として知られているが、実は鏡に映った自分を自分だと分かる、数少ない動物のひとつらしい。",
    "俳句は世界でも短い詩として知られているけれど、実は「五・七・五」のたった17音でできているという。",
    "月は地球のすぐそばにあるようで、実は少しずつ遠ざかっているらしい。",
    "沖縄と北海道では、気候も方言も大きく異なる。",
    "アトリエTheater TENのある那覇市安里は、かつて宿場町として栄えたエリアだったという。",
    "演劇の稽古では、発声練習に「外郎売(ういろううり)」という早口の台詞が使われることがある。",

    // ここから下は「知ってどうするんだよ」系の、しょうもない雑学
    "輪ゴムはただのゴムじゃない。実は、暖かい場所に置いておくほうが長持ちするらしい。",
    "モナ・リザの微笑みの下に、ちょっとした秘密がある。実は、彼女には眉毛が描かれていない。",
    "アリは休みなく働いているイメージがあるけれど、実は眠らない生き物らしい。",
    "猫という生き物は液体なのか固体なのか。不思議なことに、その答えはいまだにはっきりしていないという。",
    "あなたが何気なく押しているエレベーターの「閉」ボタン。じつのところ、作動していない機種もあるらしい。",
    "自動販売機のボタンを何度も連打してしまう人へ。実のところ、それはあまり意味がないらしい。",
    "あくびが人にうつるのはなぜか。実は、その理由はまだよく分かっていないらしい。",
    "サンドイッチという名前の裏には、ある貴族のちょっとしたわがままが隠れている。どうやら、トランプを続けたかっただけらしい。",
    "ハンバーガーという名前、その由来をたどると、ドイツのとある街に行き着くと言われている。",
    "ポテトチップスの誕生には、ちょっとした逸話がある。どうやら、料理への文句に対する仕返しで薄く切られたのが始まりという説があるそうだ。",
    "コアラの指紋は、人間のものとほとんど見分けがつかないほどよく似ているという。",
    "切手の裏側の「のり」について。実は、なめてもほとんど味がしないように作られているらしい。",
    "じゃんけんは日本だけの遊びかと思いきや、実は世界のいろいろな国に似た遊びがあるらしい。",
    "冷蔵庫の扉を閉めた瞬間。当然ながら、中の電気はちゃんと消えている。",
    "「ぬいぐるみ」という言い方は、英語の直訳ではなく日本語独自の表現だという。",
    "カップ焼きそばのあの穴。よく見ると、少しだけ位置がずれていることに気づくかもしれない。",
    "ラーメン屋の「マシマシ」は、注文時の掛け声として広まった言葉らしい。",
    "「バナナはおやつに含まれますか」という質問は、遠足のしおりの定番ネタとして知られている。",
    "カラオケの点数について。実は、同じ歌を歌っても、機種によって点数が変わることがあるらしい。",
    "エスカレーターで片側を空ける習慣は、地域によって左右が逆になるという。"
  ];

  // 英語版のAPIから来る文章に対する簡易セーフティ(完全ではないが、明らかに
  // 不適切なものは弾く)。翻訳前の英語と、翻訳後の日本語の両方をチェックする。
  var BLOCK_EN = [
    "sex", "sexual", "porn", "rape", "incest", "penis", "vagina", "breast",
    "orgasm", "masturbat", "prostitut", "nude", "naked", "erotic",
    "kill", "murder", "suicide", "self-harm", "self harm",
    "drug", "cocaine", "heroin", "marijuana", "narcotic",
    "nazi", "hitler", "slave", "slavery", "genocide",
    "gore", "torture", "corpse",
    "gun", "shoot", "bomb", "terroris",
    "racist", "hate crime",
    "fuck", "shit", "bitch", "asshole", "bastard", "whore", "slut"
  ];
  var BLOCK_JA = [
    "性的", "セックス", "レイプ", "強姦", "売春", "ヌード", "わいせつ",
    "自殺", "殺人", "殺害", "虐殺",
    "麻薬", "覚醒剤", "大麻",
    "ナチス", "ヒトラー", "奴隷", "拷問", "死体",
    "銃", "爆弾", "テロ", "差別"
  ];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    injectStyle();
    var bar = buildBar();
    document.body.appendChild(bar);
    // 開いた直後にいきなり流れ始めると忙しない印象になるため、少し間を置く
    setTimeout(function () {
      loadNext(bar.querySelector(".trivia-text"));
    }, 3000);
  }

  function injectStyle() {
    var style = document.createElement("style");
    style.textContent =
      "#trivia-ticker{position:fixed;left:0;right:0;bottom:0;height:38px;background:#1a1a1a;" +
      "display:flex;align-items:center;overflow:hidden;z-index:9999;font-family:'Noto Sans JP',sans-serif;}" +
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
      "#trivia-ticker .trivia-text{font-size:12px;}" +
      "}";
    document.head.appendChild(style);
  }

  function buildBar() {
    var bar = document.createElement("div");
    bar.id = "trivia-ticker";
    bar.innerHTML =
      '<div class="trivia-track"><span class="trivia-text"></span></div>' +
      '<button type="button" class="trivia-close" aria-label="閉じる">×</button>';

    bar.querySelector(".trivia-close").addEventListener("click", function () {
      sessionStorage.setItem(DISMISS_KEY, "1");
      bar.remove();
      document.body.style.paddingBottom = "";
    });

    return bar;
  }

  var lastJpIndex = -1;
  function pickJpTrivia() {
    var i;
    do {
      i = Math.floor(Math.random() * JP_TRIVIA.length);
    } while (i === lastJpIndex && JP_TRIVIA.length > 1);
    lastJpIndex = i;
    return JP_TRIVIA[i];
  }

  function isSafe(enText, jaText) {
    var lowerEn = String(enText || "").toLowerCase();
    var i;
    for (i = 0; i < BLOCK_EN.length; i++) {
      if (lowerEn.indexOf(BLOCK_EN[i]) !== -1) return false;
    }
    for (i = 0; i < BLOCK_JA.length; i++) {
      if (String(jaText || "").indexOf(BLOCK_JA[i]) !== -1) return false;
    }
    return true;
  }

  function loadNext(textEl) {
    // 半々くらいの確率で、自前の日本語リストか、外部APIの翻訳かを選ぶ
    if (Math.random() < 0.5) {
      setText(textEl, pickJpTrivia());
      return;
    }

    fetchExternalTriviaWithRetry(3)
      .then(function (text) {
        setText(textEl, text);
      })
      .catch(function () {
        // 取得失敗、または3回とも不適切判定だった場合は安全な自前リストへ
        setText(textEl, pickJpTrivia());
      });
  }

  function fetchExternalTriviaWithRetry(attemptsLeft) {
    if (attemptsLeft <= 0) return Promise.reject(new Error("no safe fact found"));

    return fetchFact()
      .then(function (enText) {
        return translateToJapanese(enText).then(function (jaText) {
          if (!isSafe(enText, jaText)) {
            return fetchExternalTriviaWithRetry(attemptsLeft - 1);
          }
          return jaText;
        });
      })
      .catch(function () {
        return fetchExternalTriviaWithRetry(attemptsLeft - 1);
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

    var pixelsPerSecond = 42;
    var duration = Math.max(16, Math.min(110, distance / pixelsPerSecond));
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
