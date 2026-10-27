/* ============================================================
   presenter.js — "follow the presenter" live sync for lectures.

   Two roles, decided by the URL:
     • PRESENTER:  .../lectureN/?present=<lecture-password>
         - full control of the deck
         - broadcasts the current slide number as you move
     • STUDENT (default, no ?present):
         - screen follows the presenter's slide automatically
         - cannot navigate forward on their own (locked)
         - if sync is unreachable, freezes on the current slide

   Transport: the free, no-signup Abacus counter service
   (CORS-enabled). The presenter CREATES a counter once (the
   service returns an admin key, kept in the presenter's browser)
   and SETs the slide number on every change. Students only GET
   the value — no key needed.

   Notes:
   - The admin key only lets someone move the class's slide pointer;
     it is never placed in the student page.
   - ~2s polling: students follow within a couple of seconds.
   ============================================================ */
(function () {
  var BASE = "https://abacus.jasoncameron.dev";
  var NS = "hassanmiir-cpp-sync";

  function lectureId() {
    // Prefer an explicit <body data-lecture="..."> (lets non-"lectureN" folders
    // like /drahsan/ have their own sync namespace); fall back to the URL.
    var attr = document.body && document.body.getAttribute("data-lecture");
    if (attr) return attr;
    return (location.pathname.match(/\/(lecture\d+)\/?/) || [])[1] || "lecture";
  }
  function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  var lec = lectureId();
  var KEY = lec + "-slide";                 // counter key for this lecture
  var presentPw = qs("present");            // presenter mode if set

  // ---- shared helpers ----
  function getVal() {
    return fetch(BASE + "/get/" + NS + "/" + KEY, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { return d.value; });
  }

  function waitForReveal(cb) {
    if (window.Reveal && Reveal.isReady && Reveal.isReady()) return cb();
    if (window.Reveal && Reveal.on) { Reveal.on("ready", cb); return; }
    setTimeout(function () { waitForReveal(cb); }, 150);
  }

  // =========================================================
  //  PRESENTER
  // =========================================================
  function runPresenter() {
    var LSK = "cpp_present_adminkey_" + lec;
    var adminKey = null;
    try { adminKey = localStorage.getItem(LSK); } catch (e) {}
    var forceFresh = qs("fresh") === "1";

    function setSlide(n) {
      if (!adminKey) return;
      fetch(BASE + "/set/" + NS + "/" + KEY + "?value=" + n, {
        method: "POST",
        headers: { "Authorization": "Bearer " + adminKey }
      }).catch(function () {});
    }

    function ensureCounter() {
      // Create the counter (first ever use). If it already exists and we
      // have no key, make a fresh per-session key so we can drive it.
      var createUrl = BASE + "/create/" + NS + "/" + KEY + "?initializer=0";
      fetch(createUrl).then(function (r) { return r.json().then(function (d) { return { s: r.status, d: d }; }); })
        .then(function (res) {
          if (res.s === 201 && res.d.admin_key) {
            adminKey = res.d.admin_key;
            try { localStorage.setItem(LSK, adminKey); } catch (e) {}
          }
          // if 409 (exists) we rely on the stored adminKey (if any)
          startBroadcast();
        })
        .catch(function () { startBroadcast(); });
    }

    function startBroadcast() {
      waitForReveal(function () {
        badge("● Presenting — students are following you", "live");
        // Broadcast slide index + 1, so the value is always >= 1 while a
        // presenter is live (0 is reserved for "no presenter"). Students
        // subtract 1. This lets the first slide (index 0) still lock students.
        setSlide(Reveal.getState().indexh + 1);
        Reveal.on("slidechanged", function (e) { setSlide(e.indexh + 1); });
        // also re-push every 5s so late-joining students catch up
        setInterval(function () { setSlide(Reveal.getState().indexh + 1); }, 5000);
      });
    }

    if (forceFresh) { adminKey = null; try { localStorage.removeItem(LSK); } catch (e) {} }
    if (adminKey) startBroadcast(); else ensureCounter();
  }

  // =========================================================
  //  STUDENT (follow + lock)
  // =========================================================
  function runStudent() {
    waitForReveal(function () {
      // The student link ALWAYS works and is ALWAYS navigable. The only rule:
      // a student may never go PAST the presenter's current slide (the
      // "ceiling"). They can always step back to review anything already shown,
      // and move forward up to — but not beyond — where the presenter is.
      // Before any presenter broadcast, let students see the intro slides
      // (scan-in + welcome) so the link clearly works, but not the content
      // ahead. Once the presenter is live, the ceiling tracks them exactly.
      var INTRO_CEILING = 1;
      var ceiling = INTRO_CEILING;   // highest slide index students may reach
      var sawPresenter = false;

      // Keep normal keyboard / touch / arrows so the deck is fully usable;
      // we enforce the ceiling by bouncing back any move beyond it.
      function showAllFragments() {
        try { var g = 0; while (g++ < 60 && Reveal.nextFragment()) {} } catch (e) {}
      }

      // Hard stop: if a student lands beyond the ceiling, snap them back to it.
      Reveal.on("slidechanged", function (e) {
        if (e.indexh > ceiling) {
          Reveal.slide(ceiling);
          flash();
        }
      });

      // Belt-and-braces for the keyboard: block a forward key when already at
      // the ceiling (so holding → doesn't fight the bounce). Always allow back
      // keys, and never swallow typing in a field (the password gate).
      document.addEventListener("keydown", function (e) {
        var t = e.target;
        var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
        if (typing || document.querySelector(".gate-overlay")) return;
        var forward = (e.key === "ArrowRight" || e.key === "ArrowDown" ||
                       e.key === "PageDown" || e.key === " " || e.key === "Spacebar");
        if (forward && Reveal.getState().indexh >= ceiling) {
          e.stopPropagation(); e.preventDefault(); flash();
        }
      }, true);

      var flashTimer = null;
      function flash() {
        badge("🔒 That's as far as the presenter has reached", "wait");
        if (flashTimer) clearTimeout(flashTimer);
        flashTimer = setTimeout(setIdleBadge, 1800);
      }
      function setIdleBadge() {
        if (!sawPresenter) badge("🔓 Browse freely — up to the presenter's slide", "ok");
        else badge("🟢 Following the presenter — you can review earlier slides", "ok");
      }
      setIdleBadge();

      function poll() {
        getVal().then(function (v) {
          if (typeof v === "number" && v > 0) {
            // presenter live (broadcast value = slide index + 1)
            var presenterSlide = v - 1;
            sawPresenter = true;
            var rose = presenterSlide > ceiling;
            ceiling = presenterSlide;        // raise (or lower) the forward wall
            // When the presenter MOVES FORWARD, bring students along so they
            // don't fall behind — but only pull them forward, never yank a
            // student who stepped back to review. If they're ahead of the new
            // ceiling (presenter went back), snap them down to it.
            var here = Reveal.getState().indexh;
            if (here > ceiling) { Reveal.slide(ceiling); setTimeout(showAllFragments, 60); }
            else if (rose) { Reveal.slide(ceiling); setTimeout(showAllFragments, 60); }
            setIdleBadge();
          }
          // v === 0 → no live presenter yet. Leave the ceiling where it is
          // (start-of-class it's slide 0, so students can't jump ahead to
          // unseen slides), the link stays fully navigable within [0..ceiling].
        }).catch(function () { /* transient network error: keep current ceiling */ });
      }
      poll();
      setInterval(poll, 2000);
    });
  }

  // =========================================================
  //  small status badge
  // =========================================================
  function badge(text, cls) {
    var el = document.getElementById("sync-badge");
    if (!el) {
      el = document.createElement("div");
      el.id = "sync-badge";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.className = "sync-badge " + (cls || "");
  }

  // boot
  if (presentPw) runPresenter(); else runStudent();
})();
