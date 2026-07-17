document.addEventListener("DOMContentLoaded", function () {
  var slides = document.querySelectorAll(".hero-slideshow .slide");
  if (slides.length < 2) return; // 写真が1枚だけの間は何もしない(自動で切り替わる準備だけしておく)

  var current = 0;
  var intervalMs = 5000;

  setInterval(function () {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, intervalMs);
});
