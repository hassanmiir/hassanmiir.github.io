/* ============================================================
   timer.js — live countdown timer for activity slides.
   Drop into a slide with:
     <div class="timer" data-minutes="5"></div>
   - Auto-starts when its slide becomes active (reveal.js).
   - Big digits, Start/Pause, Reset, +1 min.
   - Turns amber under 60s, red under 20s, flashes at 0.
   ============================================================ */
(function () {
  function fmt(s) {
    var m = Math.floor(s / 60), r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function build(el) {
    if (el.dataset.tmBuilt) return el._tm; el.dataset.tmBuilt = "1";
    var total = Math.max(5, Math.round(parseFloat(el.getAttribute("data-minutes") || "5") * 60));
    var state = { remaining: total, total: total, running: false, iv: null, done: false };

    el.innerHTML =
      '<div class="tm-face"><span class="tm-digits">' + fmt(total) + '</span></div>' +
      '<div class="tm-controls">' +
        '<button class="tm-btn tm-start" type="button">▶ Start</button>' +
        '<button class="tm-btn tm-reset" type="button" title="Reset">↺</button>' +
        '<button class="tm-btn tm-add" type="button" title="Add one minute">+1 min</button>' +
      '</div>';

    var digits = el.querySelector(".tm-digits");
    var face = el.querySelector(".tm-face");
    var startBtn = el.querySelector(".tm-start");

    function paint() {
      digits.textContent = fmt(state.remaining);
      face.classList.toggle("warn", state.remaining <= 60 && state.remaining > 20);
      face.classList.toggle("danger", state.remaining <= 20 && state.remaining > 0);
      face.classList.toggle("done", state.remaining <= 0);
    }
    function tick() {
      if (state.remaining > 0) {
        state.remaining--; paint();
        if (state.remaining === 0) { stop(); state.done = true; face.classList.add("ring"); setTimeout(function(){face.classList.remove("ring");}, 2600); }
      }
    }
    function start() {
      if (state.running || state.remaining <= 0) return;
      state.running = true; startBtn.textContent = "❚❚ Pause";
      state.iv = setInterval(tick, 1000);
    }
    function stop() {
      state.running = false; startBtn.textContent = "▶ Start";
      if (state.iv) { clearInterval(state.iv); state.iv = null; }
    }
    function toggle() { state.running ? stop() : start(); }
    function reset() { stop(); state.remaining = state.total; state.done = false; paint(); }
    function add() { state.remaining += 60; if (state.remaining > 0) face.classList.remove("done"); paint(); }

    startBtn.addEventListener("click", toggle);
    el.querySelector(".tm-reset").addEventListener("click", reset);
    el.querySelector(".tm-add").addEventListener("click", add);
    paint();

    el._tm = { start: start, stop: stop, reset: reset, state: state };
    return el._tm;
  }

  // Build all timers; auto-start the one on the current slide.
  function initAll() { document.querySelectorAll(".timer").forEach(build); }

  function autoStartCurrent() {
    if (!window.Reveal || !Reveal.getCurrentSlide) return;
    var cur = Reveal.getCurrentSlide();
    if (!cur) return;
    var t = cur.querySelector(".timer");
    if (t) {
      var api = build(t);
      // auto-start only if untouched (fresh)
      if (api && !api.state.running && api.state.remaining === api.state.total && !api.state.done) {
        api.start();
      }
    }
  }

  function init() {
    initAll();
    autoStartCurrent();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
  if (window.Reveal && Reveal.on) {
    Reveal.on("ready", init);
    Reveal.on("slidechanged", autoStartCurrent);
  }
  window.TimerInit = init;
})();
