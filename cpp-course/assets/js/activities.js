/* activities.js — quiz + reveal-answer interactivity for lecture slides.
   Works with reveal.js; re-binds when slides change. */
(function () {
  function bindQuiz(q) {
    if (q.dataset.bound) return; q.dataset.bound = "1";
    var opts = q.querySelectorAll(".opt");
    var verdict = q.querySelector(".verdict");
    opts.forEach(function (o) {
      o.addEventListener("click", function () {
        var correct = o.getAttribute("data-correct") === "1";
        opts.forEach(function (x) {
          // reveal the correct one, mark the chosen
          if (x.getAttribute("data-correct") === "1") x.classList.add("correct");
        });
        if (!correct) o.classList.add("wrong");
        if (verdict) {
          verdict.textContent = correct
            ? (o.getAttribute("data-msg") || "Correct! ✓")
            : (o.getAttribute("data-msg") || "Not quite — see the highlighted answer.");
          verdict.className = "verdict " + (correct ? "ok" : "no");
        }
      });
    });
  }
  function bindReveal(r) {
    if (r.dataset.bound) return; r.dataset.bound = "1";
    r.addEventListener("click", function () { r.classList.add("shown"); });
  }
  function spawnFloaties() {
    var glyphs = ["{", "}", "<", ">", ";", "//", "++", "()", "cout", "int", "&&", "::", "[]", "=="];
    document.querySelectorAll("[data-floaty]:not([data-floaty-done])").forEach(function (box) {
      box.setAttribute("data-floaty-done", "1");
      var n = 14;
      for (var i = 0; i < n; i++) {
        var s = document.createElement("span");
        s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
        s.style.left = Math.round(Math.random() * 96) + "%";
        s.style.bottom = "-40px";
        s.style.fontSize = (18 + Math.round(Math.random() * 42)) + "px";
        s.style.animationDuration = (7 + Math.random() * 9).toFixed(1) + "s";
        s.style.animationDelay = (Math.random() * 8).toFixed(1) + "s";
        box.appendChild(s);
      }
    });
  }
  function init() {
    document.querySelectorAll(".quiz").forEach(bindQuiz);
    document.querySelectorAll(".reveal-answer").forEach(bindReveal);
    spawnFloaties();
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
  if (window.Reveal && Reveal.on) Reveal.on("ready", init);
  window.ActivitiesInit = init;
})();
