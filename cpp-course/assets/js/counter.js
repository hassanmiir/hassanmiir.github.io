/* ============================================================
   counter.js — live "students opened" counter for a lecture.
   Uses the free, no-signup Abacus service (CORS-enabled):
     https://abacus.jasoncameron.dev/hit/{namespace}/{key}
   Increments once per browser session (so a refresh doesn't
   double-count), and shows the live total on the slide.

   Markup to place on a slide:
     <span class="open-counter" data-lecture="lecture1">…</span>

   The namespace + today's date make each lecture-day its own
   tally. If the service is unreachable, the badge quietly shows
   a dash instead of breaking the slide.
   ============================================================ */
(function () {
  var BASE = "https://abacus.jasoncameron.dev";
  // Namespace must be URL-safe; tie it to the site so counts don't collide
  // with other people using the same free service.
  var NAMESPACE = "hassanmiir-cpp-course";

  function todayKey(lecture) {
    var d = new Date();
    var ymd = d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
    return (lecture || "lecture") + "_" + ymd;
  }

  function render(el, value, state) {
    // state: 'loading' | 'ok' | 'err'
    var num = (state === "ok" && value != null) ? value : (state === "loading" ? "…" : "—");
    el.innerHTML =
      '<span class="oc-eye">👁</span>' +
      '<span class="oc-num">' + num + '</span>' +
      '<span class="oc-label">opened today</span>';
    el.classList.toggle("oc-err", state === "err");
  }

  function fetchJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    });
  }

  function activate(el) {
    if (el.dataset.ocDone) return; el.dataset.ocDone = "1";
    var lecture = el.getAttribute("data-lecture") || "lecture";
    var key = todayKey(lecture);
    var storeKey = "oc_hit_" + key;
    render(el, null, "loading");

    var alreadyHit = false;
    try { alreadyHit = sessionStorage.getItem(storeKey) === "1"; } catch (e) {}

    // If this browser already counted today, just read the total.
    var endpoint = alreadyHit ? "/get/" : "/hit/";
    var url = BASE + endpoint + encodeURIComponent(NAMESPACE) + "/" + encodeURIComponent(key);

    fetchJSON(url).then(function (d) {
      render(el, d.value, "ok");
      if (!alreadyHit) { try { sessionStorage.setItem(storeKey, "1"); } catch (e) {} }
    }).catch(function () {
      render(el, null, "err");
    });
  }

  function init() {
    document.querySelectorAll(".open-counter").forEach(activate);
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
  if (window.Reveal && Reveal.on) Reveal.on("ready", init);
  window.CounterInit = init;
})();
