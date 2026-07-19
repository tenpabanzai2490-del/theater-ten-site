// class="autofit-heading" が付いた見出しの文字数が多くて折り返しそうな時に、
// 1行に収まるところまでフォントサイズを自動で少しずつ縮める。
// 最小サイズまで縮めても収まらない場合は、最終的に通常通り折り返す(画面外にはみ出さないための保険)。
// タイトルをJSで動的に差し替えるページ(index.html、performance.htmlなど)では、
// このスクリプトを差し替え処理のscriptタグより後に読み込めば、自動で正しく計測される。

function autofitHeading(el) {
  if (!el) return;
  var minSize = Number(el.getAttribute("data-min-font")) || 14;
  var baseSize = Number(el.getAttribute("data-base-font"));
  if (!baseSize) {
    baseSize = parseFloat(getComputedStyle(el).fontSize);
    el.setAttribute("data-base-font", baseSize);
  }

  // flexboxの子要素(例: .feature-text直下のh1)は、white-space:nowrapにした瞬間、
  // 要素自身の幅(clientWidth)も中身に合わせて広がってしまい、正しく比較できない。
  // そのため、折り返し可能な通常状態でのクライアント幅を先に測っておき、それを基準にする。
  el.style.fontSize = baseSize + "px";
  el.style.whiteSpace = "normal";
  var targetWidth = el.clientWidth;

  el.style.whiteSpace = "nowrap";
  var size = baseSize;
  el.style.fontSize = size + "px";
  while (el.scrollWidth > targetWidth && size > minSize) {
    size -= 1;
    el.style.fontSize = size + "px";
  }
  el.style.whiteSpace = "normal";
}

function autofitAllHeadings() {
  document.querySelectorAll(".autofit-heading").forEach(autofitHeading);
}

document.addEventListener("DOMContentLoaded", autofitAllHeadings);

(function () {
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(autofitAllHeadings, 150);
  });
})();
