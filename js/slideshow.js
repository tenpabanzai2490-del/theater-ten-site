document.addEventListener("DOMContentLoaded", function () {
  var slides = document.querySelectorAll(".hero-slideshow .slide");
  if (slides.length < 2) return; // 写真が1枚だけの間は何もしない(自動で切り替わる準備だけしておく)

  var current = 0;
  var intervalMs = 5000;
  var dotsWrap = document.getElementById("hero-slideshow-dots");
  var dots = [];

  if (dotsWrap) {
    slides.forEach(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", (i + 1) + "枚目の写真を表示");
      dot.addEventListener("click", function () {
        goTo(i);
        resetTimer();
      });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });
  }

  function goTo(index) {
    slides[current].classList.remove("active");
    if (dots[current]) dots[current].classList.remove("active");
    current = index;
    slides[current].classList.add("active");
    if (dots[current]) dots[current].classList.add("active");
  }

  var timer = setInterval(function () {
    goTo((current + 1) % slides.length);
  }, intervalMs);

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(function () {
      goTo((current + 1) % slides.length);
    }, intervalMs);
  }

  var slideshowEl = document.querySelector(".hero-slideshow");
  if (slideshowEl) {
    slideshowEl.style.cursor = "pointer";
    slideshowEl.addEventListener("click", function () {
      goTo((current + 1) % slides.length);
      resetTimer();
    });
  }
});
