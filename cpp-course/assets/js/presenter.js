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
        setSlide(Reveal.getState().indexh);
        Reveal.on("slidechanged", function (e) { setSlide(e.indexh); });
        // also re-push every 5s so late-joining students catch up
        setInterval(function () { setSlide(Reveal.getState().indexh); }, 5000);
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
      var lastKnown = 0;
      var synced = false;

      // Lock forward navigation. Allow looking back (left/up) only.
      Reveal.configure({ keyboard: false, touch: false, controls: false });
      // Block keys except Left/Up (review). Everything else: swallow.
      document.addEventListener("keydown", function (e) {
        var review = (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp");
        if (!review) { e.stopPropagation(); e.preventDefault(); }
      }, true);
      // If a student scrolls back, they may never go PAST lastKnown.
      Reveal.on("slidechanged", function (e) {
        if (e.indexh > lastKnown) { Reveal.slide(lastKnown); }
      });

      badge("🔒 Following the presenter", "wait");

      function showAllFragments() {
        // Students can't advance fragments themselves, so reveal them all
        // when they land on (or are already on) the presenter's slide.
        try { var g = 0; while (g++ < 40 && Reveal.nextFragment()) {} } catch (e) {}
      }

      function poll() {
        getVal().then(function (v) {
          if (typeof v === "number") {
            lastKnown = v; synced = true;
            badge("🟢 Following the presenter", "ok");
            if (Reveal.getState().indexh !== v) {
              Reveal.slide(v);
              setTimeout(showAllFragments, 60);
            } else {
              showAllFragments();
            }
          }
        }).catch(function () {
          // offline → freeze on current slide (do not unlock)
          if (synced) badge("⚠ Reconnecting… (screen is frozen)", "err");
          else badge("⚠ Waiting for the presenter…", "wait");
        });
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
